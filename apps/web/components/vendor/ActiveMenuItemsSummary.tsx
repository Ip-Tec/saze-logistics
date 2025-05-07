// components/vendor/ActiveMenuItemsSummary.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@shared/supabaseClient";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import Image from "next/image"; // Use next/image
import DefaultImage from "@/public/images/logo.png"; // Placeholder image

interface ActiveMenuItemsSummaryProps {
  vendorId: string;
}

export default function ActiveMenuItemsSummary({ vendorId }: ActiveMenuItemsSummaryProps) {
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveCount = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { count, error } = await supabase
        .from("menu_item")
        .select("*", { count: "exact", head: true })
        .eq("vendor_id", vendorId)
        .eq("is_available", true); // Count only available items

      if (error) throw error;
      setActiveCount(count);
    } catch (err: any) {
      console.error("Error fetching active menu items count:", err);
      setError(err.message || "Failed to load active items count.");
      setActiveCount(null);
      toast.error(err.message || "Failed to load active items count.");
    } finally {
      setIsLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchActiveCount();
  }, [fetchActiveCount]);

  // Find a representative image? Or use a generic icon/image
  // For simplicity here, I'll just use a placeholder image and the count.
  // You might want to fetch one actual active item's image if desired.

  return (
    <div className="rounded-2xl bg-white/10 p-6 backdrop-blur border border-white/20 shadow-md flex-1">
      <h2 className="text-white font-semibold text-lg mb-4">Active Listings Summary</h2> {/* Renamed for clarity */}

      {isLoading ? (
         <div className="flex w-full justify-center items-center h-20">
            <Loader2 size={20} className="animate-spin text-orange-500" />
            <p className="ml-2 text-gray-300 text-sm">Loading count...</p>
         </div>
      ) : error ? (
         <div className="text-red-500 text-center text-sm">
            <p>{error}</p>
         </div>
      ) : (
        <div className="flex items-center space-x-4">
           {/* Generic Icon or placeholder image */}
           <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
             <Image
                src={DefaultImage.src} // Using default logo as placeholder
                alt="Active Items Icon"
                fill
                sizes="64px"
                className="object-cover opacity-50" // Styled to look like an icon
             />
              {/* Optional: Overlay count on image */}
               <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white z-10">
                   {activeCount !== null ? activeCount : "?"}
               </div>
           </div>
           <div>
               <p className="text-xl font-bold text-white">
                   {activeCount !== null ? activeCount : "N/A"}
               </p>
               <p className="text-sm text-gray-300">Active Menu Items</p>
           </div>
        </div>
      )}
    </div>
  );
}
