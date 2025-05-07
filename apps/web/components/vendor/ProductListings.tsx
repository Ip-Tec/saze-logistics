// components/vendor/ProductListings.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image"; // Use next/image
import { supabase } from "@shared/supabaseClient";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import DefaultImage from "@/public/images/logo.png"; // Or a placeholder image

interface ProductListingsProps {
  vendorId: string;
}

type MenuItem = {
  id: string;
  name: string | null;
  price: number | null;
  // stock: number | null; // Assuming you have a 'stock' column
  is_available: boolean | null;
  menu_item_image: { image_url: string | null }[] | null;
};

const formatCurrency = (amount: number | null): string => {
    if (amount === null) return "N/A";
    return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function ProductListings({ vendorId }: ProductListingsProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenuItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch a limited number of menu items (e.g., latest 6)
      const { data, error } = await supabase
        .from("menu_item")
        .select("id, name, price, is_available, menu_item_image(image_url)")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false })
        .limit(6); // Limit to a few items for the dashboard view

      if (error) throw error;
      setMenuItems(data || []);
    } catch (err: any) {
      console.error("Error fetching menu items:", err);
      setError(err.message || "Failed to load menu items.");
      setMenuItems([]);
      toast.error(err.message || "Failed to load menu items.");
    } finally {
      setIsLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  return (
    <div className="rounded-2xl bg-white/10 p-6 backdrop-blur border border-white/50 shadow-md flex-1">
      <h2 className="text-black font-semibold text-lg mb-4">Product Listings</h2>

      {isLoading ? (
        <div className="flex w-full justify-center items-center h-40">
          <Loader2 size={24} className="animate-spin text-orange-500" />
          <p className="ml-2 text-gray-500">Loading products...</p>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center">
          <p>{error}</p>
        </div>
      ) : menuItems.length === 0 ? (
        <div className="text-gray-500 text-center">No menu items found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> {/* Responsive grid for items */}
          {menuItems.map((item) => (
            <div key={item.id} className="flex items-center space-x-3 bg-white/5 rounded-lg p-3">
                {/* Image Container */}
                <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
                     <Image
                        src={item.menu_item_image?.[0]?.image_url || DefaultImage.src}
                        alt={item.name || 'Menu Item'}
                        fill
                        sizes="64px" // Define size for this context
                        className="object-cover"
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = DefaultImage.src;
                        }}
                     />
                </div>
                <div>
                    <p className="text-sm font-medium text-white truncate">{item.name || 'Unnamed Item'}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(item.price)}</p>
                     {/* Display stock if available, handle null/undefined/unavailable */}
                     {/* <p className="text-xs text-gray-400">
                        Stock: {item.stock !== null && item.stock !== undefined ? item.stock : item.is_available ? 'In Stock' : 'Unavailable'}
                    </p> */}
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
// Note: Consider moving formatCurrency to a shared utils file
