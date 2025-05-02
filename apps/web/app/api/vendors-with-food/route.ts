// app/api/vendors-with-food/route.ts
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
    // 1) Fetch up to maxVendors vendor profiles
    const { data: vendors, error: vErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "vendor")
      .limit(maxVendors);

    if (vErr) throw vErr;
    if (!vendors || vendors.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // 2) Shuffle & pick the first vendorCount
    const chosen = shuffleArray(vendors).slice(0, vendorCount);

    // 3) For each vendor, fetch up to maxFoods menu items *and* their images
    const payload = await Promise.all(
      chosen.map(async (vendor) => {
        const { data: items, error: fErr } = await supabase
          .from("menu_item")
          .select(
            `
            *,
            menu_item_image ( image_url )
          `
          )
          .eq("vendor_id", vendor.id)
          .limit(maxFoods);

        if (fErr) throw fErr;

        // 4) Shuffle & slice items, then map to the shape your UI expects
        const foods = shuffleArray(items || [])
          .slice(0, foodsPerVendor)
          .map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            description: item.description,
            // take the first image_url if exists
            image_url: item.menu_item_image?.[0]?.image_url ?? null,
            vendor_name: vendor.name,
          }));

        return {
          id: vendor.id,
          name: vendor.name,
          image_url: vendor.logo_url,
          description: vendor.description,
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
