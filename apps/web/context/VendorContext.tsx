// context/VendorContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import { toast } from "react-toastify";
import { supabase } from "@shared/supabaseClient";
import { useAuthContext } from "./AuthContext"; 
import { MenuCategory, MenuItem } from "@shared/types"; 

type VendorContextType = {
  vendorId: string | undefined; // vendorId can be undefined initially
  categories: MenuCategory[];
  setCategories: Dispatch<SetStateAction<MenuCategory[]>>;
  menuItems: MenuItem[];
  setMenuItems: Dispatch<SetStateAction<MenuItem[]>>;
  isLoading: boolean; // Added loading state for initial fetch
  fetchError: Error | null; // Added error state for initial fetch
  /**
   * Inserts a new category and returns it, or undefined on failure.
   */
  addCategory: (
    name: string,
    description?: string
  ) => Promise<MenuCategory | undefined>;
  /**
   * Inserts a new menu item and returns it, or undefined on failure.
   */
  addMenuItem: (item: Omit<MenuItem, "id">) => Promise<MenuItem | undefined>;
};

const VendorContext = createContext<VendorContextType | undefined>(undefined);

export const VendorProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuthContext();
  const vendorId = user?.id;
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true); // State for initial loading
  const [fetchError, setFetchError] = useState<Error | null>(null); // State for initial fetch error

  // Fetch categories & items when we know vendorId
  useEffect(() => {
    const fetchData = async () => {
      if (!vendorId) {
        setIsLoading(false); // Stop loading if no vendorId
        setFetchError(null);
        setCategories([]);
        setMenuItems([]);
        return;
      }

      setIsLoading(true); // Start loading
      setFetchError(null); // Clear previous errors

      try {
        // Fetch Categories
        const { data: catData, error: catErr } = await supabase
          .from("menu_category") // Ensure correct table name 'menu_category'
          .select("*")
          .eq("vendor_id", vendorId);

        if (catErr) throw catErr;
        setCategories(catData || []);

        // Fetch Menu Items
        const { data: itemData, error: itemErr } = await supabase
          .from("menu_item") // Ensure correct table name 'menu_item'
          .select("*")
          .eq("vendor_id", vendorId);

        if (itemErr) throw itemErr;
        setMenuItems(itemData || []);
      } catch (error: any) {
        console.error("Error fetching vendor menu data:", error);
        setFetchError(error); // Set fetch error
        setCategories([]); // Clear data on error
        setMenuItems([]);
        toast.error("Failed to load vendor menu."); // Show a toast on fetch error
      } finally {
        setIsLoading(false); // Stop loading regardless of success or failure
      }
    };

    fetchData(); // Execute the fetch function
  }, [vendorId]); // Re-run effect when vendorId changes

  const addCategory = async (
    name: string,
    description?: string
  ): Promise<MenuCategory | undefined> => {
    if (!vendorId) {
      toast.error("Not authenticated");
      return undefined; // Return undefined on failure
    }

    // Note: You might want loading/error state for mutations too,
    // but keeping it simple based on your original code.
    // The MenuForm component manages its own loading state.

    const newCat = {
      name,
      description: description ?? null,
      vendor_id: vendorId,
      // created_at should ideally be set by a database default or server-side
      // Keeping client-side for now as per your code, but consider server-side.
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from("menu_category") // Ensure correct table name
        .insert(newCat)
        .select()
        .single();

      if (error || !data) {
        console.error("Error inserting category:", error);
        toast.error("Could not add category");
        return undefined; // Return undefined on failure
      }

      setCategories((prev) => [...prev, data]);
      toast.success("Category added successfully!"); // More descriptive toast
      return data; // Return the newly created category
    } catch (error: any) {
      console.error("Unexpected error adding category:", error);
      toast.error("An unexpected error occurred while adding category.");
      return undefined; // Return undefined on failure
    }
  };

  const addMenuItem = async (
    item: Omit<MenuItem, "id">
  ): Promise<MenuItem | undefined> => {
    if (!vendorId) {
      toast.error("Not authenticated");
      return undefined; // Return undefined on failure
    }

    // Note: Generating ID client-side is okay for optimistic UI,
    // but database-generated UUIDs are generally preferred for uniqueness guarantees.
    // Keeping client-side as per your code.
    const newItem: MenuItem = {
      ...item,
      id: crypto.randomUUID(), // Client-side ID generation
      vendor_id: vendorId,
      // created_at should ideally be set by a database default or server-side
      created_at: new Date().toISOString(), // Client-side timestamp
    };

    try {
      const { error } = await supabase.from("menu_item").insert(newItem); // Ensure correct table name

      if (error) {
        console.error("Error inserting menu item:", error);
        toast.error("Could not add menu item");
        return undefined; // Return undefined on failure
      }

      setMenuItems((prev) => [...prev, newItem]);
      toast.success("Menu item added successfully!"); // More descriptive toast
      return newItem; // Return the newly created menu item
    } catch (error: any) {
      console.error("Unexpected error adding menu item:", error);
      toast.error("An unexpected error occurred while adding menu item.");
      return undefined; // Return undefined on failure
    }
  };

  // Do not render children if vendorId is not available and loading
  // The consuming component should handle the loading/error states from the hook
  // if (!vendorId && isLoading) {
  //   return <>{children}</>; // Or a specific loading indicator here
  // }

  return (
    <VendorContext.Provider
      value={{
        vendorId,
        categories,
        setCategories,
        menuItems,
        setMenuItems,
        isLoading,
        fetchError,
        addCategory,
        addMenuItem,
      }}
    >
      {children}
    </VendorContext.Provider>
  );
};

export const useVendor = (): VendorContextType => {
  const ctx = useContext(VendorContext);
  if (!ctx) {
    throw new Error("useVendor must be used within VendorProvider");
  }
  return ctx;
};
