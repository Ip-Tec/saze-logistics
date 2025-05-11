// app/user/category/[id]/page.tsx
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@shared/supabase/types";
import { FoodCard } from "@/components/user/FoodCard";
import DefaultFoodImage from "@/public/images/logo.png";

// supabase client (same as above)
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function CategoryPage({ params,
}: {
  params: Promise<{
    id: string;
    name?: string;
    price?: string;
    image?: string;
    description?: string;
  }>;
}) {
  const { id, name, price, image, description } = await params;

  const categoryId = id;

  const { data: products, error } = await supabase
    .from("products")
    .select(`*, vendor_name:vendor_id(name)`)
    .eq("category_id", categoryId)
    .eq("is_hidden", false);

  if (error) {
    return (
      <div className="text-red-600 text-center mt-8">
        Failed to load products: {error.message}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-gray-500 text-center mt-8">
        No products found in this category.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Products</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map((p) => (
          <FoodCard
            key={p.id}
            id={p.id}
            image={p.image_url || DefaultFoodImage.src}
            name={p.name}
            vendor={p.vendor_name?.name}
            price={p.unit_price}
            description={p.description}
          />
        ))}
      </div>
    </div>
  );
}
