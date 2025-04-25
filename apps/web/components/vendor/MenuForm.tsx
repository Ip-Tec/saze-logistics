// components/vendor/MenuForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import GlassButton from "@/components/ui/GlassButton";

import { Database } from "@shared/supabase/types";
import { supabase } from "@shared/supabaseClient";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

// Re-import MenuCategory from your shared types, assuming it has the description issue
import { MenuCategory } from "@shared/types";

// Define the expected structure for the menu item payload sent to onAddMenuItem
type AddMenuItemPayload = {
  name: string;
  description: string;
  price: number;
  category_id: string; // Based on your menu/page.tsx usage
  // vendor_id and created_at are added in the context/API call
  // is_available is also added in the context/API call based on your menu/page.tsx usage
};


// Props for the MenuForm component
interface MenuFormProps {
  isOpen: boolean;
  formType: "category" | "menu";
  categories: MenuCategory[];

  onClose: () => void;
  onAddCategory: (name: string, description?: string) => Promise<any>
  onAddMenuItem: (item: AddMenuItemPayload) => Promise<{ id: string } | null>;

  // Adjusted vendorId type to allow undefined or null based on error
  vendorId: string | null | undefined;
}

export default function MenuForm({
  isOpen,
  formType,
  categories,
  onClose,
  onAddCategory,
  onAddMenuItem,
  vendorId, // Receive vendorId
}: MenuFormProps) {
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState(""); // Renamed from itemDesc for clarity

  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState(""); // Kept as itemDescription
  const [itemPrice, setItemPrice] = useState("");
  const [itemCategoryId, setItemCategoryId] = useState<string | null>(null); // Use string | null for select value
  const [itemImage, setItemImage] = useState<File | null>(null); // State to hold the selected image file

  const [isSubmitting, setIsSubmitting] = useState(false); // State for form submission loading

  // Reset form state when the form is closed or formType changes
  useEffect(() => {
    if (!isOpen) {
      setCategoryName("");
      setCategoryDescription("");
      setItemName("");
      setItemDescription("");
      setItemPrice("");
      setItemCategoryId(null);
      setItemImage(null); // Clear selected image file
      setIsSubmitting(false);
    } else if (formType === 'menu' && categories.length > 0 && itemCategoryId === null) {
        // Auto-select the first category when opening the menu item form if categories exist
        setItemCategoryId(categories[0].id);
    }
  }, [isOpen, formType, categories, itemCategoryId]);


  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setItemImage(file);
    } else {
      setItemImage(null);
    }
  };

  // Handle category form submission
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Check vendorId more defensively due to potential undefined/null
    if (!vendorId) {
        toast.error("Vendor ID is missing.");
        return;
    }
    if (!categoryName.trim()) {
        toast.error("Category name is required.");
        return;
    }

    setIsSubmitting(true);

    try {
      // Call the onAddCategory function with name and description (optional string)
      await onAddCategory(categoryName.trim(), categoryDescription.trim() || undefined); // Pass undefined if empty

      toast.success("Category added successfully!");
      onClose(); // Close modal on success
    } catch (error: any) {
      console.error("Error adding category:", error);
      toast.error(`Failed to add category: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle menu item form submission
  const handleMenuItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
     // Check vendorId more defensively
     if (!vendorId) {
        toast.error("Vendor ID is missing.");
        return;
    }
    if (!itemName.trim() || !itemPrice.trim()) {
        toast.error("Item name and price are required.");
        return;
    }
     // Check if a category is selected (itemCategoryId is string | null)
     if (!itemCategoryId) { // Check for null or empty string
         toast.error("Please select a category.");
         return;
     }

    const price = parseFloat(itemPrice.trim());
    if (isNaN(price) || price < 0) {
        toast.error("Please enter a valid price.");
        return;
    }

    setIsSubmitting(true);
    let newItemId: string | null = null; // Variable to hold the newly created item's ID

    try {
      // 1. Add the menu item to the menu_item table
      // Prepare payload matching the AddMenuItemPayload type expected by onAddMenuItem
      const newMenuItemPayload: AddMenuItemPayload = {
         name: itemName.trim(),
         description: itemDescription.trim() || '', // Ensure description is string as per payload type
         price: price,
         category_id: itemCategoryId, // itemCategoryId is string | null, but payload expects string.
                                      // This might still cause a type error if itemCategoryId is null.
                                      // We already checked !itemCategoryId above, so it should be a string here.
                                      // Casting might be needed if context expects string | null
                                      // Let's assume context handles string | null based on DB type.
                                      // If your context's addMenuItem expects `category_id: string`, you might need `itemCategoryId as string`.
      };

      console.log("Adding menu item to DB..."); // Debug log
      // Call the onAddMenuItem function, which should return { id: string } | null
      const addedItem = await onAddMenuItem(newMenuItemPayload);

      if (!addedItem || !addedItem.id) {
          // This case should ideally not happen if onAddMenuItem is successful
          // but adding a check defensively.
          throw new Error("Failed to retrieve new menu item ID after creation.");
      }
      newItemId = addedItem.id;
      toast.success("Menu item added successfully!"); // Show success early

      // 2. If an image was selected, upload it and add a record to menu_item_image
      if (itemImage && newItemId) {
        const fileExt = itemImage.name.split('.').pop();
        // Use the new item ID in the storage path for better organization
        const filePath = `menu_item_images/${newItemId}/${Math.random()}.${fileExt}`; // Unique path

        console.log("Uploading image to Storage:", filePath); // Debug log

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('vendor_assets') // Replace with your Supabase Storage bucket name
          .upload(filePath, itemImage);

        if (uploadError) {
          // Log the error but don't necessarily fail the whole item creation
          console.error("Error uploading image for item", newItemId, ":", uploadError);
          toast.warn(`Menu item added, but failed to upload image: ${uploadError.message}`);
          // Continue without image
        } else {
           console.log("Image uploaded successfully, getting public URL..."); // Debug log
           // Get the public URL of the uploaded file
           const { data: publicUrlData } = supabase.storage
             .from('vendor_assets') // Replace with your bucket name
             .getPublicUrl(filePath);

           const imageUrl = publicUrlData.publicUrl;
           console.log("Public image URL:", imageUrl); // Debug log

           // Insert the image URL into the menu_item_image table
           if (imageUrl) {
               console.log("Inserting image record into menu_item_image..."); // Debug log
               const { data: imageData, error: imageInsertError } = await supabase
                   .from('menu_item_image')
                   .insert([
                       {
                           menu_item_id: newItemId,
                           image_url: imageUrl,
                           // created_at is automatically generated by the DB usually
                       },
                   ]);

               if (imageInsertError) {
                   console.error("Error inserting image record for item", newItemId, ":", imageInsertError);
                   toast.warn(`Menu item added, but failed to link image: ${imageInsertError.message}`);
               } else {
                   console.log("Image record inserted successfully."); // Debug log
                   // If MenuList uses Realtime, it will update automatically.
                   // If not, you might need to trigger a refetch in MenuList here.
               }
           }
        }
      }

      onClose(); // Close modal after successful item creation and image handling

    } catch (error: any) {
      console.error("Error adding menu item:", error);
      toast.error(`Failed to add menu item: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render the form content based on formType
  const renderFormContent = () => {
    if (formType === "category") {
      return (
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          <div>
            <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700">
              Category Name
            </label>
            <input
              type="text"
              id="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="categoryDescription" className="block text-sm font-medium text-gray-700">
              Description (Optional)
            </label>
            <textarea
              id="categoryDescription"
              rows={3}
              value={categoryDescription}
              onChange={(e) => setCategoryDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
            ></textarea>
          </div>
          <div className="flex justify-end">
            <GlassButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
              Add Category
            </GlassButton>
          </div>
        </form>
      );
    } else { // formType === "menu"
      return (
        <form onSubmit={handleMenuItemSubmit} className="space-y-4">
          <div>
            <label htmlFor="itemName" className="block text-sm font-medium text-gray-700">
              Item Name
            </label>
            <input
              type="text"
              id="itemName"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
              required
            />
          </div>
           <div>
            <label htmlFor="itemDescription" className="block text-sm font-medium text-gray-700">
              Description (Optional)
            </label>
            <textarea
              id="itemDescription"
              rows={3}
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
            ></textarea>
          </div>
          <div>
            <label htmlFor="itemPrice" className="block text-sm font-medium text-gray-700">
              Price (₦)
            </label>
            <input
              type="number" // Use number type for price
              id="itemPrice"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
              min="0" // Ensure price is not negative
              step="0.01" // Allow decimal values
              required
            />
          </div>
          <div>
            <label htmlFor="itemCategory" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="itemCategory"
              value={itemCategoryId || ""} // Use empty string for initial state if null
              onChange={(e) => setItemCategoryId(e.target.value || null)} // Set to null if empty string selected
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
              required
              disabled={categories.length === 0} // Disable if no categories
            >
              <option value="">Select a category</option> {/* Default empty option */}
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
             {categories.length === 0 && (
                 <p className="mt-2 text-sm text-orange-600">Please create a category first.</p>
             )}
          </div>
           <div>
            <label htmlFor="itemImage" className="block text-sm font-medium text-gray-700">
              Item Image (Optional)
            </label>
            <input
              type="file"
              id="itemImage"
              accept="image/*" // Accept only image files
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-orange-50 file:text-orange-700
                hover:file:bg-orange-100"
            />
             {/* Optional: Display selected file name */}
             {itemImage && <p className="mt-1 text-sm text-gray-600">Selected: {itemImage.name}</p>}
          </div>
          <div className="flex justify-end">
             {/* Disable button if no categories exist for menu item form */}
            <GlassButton type="submit" disabled={isSubmitting || (formType === 'menu' && categories.length === 0)}>
              {isSubmitting ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
              Add Menu Item
            </GlassButton>
          </div>
        </form>
      );
    }
  };

  return (
    // Use the imported Modal component
    <Modal isOpen={isOpen} onClose={onClose} title={`Create ${formType === "category" ? "Category" : "Menu Item"}`}>
       {/* Modal content is rendered here */}
       {renderFormContent()}
    </Modal>
  );
}
