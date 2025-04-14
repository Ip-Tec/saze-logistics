import React from "react";
import Image from "next/image";
import Reimage from "@/public/images/bike_.png"

interface RestaurantDetailPageProps {
  params: {
    id: string;
  };
}

export default function RestaurantDetailPage({
  params,
}: RestaurantDetailPageProps) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-2">Restaurant: {params.id}</h1>
      <Image
        src={Reimage}
        width={100}
        height={100}
        alt="restaurant"
        className="w-full h-60 object-cover rounded-xl mb-4"
      />
      <p className="text-sm text-gray-600 mb-2">Pizza, Shawarma • 4.6★</p>
      <p className="text-md text-gray-500 mb-4">Located in: Ekpoma</p>
      <button className="bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition">
        View Menu
      </button>
    </div>
  );
}
