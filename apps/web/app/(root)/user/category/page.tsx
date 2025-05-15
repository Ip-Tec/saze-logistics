// app/user/page.tsx
import Link from "next/link";
import Image from "next/image";
import GlassDiv from "@/components/ui/GlassDiv";
import DefaultImage from "@/public/images/logo.png";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@shared/supabase/types";

// initialize a read-only client with anon key
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function CategoriesPage() {
  const { data: categories, error } = await supabase
    .from("categories")
    .select("*");

  if (error) {
    return (
      <div className="text-red-600 text-center mt-8">
        Failed to load categories: {error.message}
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 place-items-center place-content-center w-full">
      {categories?.map((cat) => (
        <Link key={cat.id} href={`/user/category/${cat.id}`}>
          <GlassDiv className="flex flex-col items-center p-4 hover:shadow-lg transition cursor-pointer">
            <div className="w-42 h-42 relative mb-2">
              <Image
                src={cat.image_url || DefaultImage}
                alt={cat.name}
                fill
                className="object-cover rounded-lg"
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">{cat.name}</h3>
          </GlassDiv>
        </Link>
      ))}
    </div>
  );
}
