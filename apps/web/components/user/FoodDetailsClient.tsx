// apps/web/components/user/FoodDetailsClient.tsx
"use client";

import Image from "next/image";
import { CartItem } from "@shared/types";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import QuantityPicker from "@/components/ui/QuantityPicker";

interface Extra {
  id: string;
  name: string;
  price: number;
  vendor?: string;
}

interface FoodDetailsClientProps {
  initialFood: CartItem;
  availableExtras: Extra[];
  FoodPic: any;
}

export default function FoodDetailsClient({
  initialFood,
  availableExtras,
  FoodPic,
}: FoodDetailsClientProps) {
  const [quantity, setQuantity] = useState(0);
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);
  const [food, setFood] = useState<CartItem>(initialFood);

  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const existingItem = cart.find((item) => item.id === initialFood.id);

  useEffect(() => {
    if (existingItem) {
      setQuantity(existingItem.quantity);
    } else {
      setQuantity(0);
    }
  }, [existingItem]);

  const handleAdd = () => {
    const extrasTotal = selectedExtraIds.reduce((sum, extraId) => {
      const extra = availableExtras.find((e) => e.id === extraId);
      return sum + (extra?.price || 0);
    }, 0);

    const itemToCart: CartItem = {
      ...initialFood,
      price: initialFood.price + extrasTotal,
    };

    if (!existingItem) {
      // If item is not in the cart, add it with quantity 1
      addToCart({ ...itemToCart }, 1);
      setQuantity(1); // Update local state
    } else {
      // If item is in the cart, increase its quantity
      const newQty = quantity + 1;
      updateQuantity(initialFood.id, newQty);
      setQuantity(newQty); // Update local state
    }
  };
  const handleDecrease = () => {
    const newQuantity = quantity - 1;
    if (newQuantity <= 0) {
      // If quantity drops to 0 or less, remove from cart
      removeFromCart(initialFood.id);
      setQuantity(0); // Update local state
    } else {
      // Otherwise, update quantity
      updateQuantity(initialFood.id, newQuantity);
      setQuantity(newQuantity); // Update local state
    }
  };

  const toggleExtra = (id: string) => {
    setSelectedExtraIds((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  // Render the UI elements that need client-side logic
  return (
    <>
      {" "}
      {/* Using fragment as the root element */}
      {/* Food Image - Can be rendered here or passed from server if static */}
      <div className="rounded-2xl overflow-hidden mb-4">
        <Image
          src={food.image ? food.image : FoodPic} // Use state food image or placeholder
          width={800}
          height={500}
          alt={food.name}
          className="w-full h-64 object-cover"
          priority
        />
      </div>
      {/* Info - Rendered here because price changes based on extras */}
      <h1 className="text-2xl sm:text-3xl font-bold mb-1">{food.name}</h1>{" "}
      {/* Use state food name */}
      <p className="text-sm text-gray-500">From {food.vendor}</p>{" "}
      {/* Use state food vendor */}
      <p className="text-orange-600 font-semibold text-lg mt-2">
        ₦{food.price} {/* Use state food price (will update based on extras) */}
      </p>
      <p className="text-sm text-gray-600 mt-2">{food.description}</p>{" "}
      {/* Use state food description */}
      {/* Extras Selection - Interactive part */}
      <div className="mt-6">
        <h3 className="text-md font-semibold mb-2">Add Extras</h3>
        <div className="flex flex-cols gap-3 overflow-x-auto w-full">
          {availableExtras.map((extra) => (
            <label
              // Using extra.id as key, assuming IDs are unique for extras
              // If not, combine with index or a unique vendor+id combination if needed
              key={extra.id}
              className={`border p-3 rounded-xl text-sm cursor-pointer transition ${
                selectedExtraIds.includes(extra.id)
                  ? "bg-orange-100 border-orange-400"
                  : "hover:border-gray-400"
              }`}
            >
              <input
                type="checkbox"
                value={extra.id}
                checked={selectedExtraIds.includes(extra.id)}
                onChange={() => toggleExtra(extra.id)}
                className="mr-2"
              />
              {extra.name} – ₦{extra.price}
            </label>
          ))}
        </div>
      </div>
      {/* Quantity + Cart Button - Interactive part */}
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
      {/* The closing div from the original component is now in the Server Component */}
    </>
  );
}
