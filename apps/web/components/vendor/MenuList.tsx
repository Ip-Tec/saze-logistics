// components/vendor/MenuList.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react"; // Import hooks
import { Database } from "@shared/supabase/types"; // Import DB types
import GlassDiv from "@/components/ui/GlassDiv"; // Assuming GlassDiv is used for list items
import { Loader2 } from "lucide-react"; // For loading indicator
import { supabase } from "@shared/supabaseClient"; // Import Supabase client
import { toast } from "react-toastify"; // For notifications

// Define types for the data fetched from Supabase
// This structure matches the select query with the nested relationship
// It explicitly lists menu_item fields
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


// Define types for the data used in the component's state (processed data)
// This structure is flattened for easier rendering
type ProcessedMenuItem = Omit<
    MenuItemQueryResult,
    "menu_item_image" | "vendor_id" // Omit the image array and vendor_id
> & {
    // Add the URL of the *first* image for display
    imageUrl: string | null;
};

// Define type for Category rows
type Category = Database["public"]["Tables"]["menu_category"]["Row"];

// Props for the MenuList component
interface MenuListProps {
  vendorId: string | null | undefined; // Pass vendorId from the context/page
}

export default function MenuList({ vendorId }: MenuListProps) {
  const [categories, setCategories] = useState<Category[]>([]);
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
            menu_item_image (
                id,
                image_url,
                created_at
            )
          `
        )
        .eq("vendor_id", vendorId)
        .order("name", { ascending: true }); // Order menu items alphabetically

      if (menuItemsError) throw menuItemsError;

      // Process the fetched menu items to flatten the image data
      const processedMenuItems: ProcessedMenuItem[] =
        menuItemsData?.map((item: MenuItemQueryResult) => { 
          // Explicitly type the item in map
          // Find the first image URL (or the one you want to display)
          // You might sort item.menu_item_image here if you have a specific order
          const firstImageUrl =
            item.menu_item_image && item.menu_item_image.length > 0
              ? item.menu_item_image[0].image_url // Take the URL of the first image
              : null; // No image available

          // Omit the full menu_item_image array and vendor_id, add the single imageUrl
          const { menu_item_image, vendor_id, ...rest } = item; // Destructure to omit
          return {
            ...rest, // Include all other fields from menu_item (category_id, created_at, description, id, is_available, name, price)
            imageUrl: firstImageUrl, // Add the extracted image URL
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
  // This would allow the list to update automatically when items/images are added/updated/deleted.
  // You would subscribe to both tables filtered by vendor_id (for menu_item)
  // and potentially filter menu_item_image changes based on related menu_item_id.
  // A simple approach is to just refetch fetchMenuData() on any relevant change.
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
          {itemsByCategory[category.id] && itemsByCategory[category.id].length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {itemsByCategory[category.id].map((item) => (
                // Use GlassDiv or a similar card component for each item
                <GlassDiv
                  key={item.id}
                  className="p-4 rounded-xl !bg-white/70 !text-black border border-white/10 flex items-center gap-4" // Added flex and gap
                >
                  {/* Display Image if available */}
                  {item.imageUrl ? ( // Use the processed imageUrl
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-md flex-shrink-0" // Fixed size image
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
                    <p className="text-green-700 font-semibold mt-2">
                      ₦{item.price?.toFixed(2) || "0.00"}{" "}
                      {/* Format price, handle null */}
                    </p>
                    {/* Optional: Add Edit/Delete buttons here */}
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
                  className="p-4 rounded-xl !bg-white/70 !text-black border border-white/10 flex items-center gap-4"
                >
                  {item.imageUrl ? ( // Use the processed imageUrl
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-md flex-shrink-0"
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
                    <p className="text-green-700 font-semibold mt-2">
                      ₦{item.price?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                </GlassDiv>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
