import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const vendorCount = Number(url.searchParams.get("vendorCount")) || 4;
  const foodsPerVendor = Number(url.searchParams.get("foodsPerVendor")) || 6;
  const maxVendors = Number(url.searchParams.get("maxVendors")) || 50;
  const maxFoods = Number(url.searchParams.get("maxFoodsPerVendor")) || 20;

  try {
    // 1) Fetch vendors
    const { data: vendors, error: vErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "vendor")
      .limit(maxVendors);

    if (vErr) throw vErr;
    if (!vendors || vendors.length === 0) {
      return NextResponse.json(
        { message: "No vendors found" },
        { status: 404 }
      );
    }

    // 2) Randomize & pick
    const chosenVendors = shuffleArray(vendors).slice(0, vendorCount);

    // 3) For each, fetch & shuffle foods
    const payload = await Promise.all(
      chosenVendors.map(async (v) => {
        const { data: items, error: fErr } = await supabase
          .from("menu_item") // ← adjust your real table name
          .select("*")
          .eq("vendor_id", v.id)
          .limit(maxFoods);

        if (fErr) throw fErr;

        const foods = shuffleArray(items || [])
          .slice(0, foodsPerVendor)
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            description: item.description,
            image_url: item.image_urls?.[0] || null,
            vendor_name: v.name,
          }));

        return {
          id: v.id,
          name: v.name,
          image_url: v.logo_url,
          description: v.description,
          foods,
        };
      })
    );

    return NextResponse.json(payload);
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
