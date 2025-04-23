// app/api/orders/route.ts
import { createServerClient } from "@supabase/ssr"; // Import the correct function from the official package
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Database } from "@shared/supabase/types"; // Update this path to your Supabase types

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Create the Supabase client directly using the pattern from your second example
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

    // Get the current user's session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch orders for the current user
    const { data: orders, error } = await supabase
      .from("order")
      .select(
        `
        id,
        created_at,
        total_amount,
        status,
        delivery_address,
        items,
        vendor:vendor_id(name, avatar_url),
        rider:rider_id(name, avatar_url, current_location)
      `
      )
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders from Supabase:", error); // Log the Supabase error
      throw error; // Rethrow to be caught by the outer catch block
    }

    // Transform the data to match your Order interface
    const transformedOrders = orders?.map((order: any) => ({
      id: order.id,
      userId: session.user.id,
      vendorId: order.vendor_id,
      riderId: order.rider_id,
      items: order.items.map((item: any) => ({
        itemId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes,
      })),
      totalAmount: order.total_amount,
      status: order.status,
      createdAt: new Date(order.created_at),
      updatedAt: new Date(order.created_at),
      deliveryAddress: order.delivery_address,
      paymentMethod: "credit_card",
      paymentStatus: "completed",
      vendor: order.vendor
        ? { name: order.vendor.name, avatar_url: order.vendor.avatar_url }
        : null,
      rider: order.rider
        ? {
            name: order.rider.name,
            avatar_url: order.rider.avatar_url,
            current_location: order.rider.current_location,
          }
        : null,
    }));
    return NextResponse.json(transformedOrders);
  } catch (error) {
    console.error("Error processing orders API request:", error); // General catch block error
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
