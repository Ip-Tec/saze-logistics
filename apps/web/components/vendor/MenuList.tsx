// components/vendor/MenuList.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react"; // Import hooks
import { Database } from "@shared/supabase/types"; // Import DB types
import GlassDiv from "@/components/ui/GlassDiv"; // Assuming GlassDiv is used for list items
import { Loader2, Edit } from "lucide-react"; // For loading indicator and Edit icon
import { supabase } from "@shared/supabaseClient"; // Import Supabase client
import { toast } from "react-toastify"; // For notifications

// Import types from your shared types file
import {
  MenuCategory,
  ProcessedMenuItem, // Import shared type
} from "@shared/types";
import Image from "next/image";

// Define types for the data fetched from Supabase
// This structure matches the select query with the nested relationship
// Explicitly list menu_item fields
// NOTE: This type is used internally for the fetch result before processing.
// The ProcessedMenuItem type is used for the component's state.
type MenuItemQueryResult = {
  category_id: string | null;
  created_at: string | null;
  description: string | null;
  id: string;
  is_available: boolean | null;
  name: string;
  price: number;
  vendor_id: string | null; // Keep vendor_id in query result type

  // The relationship 'menu_item_image' returns an array of related image rows
  menu_item_image:
    | Database["public"]["Tables"]["menu_item_image"]["Row"][]
    | null;
};

// Props for the MenuList component
interface MenuListProps {
  vendorId: string | null | undefined; // Pass vendorId from the context/page
  // Add a prop to handle editing a menu item
  onEditMenuItem: (item: ProcessedMenuItem) => void;
}

