// components/user/ProductCard.tsx

"use client";

import React from "react";
import Link from "next/link";
import Default from "@/public/images/logo.png";
import GlassDiv from "@/components/ui/GlassDiv";

interface ProductCardProps {
  id: string;
  image: string;
  name: string;
  vendor: string;
  price: number | string;
  description?: string | null;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  image,
  name,
  vendor,
  price,
  description,
}) => {
  // Ensure description is treated as optional
  const displayDescription = description ?? undefined;
  console.log({ id, image, name, vendor, price, description });
  return (
    // Link to the specific food item detail page
    <Link href={`/user/products/${id}`}>
      <GlassDiv className="rounded-2xl shadow-green-200 hover:shadow-lg transition hover:scale-[1.02] cursor-pointer !p-0 overflow-hidden">
        {/* Image Container for next/image fill */}
        <div className="relative w-full h-auto">
          {/* Maintain the card image size */}
          <img
            src={image || Default.src}
            alt={name}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = Default.src;
            }}
          />
        </div>

        {/* Content below the image */}
        <div className="w-full p-4 space-y-1">
          {/* Add padding here */}
          <h3 className="font-medium text-base text-gray-800">{name}</h3>
          <p className="text-xs text-gray-500">{vendor}</p>
          <p className="text-orange-600 text-lg font-semibold">₦{price}</p>
          {displayDescription ? (
            <p className="text-sm text-gray-600 mt-2">{displayDescription}</p>
          ) : null}
        </div>
      </GlassDiv>
    </Link>
  );
};
