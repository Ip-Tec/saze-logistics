"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Rider from "@/public/images/bike_.png";
import Food from "@/public/images/Jollof_Rice-removebg-preview.png"
import Person2 from "@/public/images/user-removebg-preview.png"

interface Role {
  title: string;
  description: string;
  image?: any;
}

const roles: Role[] = [
  {
    title: "Customer",
    image: Person2,
    description: "Sign up to order delicious meals from your favorite vendors.",
  },
  {
    title: "Vendor",
    image: Food,
    description:
      "Join as a vendor to showcase your menu and serve more customers.",
  },
  {
    title: "Rider",
    image: Rider,
    description:
      "Become a delivery rider and earn by delivering orders to customers.",
  },
];

// Define a mapping for background colors for each role (for the card container)
const backgroundMap: Record<string, string> = {
  customer: "bg-blue-100",
  vendor: "bg-green-100",
  rider: "bg-amber-100",
};

// Define a mapping for button background colors for each role
const buttonBgMap: Record<string, string> = {
  customer: "bg-blue-500 hover:bg-blue-600",
  vendor: "bg-green-500 hover:bg-green-600",
  rider: "bg-amber-500 hover:bg-amber-600",
};

const Card: React.FC<{ title: string; description: string; image?: any }> = ({
  title,
  description,
  image,
}) => {
  const router = useRouter();
  const lowerTitle = title.toLowerCase();
  const handleRegister = () => {
    router.push(`/auth/register?role=${lowerTitle}`);
  };

  return (
    <div
      className={`flex flex-col items-center justify-center text-gray-800 rounded-lg shadow-md p-6 ${backgroundMap[lowerTitle]}`}
    >
      {image && <Image src={image} alt={title} width={100} height={100} />}
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <button
        onClick={handleRegister}
        className={`px-6 py-3 rounded-lg shadow-md transition duration-300 cursor-pointer text-white ${buttonBgMap[lowerTitle]}`}
      >
        Register
      </button>
    </div>
  );
};

const LetDoItTogether: React.FC = () => {
  return (
    <div className="w-full b-blue-500 text-white py-16">
      <div className="container mx-auto text-center">
        <h2 className="text-4xl font-bold mb-4">Let's do it together</h2>
      </div>
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map((role, index) => (
          <Card key={index} {...role} />
        ))}
      </div>
    </div>
  );
};

export default LetDoItTogether;