export default function MenuList({ vendorId, onEditMenuItem }: MenuListProps) {
  // Receive onEditMenuItem prop
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  // Use the shared ProcessedMenuItem type for the state
  const [menuItems, setMenuItems] = useState<ProcessedMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Data Fetching ---
  // Use useCallback to memoize the fetch function
  const fetchMenuData = useCallback(async () => {
    if (!vendorId) {
      // If vendorId is null or undefined, it means the context is still loading or user is not a vendor.
      // The parent page handles this state, so we just reset here.
      setCategories([]);
      setMenuItems([]);
      setIsLoading(false);
      setError(null); // Clear any previous error
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch categories for this vendor
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("menu_category")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("name", { ascending: true }); // Order categories alphabetically

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []); // Set categories state

      // Fetch menu items for this vendor, including related images
      // Explicitly list menu_item fields instead of using '*'
      // Ensure no extra whitespace or comments within the select string backticks
      const { data: menuItemsData, error: menuItemsError } = await supabase
        .from("menu_item")
        .select(
          `
            category_id,
            created_at,
            description,
            id,
            is_available,
            name,
            price,
            vendor_id,
            menu_item_image ( id, image_url, created_at )
          `
        )
        .eq("vendor_id", vendorId)
        .order("name", { ascending: true }); // Order menu items alphabetically

      if (menuItemsError) throw menuItemsError;

      // Process the fetched menu items to flatten the image data
      // Ensure menuItemsData is treated as an array of MenuItemQueryResult
      const processedMenuItems: ProcessedMenuItem[] =
        (menuItemsData as MenuItemQueryResult[] | null)?.map((item) => {
          // Find the first image URL (or the one you want to display)
          // You might sort item.menu_item_image here if you have a specific order
          const firstImageUrl =
            item.menu_item_image && item.menu_item_image.length > 0
              ? item.menu_item_image[0].image_url // Take the URL of the first image
              : null; // No image available

          // Omit vendor_id, keep the full menu_item_image array as 'images', and add imageUrl
          const { vendor_id, ...rest } = item; // Destructure to omit vendor_id
          return {
            ...rest, // Include all other fields from menu_item
            imageUrl: firstImageUrl, // Add the extracted first image URL
            images: item.menu_item_image, // Keep the full array of images
          };
        }) || []; // Ensure it's an array even if data is null

      setMenuItems(processedMenuItems); // Set processed menu items state
      setError(null); // Clear error on successful fetch
    } catch (err: any) {
      console.error("Error fetching menu data:", err);
      setError(err.message || "Failed to load menu data.");
      setCategories([]);
      setMenuItems([]);
      toast.error("Failed to load menu data."); // Show toast on fetch error
    } finally {
      setIsLoading(false);
    }
  }, [vendorId]); // Dependency on vendorId - refetch when vendorId changes

  // Effect to fetch data when the component mounts or vendorId becomes available/changes
  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]); // Effect depends on the fetchMenuData callback

  // Optional: Add Realtime subscription for menu_item and menu_item_image changes
  useEffect(() => {
    if (!vendorId) return; // Only subscribe if vendorId is available

    // Subscribe to menu_item changes for this vendor
    const menuItemChannel = supabase
      .channel(`menu_items_${vendorId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "menu_item",
          filter: `vendor_id=eq.${vendorId}`,
        },
        (payload) => {
          console.log("Menu item change received!", payload);
          // Refetch all menu data to update both items and categories if needed
          fetchMenuData();
        }
      )
      .subscribe();

    // Subscribe to menu_item_image changes related to this vendor's menu items
    // This requires a more complex filter or RLS policy to link image changes to the vendor.
    // A simpler (though less efficient) approach is to just refetch on any menu_item_image change.
    // For a more precise approach, you might need a function or view in Supabase.
    // Assuming a simple refetch for now:
    const menuItemImageChannel = supabase
      .channel(`menu_item_images`) // Can't filter by vendorId directly here without RLS/Views
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "menu_item_image",
          // Filter here is tricky. If you have RLS that links menu_item_image to vendor_id
          // via menu_item, you might be able to filter. Otherwise, refetching on any change
          // to this table might be necessary, though less performant for large apps.
          // A better approach for large apps is a Supabase function/trigger that notifies
          // a specific channel when an image for a vendor's item changes.
          // For simplicity, let's refetch on any change to this table for now.
          // **NOTE**: This might refetch for other vendors' image changes too!
          // Consider a more specific filter or RLS if possible.
        },
        (payload) => {
          console.log("Menu item image change received!", payload);
          // Refetch all menu data to update images
          fetchMenuData();
        }
      )
      .subscribe();

    // Cleanup subscriptions on component unmount or vendorId change
    return () => {
      supabase.removeChannel(menuItemChannel);
      supabase.removeChannel(menuItemImageChannel); // Clean up image channel
    };
  }, [vendorId, fetchMenuData]); // Re-subscribe if vendorId or fetchMenuData changes

  // --- Group menu items by category ---
  const itemsByCategory: { [categoryId: string]: ProcessedMenuItem[] } = {};
  // Ensure menuItems is an array before calling forEach
  if (menuItems) {
    menuItems.forEach((item) => {
      const catId = item.category_id || "uncategorized"; // Group uncategorized items
      if (!itemsByCategory[catId]) {
        itemsByCategory[catId] = [];
      }
      itemsByCategory[catId].push(item);
    });
  }

  // --- Render ---

  // Render loading or error states
  if (isLoading) {
    return (
      <div className="flex justify-center items-center w-full h-full text-gray-800">
        <Loader2 size={32} className="animate-spin text-orange-500" />
        <p className="ml-2 text-white">Loading menu data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center mt-8">
        <p>Failed to load vendor menu.</p>
        <p>{error}</p> {/* Display error message string */}
      </div>
    );
  }

  // Handle case where there are no categories or menu items after loading
  if (categories.length === 0 && menuItems.length === 0) {
    return (
      <div className="text-gray-700 text-center mt-8">
        <p>Your menu is currently empty.</p>
        <p>Start by creating a category and then add menu items.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Render categories and their menu items */}
      {categories.map((category) => (
        <div key={category.id}>
          <h3 className="text-xl font-semibold text-white mb-4">
            {category.name}
          </h3>
          {/* Check if itemsByCategory[category.id] exists and has items */}
          {itemsByCategory[category.id] &&
          itemsByCategory[category.id].length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {itemsByCategory[category.id].map((item) => (
                // Use GlassDiv or a similar card component for each item
                <GlassDiv
                  key={item.id}
                  className="rounded-xl !p-0 !bg-white/70 !text-black border border-white/10 flex flex-col items-center gap-4 justify-between" // Added justify-between
                >
                  <div className="flex flex-col w-full items-center gap-4">
                    {/* Wrap image and text content */}
                    {/* Display Image if available */}
                    {item.imageUrl ? ( // Use the processed imageUrl
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={100}
                        height={100}
                        className="w-full h-auto object-cover rounded-md flex-shrink-0" // Fixed size image
                        onError={(e) => {
                          // Handle broken image links
                          e.currentTarget.onerror = null; // Prevent infinite loop
                          e.currentTarget.src =
                            "https://placehold.co/64x64?text=No+Image"; // Placeholder
                        }}
                      />
                    ) : (
                      // Optional: Placeholder if no image
                      <div className="w-16 h-16 bg-gray-200 rounded-md flex-shrink-0 flex items-center justify-center text-gray-500 text-xs text-center">
                        No Image
                      </div>
                    )}
                    <div className="flex-1">
                      {/* Use flex-1 to make text content fill space */}
                      <h3 className="text-black text-base font-medium">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-gray-700 text-sm mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="w-full flex justify-between items-center gap-2">
                    <p className="text-green-700 font-semibold mt-2">
                      ₦{item.price?.toFixed(2) || "0.00"}{" "}
                      {/* Format price, handle null */}
                    </p>

                    {/* Edit Button */}
                    <button
                      onClick={() => onEditMenuItem(item)} // Call the onEditMenuItem prop
                      className="p-2 rounded-full text-gray-600 hover:bg-gray-200 focus:outline-none"
                      aria-label={`Edit ${item.name}`}
                    >
                      <Edit size={20} />
                    </button>
                  </div>
                </GlassDiv>
              ))}
            </div>
          ) : (
            <p className="text-gray-700 italic">
              No items in this category yet.
            </p>
          )}
        </div>
      ))}

      {/* Render uncategorized items if any */}
      {itemsByCategory["uncategorized"] &&
        itemsByCategory["uncategorized"].length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              Uncategorized Items
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {itemsByCategory["uncategorized"].map((item) => (
                <GlassDiv
                  key={item.id}
                  className="p-4 rounded-xl !bg-white/70 !text-black border border-white/10 flex items-center gap-4 justify-between" // Added justify-between
                >
                  <div className="flex items-center gap-4">
                    {" "}
                    {/* Wrap image and text content */}
                    {item.imageUrl ? ( // Use the processed imageUrl
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={100}
                        height={100}
                        className="w-w-full h-auto object-cover rounded-md flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src =
                            "https://placehold.co/64x64?text=No+Image";
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-md flex-shrink-0 flex items-center justify-center text-gray-500 text-xs text-center">
                        No Image
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-black text-base font-medium">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-gray-700 text-sm mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="w-full flex items-center justify-between gap-2">
                    <p className="text-green-700 font-semibold mt-2">
                      ₦{item.price?.toFixed(2) || "0.00"}
                    </p>
                    {/* Edit Button */}
                    <button
                      onClick={() => onEditMenuItem(item)} // Call the onEditMenuItem prop
                      className="p-2 rounded-full text-gray-600 hover:bg-gray-200 focus:outline-none"
                      aria-label={`Edit ${item.name}`}
                    >
                      <Edit size={20} />
                    </button>
                  </div>
                </GlassDiv>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
