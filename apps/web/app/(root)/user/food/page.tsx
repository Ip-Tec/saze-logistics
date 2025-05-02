// app/user/food/page.tsx 
import FoodPageClient from "./FoodPageClient";
import { createClient } from "@supabase/supabase-js";
import FallbackImage from "@/public/images/logo.png"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function FoodPage() {
  // 1) Fetch all menu items (or a reasonable subset) server-side
  const { data: items, error } = await supabase
    .from("menu_item")
    .select("id, name, price, vendor_id, menu_item_image(image_url)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Server fetch error:", error);
    return <p className="p-6 text-red-600">Failed to load menu.</p>;
  }

  // 2) Flatten into the shape your client wants
  const allFood = (items || []).map((row) => ({
    id: row.id,
    image: row.menu_item_image?.[0]?.image_url ?? FallbackImage.src,
    name: row.name,
    vendor: row.vendor_id, // or look up vendor name if you prefer
    price: row.price,
  }));

  // 3) Render the client, passing data as a prop
  return <FoodPageClient allFood={allFood} />;
}
