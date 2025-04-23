import React from 'react'

export default function page() {
  return (
    <div>page</div>
  )
}
//   import React from "react";
// import Image from "next/image";
// import Reimage from "@/public/images/bike_.png";
// import { FoodCard } from "@/components/user/FoodCard";

// interface RestaurantMenuPageProps {
//   params: {
//     id: string;
//   };
// }

// // Mock menu data – replace with real API data
// const mockMenu = [
//   {
//     id: "1",
//     name: "Jollof Rice & Chicken",
//     price: "₦1500",
//     image: "/images/Jollof_Rice-removebg-preview.png",
//     description: "Delicious party-style Jollof with grilled chicken",
//   },
//   {
//     id: "2",
//     name: "Shawarma",
//     price: "₦1200",
//     image: "/images/Jollof_Rice-removebg-preview.png",
//     description: "Spicy beef shawarma with extra cream",
//   },
//   {
//     id: "3",
//     name: "Efo Riro",
//     price: "₦1000",
//     image: "/images/Jollof_Rice-removebg-preview.png",
//     description: "Well-seasoned spinach with assorted meat",
//   },
// ];

// export default function RestaurantMenuPage({
//   params,
// }: RestaurantMenuPageProps) {
//   return (
//     <div className="p-4 w-full h-full overflow-y-scroll glass-scrollbar mx-auto">
//       {/* Restaurant Banner */}
//       <div className="rounded-xl overflow-hidden mb-6">
//         <Image
//           src={Reimage}
//           width={1200}
//           height={400}
//           alt="Restaurant Banner"
//           className="w-full h-56 sm:h-80 object-cover"
//         />
//       </div>

//       {/* Info Section */}
//       <div className="mb-6">
//         <h1 className="text-2xl sm:text-3xl font-bold mb-1">
//           Restaurant: {params.id}
//         </h1>
//         <p className="text-sm text-gray-600">Pizza, Shawarma • 4.6★</p>
//         <p className="text-sm text-gray-500 mb-3">Located in: Ekpoma</p>

//         <button className="bg-orange-500 text-white px-5 py-2 rounded-xl hover:bg-orange-600 transition">
//           Order Now
//         </button>
//       </div>

//       {/* Menu Section */}
//       <div className="mb-8">
//         <h2 className="text-xl sm:text-2xl font-semibold mb-4">Menu</h2>

//         {mockMenu.length === 0 ? (
//           <p className="text-gray-500">Menu is currently unavailable.</p>
//         ) : (
//           <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
//             {mockMenu.map((item) => (
//               <>
//                 <FoodCard
//                   id={""}
//                   image={item.image}
//                   name={item.name}
//                   vendor={""}
//                   price={`${item.price.toString()}`}
//                   description={item.description}
//                 />
//               </>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// }

// import React from "react";
// import Image from "next/image";
// import Reimage from "@/public/images/bike_.png";
// import { FoodCard } from "@/components/user/FoodCard";

// interface RestaurantMenuPageProps {
//   params: {
//     id: string;
//   };
// }

// // Mock menu data – replace with real API data
// const mockMenu = [
//   {
//     id: "1",
//     name: "Jollof Rice & Chicken",
//     price: "₦1500",
//     image: "/images/Jollof_Rice-removebg-preview.png",
//     description: "Delicious party-style Jollof with grilled chicken",
//   },
//   {
//     id: "2",
//     name: "Shawarma",
//     price: "₦1200",
//     image: "/images/Jollof_Rice-removebg-preview.png",
//     description: "Spicy beef shawarma with extra cream",
//   },
//   {
//     id: "3",
//     name: "Efo Riro",
//     price: "₦1000",
//     image: "/images/Jollof_Rice-removebg-preview.png",
//     description: "Well-seasoned spinach with assorted meat",
//   },
// ];

// export default function RestaurantMenuPage({
//   params,
// }: RestaurantMenuPageProps) {
//   return (
//     <div className="p-4 w-full h-full overflow-y-scroll glass-scrollbar mx-auto">
//       {/* Restaurant Banner */}
//       <div className="rounded-xl overflow-hidden mb-6">
//         <Image
//           src={Reimage}
//           width={1200}
//           height={400}
//           alt="Restaurant Banner"
//           className="w-full h-56 sm:h-80 object-cover"
//         />
//       </div>

//       {/* Info Section */}
//       <div className="mb-6">
//         <h1 className="text-2xl sm:text-3xl font-bold mb-1">
//           Restaurant: {params.id}
//         </h1>
//         <p className="text-sm text-gray-600">Pizza, Shawarma • 4.6★</p>
//         <p className="text-sm text-gray-500 mb-3">Located in: Ekpoma</p>

//         <button className="bg-orange-500 text-white px-5 py-2 rounded-xl hover:bg-orange-600 transition">
//           Order Now
//         </button>
//       </div>

//       {/* Menu Section */}
//       <div className="mb-8">
//         <h2 className="text-xl sm:text-2xl font-semibold mb-4">Menu</h2>

//         {mockMenu.length === 0 ? (
//           <p className="text-gray-500">Menu is currently unavailable.</p>
//         ) : (
//           <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
//             {mockMenu.map((item) => (
//               <>
//                 <FoodCard
//                   id={""}
//                   image={item.image}
//                   name={item.name}
//                   vendor={""}
//                   price={`${item.price.toString()}`}
//                   description={item.description}
//                 />
//               </>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
