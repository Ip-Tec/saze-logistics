// components/user/FoodCard.tsx
import React from "react";
import Image from "next/image";
import Link from "next/link";
import GlassDiv from "@/components/ui/GlassDiv";

interface FoodCardProps {
  id: string;
  image: string;
  name: string;
  vendor: string;
  price: number | string;
  description?: string | null;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  id,
  image, // Use the image prop
  name,
  vendor, // Use the vendor prop
  price,
  description,
}) => {
  // Ensure description is treated as optional
  const displayDescription = description ?? undefined; // Use ?? to handle null/undefined

  return (
    // Link to the specific food item detail page
    <Link href={`/user/food/${id}`}>
      <GlassDiv className="rounded-2xl shadow-green-200 hover:shadow-lg transition hover:scale-[1.02] cursor-pointer !p-0 overflow-hidden">
        {/* Image Container for next/image fill */}
        <div className="relative w-full h-52">
          
          {/* Maintain the card image size */}
          <Image
            // Use the image prop for the source URL
            src={image}
            // Use layout="fill" for responsive image within the container
            layout="fill"
            // Use object-cover to maintain aspect ratio and cover the container
            objectFit="cover"
            alt={name}
            // Add loader if needed for specific image hosts (Supabase Storage usually works without)
            // loader={({ src, width, quality }) => `${src}?w=${width}&q=${quality || 75}`}
            // Add sizes prop for better performance on different screen sizes
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            // Handle error if image fails to load
            onError={(e) => {
              e.currentTarget.onerror = null; // Prevent infinite loop
              // Replace with a fallback image if the main image fails
              e.currentTarget.src = "/path/to/fallback-image.jpg"; // Provide a static fallback image
            }}
          />
        </div>

        {/* Content below the image */}
        <div className="w-full p-4 space-y-1">
          
          {/* Add padding here */}
          <h3 className="font-medium text-base text-gray-800">{name}</h3>
          {/* Adjust text color if needed */}
          <p className="text-xs text-gray-500">{vendor}</p>
          {/* Ensure price is displayed correctly */}
          <p className="text-orange-600 text-lg font-semibold">₦{price}</p>
          {/* Conditionally render description */}
          {displayDescription ? (
            <p className="text-sm text-gray-600 mt-2">{displayDescription}</p> // Adjust text size/color/margin
          ) : null}
        </div>
      </GlassDiv>
    </Link>
  );
};
