import React from "react";
import Image from "next/image";
import Reimage from "@/public/images/bike_.png";
import { FoodCard } from "@/components/user/FoodCard";

// Mock menu data – replace with real API data later
// Using a number for price is generally better than a string until display
const mockMenu = [
  {
    id: "1",
    name: "Jollof Rice & Chicken",
    price: 1500, // Changed price to number
    image: "/images/Jollof_Rice-removebg-preview.png",
    description: "Delicious party-style Jollof with grilled chicken",
  },
  {
    id: "2",
    name: "Shawarma",
    price: 1200, // Changed price to number
    image: "/images/Jollof_Rice-removebg-preview.png",
    description: "Spicy beef shawarma with extra cream",
  },
  {
    id: "3",
    name: "Efo Riro",
    price: 1000, // Changed price to number
    image: "/images/Jollof_Rice-removebg-preview.png",
    description: "Well-seasoned spinach with assorted meat",
  },
];

// Page components in the App Router are async by default and receive props
// Use PageProps to correctly type the params for this dynamic route
export default async function RestaurantMenuPage({
  params,
}: {
  params: Promise<{
    id: string;
    name: string;
    price: string;
    image: string;
    description: string;
  }>;
}) {
  const { id, name, price, image, description } = await params;

  const restaurantName = name;

  return (
    <div className="p-4 w-full h-full overflow-y-scroll glass-scrollbar mx-auto">
      {/* Restaurant Banner */}
      <div className="rounded-xl overflow-hidden mb-6">
        <Image
          src={Reimage}
          width={1200}
          height={400}
          alt={`${restaurantName} Banner`} // Use dynamic alt text
          className="w-full h-56 sm:h-80 object-cover"
          priority
        />
      </div>

      {/* Info Section */}
      <div className="mb-6">
        {/* Use dynamic restaurant name */}
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">{name}</h1>
        {/* Replace with real data later */}
        <p className="text-sm text-gray-600">Pizza, Shawarma • 4.6★</p>
        <p className="text-sm text-gray-500 mb-3">Located in: Ekpoma</p>
      </div>

      {/* Menu Section */}
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Menu</h2>

        {mockMenu.length === 0 ? (
          <p className="text-gray-500">Menu is currently unavailable.</p>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {mockMenu.map((item) => (
              // *** FIX: Add unique key prop and remove empty fragment ***
              <FoodCard
                key={item.id}
                id={item.id}
                image={item.image}
                name={item.name}
                vendor={"Mama Cee"}
                price={item.price}
                description={item.description}
                // vendor_id={item.id}
                // is_available)
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
