export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      call: {
        Row: {
          call_duration: number | null
          caller_id: string | null
          end_time: string | null
          id: string
          receiver_id: string | null
          start_time: string
          status: string | null
          type: string | null
        }
        Insert: {
          call_duration?: number | null
          caller_id?: string | null
          end_time?: string | null
          id?: string
          receiver_id?: string | null
          start_time: string
          status?: string | null
          type?: string | null
        }
        Update: {
          call_duration?: number | null
          caller_id?: string | null
          end_time?: string | null
          id?: string
          receiver_id?: string | null
          start_time?: string
          status?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_caller_id_fkey"
            columns: ["caller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cart: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_item: {
        Row: {
          cart_id: string | null
          id: string
          menu_item_id: string | null
          notes: string | null
          quantity: number
        }
        Insert: {
          cart_id?: string | null
          id?: string
          menu_item_id?: string | null
          notes?: string | null
          quantity?: number
        }
        Update: {
          cart_id?: string | null
          id?: string
          menu_item_id?: string | null
          notes?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_item_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "cart"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_item_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_item_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "random_menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversation: {
        Row: {
          created_at: string | null
          id: string
          last_activity: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_activity?: string | null
          type?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_activity?: string | null
          type?: string
        }
        Relationships: []
      }
      conversation_participant: {
        Row: {
          conversation_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participant_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participant_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_address: {
        Row: {
          city: string
          country: string
          id: string
          lat: number | null
          lng: number | null
          postal_code: string | null
          state: string
          street: string
          user_id: string | null
        }
        Insert: {
          city: string
          country: string
          id?: string
          lat?: number | null
          lng?: number | null
          postal_code?: string | null
          state: string
          street: string
          user_id?: string | null
        }
        Update: {
          city?: string
          country?: string
          id?: string
          lat?: number | null
          lng?: number | null
          postal_code?: string | null
          state?: string
          street?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_address_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_category: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          vendor_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          vendor_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_category_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_available: boolean | null
          name: string
          price: number
          vendor_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          name: string
          price: number
          vendor_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          name?: string
          price?: number
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_image: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          menu_item_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          menu_item_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          menu_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_image_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_image_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "random_menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      message: {
        Row: {
          content: string | null
          conversation_id: string | null
          id: string
          metadata: Json | null
          sender_id: string | null
          status: string | null
          timestamp: string | null
          type: string | null
        }
        Insert: {
          content?: string | null
          conversation_id?: string | null
          id?: string
          metadata?: Json | null
          sender_id?: string | null
          status?: string | null
          timestamp?: string | null
          type?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string | null
          id?: string
          metadata?: Json | null
          sender_id?: string | null
          status?: string | null
          timestamp?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification: {
        Row: {
          body: string
          created_at: string | null
          id: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preference: {
        Row: {
          call_preferences: string | null
          email_notifications: boolean | null
          id: string
          in_app_notifications: boolean | null
          push_notifications: boolean | null
          quiet_hours: Json | null
          sms_notifications: boolean | null
          user_id: string | null
        }
        Insert: {
          call_preferences?: string | null
          email_notifications?: boolean | null
          id?: string
          in_app_notifications?: boolean | null
          push_notifications?: boolean | null
          quiet_hours?: Json | null
          sms_notifications?: boolean | null
          user_id?: string | null
        }
        Update: {
          call_preferences?: string | null
          email_notifications?: boolean | null
          id?: string
          in_app_notifications?: boolean | null
          push_notifications?: boolean | null
          quiet_hours?: Json | null
          sms_notifications?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_preference_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order: {
        Row: {
          created_at: string | null
          customer_support_conversation_id: string | null
          delivery_address_id: string | null
          id: string
          payment_method: string
          payment_status: string | null
          rider_id: string | null
          special_instructions: string | null
          status: string | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
          vendor_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_support_conversation_id?: string | null
          delivery_address_id?: string | null
          id?: string
          payment_method: string
          payment_status?: string | null
          rider_id?: string | null
          special_instructions?: string | null
          status?: string | null
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_support_conversation_id?: string | null
          delivery_address_id?: string | null
          id?: string
          payment_method?: string
          payment_status?: string | null
          rider_id?: string | null
          special_instructions?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_customer_support_conversation_id_fkey"
            columns: ["customer_support_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "delivery_address"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item: {
        Row: {
          id: string
          menu_item_id: string | null
          notes: string | null
          order_id: string | null
          price: number
          quantity: number
        }
        Insert: {
          id?: string
          menu_item_id?: string | null
          notes?: string | null
          order_id?: string | null
          price: number
          quantity: number
        }
        Update: {
          id?: string
          menu_item_id?: string | null
          notes?: string | null
          order_id?: string | null
          price?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_item_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_item_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "random_menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_item_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_method: {
        Row: {
          id: string
          last4digits: string | null
          type: string
          user_id: string | null
          wallet_provider: string | null
        }
        Insert: {
          id?: string
          last4digits?: string | null
          type: string
          user_id?: string | null
          wallet_provider?: string | null
        }
        Update: {
          id?: string
          last4digits?: string | null
          type?: string
          user_id?: string | null
          wallet_provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_method_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          available_quantity: number
          category_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_hidden: boolean
          name: string
          unit_price: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          available_quantity: number
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          name: string
          unit_price: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          available_quantity?: number
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          name?: string
          unit_price?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          banner_url: string | null
          cac: string | null
          created_at: string | null
          description: string | null
          email: string
          id: string
          licensePlate: string | null
          logo_url: string | null
          name: string
          nin: string | null
          phone: string
          rider_image_url: string | null
          role: string
          second_phone: string | null
          vehicle_image_url: string | null
          vehicleType: string | null
        }
        Insert: {
          address?: string | null
          banner_url?: string | null
          cac?: string | null
          created_at?: string | null
          description?: string | null
          email: string
          id: string
          licensePlate?: string | null
          logo_url?: string | null
          name: string
          nin?: string | null
          phone: string
          rider_image_url?: string | null
          role?: string
          second_phone?: string | null
          vehicle_image_url?: string | null
          vehicleType?: string | null
        }
        Update: {
          address?: string | null
          banner_url?: string | null
          cac?: string | null
          created_at?: string | null
          description?: string | null
          email?: string
          id?: string
          licensePlate?: string | null
          logo_url?: string | null
          name?: string
          nin?: string | null
          phone?: string
          rider_image_url?: string | null
          role?: string
          second_phone?: string | null
          vehicle_image_url?: string | null
          vehicleType?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          role: string
          user_id: string
        }
        Insert: {
          role: string
          user_id: string
        }
        Update: {
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      random_menu_items: {
        Row: {
          description: string | null
          id: string | null
          image_urls: string[] | null
          name: string | null
          price: number | null
          vendor_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_random_menu_items: {
        Args: { lim: number }
        Returns: {
          id: string
          name: string
          price: number
          description: string
          vendor_name: string
          image_urls: string[]
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
