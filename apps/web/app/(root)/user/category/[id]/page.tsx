// app/user/category/[id]/page.tsx

import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@shared/supabase/types";
import DefaultFoodImage from "@/public/images/logo.png";
import { ProductCard } from "@/components/user/ProductCard";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PAGE_SIZE = 12;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { page?: string };
}) {
  const categoryId = params.id;
  const pageNum = parseInt(searchParams?.page ?? "1", 10);
  const from = (pageNum - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // 1) count total
  const { count } = await supabase
    .from("products")
    .select("id", { head: true, count: "exact" })
    .eq("category_id", categoryId)
    .eq("is_hidden", false);

  // 2) fetch one page
  const { data, error } = await supabase
    .from("products")
    .select(
      `*,profiles!products_vendor_id_fkey(id,name,logo_url),categories!products_category_id_fkey(id,name,image_url)`
    )
    .eq("category_id", categoryId)
    .eq("is_hidden", false)
    .range(from, to);

  if (error) {
    return (
      <div className="text-red-600 text-center mt-8">
        Failed to load products: {error.message}
      </div>
    );
  }
  console.log({ data });
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select(`id, name, logo_url`)
    .in(
      "id",
      data.map((p) => p.vendor_id)
    );

  if (profileError) {
    return (
      <div className="text-red-600 text-center mt-8">
        Failed to load products: {profileError.message}
      </div>
    );
  }

  const products = data.map((product) => {
    const profile = profiles.find(
      (profile) => profile.id === product.vendor_id
    );
    return { ...product, profile };
  });
  console.log({ products });
  if (!products || products.length === 0) {
    return (
      <div className="text-gray-500 text-center mt-8">
        No products found in this category.
      </div>
    );
  }

  const total = count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <h1 className="text-2xl font-bold">Products</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map((p) => (
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

      {/* Pagination controls */}
      <div className="flex justify-center items-center space-x-4 mt-6">
        {/* Previous button */}
        <Link
          href={`/user/category/${categoryId}?page=${Math.max(1, pageNum - 1)}`}
          className={`px-3 py-1 rounded ${
            pageNum === 1
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-orange-500 text-white"
          }`}
        >
          Previous
        </Link>

        {/* Page x of y */}
        <span>
          Page {pageNum} of {totalPages}
        </span>
        <Link
          href={`/user/category/${categoryId}?page=${Math.min(
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
