// app/api/orders/place-order/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getDistance } from "geolib";
import type { Database } from "@shared/supabase/types";

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const {
    reference,
    cart,
    address,
    userId,    // your app’s UUID
    vendorId,  // UUID of the selected vendor
  } = (await req.json()) as {
    reference: string;
    cart: Array<{ menu_item_id: string; quantity: number; price: number }>;
    address: string;
    userId: string;
    vendorId: string;
  };

  // --- 1) Verify payment with Paystack (omitted) ---

  // --- 2) Insert Order ---
  const { data: order, error: orderErr } = await supabase
    .from("order")
    .insert<Database["public"]["Tables"]["order"]["Insert"]>({
      user_id: userId,
      vendor_id: vendorId,
      rider_id: null,
      total_amount: cart.reduce((sum, i) => sum + i.price * i.quantity, 0) + 500,
      payment_method: "paystack",
      payment_status: "paid",
      status: "pending",
      delivery_address_id: null,         // you could insert address table here
      customer_support_conversation_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    console.error(orderErr);
    return NextResponse.json({ error: "Could not create order" }, { status: 500 });
  }

  const orderId = order.id;

  // --- 3) Insert Order Items ---
  const items = cart.map((it) => ({
    order_id: orderId,
    menu_item_id: it.menu_item_id,
    price: it.price,
    quantity: it.quantity,
  }));
  await supabase.from("order_item").insert(items);

  // --- 4) Notify User & Vendor ---
  const notifications = [
    {
      user_id: userId,
      title: "Order Confirmed",
      body: `Your order ${orderId} is confirmed!`,
      metadata: { orderId },
      read: false,
      created_at: new Date().toISOString(),
    },
    {
      user_id: vendorId,
      title: "New Order Received",
      body: `Order ${orderId} has been placed.`,
      metadata: { orderId },
      read: false,
      created_at: new Date().toISOString(),
    },
  ];
  await supabase.from("notification").insert(notifications);

  // --- 5) Find Closest Rider ---
  // 5a) Get vendor’s coords from your delivery_address table
  const { data: vloc } = await supabase
    .from("delivery_address")
    .select("lat, lng")
    .eq("user_id", vendorId)
    .single();

  // 5b) Get all riders’ last known locations
  const { data: riders } = await supabase
    .from("rider_location")        // assume you track this table
    .select("user_id, lat, lng");

  // 5c) Compute closest
  let best: { riderId: string; dist: number } | null = null;
  for (const r of riders || []) {
    if (vloc?.lat == null || vloc?.lng == null) continue;
    const d = getDistance(
      { latitude: vloc.lat, longitude: vloc.lng },
      { latitude: r.lat!, longitude: r.lng! }
    );
    if (!best || d < best.dist) best = { riderId: r.user_id, dist: d };
  }

  // --- 6) Notify that Rider ---
  if (best) {
    await supabase.from("notification").insert({
      user_id: best.riderId,
      title: "New Pickup Assigned",
      body: `Pickup order ${orderId} at your nearest vendor.`,
      metadata: {
        orderId,
        vendorLat: vloc?.lat,
        vendorLng: vloc?.lng,
        userAddress: address,
      },
      read: false,
      created_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ success: true, orderId });
}
