"use client";

import GlassComponent from "@/components/ui/glass";
import UserNavbar from "@/components/user/UserNavbar";
import { motion } from "framer-motion";
import React from "react";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full h-full p-0 m-0 overflow-hidden">
      <div className="absolute w-full h-full !overflow-hidden pointer-events-none">
        {/* Friendly Animated Background Circles */}
        <motion.div
          className="absolute -top-10 -left-5 w-[250px] h-[250px] bg-green-500 rounded-full mix-blend-multiply filter opacity-60"
          animate={{
            y: [0, 60, -30, 0],
            x: [0, 40, -40, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{
            duration: 12,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "loop",
          }}
        />

        <motion.div
          className="absolute -bottom-20 -right-10 w-[250px] h-[250px] bg-orange-500 rounded-full mix-blend-multiply filter opacity-60"
          animate={{
            y: [0, -50, 50, 0],
            x: [0, -40, 40, 0],
            scale: [1, 1.05, 1.1, 1],
          }}
          transition={{
            duration: 14,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "loop",
          }}
        />

        <motion.div
          className="absolute bottom-48 left-1/2 w-[200px] h-[200px] bg-amber-400 rounded-full mix-blend-multiply filter opacity-60"
          animate={{
            y: [0, 30, -30, 0],
            x: [0, -30, 30, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{
            duration: 11,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "loop",
          }}
        />
      </div>

      {/* Main Glass Area */}
      <GlassComponent className="!bg-green-600/10 z-10">
        <UserNavbar />
        {children}
      </GlassComponent>
    </div>
  );
}
