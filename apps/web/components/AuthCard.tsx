"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Logo from "@/public/images/logo.png";
import Bike from "@/public/images/bike_.png";

interface AuthCardProps {
  title?: string;
  children: React.ReactNode;
}

const AuthCard: React.FC<AuthCardProps> = ({ title, children }) => {
  return (
    <div className="relative md:grid grid-cols-2 justify-between items-center bg-gradient-to-br from-blue-300/35 to-amber-300/35 shadow-md rounded-2xl p-4">
      {/* Background div (only visible on mobile) */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-amber-400/20 md:hidden"></div>

      {/* Main content */}
      <div className="relative bg-white/70 p-8 rounded-lg inset-shadow-md max-w-md w-full mx-auto z-10">
        <Image
          src={Logo}
          alt="Logo"
          width={100}
          height={100}
          className="mx-auto"
        />
        {title && (
          <h2 className="text-2xl font-bold text-center mb-4">{title}</h2>
        )}
        {children}
      </div>

      {/* Bike Image container (hidden in mobile) */}
      <div className="hidden md:block relative">
        <div className="relative shapeless-liquid-hero w-[30rem] h-[30rem] flex items-center justify-center">
          {/* Bike Image */}
          <Image
            alt="bike"
            src={Bike}
            width={400}
            height={400}
            className="mx-auto p-2 object-contain"
          />

          {/* Animated Motion Lines */}
          <div className="absolute bottom-10 right-0 w-full h-16 overflow-hidden">
            {[...Array(3)].map((_, index) => (
              <motion.div
                key={index}
                className="absolute h-[4px] w-[14rem] bg-gray-400 rounded-md"
                initial={{ x: "100%" }} // Start off-screen (right side)
                animate={{ x: "-100%" }} // Move off-screen (left side)
                transition={{
                  duration: 1.2, // Speed of movement
                  repeat: Infinity, // Loop animation
                  ease: "linear",
                  delay: index * 0.3, // Staggered delay for each line
                }}
                style={{
                  bottom: `${index * 10}px`, // Staggered position for spacing
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCard;
