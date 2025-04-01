// Base interface for all user types
export interface BaseUser {
    id: string;
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
    type: 'individual' | 'group';
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
    status: 'sent' | 'delivered' | 'read';
    type: 'text' | 'image' | 'system';
    metadata?: Record<string, unknown>;
}

export interface Call {
    id: string;
    callerId: string;
    receiverId: string;
    startTime: Date;
    endTime?: Date;
    status: 'initiated' | 'ongoing' | 'completed' | 'missed';
    type: 'voice' | 'video';
    callDuration?: number; // In seconds
}

export interface Notification {
    id: string;
    userId: string;
    type: 'message' | 'call' | 'order_update' | 'system';
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
    callPreferences: 'voice_only' | 'video_allowed';
    quietHours?: {
        enabled: boolean;
        startTime: string;
        endTime: string;
    };
}

// Main user type (customer)
export interface User extends BaseUser {
    role: 'user';
    deliveryAddresses?: DeliveryAddress[];
    paymentMethods?: PaymentMethod[];
}

// Vendor type
export interface Vendor extends BaseUser {
    role: 'vendor';
    businessName: string;
    businessAddress: string;
    cuisineType: string[];
    businessRegistrationNumber: string;
    isApproved: boolean;
    menuItems?: MenuItem[];
    openingHours?: OpeningHours;
    rating?: number;
}

// Rider type
export interface Rider extends BaseUser {
    role: 'rider';
    vehicleType: 'bicycle' | 'motorcycle' | 'car';
    licensePlate?: string;
    isAvailable: boolean;
    currentLocation?: GeoLocation;
    totalDeliveries: number;
    rating?: number;
}

// Admin type with sub-roles
export interface Admin extends BaseUser {
    role: 'admin';
    adminRole: 'support' | 'dev' | 'super_admin' | 'moderator';
    permissions: Permission[];
}

// Union type for any user type
export type AppUser = User | Vendor | Rider | Admin& {
    conversations?: Conversation[];
    activeCall?: Call | null;
    unreadMessages: number;
}

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
    | 'pending'
    | 'confirmed'
    | 'preparing'
    | 'ready_for_pickup'
    | 'in_transit'
    | 'delivered'
    | 'cancelled';

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

export interface MenuItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    category: string;
    isAvailable: boolean;
    imageUrl?: string;
}

export type PaymentMethodType = 'credit_card' | 'debit_card' | 'mobile_wallet' | 'cash_on_delivery';

export interface PaymentMethod {
    type: PaymentMethodType;
    last4Digits?: string;
    walletProvider?: string;
}

export type PaymentStatus = 'pending' | 'completed' | 'refunded' | 'failed';

export interface OpeningHours {
    [day: string]: {
        open: string;
        close: string;
        isClosed: boolean;
    };
}

export type Permission =
    | 'manage_users'
    | 'manage_vendors'
    | 'manage_riders'
    | 'manage_orders'
    | 'manage_payments'
    | 'manage_content'
    | 'analytics_view';