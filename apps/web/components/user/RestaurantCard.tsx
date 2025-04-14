import React from "react";
import Image from "next/image";
import Link from "next/link";
import GlassDiv from "@/components/ui/GlassDiv";
import Food from "@/public/images/Jollof_Rice-removebg-preview.png";
import GlassButton from "../ui/GlassButton";

interface RestaurantCardProps {
  id: string; // NEW
  image: string;
  name: string;
  tags: string;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  id,
  image,
  name,
  tags,
}) => {
  return (
    <GlassButton
      href={`/user/restaurant/${id}`}
      className="!bg-white/30 rounded-xl !p-0 shadow hover:shadow-lg transition cursor-pointer"
    >
      <Image
        src={Food}
        width={100}
        height={100}
        className="w-full h-48 object-cover rounded-lg mb-2"
        alt={name}
      />
      <GlassDiv className="w-full">
        <h3 className="font-medium text-sm text-black">{name}</h3>
        <p className="text-xs text-gray-500">{tags}</p>
      </GlassDiv>
    </GlassButton>
  );
};
