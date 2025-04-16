import React from "react";
import Image from "next/image";
import Link from "next/link";
import GlassDiv from "@/components/ui/GlassDiv";
import Food from "@/public/images/Pepper_Soup-removebg-preview.png";

interface FoodCardProps {
  id: string;
  image: string;
  name: string;
  vendor: string;
  price: number | string;
  description?: string;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  id,
  image,
  name,
  vendor,
  price,
  description,
}) => {
  return (
    <Link href={`/user/food/${id}`}>
      <GlassDiv className="rounded-2xl shadow-green-200 hover:shadow-lg transition hover:scale-[1.02] cursor-pointer !p-0 overflow-hidden">
        <Image
          src={Food}
          width={100}
          height={100}
          className="w-full h-52 object-cover rounded-xl"
          alt={name}
        />
        <GlassDiv className="w-full absolute bottom-0">
          <h3 className="font-medium text-sm">{name}</h3>
          <p className="text-xs text-gray-500">{vendor}</p>
          <p className="text-orange-600 text-sm font-semibold">₦{price}</p>
          {description ? (
            <p className="text-xs text-gray-500">{description}</p>
          ) : null}
        </GlassDiv>
      </GlassDiv>
    </Link>
  );
};
