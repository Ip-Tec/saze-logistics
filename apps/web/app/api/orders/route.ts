import { NextResponse } from "next/server";
import { supabaseFE  } from "@shared/supabaseClient";

export async function POST(req: Request) {
  const { cart, location, paymentMethod, userId } = await req.json();

  if (!cart?.length || !location || !paymentMethod) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const total = cart.reduce((sum: number, item: any) => sum + item.price, 0);

  const { data: order, error } = await supabaseFE
    .from("orders")
    .insert([
      {
        user_id: userId,
        location,
        payment_method: paymentMethod,
        total
      }
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Insert order items
  const orderItems = cart.map((item: any) => ({
    order_id: order.id,
    menu_item_id: item.id,
    quantity: item.quantity || 1
  }));

  const { error: itemsError } = await supabaseFE
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json(order);
}
