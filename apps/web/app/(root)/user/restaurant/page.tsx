// /app/(root)/user/restaurant/page.tsx
"use client"

import { useState } from "react";
import { RestaurantCard } from "@/components/user/RestaurantCard";

interface Restaurant {
  id: string;
  image: string;
  name: string;
  tags: string;
}

// Mock data – you can replace this with API data later
const allRestaurants: Restaurant[] = [
  { id: "1", image: "/images/Jollof_Rice-removebg-preview.png", name: "Mama Put", tags: "Nigerian, Rice" },
  { id: "2", image: "/images/Jollof_Rice-removebg-preview.png", name: "Tastee Bites", tags: "Fast food, Fries" },
  { id: "3", image: "/images/Jollof_Rice-removebg-preview.png", name: "Suya Express", tags: "Spicy, Grill" },
  { id: "4", image: "/images/Jollof_Rice-removebg-preview.png", name: "Tantalizers", tags: "Local, African" },
  { id: "5", image: "/images/Jollof_Rice-removebg-preview.png", name: "The Kitch", tags: "Rice, Beans, Chicken" },
  { id: "6", image: "/images/Jollof_Rice-removebg-preview.png", name: "Mega Chops", tags: "Burgers, Wraps" },
  { id: "7", image: "/images/Jollof_Rice-removebg-preview.png", name: "Spice Hub", tags: "Shawarma, Suya" },
  { id: "8", image: "/images/Jollof_Rice-removebg-preview.png", name: "Buka Spot", tags: "Efo, Amala" },
];

const ITEMS_PER_PAGE = 6;

export default function RestaurantsPage() {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(allRestaurants.length / ITEMS_PER_PAGE);

  const paginatedRestaurants = allRestaurants.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <div className="p-6 w-full h-full mt-36 overflow-auto glass-scrollbar">
      <h1 className="text-2xl font-bold mb-6 text-center">All Restaurants</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {paginatedRestaurants.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            id={restaurant.id}
            image={restaurant.image}
            name={restaurant.name}
            tags={restaurant.tags}
          />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-6 mb-18 gap-4">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="self-center text-gray-600">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
