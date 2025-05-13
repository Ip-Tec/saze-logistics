// components/vendor/ProductListings.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image"; // Use next/image
import { supabase } from "@shared/supabaseClient";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import DefaultImage from "@/public/images/logo.png"; // Or a placeholder image
import { Product } from "@shared/types";

interface ProductListingsProps {
  vendorId: string;
}

interface ProductItem extends Product {
  category: {
    id: string;
    name: string;
    image_url: string;
  };
}

const formatCurrency = (amount: number | null): string => {
  if (amount === null) return "N/A";
  return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function ProductListings({ vendorId }: ProductListingsProps) {
  const [menuItems, setMenuItems] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenuItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch a limited number of menu items (e.g., latest 6)
      const { data, error } = await supabase
        .from("products")
        .select("*, category:category_id(id, name, image_url)")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false })
        .limit(8); // Limit to a few items for the dashboard view

      if (error) throw error;
      if (data && Array.isArray(data)) {
        setMenuItems(data as ProductItem[]);
      } else {
        setMenuItems([]);
      }
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
      <h2 className="text-black font-semibold text-lg mb-4">
        Product Listing
      </h2>

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Responsive grid for items */}
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col items-center space-x-3 bg-white/50 rounded-lg p-3 !text-gray-600 shadow-md"
            >
              {/* Image Container */}
              <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
                <Image
                  src={item.image_url || DefaultImage.src}
                  alt={item.name || "Menu Item"}
                  fill
                  sizes="88px"
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DefaultImage.src;
                  }}
                />
              </div>
              {/* Flex container for text */}
              <div className="flex flex-col items-center justify-between min-w-full text-gray-600">
                <p className="text-sm font-medium text-black truncate">
                  {item.name || "Unnamed Item"}
                </p>
                <p className="text-sm font-medium text-black truncate">
                  {item.category.name}
                </p>
                <p className="text-sm font-medium text-black truncate">
                  {item.available_quantity}
                </p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(item.unit_price)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
// Note: Consider moving formatCurrency to a shared utils file
