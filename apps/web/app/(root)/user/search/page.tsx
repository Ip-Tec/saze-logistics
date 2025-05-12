// app/user/search/page.tsx
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@shared/supabase/types";
import DefaultFoodImage from "@/public/images/logo.png";
import { ProductCard } from "@/components/user/ProductCard";
import GlassDiv from "@/components/ui/GlassDiv";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function SearchPage({
  searchParams, // <-- NOT a Promise
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  if (!q) {
    return (
      <div className="p-6 text-center text-gray-500">
        Please enter a search term.
      </div>
    );
  }

  // 1) Search categories
  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .select("id,name,image_url")
    .ilike("name", `%${q}%`);

  // 2) Search products (with profile join)
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select(
      `id,name,unit_price,description,image_url,
       profiles!products_vendor_id_fkey(id,name)`
    )
    .ilike("name", `%${q}%`)
    .eq("is_hidden", false)
    .limit(20);

  if (catErr || prodErr) {
    const msg = catErr?.message || prodErr?.message;
    return (
      <div className="p-6 text-red-600 text-center">Search failed: {msg}</div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-xl font-semibold">Search results for “{q}”</h2>

      {/* Categories */}
      {categories?.length ? (
        <>
          <h3 className="text-lg font-medium">Categories</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories.map((c) => (
              <Link key={c.id} href={`/user/category/${c.id}`}>
                <GlassDiv className="flex flex-col items-center p-4 hover:shadow-lg transition">
                  {c.image_url && (
                    <img
                      src={c.image_url}
                      alt={c.name}
                      className="h-24 w-full object-cover rounded mb-2"
                    />
                  )}
                  <span className="font-medium">{c.name}</span>
                </GlassDiv>
              </Link>
            ))}
          </div>
        </>
      ) : null}

      {/* Products */}
      {products?.length ? (
        <>
          <h3 className="text-lg font-medium">Products</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                image={p.image_url || DefaultFoodImage.src}
                name={p.name}
                vendor={p.profiles?.name || "Unknown Vendor"}
                price={p.unit_price}
                description={p.description}
              />
            ))}
          </div>
        </>
      ) : null}

      {!(categories?.length || products?.length) && (
        <div className="text-gray-500 text-center">
          No categories or products matched “{q}”.
        </div>
      )}
    </div>
  );
}
