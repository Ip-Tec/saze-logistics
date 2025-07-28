// utils/sendNotification.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Define a type for the notification data that matches your DB schema
// This helps ensure type safety when inserting data
interface NotificationInsert {
  user_id: string;
  title: string;
  body: string; // Matches 'body' column in DB
  type: "info" | "error" | "success" | "chat" | string; // Matches 'type' column in DB
  metadata?: object; // Matches 'metadata' jsonb column
  read?: boolean; // Matches 'read' boolean column, default to false in DB
}

// Define the return type for the sendNotification function
interface SendNotificationResult {
  success: boolean;
  data?: NotificationInsert | null; // The inserted notification data
  error?: Error | null; // Any error that occurred
}

let supabase: SupabaseClient;

// Initialize Supabase client only once
// This is important for performance and to avoid re-creating clients
if (
  typeof process.env.SUPABASE_URL === "string" &&
  typeof process.env.SUPABASE_SERVICE_ROLE_KEY === "string"
) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
} else {
  // This block will run if environment variables are not set.
  // In a Vercel deployment, these should be set and this error shouldn't occur at runtime.
  // It's good for local development sanity checks.
  console.error(
    "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined. Please check your environment variables."
  );
  // You might want to throw an error here to prevent further execution
  // throw new Error("Supabase environment variables are missing.");
}

export async function sendNotification({
  receiver_id, // This is the user_id for whom the notification is
  title,
  body,
  type, // Corresponds to the 'type' column in your DB
  metadata = {},
}: {
  receiver_id: string;
  title: string;
  body: string;
  type: "info" | "error" | "success" | "chat"; // Limiting types, but flexible if your DB 'type' is general text
  metadata?: object;
}): Promise<SendNotificationResult> {
  // Ensure supabase client is initialized
  if (!supabase) {
    return {
      success: false,
      error: new Error(
        "Supabase client not initialized. Check environment variables."
      ),
    };
  }

  try {
    const { data, error } = await supabase
      .from("notification") // Use singular 'notification' as per your DB schema
      .insert({
        user_id: receiver_id, // Map receiver_id from function param to user_id column
        title,
        body,
        type,
        metadata,
        read: false, // Default to unread for new notifications
      })
      .select(); // Request the inserted data back

    if (error) {
      console.error("Supabase Notification Insertion Error:", error);
      return {
        success: false,
        error: new Error(error.message || "Failed to insert notification"),
      };
    }

    // If data is returned, it will be an array. We expect one record.
    return { success: true, data: data ? data[0] : null };
  } catch (err: any) {
    console.error("Unexpected Error in sendNotification:", err);
    return {
      success: false,
      error: new Error(err.message || "An unexpected error occurred"),
    };
  }
}
