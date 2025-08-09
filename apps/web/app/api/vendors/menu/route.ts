import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const { vendorId } = await req.json();

  if (!vendorId) {
    return NextResponse.json({ error: "vendor Id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("menu_items")
    .select("id, name, description, price")
    .eq("vendor_id", vendorId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
