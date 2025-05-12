"use client";

import { useState } from "react";
import { FoodCard } from "@/components/user/FoodCard";

interface Food {
  id: string;
  image: string;
  name: string;
  vendor: string;
  price: number;
}

const ITEMS_PER_PAGE = 6;

export default function FoodPageClient({ allFood }: { allFood: Food[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(allFood.length / ITEMS_PER_PAGE);
  const paginatedFood = allFood.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <div className="p-6 w-full h-full mt-36 overflow-auto glass-scrollbar">
      <h1 className="text-2xl font-bold mb-6 text-center">All Food Menu</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {paginatedFood.map((food) => (
          <FoodCard
            key={food.id}
            id={food.id}
            image={food.image}
            name={food.name}
            vendor={food.vendor}
            price={food.price}
          />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-6 mb-18 gap-4">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="self-center text-gray-600">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
