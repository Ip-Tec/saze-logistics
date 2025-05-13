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
    .from("products")
    .select(
      "*, profiles:vendor_id(id, name, logo_url, phone, second_phone), category:category_id(id, name, description)"
    )
    .eq("id", id)
    .eq("is_hidden", false)
    .maybeSingle();
  console.log("productRoute:", { data });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    name: data?.name,
    image_url: data?.image_url,
    unit_price: data?.unit_price,
    id: data?.id || null,
    vendor_id: data?.vendor_id,
    created_at: data?.created_at,
    description: data?.description,
    category_id: data?.category_id,
    is_hidden: data?.is_hidden,
    vendor: data?.profiles,
    category: data?.category,
  });
}
