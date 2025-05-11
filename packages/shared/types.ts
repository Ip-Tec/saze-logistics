// packages\shared\types.ts

import { Database } from "./supabase/types";

// Base interface for all user types
export interface BaseUser {
  id: string;
  name: string;
  email: string;
  phoneNumber: string; // Now required for calls
  createdAt: Date;
  updatedAt: Date;
  avatarUrl?: string;
  isActive: boolean;
  notificationPreferences: NotificationPreferences;
}

// Add these new interfaces for communication features
export interface Conversation {
  id: string;
  participants: string[]; // Array of user IDs
  type: "individual" | "group";
  createdAt: Date;
  lastMessage?: Message;
  lastActivity: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  status: "sent" | "delivered" | "read";
  type: "text" | "image" | "system";
  metadata?: Record<string, unknown>;
}

export interface Call {
  id: string;
  callerId: string;
  receiverId: string;
  startTime: Date;
  endTime?: Date;
  status: "initiated" | "ongoing" | "completed" | "missed";
  type: "voice" | "video";
  callDuration?: number; // In seconds
}

export interface Notification {
  id: string;
  userId: string;
  type: "message" | "call" | "order_update" | "system";
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export interface NotificationPreferences {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  inAppNotifications: boolean;
  callPreferences: "voice_only" | "video_allowed";
  quietHours?: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

// Main user type (customer)
export interface User extends BaseUser {
  role: "user";
  deliveryAddresses?: DeliveryAddress[];
  paymentMethods?: PaymentMethod[];
}

// Vendor type
export interface Vendor extends BaseUser {
  role: "vendor";
  businessName: string;
  businessAddress: string;
  cuisineType: string[];
  businessRegistrationNumber: string;
  isApproved: boolean;
  menuItems?: MenuItem[];
  openingHours?: OpeningHours;
  rating?: number | string;
}

// Rider type
export interface Rider extends BaseUser {
  role: "rider";
  vehicleType: "bicycle" | "motorcycle" | "car";
  licensePlate?: string;
  isAvailable: boolean;
  currentLocation?: GeoLocation;
  totalDeliveries: number;
  rating?: number;
}

export interface RiderProfile extends Rider {
  nin?: string;
  name: string;
  phone: string;
  second_phone?: string;
  vehicleType: "bicycle" | "motorcycle" | "car";
  licensePlate?: string;
  rider_image_url?: string;
  vehicle_image_url?: string;

}

// Admin type with sub-roles
export interface Admin extends BaseUser {
  role: "admin";
  adminRole: "support" | "dev" | "super_admin" | "moderator";
  permissions: Permission[];
}

// Union type for any user type
export type AppUser =
  | User
  | Vendor
  | RiderProfile
  | (Admin & {
      conversations?: Conversation[];
      activeCall?: Call | null;
      unreadMessages: number;
    });

// Order types
export interface Order {
  id: string;
  userId: string;
  vendorId: string;
  riderId?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  deliveryAddress: DeliveryAddress;
  specialInstructions?: string;
  paymentMethod: PaymentMethodType;
  paymentStatus: PaymentStatus;
  chatHistory?: Message[]; // Order-specific chat
  customerSupportConversationId?: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready_for_pickup"
  | "in_transit"
  | "delivered"
  | "cancelled";

// Supporting interfaces
export interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: GeoLocation;
}

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface MenuCategory {
  id: string;
  vendor_id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface MenuItem {
  id: string;
  vendor_id: string;
  category_id?: string;
  name: string;
  description?: string;
  price: number;
  is_available: boolean;
  created_at: string;
}

export interface MenuItemImage {
  id: string;
  menu_item_id: string;
  image_url: string;
  created_at: string;
}

export interface FoodDetail extends MenuItem {
  image: string;
  vendor: string;
}
export interface CartItem extends FoodDetail {
  quantity: number;
}

export type PaymentMethodType =
  | "credit_card"
  | "debit_card"
  | "mobile_wallet"
  | "cash_on_delivery";

export interface PaymentMethod {
  type: PaymentMethodType;
  last4Digits?: string;
  walletProvider?: string;
}

export type PaymentStatus = "pending" | "completed" | "refunded" | "failed";

export interface OpeningHours {
  [day: string]: {
    open: string;
    close: string;
    isClosed: boolean;
  };
}

export type Permission =
  | "manage_users"
  | "manage_vendors"
  | "manage_riders"
  | "manage_orders"
  | "manage_payments"
  | "manage_content"
  | "analytics_view";

  
  export type ProcessedMenuItem = Omit<
    Database["public"]["Tables"]["menu_item"]["Row"] & {
        menu_item_image:
            | Database["public"]["Tables"]["menu_item_image"]["Row"][]
            | null;
    },
    "menu_item_image" | "vendor_id"
> & {
    // Add the URL of the *first* image for display
    imageUrl: string | null;
    // Keep the full image array for potential editing later
    images: Database["public"]["Tables"]["menu_item_image"]["Row"][] | null;
};

// Define the payload type that the FORM SENDS to addMenuItem
export type AddMenuItemFormPayload = {
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
};

// Define the payload type that the FORM SENDS to updateMenuItem
export type UpdateMenuItemFormPayload = {
    id: string; // Need the ID to update
    name: string;
    description: string | null;
    price: number;
    category_id: string | null;
    is_available?: boolean;
};

// Define the payload type that the FORM SENDS to addCategory
export type AddCategoryFormPayload = {
  name: string;
  description: string | null;
};


// Derived Supabase types
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];

// Product Form Data type (used by the form and passed to onSubmit)
// Ensure 'id' is string | undefined to match Supabase UUIDs
export interface ProductFormData {
  id?: string;
  name: string;
  unitPrice: number; 
  availableQuantity: number; 
  category: string;
  description?: string;
}

// Shipment related types (keep here or in another shared file)
export interface ShipmentFormData {
  recipientName: string;
  recipientAddress: string;
  packageWeight: number;
  packageDimensions: string;
  serviceType: "standard" | "express" | "international";
}

export interface ShipmentCreationResponse {
  success: boolean;
  trackingNumber?: string;
  message: string;
}
