// apps/web/app/api/menu-item/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("menu_item")
    .select("id, name, description, price, menu_item_image(image_url)")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten the image_url
  const image_url = data.menu_item_image?.[0]?.image_url ?? null;

  return NextResponse.json({
    id: data.id,
    name: data.name,
    description: data.description,
    price: data.price,
    image_url,
  });
}
