// app/(root)/user/search/page.tsx
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@shared/supabase/types";
import { ProductCard } from "@/components/user/ProductCard";
import DefaultFoodImage from "@/public/images/logo.png";
import Link from "next/link";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PAGE_SIZE = 12;

export default async function SearchPage(
  props: Promise<{
    searchParams: { q?: string; page?: string };
  }>
) {
  // 1️⃣ Await the entire props
  const { searchParams } = await props;
  const q = (searchParams.q ?? "").trim();
  const pageNum = parseInt(searchParams.page ?? "1", 10);

  if (!q) {
    return (
      <div className="p-6 text-center text-gray-500">
        Please enter something to search.
      </div>
    );
  }

  // 2️⃣ Pagination math
  const from = (pageNum - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // 3️⃣ Count matching items
  const { count } = await supabase
    .from("products")
    .select("id", { head: true, count: "exact" })
    .ilike("name", `%${q}%`)
    .eq("is_hidden", false);

  // 4️⃣ Fetch one page
  const { data, error } = await supabase
    .from("products")
    .select(
      `*, profiles!products_vendor_id_fkey(id,name,logo_url),
          categories!products_category_id_fkey(id,name,image_url)`
    )
    .ilike("name", `%${q}%`)
    .eq("is_hidden", false)
    .range(from, to);

  if (error) {
    return (
      <div className="text-red-600 text-center mt-8">
        Search failed: {error.message}
      </div>
    );
  }

  const total = count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <h1 className="text-2xl font-bold">
        Search results for “{q}” ({total})
      </h1>

      {data && data.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {data.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              image={p.image_url || DefaultFoodImage.src}
              name={p.name}
              vendor={p.profiles?.name ?? "Unknown Vendor"}
              price={p.unit_price}
              description={p.description}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No products found.</p>
      )}

      {/* Pagination */}
      <div className="flex justify-center items-center space-x-4 mt-6">
        <Link
          href={`/user/search?q=${encodeURIComponent(q)}&page=${Math.max(
            1,
            pageNum - 1
          )}`}
          className={`px-3 py-1 rounded ${
            pageNum === 1
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-orange-500 text-white"
          }`}
        >
          Previous
        </Link>

        <span>
          Page {pageNum} of {totalPages}
        </span>

        <Link
          href={`/user/search?q=${encodeURIComponent(q)}&page=${Math.min(
            totalPages,
            pageNum + 1
          )}`}
          className={`px-3 py-1 rounded ${
            pageNum === totalPages
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-orange-500 text-white"
          }`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
