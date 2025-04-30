// hooks/useFoodItems.ts
import { useEffect, useState } from "react";
import { supabase } from "@shared/supabaseClient";

// Define a type that represents the combined data needed for a food card
// This should match the processed data shape
export type FoodItemForCard = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  vendor_name: string | null;
  image_url: string | null;
};

// Function to fetch a limited number of random food items
// Added a limit parameter for flexibility
export async function fetchRandomFoodItems(
  limit = 8
): Promise<FoodItemForCard[]> {
  try {
    // Fetch menu items, order randomly, and limit the results
    const { data: menuItems, error: menuItemsError } = await supabase
      .from("menu_item")
      .select(
        `
        id,
        name,
        price,
        description,
        profiles:vendor_id(name), -- Select the vendor's name via the relationship (using alias 'vendor_id')
        menu_item_image:menu_item_image(image_url) -- Select related image URLs via the relationship
      `
      )
      .eq("is_available", true) // Only fetch available items
      .order("random()") // Order results randomly
      .limit(limit); // Limit the number of results

    if (menuItemsError) {
      console.error("Error fetching random menu items:", menuItemsError);
      throw new Error(menuItemsError.message);
    }

    // Process the fetched data into the desired format for the card
    const processedItems: FoodItemForCard[] = menuItems.map((item: any) => {
      // Ensure relationships returned data and cast types correctly
      const vendorName = item.profiles ? item.profiles.name : "Unknown Vendor";
      // Get the first image URL, or null if no images exist
      // item.menu_item_image is an array of objects { image_url: string }
      const imageUrl =
        (item.menu_item_image as { image_url: string }[] | null)?.[0]
          ?.image_url || null;

      return {
        id: item.id,
        name: item.name,
        price: item.price,
        description: item.description,
        vendor_name: vendorName,
        image_url: imageUrl,
      };
    });

    return processedItems;
  } catch (error: any) {
    console.error("Unexpected error fetching random food items:", error);
    return [];
  }
}

// Hook to use the random food item fetching function
export function useFoodItems() {
  const [foodItems, setFoodItems] = useState<FoodItemForCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadFoodItems = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch a limited number of random items for the homepage display
        const items = await fetchRandomFoodItems(8); // Fetch e.g., 8 random items
        setFoodItems(items);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadFoodItems();
  }, []); // Empty dependency array means this runs once on mount

  return { foodItems, isLoading, error };
}
