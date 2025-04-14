"use client"
import React from "react";
import { motion } from "framer-motion";
import GlassComponent from "@/components/ui/glass";
import VendorSidebar from "@/components/vendor/Sidebar";

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className="min-h-screen flex items-center justify-center"
      initial={{
        backgroundImage:
          "linear-gradient(to bottom right, rgb(59, 130, 246), rgb(234, 179, 8))", // Initial gradient
      }}
      animate={{
        backgroundImage: [
          "linear-gradient(to bottom right, rgb(59, 130, 246), rgb(234, 179, 8))", // Blue to yellow gradient
          "linear-gradient(to bottom right, rgb(34, 197, 94), rgb(249, 115, 22))", // Green to orange gradient
        ],
      }}
      transition={{
        duration: 3, // Time for one complete animation cycle
        repeat: Infinity, // Repeat the animation infinitely
        repeatType: "reverse", // Alternate between the gradients
      }}
    >
      <GlassComponent>
        <div className="flex w-full h-full p-0 m-0">
          <VendorSidebar />
          {children}
        </div>
      </GlassComponent>
    </motion.div>
  );
}
