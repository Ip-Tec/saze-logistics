// apps/web/app/api/menu-item/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("menu_item")
    .select(
      "category_id, created_at, description, id, is_available, name, price, vendor_id, menu_item_image(image_url)"
    )
    .eq("id", id)
    .maybeSingle();
  console.log({ data });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten the image_url
  const image_url = data?.menu_item_image?.[0]?.image_url ?? null;

  return NextResponse.json({
    image_url,
    name: data?.name,
    price: data?.price,
    id: data?.id || null,
    vendor_id: data?.vendor_id,
    created_at: data?.created_at,
    description: data?.description,
    category_id: data?.category_id,
    is_available: data?.is_available,
  });
}
