// apps/web/app/api/cart-item/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const { cartId, menuItemId, quantity } = await request.json();

  if (!cartId || !menuItemId || typeof quantity !== "number") {
    return NextResponse.json(
      { error: "Required fields: cartId, menuItemId, quantity" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("cart_item")
    .insert({
      cart_id: cartId,
      menu_item_id: menuItemId,
      quantity,
    })
    .select("id,cart_id,menu_item_id,quantity")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
