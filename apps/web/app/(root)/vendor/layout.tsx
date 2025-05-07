"use client";
import React from "react";
import { motion } from "framer-motion";
import { ToastContainer } from "react-toastify";
import GlassComponent from "@/components/ui/glass";
import VendorSidebar from "@/components/vendor/Sidebar";
import { VendorProvider } from "@/context/VendorContext";
import { BellIcon } from "@/components/reuse/BellIcon";

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <VendorProvider>
      <BellIcon />
      <div className="top-0 grid grid-cols-1 md:grid-cols-4 min-h-screen w-full m-0 p-0" style={{margin: "-24px 0", padding: "0"}}>
        <div className="w-full h-full">
          <VendorSidebar />
        </div>
        <div className="md:col-span-3 w-full">
          {children}
        </div>
      </div>
    </VendorProvider>
  );
}
