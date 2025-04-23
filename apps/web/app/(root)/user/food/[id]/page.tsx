import React from 'react'

export default function page() {
  return (
    <div>page</div>
  )
}


// "use client";

// import Image from "next/image";
// import { CartItem } from "@shared/types";
// import { useEffect, useState } from "react";
// import { useCart } from "@/context/CartContext";
// import QuantityPicker from "@/components/ui/QuantityPicker";

// import FoodPic from "@/public/images/Jollof_Rice-removebg-preview.png";

// interface FoodDetailPageProps {
//   params: {
//     id: string;
//   };
//   searchParams?: {
//     [key: string]: string | string[] | undefined;
//   };
// }

// const AVAILABLE_EXTRAS = [
//   { id: "icecream", name: "Ice Cream", price: 500, vendor: "Mama Cee" },
//   { id: "water", name: "Bottled Water", price: 200, vendor: "Mama Tee" },
//   { id: "softdrink", name: "Soft Drink", price: 400, vendor: "Mama Jee" },
//   { id: "softdrink", name: "Soft Drink", price: 400, vendor: "Mama Lee" },
// ];

// export default function FoodDetailPage({ params, searchParams }: FoodDetailPageProps) {
//   const { id } = params;
//   const [quantity, setQuantity] = useState(0);
//   const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

//   const [food, setFood] = useState<CartItem>({
//     quantity: 1,
//     id: "2222222",
//     name: "Jollof Rice",
//     description: "Spicy, party-style Jollof rice with fried chicken & salad.",
//     vendor_id: "1234567",
//     is_available: true,
//     price: 2500,
//     image: "/sample-food.jpg",
//     vendor: "Mama Cee",
//     created_at: "",
//   });

//   const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
//   const existingItem = cart.find((item) => item.id === id);

//   useEffect(() => {
//     const fetchFood = async () => {
//       try {
//         const res = await fetch(`/api/foods/${id}`);
//         if (!res.ok) throw new Error('Failed to fetch food');
//         const data = await res.json();
//         setFood(data);
//       } catch (error) {
//         console.error('Error fetching food:', error);
//       }
//     };

//     fetchFood();
//   }, [id]);

//   useEffect(() => {
//     if (existingItem) {
//       setQuantity(existingItem.quantity);
//     } else {
//       setQuantity(0);
//     }
//   }, [existingItem]);

//   const handleAdd = () => {
//     const extrasTotal = selectedExtras.reduce((sum, extraId) => {
//       const extra = AVAILABLE_EXTRAS.find((e) => e.id === extraId);
//       return sum + (extra?.price || 0);
//     }, 0);

//     const foodWithExtras = {
//       ...food,
//       price: food.price + extrasTotal,
//       extras: selectedExtras,
//     };

//     if (!existingItem) {
//       addToCart({ ...foodWithExtras, quantity: 1 });
//       setQuantity(1);
//     } else {
//       const newQty = quantity + 1;
//       updateQuantity(food.id, newQty);
//       setQuantity(newQty);
//     }
//   };

//   const handleDecrease = () => {
//     const newQuantity = quantity - 1;
//     if (newQuantity <= 0) {
//       removeFromCart(food.id);
//       setQuantity(0);
//     } else {
//       updateQuantity(food.id, newQuantity);
//       setQuantity(newQuantity);
//     }
//   };

//   const toggleExtra = (id: string) => {
//     setSelectedExtras((prev) =>
//       prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
//     );
//   };

//   return (
//     <div className="p-4 w-full mx-auto">
//       {/* Food Image */}
//       <div className="rounded-2xl overflow-hidden mb-4">
//         <Image
//           src={food.image ? food.image : FoodPic}
//           width={800}
//           height={500}
//           alt={food.name}
//           className="w-full h-64 object-cover"
//           priority
//         />
//       </div>

//       {/* Info */}
//       <h1 className="text-2xl sm:text-3xl font-bold mb-1">{food.name}</h1>
//       <p className="text-sm text-gray-500">From {food.vendor}</p>
//       <p className="text-orange-600 font-semibold text-lg mt-2">
//         ₦{food.price}
//       </p>
//       <p className="text-sm text-gray-600 mt-2">{food.description}</p>

//       {/* Extras */}
//       <div className="mt-6">
//         <h3 className="text-md font-semibold mb-2">Add Extras</h3>
//         <div className="flex flex-cols gap-3 overflow-x-auto w-full">
//           {AVAILABLE_EXTRAS.map((extra) => (
//             <label
//               key={`${extra.id}-${extra.vendor}`} // Fixed duplicate key issue
//               className={`border p-3 rounded-xl text-sm cursor-pointer transition ${
//                 selectedExtras.includes(extra.id)
//                   ? "bg-orange-100 border-orange-400"
//                   : "hover:border-gray-400"
//               }`}
//             >
//               <input
//                 type="checkbox"
//                 value={extra.id}
//                 checked={selectedExtras.includes(extra.id)}
//                 onChange={() => toggleExtra(extra.id)}
//                 className="mr-2"
//               />
//               {extra.name} – ₦{extra.price}
//             </label>
//           ))}
//         </div>
//       </div>

//       {/* Quantity + Cart Button */}
//       <div className="mt-6 flex items-center gap-4">
//         {quantity > 0 ? (
//           <QuantityPicker
//             quantity={quantity}
//             onIncrease={handleAdd}
//             onDecrease={handleDecrease}
//           />
//         ) : (
//           <button
//             onClick={handleAdd}
//             className="bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 transition w-full sm:w-auto"
//           >
//             Add to Cart
//           </button>
//         )}
//       </div>
//     </div>
//   );
// }