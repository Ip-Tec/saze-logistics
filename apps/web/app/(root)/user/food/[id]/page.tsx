"use client";

import { use } from "react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import QuantityPicker from "@/components/ui/QuantityPicker";
import { FoodDetail } from "@shared/types";

export default function FoodDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [quantity, setQuantity] = useState(0);
  const [food, setFood] = useState<FoodDetail | null>({
    id,
    name: "Jollof Rice",
    description: "",
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
    // Replace this with actual fetch logic
    const fetchFood = async () => {
      const res = await fetch(`/api/foods/${id}`);
      const data = await res.json();
      setFood(data);
    };

    fetchFood();
  }, [id]);
  useEffect(() => {
    if (existingItem) {
      setQuantity(existingItem.quantity);
    } else {
      setQuantity(0); // reset if item is removed
    }
  }, [existingItem]);

  const handleAdd = () => {
    if (!existingItem) {
      addToCart({ ...food, quantity: 1 });
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

  return (
    <div className="p-4 max-w-md mx-auto">
      <Image
        src={food.image}
        width={400}
        height={250}
        alt={food.title}
        className="rounded-xl object-cover mb-4"
      />

      <h1 className="text-2xl font-bold">{food.title}</h1>
      <p className="text-gray-500 mt-1">From {food.vendor}</p>
      <p className="text-orange-600 font-semibold text-lg mt-2">
        ₦{food.price}
      </p>

      <div className="mt-4 flex gap-4 items-center">
        {quantity > 0 ? (
          <QuantityPicker
            quantity={quantity}
            onIncrease={handleAdd}
            onDecrease={handleDecrease}
          />
        ) : (
          <button
            onClick={handleAdd}
            className="bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600"
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}
