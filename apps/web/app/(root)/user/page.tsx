"use client";

import Image from "next/image";
import GlassButton from "@/components/ui/GlassButton";
import { FoodCard } from "@/components/user/FoodCard";
import { MapPin, Search, Store, Menu } from "lucide-react";
import { RestaurantCard } from "@/components/user/RestaurantCard";

export default function UserHomePage() {
  return (
    <div className="p-4 w-full space-y-4 h-full overflow-y-scroll glass-scrollbar">
      {/* Header */}
      <GlassButton className="bg-white p-2 mt-12 rounded-full shadow-md hover:scale-105 transition">
        <Image
          width={100}
          height={100}
          src="/user-avatar.png"
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
          {[...Array(6)].map((_, i) => (
            <FoodCard
              key={i}
              id={`food-${i}`}
              image="/sample-food.jpg"
              title="Jollof Rice"
              vendor="Mama Cee"
              price={2500}
            />
          ))}
        </div>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
          {[...Array(5)].map((_, i) => (
            <RestaurantCard
              key={i}
              id={`resto-${i}`}
              image="/sample-restaurant.jpg"
              name="Big Bites"
              tags="Pizza, Shawarma • 4.6★"
            />
          ))}
        </div>
        {/* Show more Restaurant Button */}
        <div className="w-full flex flex-col items-end">
          <GlassButton
            href="/user/restaurant"
            className="!text-white !bg-orange-500 m-2 p-4 w-auto hover:!text-orange-500 hover:!bg-white"
          >
            More Food
          </GlassButton>
        </div>
      </section>
    </div>
  );
}
