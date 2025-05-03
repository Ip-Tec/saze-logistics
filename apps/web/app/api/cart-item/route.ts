// apps/web/app/api/cart-item/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const cartId = req.nextUrl.searchParams.get("cartId");
  if (!cartId) {
    return NextResponse.json({ error: "Missing cartId" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("cart_item")
    .select("id, menu_item_id, quantity")
    .eq("cart_id", cartId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { cartId, menuItemId, quantity } = await req.json();
  if (!cartId || !menuItemId || typeof quantity !== "number") {
    return NextResponse.json(
      { error: "Required: cartId, menuItemId, quantity" },
      { status: 400 }
    );
  }
  const { data, error } = await supabase
    .from("cart_item")
    .insert({ cart_id: cartId, menu_item_id: menuItemId, quantity })
    .select("id, menu_item_id, quantity")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const { id, quantity } = await req.json();
  if (!id || typeof quantity !== "number") {
    return NextResponse.json(
      { error: "Required: id, quantity" },
      { status: 400 }
    );
  }
  const { data, error } = await supabase
    .from("cart_item")
    .update({ quantity })
    .eq("id", id)
    .select("id, menu_item_id, quantity")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const { error } = await supabase.from("cart_item").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
