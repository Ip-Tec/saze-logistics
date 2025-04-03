"use client";
import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Rider from "@/public/images/bike_.png";

/*
 * Let's Do It Together
 * @description: This component displays registration options for users, vendors, and riders.
 * Clicking a role navigates to the registration page with the selected role as a query parameter.
 */

const roles = [
  {
    title: "User",
    description: "Sign up to order delicious meals from your favorite vendors.",
  },
  {
    title: "Vendor",
    description:
      "Join as a vendor to showcase your menu and serve more customers.",
  },
  {
    title: "Rider",
    description:
      "Become a delivery rider and earn by delivering orders to customers.",
    image: Rider,
  },
];

const Card: React.FC<{ title: string; description: string; image?: any }> = ({
  title,
  description,
  image,
}) => {
  const router = useRouter();

  const handleRegister = () => {
    router.push(`/auth/register?role=${title.toLowerCase()}`);
  };

  return (
    <div className="bg-white flex flex-col items-center justify-center text-gray-800 rounded-lg shadow-md p-6">
      {image && <Image src={image} alt={title} width={100} height={100} />}
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <button
        onClick={handleRegister}
        className="bg-gradient-to-br from-yellow-200 to-blue-500 px-6 py-3 rounded-lg shadow-md hover:bg-gray-200 transition duration-300 cursor-pointer"
      >
        Register
      </button>
    </div>
  );
};

const LetDoItTogether: React.FC = () => {
  return (
    <div className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-16">
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
