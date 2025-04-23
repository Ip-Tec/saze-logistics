import { useState } from "react";
import { FoodCard } from "@/components/user/FoodCard";

interface Food {
  id: string;
  image: string;
  name: string;
  vendor: string;
}

// Mock data – you can replace this with API data later
const allFood: Food[] = [
  {
    id: "1",
    image: "/images/Jollof_Rice-removebg-preview.png",
    name: "Mama Put",
    vendor: "Nigerian, Rice",
  },
  {
    id: "2",
    image: "/images/Jollof_Rice-removebg-preview.png",
    name: "Tastee Bites",
    vendor: "Fast food, Fries",
  },
  {
    id: "3",
    image: "/images/Jollof_Rice-removebg-preview.png",
    name: "Suya Express",
    vendor: "Spicy, Grill",
  },
  {
    id: "4",
    image: "/images/Jollof_Rice-removebg-preview.png",
    name: "Tantalizers",
    vendor: "Local, African",
  },
  {
    id: "5",
    image: "/images/Jollof_Rice-removebg-preview.png",
    name: "The Kitch",
    vendor: "Rice, Beans, Chicken",
  },
  {
    id: "6",
    image: "/images/Jollof_Rice-removebg-preview.png",
    name: "Mega Chops",
    vendor: "Burgers, Wraps",
  },
  {
    id: "7",
    image: "/images/Jollof_Rice-removebg-preview.png",
    name: "Spice Hub",
    vendor: "Shawarma, Suya",
  },
  {
    id: "8",
    image: "/images/Jollof_Rice-removebg-preview.png",
    name: "Buka Spot",
    vendor: "Efo, Amala",
  },
];

const ITEMS_PER_PAGE = 6;

export default function FoodPage() {
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
            price={(
              Number(food!.id) * 100 -
              Number(food!.id) +
              2 / 3 +
              Number(food!.id) / 3
            ).toFixed(2)}
            vendor={food.vendor}
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
