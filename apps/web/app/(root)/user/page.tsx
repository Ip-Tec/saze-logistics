// apps/web/app/(root)/user/page.tsx
"use client";

import { Loader2 } from "lucide-react";
import GlassButton from "@/components/ui/GlassButton";
import { FoodCard } from "@/components/user/FoodCard";
import DefaultFoodImage from "@/public/images/logo.png";
import DefaultRestaurantImage from "@/public/images/bike_.png";
import { useVendorsWithFood } from "@/hooks/useVendorsWithFood";
import { RestaurantCard } from "@/components/user/RestaurantCard";

export default function UserHomePage() {
  const { data: vendorBlocks, isLoading, error } = useVendorsWithFood();

  if (isLoading) {
    return (
      <div className="flex m-auto justify-center items-center min-h-screen">
        <Loader2 size={48} className="animate-spin text-orange-500" />
        <span className="ml-4 text-lg">Loading data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center mt-8">
        <p>Error loading data:</p>
        <p>{error.message}</p>
      </div>
    );
  }

  // If there are no vendors at all:
  if (vendorBlocks.length === 0) {
    return (
      <div className="flex m-auto flex-col items-center justify-center min-h-screen space-y-4">
        <p className="text-gray-600 text-lg">No restaurants available yet.</p>
        <p className="text-gray-500">Check back soon for new vendors!</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-8 overflow-y-auto h-full glass-scrollbar">
      {vendorBlocks.map((vendor: any) => (
        <section key={vendor.id} className="space-y-4">
          <RestaurantCard
            id={vendor.id}
            image={vendor.image_url || DefaultRestaurantImage.src}
            name={vendor.name}
            tags={vendor.description || "Restaurant"}
          />

          {vendor.foods.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {vendor.foods.map((f: any) => (
                <FoodCard
                  key={f.id}
                  id={f.id}
                  image={f.image_url || DefaultFoodImage.src}
                  name={f.name}
                  vendor={f.vendor_name || ""}
                  price={f.price}
                  description={f.description}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 italic">
              No dishes available for this restaurant.
            </div>
          )}
        </section>
      ))}

      {/* If you still want a “Browse all foods” button, only show if there's at least one food anywhere */}
      {vendorBlocks.some((v: any) => v.foods.length > 0) && (
        <div className="flex justify-center mt-8">
          <GlassButton
            href="/user/food"
            className="!text-white !bg-orange-500 p-4 rounded-full hover:!bg-white hover:!text-orange-500"
          >
            Browse All Foods
          </GlassButton>
        </div>
      )}
    </div>
  );
}
