// apps/web/app/api/menu-item/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4Y2ptaG9wbmxsYW5udnRmd3plIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzU4MzI0NiwiZXhwIjoyMDU5MTU5MjQ2fQ.TItg2vx8zWiHLwe8nS5gAxoLgFuPcOEeYqDoa2IWYbI"
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
