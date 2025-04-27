// apps/web/app/(root)/vendor/menu/page.tsx
"use client";

import React, { useState } from "react";
// Adjust import paths if necessary
import MenuForm from "@/components/vendor/MenuForm";
import MenuList from "@/components/vendor/MenuList";
import { useVendor } from "@/context/VendorContext"; // Assuming useVendor provides vendorId and add/update functions
import GlassButton from "@/components/ui/GlassButton";
import { Loader2 } from "lucide-react"; // Import Loader icon
// GlassDiv is not used directly in this component's render
// import GlassDiv from "@/components/ui/GlassDiv";

// Import the ProcessedMenuItem type from MenuList for state typing
import { ProcessedMenuItem } from "@shared/types";

export default function VendorMenuPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<"category" | "menu">("category");
  // Add state to hold the menu item being edited
  const [editingItem, setEditingItem] = useState<ProcessedMenuItem | null>(
    null
  );

  // Get only vendorId, categories (for the form dropdown), and the add/update functions from the context.
  // MenuList will now fetch its own menu items data.
  const {
    vendorId,
    categories, // Still need categories for the form dropdown
    isLoading: isContextLoading, // Use a distinct name for context loading
    fetchError: contextFetchError, // Use a distinct name for context error
    addCategory,
    addMenuItem, // This function should now return the new item's ID
    updateMenuItem, // Get the new update function from context
  } = useVendor();

  // Function to handle when a menu item is selected for editing
  const handleEditMenuItem = (item: ProcessedMenuItem) => {
    setEditingItem(item); // Set the item to be edited
    setFormType("menu"); // Ensure the form opens in menu item mode
    setIsFormOpen(true); // Open the form
  };

  // Function to close the form and reset editing state
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingItem(null); // Clear the editing item when the form is closed
  };

  // --- Render ---
  // Show loading or error states based on context's initial state (fetching vendorId and categories)
  if (isContextLoading) {
    return (
      <div className="flex justify-center items-center w-full h-screen text-gray-800">
        {" "}
        {/* Use h-screen for full page loader */}
        <Loader2 size={32} className="animate-spin text-orange-500" />
        <p className="ml-2 text-white">Loading vendor data...</p>{" "}
        {/* Updated message */}
      </div>
    );
  }

  if (contextFetchError) {
    return (
      <div className="text-red-600 text-center mt-8">
        <p>Failed to load vendor data.</p> {/* Updated message */}
        <p>{contextFetchError.message}</p>
      </div>
    );
  }

  // Handle case where vendorId is not available after loading (e.g., user not logged in or not a vendor)
  if (!vendorId && !isContextLoading && !contextFetchError) {
    return (
      <div className="text-gray-700 text-center mt-8">
        <p>You must be logged in as a vendor to manage your menu.</p>
        {/* Optional: Link to login page */}
      </div>
    );
  }

  // If vendorId is available, render the main menu page content
  return (
    <div className="p-6 w-full h-full mx-auto space-y-8 overflow-y-auto glass-scrollbar">
      {" "}
      {/* Use h-full and overflow */}
      <h1 className="text-2xl font-bold text-white">Vendor Menu Manager</h1>
      <div className="flex justify-end gap-4">
        <GlassButton
          onClick={() => {
            setFormType("category");
            setEditingItem(null); // Ensure editing state is clear when adding category
            setIsFormOpen(true);
          }}
        >
          Create Category
        </GlassButton>
        <GlassButton
          onClick={() => {
            setFormType("menu");
            setEditingItem(null); // Ensure editing state is clear when adding menu item
            setIsFormOpen(true);
          }}
          // Disable menu item button if no categories exist
          disabled={categories.length === 0}
        >
          Create Menu Item
        </GlassButton>
      </div>
      {/* MenuList now fetches its own menu items, pass only vendorId */}
      {/* Pass the handleEditMenuItem function as the onEditMenuItem prop */}
      <MenuList
        vendorId={vendorId}
        onEditMenuItem={handleEditMenuItem} // Pass the handler
      />
      {/* Pass categories (for dropdown), form state, editing item, and add/update functions to MenuForm */}
      <MenuForm
        isOpen={isFormOpen}
        formType={formType}
        categories={categories} // Pass categories for the dropdown
        onClose={handleCloseForm} // Use the new handler to clear editing state
        onAddCategory={addCategory} // Pass the function from context
        onAddMenuItem={addMenuItem} // Pass the function from context (returns ID)
        onUpdateMenuItem={updateMenuItem} // Pass the new update function from context
        editingItem={editingItem} // Pass the item being edited (null for add mode)
        vendorId={vendorId} // Pass vendorId to the form (needed for image upload path)
      />
    </div>
  );
}
