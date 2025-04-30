// apps/web/app/(root)/user/page.tsx
"use client";

import Image from "next/image";
import { useVendors } from "@/hooks/useVendors";
import { useFoodItems } from "@/hooks/useFoodItems";
import GlassButton from "@/components/ui/GlassButton";
import { FoodCard } from "@/components/user/FoodCard";
import DefaultFoodImage from "@/public/images/logo.png";
import DefaultRestaurantImage from "@/public/images/bike_.png";
import { RestaurantCard } from "@/components/user/RestaurantCard";
import { MapPin, Search, Store, Menu, Loader2 } from "lucide-react";

export default function UserHomePage() {
  // Fetch food items
  const {
    foodItems,
    isLoading: isLoadingFood,
    error: foodError,
  } = useFoodItems();
  // Fetch vendors (restaurants)
  const {
    vendors,
    isLoading: isLoadingVendors,
    error: vendorsError,
  } = useVendors();

  const isLoading = isLoadingFood || isLoadingVendors; // Combined loading state
  const error = foodError || vendorsError; // Combined error state (simple)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-800">
        <Loader2 size={48} className="animate-spin text-orange-500" />
        <p className="ml-4 text-lg">Loading data...</p>{" "}
        {/* Generic loading message */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center mt-8 text-lg">
        <p>Error loading data:</p>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-4 w-full space-y-4 h-full overflow-y-scroll glass-scrollbar">
      {/* Header */}
      <GlassButton className="bg-white p-2 mt-12 rounded-full shadow-md hover:scale-105 transition">
        <Image
          width={100}
          height={100}
          src="/user-avatar.png" // Assuming a static user avatar image
          className="w-8 h-8 rounded-full"
          alt="User"
        />
      </GlassButton>
      <div className="flex items-center gap-1 text-sm text-gray-500">
        <MapPin size={16} className="text-gray-400" />
        Delivering to: <span className="font-medium text-gray-700">Ekpoma</span>
      </div>

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="text"
          placeholder="Search food or restaurants..."
          className="w-full p-3 pl-10 rounded-xl border shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
      </div>

      {/* Featured Foods */}
      <section className="flex flex-col gap-2 items-start">
        <h2 className="text-lg font-semibold my-2 flex items-center gap-2">
          <Menu size={18} />
          Popular Foods
        </h2>
        {/* Display food items or a message if none found */}
        {foodItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
            {foodItems.map((item) => (
              <FoodCard
                key={item.id}
                id={item.id}
                // Use the fetched image_url, fallback to a default if null
                image={item.image_url || DefaultFoodImage.src}
                name={item.name}
                // Use the fetched vendor_name, fallback if null
                vendor={item.vendor_name || "Unknown Vendor"}
                price={item.price}
                description={item.description} // Pass description
              />
            ))}
          </div>
        ) : (
          <div className="w-full text-center text-gray-600">
            No popular food items found.
          </div>
        )}

        {/* Show more Food Button  */}
        <div className="w-full flex flex-col items-end">
          <GlassButton
            href="/user/food"
            className="!text-white !bg-orange-500 m-2 p-4 w-auto hover:!text-orange-500 hover:!bg-white"
          >
            More Food
          </GlassButton>
        </div>
      </section>

      {/* Restaurants */}
      <section className="flex flex-col gap-2 items-start">
        <h2 className="text-lg font-semibold mb-2 mt-4 flex items-center gap-2">
          <Store size={18} />
          Restaurants Near You
        </h2>
        {/* Display vendors or a message if none found */}
        {vendors.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
            {vendors.map((vendor: any) => (
              <RestaurantCard
                key={vendor.id}
                id={vendor.id}
                // Use the fetched image_url (logo_url), fallback to a default
                image={vendor.image_url || DefaultRestaurantImage.src}
                name={vendor.name}
                // Use the fetched description as tags placeholder, fallback if null
                tags={vendor.description || "Restaurant"}
              />
            ))}
          </div>
        ) : (
          <div className="w-full text-center text-gray-600">
            No restaurants found.
          </div>
        )}

        {/* Show more Restaurant Button */}
        <div className="w-full flex flex-col items-end">
          <GlassButton
            href="/user/restaurant"
            className="!text-white !bg-orange-500 m-2 p-4 w-auto hover:!text-orange-500 hover:!bg-white"
          >
            More Restaurants {/* Corrected button text */}
          </GlassButton>
        </div>
      </section>
    </div>
  );
}
