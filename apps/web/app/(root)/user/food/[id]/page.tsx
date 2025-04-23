// apps/web/app/(root)/user/food/[id]/page.tsx
"use client";

import Image from "next/image";
import { CartItem } from "@shared/types";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import QuantityPicker from "@/components/ui/QuantityPicker";
import FoodPic from "@/public/images/Jollof_Rice-removebg-preview.png";

const AVAILABLE_EXTRAS = [
  { id: "1", name: "Extra Chicken", price: 1000 },
  { id: "2", name: "Extra Sauce", price: 500 },
  { id: "3", name: "Extra Rice", price: 800 },
];

type PageProps = {
  params: { id: string };
  searchParams: any;
};

export default function FoodDetailPage({
  params,
  searchParams,
}: PageProps) { // <-- Use PageProps here
  const { id } = params;
  const [quantity, setQuantity] = useState(0);
  const [selectedExtras, setSelectedExtras] = useState([ // Changed to directly define available extras
    { id: "1", name: "Extra Chicken", price: 1000 },
    { id: "2", name: "Extra Sauce", price: 500 },
    { id: "3", name: "Extra Rice", price: 800 },
  ]);


  const [food, setFood] = useState<CartItem>({
    quantity: 1,
    id: "2222222",
    name: "Jollof Rice",
    description: "Spicy, party-style Jollof rice with fried chicken & salad.",
    vendor_id: "1234567",
    is_available: true,
    price: 2500,
    image: "/sample-food.jpg",
    vendor: "Mama Cee",
    created_at: "",
  });

  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const existingItem = cart.find((item) => item.id === id);

  useEffect(() => {
    const fetchFood = async () => {
      try {
        // Ensure your /api/foods/[id] route actually returns data matching CartItem
        const res = await fetch(`/api/foods/${id}`);
        if (!res.ok) throw new Error("Failed to fetch food");
        const data: CartItem = await res.json(); // Add type assertion if confident in API response
        setFood(data);
      } catch (error) {
        console.error("Error fetching food:", error);
      }
    };

    fetchFood();
  }, [id]);

  useEffect(() => {
    if (existingItem) {
      setQuantity(existingItem.quantity);
    } else {
      setQuantity(0);
    }
  }, [existingItem]);

  const handleAdd = () => {
    const extrasTotal = selectedExtras.reduce((sum, extra) => {
      return sum + (extra.price || 0);
    }, 0);

    const foodWithExtras: CartItem = {
      ...food,
      price: food.price + extrasTotal,
    };

    if (!existingItem) {
      addToCart({ ...foodWithExtras, quantity: 1 });
      setQuantity(1);
    } else {
      const newQty = quantity + 1;
      updateQuantity(food.id, newQty);
      setQuantity(newQty);
    }
  };
    const handleDecrease = () => {
    const newQuantity = quantity - 1;
    if (newQuantity <= 0) {
      removeFromCart(food.id);
      setQuantity(0);
    } else {
      updateQuantity(food.id, newQuantity);
      setQuantity(newQuantity);
    }
  };

  const toggleExtra = (id: string) => {
    setSelectedExtras((prev) =>
      prev.some(extra => extra.id === id) ? prev.filter((e) => e.id !== id) : [...prev, AVAILABLE_EXTRAS.find(extra => extra.id === id)!]    );
  };


  return (
    <div className="p-4 w-full mx-auto">
      {/* Food Image */}
      <div className="rounded-2xl overflow-hidden mb-4">
        <Image
          src={food.image ? food.image : FoodPic}
          width={800}
          height={500}
          alt={food.name}
          className="w-full h-64 object-cover"
          priority
        />
      </div>

      {/* Info */}
      <h1 className="text-2xl sm:text-3xl font-bold mb-1">{food.name}</h1>
      <p className="text-sm text-gray-500">From {food.vendor}</p>
      <p className="text-orange-600 font-semibold text-lg mt-2">
        ₦{food.price}
      </p>
      <p className="text-sm text-gray-600 mt-2">{food.description}</p>

      {/* Extras */}
      <div className="mt-6">
        <h3 className="text-md font-semibold mb-2">Add Extras</h3>
        <div className="flex flex-cols gap-3 overflow-x-auto w-full">
          {AVAILABLE_EXTRAS.map((extra) => (
            <label
              key={extra.id} // Using extra.id should be unique if IDs are unique within the array
              className={`border p-3 rounded-xl text-sm cursor-pointer transition ${
                selectedExtras.includes(extra)
                  ? "bg-orange-100 border-orange-400"
                  : "hover:border-gray-400"
              }`}
            >
              <input
                type="checkbox"
                value={extra.id}
                checked={selectedExtras.includes(extra)}
                onChange={() => toggleExtra(extra.id)}
                className="mr-2"
              />
              {extra.name} – ₦{extra.price}
            </label>
          ))}
        </div>
      </div>

      {/* Quantity + Cart Button */}
      <div className="mt-6 flex items-center gap-4">
        {quantity > 0 ? (
          <QuantityPicker
            quantity={quantity}
            onIncrease={handleAdd}
            onDecrease={handleDecrease}
          />
        ) : (
          <button
            onClick={handleAdd}
            className="bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 transition w-full sm:w-auto"
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}