// app/api/vendor/orders/route.ts // Corrected file path based on common structure
import { createServerClient } from "@supabase/ssr"; // Import the correct function
import { cookies } from "next/headers"; // Import cookies for App Router
import { NextResponse } from "next/server"; // Import NextResponse for App Router responses
import type { Database } from "@shared/supabase/types"; // Update this path to your Supabase types

// Import or define the Raw types needed for the API response
// These types match the structure returned by the specific select query
type RawVendorOrderItemResult =
  Database["public"]["Tables"]["order_item"]["Row"] & {
    menu_item_id: { name: string | null }[] | null;
  };

type RawVendorOrderQueryResult =
  Database["public"]["Tables"]["order"]["Row"] & {
    user_id: { name: string | null; phone: string | null }[] | null;
    delivery_address_id:
      | Database["public"]["Tables"]["delivery_address"]["Row"][]
      | null;
    order_item: RawVendorOrderItemResult[] | null;
  };

// This ensures the route is dynamic and not cached
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Use Service Role Key if available, otherwise use Anon Key (be careful with SRK scope)
      {
        cookies: {
          // Provide async getAll method as cookieStore is awaited
          async getAll() {
            const cookies = await cookieStore;
            return cookies.getAll();
          }, // Provide async setAll method
          async setAll(cookiesToSet) {
            try {
              const cookies = await cookieStore;
              for (const { name, value, options } of cookiesToSet) {
                cookies.set(name, value, options);
              }
            } catch (error) {
              console.error("Error setting cookies in API route:", error);
            }
          },
        },
      }
    );
    // --- End Supabase client creation ---

    // --- Authenticate User Server-Side ---
    // Get the current user's session or user details server-side
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(); // Or getSession()

    if (authError || !user) {
      console.error("API: Authentication error or no user", authError?.message);
      // Return a 401 Unauthorized response if no authenticated user is found
      return NextResponse.json(
        { error: "Unauthorized", message: "Vendor not authenticated" },
        { status: 401 }
      );
    }
    // --- End Authentication ---

    // --- Fetch Data from Supabase ---
    const vendorId = user.id;

    console.log("Vendor ID:", { vendorId });

    // Fetch all orders for this vendor using the server-side client
    // Replicate the detailed select query from the frontend component
    const { data, error: fetchError } = await supabase
      .from("order")
      .select(
        `
        id,
        total_amount,
        status,
        special_instructions,
        created_at,
        updated_at,
        user_id (name, phone),
        delivery_address_id (*),
        order_item (id, quantity, price, notes, order_id, menu_item_id (name))
            `
      )
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .returns<RawVendorOrderQueryResult[]>();

    // Handle potential errors during the fetch
    if (fetchError) {
      console.error("API: Error fetching vendor orders:", fetchError);
      // Return a 500 Internal Server Error response
      return NextResponse.json(
        { error: "Failed to fetch orders", message: fetchError.message },
        { status: 500 }
      );
    }

    console.log("API order/v:", { data });

    // --- Return Fetched Data ---
    // Return the fetched data as a JSON response with a 200 OK status
    return NextResponse.json(data, { status: 200 });
    // --- End Return ---
  } catch (error: any) {
    // Catch any unexpected errors during the request handling
    console.error("API: Unexpected error fetching vendor orders:", error);
    // Return a generic 500 Internal Server Error response
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        message: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
