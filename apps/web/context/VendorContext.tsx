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
  vendorId: string;
  categories: MenuCategory[];
  setCategories: Dispatch<SetStateAction<MenuCategory[]>>;
  menuItems: MenuItem[];
  setMenuItems: Dispatch<SetStateAction<MenuItem[]>>;
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

  // Fetch categories & items when we know vendorId
  useEffect(() => {
    if (!vendorId) return;
    (async () => {
      const { data: catData, error: catErr } = await supabase
        .from("menu_categories")
        .select("*")
        .eq("vendor_id", vendorId);
      if (catErr) toast.error("Failed to load categories");
      else setCategories(catData || []);

      const { data: itemData, error: itemErr } = await supabase
        .from("menu_items")
        .select("*")
        .eq("vendor_id", vendorId);
      if (itemErr) toast.error("Failed to load menu items");
      else setMenuItems(itemData || []);
    })();
  }, [vendorId]);

  const addCategory = async (
    name: string,
    description?: string
  ): Promise<MenuCategory | undefined> => {
    if (!vendorId) {
      toast.error("Not authenticated");
      return;
    }

    const newCat = {
      name,
      description: description ?? null,
      vendor_id: vendorId,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("menu_categories")
      .insert(newCat)
      .select()
      .single();

    if (error || !data) {
      toast.error("Could not add category");
      return;
    }

    setCategories((prev) => [...prev, data]);
    toast.success("Category added");
    return data;
  };

  const addMenuItem = async (
    item: Omit<MenuItem, "id">
  ): Promise<MenuItem | undefined> => {
    if (!vendorId) {
      toast.error("Not authenticated");
      return;
    }

    const newItem: MenuItem = {
      ...item,
      id: crypto.randomUUID(),
      vendor_id: vendorId,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("menu_items").insert(newItem);

    if (error) {
      toast.error("Could not add menu item");
      return;
    }

    setMenuItems((prev) => [...prev, newItem]);
    toast.success("Menu item added");
    return newItem;
  };

  if (!vendorId) {
    // Optionally you could render a spinner here
    return <>{children}</>;
  }

  return (
    <VendorContext.Provider
      value={{
        vendorId,
        categories,
        setCategories,
        menuItems,
        setMenuItems,
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
