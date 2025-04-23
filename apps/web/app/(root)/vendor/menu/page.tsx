// apps/web/app/(root)/vendor/menu/page.tsx
"use client";

import React, { useState } from "react";
// Adjust import paths if necessary
import MenuForm from "@/components/vendor/MenuForm";
import MenuList from "@/components/vendor/MenuList";
import { useVendor } from "@/context/VendorContext";
import GlassButton from "@/components/ui/GlassButton";
import { Loader2 } from "lucide-react"; // Import Loader icon
import GlassDiv from "@/components/ui/GlassDiv"; // Assuming you have this component

export default function VendorMenuPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<"category" | "menu">("category");

  const {
    vendorId,
    categories,
    menuItems,
    isLoading, // Get loading state from context
    fetchError, // Get fetch error from context
    addCategory,
    addMenuItem,
  } = useVendor();

  // Note: The state for form inputs (newCategory, itemName, etc.) was in VendorMenuPage,
  // but it's better managed inside MenuForm itself as it's specific to the form.
  // MenuForm already has state for this.
  // The handleAddCategory/handleAddMenuItem logic in VendorMenuPage is redundant
  // as MenuForm calls the addCategory/addMenuItem functions directly via props.
  // Removing the redundant state and handlers from VendorMenuPage.

  // --- Render ---
  // Show loading or error states based on context
  if (isLoading) {
    return (
      <div className="flex justify-center items-center w-full h-full text-gray-800">
        <Loader2 size={32} className="animate-spin text-orange-500" />
        <p className="ml-2 text-white">Loading menu data...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="text-red-600 text-center mt-8">
        <p>Failed to load vendor menu.</p>
        <p>{fetchError.message}</p>{" "}
        {/* Display fetch error message */}
      </div>
    );
  }

  // Handle case where vendorId is not available after loading (e.g., user not logged in or not a vendor)
  // Although the context should ideally prevent rendering if user is not authenticated as a vendor,
  // adding a safeguard here.
  if (!vendorId && !isLoading && !fetchError) {
    return (
      <div className="text-gray-700 text-center mt-8">
        <p>You must be logged in as a vendor to manage your menu.</p>
        {/* Optional: Link to login page */}
      </div>
    );
  }

  return (
    <div className="p-6 w-full h-auto mx-auto space-y-8 overflow-y-scroll">
      <h1 className="text-2xl font-bold text-white">Vendor Menu Manager</h1>
      <div className="flex justify-end gap-4">
        <GlassButton
          onClick={() => {
            setFormType("category");
            setIsFormOpen(true);
          }}
        >
          Create Category
        </GlassButton>
        <GlassButton
          onClick={() => {
            setFormType("menu");
            setIsFormOpen(true);
          }}
        >
          Create Menu Item
        </GlassButton>
      </div>
      {/* Pass loading and error states to MenuList if it needs to react to them */}
      <MenuList
        categories={categories}
        menuItems={menuItems}
        isLoading={isLoading}
        error={fetchError}
      />
      {/* Pass states */}
      <MenuForm
        isOpen={isFormOpen}
        formType={formType}
        categories={categories}
        onClose={() => setIsFormOpen(false)}
        // Pass the functions directly from the context
        onAddCategory={addCategory}
        // onAddMenuItem={addMenuItem}
        // No need to pass vendor_id and created_at here, addMenuItem handles it
        onAddMenuItem={({ name, description, price, category_id }) =>
          addMenuItem({
            name,
            description,
            price,
            is_available: true,
            category_id,
            created_at: new Date().toISOString(),
            vendor_id: vendorId || "",
          })
        }
      />
    </div>
  );
}
