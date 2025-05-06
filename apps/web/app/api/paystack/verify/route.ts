// apps/web/app/api/paystack/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@shared/supabase/types";

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

interface VerifyBody {
  reference: string;
  cart: Array<{
    id: string;           // cart_item.id
    menu_item_id: string; // menu item id
    quantity: number;
    price: number;
  }>;
  address: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as VerifyBody;

  if (!body.reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  // 1) Verify with Paystack
  const paystackRes = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(
      body.reference
    )}`,
    {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    }
  );
  const paystackJson = await paystackRes.json();
  if (!paystackRes.ok || paystackJson.data.status !== "success") {
    return NextResponse.json(
      { error: "Payment verification failed", detail: paystackJson },
      { status: 402 }
    );
  }

  const userId = paystackJson.data.customer.id; // customer UUID

  // 2) Insert into `order`
  const { data: order, error: orderErr } = await supabase
    .from("order")
    .insert<Database["public"]["Tables"]["order"]["Insert"]>({
      user_id: userId,
      vendor_id: null,
      rider_id: null,
      total_amount: paystackJson.data.amount / 100,
      payment_method: "paystack",
      payment_status: "paid",
      status: "pending",
      special_instructions: null,
      delivery_address_id: null,
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

  // ----> Capture the new order ID
  const orderId = order.id;

  // 3) Insert order items
  const orderItems = body.cart.map((ci) => ({
    order_id: orderId,
    menu_item_id: ci.menu_item_id,
    price: ci.price,
    quantity: ci.quantity,
  }));
  const { error: itemsErr } = await supabase
    .from("order_item")
    .insert<Database["public"]["Tables"]["order_item"]["Insert"]>(orderItems);

  if (itemsErr) {
    console.error(itemsErr);
    return NextResponse.json({ error: "Could not create order items" }, { status: 500 });
  }

  // 4a) Push a row into `notification` for the vendor
  //    Replace `vendorId` with your real logic (e.g. from order.metadata or from the items)
  const vendorId = /* fetch or derive vendor UUID here */ "";
  await supabase
    .from("notification")
    .insert<Database["public"]["Tables"]["notification"]["Insert"]>({
      user_id: vendorId,
      title: "New order received",
      body: `Order ${orderId} has been placed.`,
      read: false,
      metadata: { orderId },
      created_at: new Date().toISOString(),
    });

  // 4b) Push a row for the assigned rider (if any)
  const riderId = /* maybe null or a rider UUID */ "";
  if (riderId) {
    await supabase
      .from("notification")
      .insert<Database["public"]["Tables"]["notification"]["Insert"]>({
        user_id: riderId,
        title: "New delivery assigned",
        body: `You have a new delivery: order ${orderId}.`,
        read: false,
        metadata: { orderId },
        created_at: new Date().toISOString(),
      });
  }

  return NextResponse.json({ success: true, orderId });
}

  // Clients can subscribe to real‑time `notification` events:
  //
  // supabase
  //   .channel('notifications')
  //   .on('postgres_changes', {
  //     event: 'INSERT',
  //     schema: 'public',
  //     table: 'notification',
  //     filter: `user_id=eq.${currentUser.id}`
  //   }, payload => {
  //     // show in-app toast or badge
  //   })
  //   .subscribe();

  