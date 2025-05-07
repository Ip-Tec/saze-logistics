"use client";
import React from "react";
// Import motion and GlassComponent only if they are used *within* this file's JSX
// Based on the provided code, they are imported but not used in the layout structure itself.
// If they are used inside {children}, they don't need to be imported here.
// import { motion } from "framer-motion";
// import GlassComponent from "@/components/ui/glass";
import { ToastContainer } from "react-toastify"; // Keep this if you want the container here
import VendorSidebar from "@/components/vendor/Sidebar";
import { VendorProvider } from "@/context/VendorContext";
import { BellIcon } from "@/components/reuse/BellIcon"; // Assuming BellIcon is used in the layout

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <VendorProvider>
      {/* BellIcon - Position it fixed so it stays in place */}
      {/* Adjust top/right/z-index as needed for your design */}
      <div className="fixed top-4 right-4 z-50">
        <BellIcon />
      </div>
      {/* Main Layout Container */}
      {/* Use flexbox: column on small, row on md+ */}
      {/* min-h-screen makes sure the container takes at least full viewport height */}
      <div
        className="flex flex-col md:flex-row min-h-screen w-full"
        style={{ marginTop: "-1.5rem" }}
      >
        {/* Sidebar Container */} 
        <div className="w-full md:w-64 md:fixed md:h-screen top-0 left-0">
          <VendorSidebar /> 
        </div>
        {/* Main Content Container */} 
        <div className="flex-1 w-full md:ml-64">{children} </div>
      </div>
      {/* ToastContainer is typically placed near the root */}
      <ToastContainer />
    </VendorProvider>
  );
}
