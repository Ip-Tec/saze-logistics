// components/vendor/MenuForm.tsx
"use client";

import { toast } from "react-toastify";
import { Loader2, XCircle } from "lucide-react";
import { supabase } from "@shared/supabaseClient";
import { Database } from "@shared/supabase/types";

import Modal from "@/components/ui/Modal";
import React, { useState, useEffect } from "react";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";
import GlassSelect from "@/components/ui/GlassSelect";
import GlassTextarea from "@/components/ui/GlassTextarea";


// Import types from your shared types file
import {
    MenuCategory,
    ProcessedMenuItem,
    AddMenuItemFormPayload,
    UpdateMenuItemFormPayload,
    AddCategoryFormPayload
} from "@shared/types";


// Props for the MenuForm component - Adjusted for editing
interface MenuFormProps {
  isOpen: boolean;
  formType: "category" | "menu";
  categories: MenuCategory[];

  onClose: () => void;
  onAddCategory: (category: AddCategoryFormPayload) => Promise<any>;
  // onAddMenuItem returns the new item's ID
  onAddMenuItem: (item: AddMenuItemFormPayload) => Promise<{ id: string } | null>;
  // Add prop for updating menu item
  onUpdateMenuItem: (item: UpdateMenuItemFormPayload, imagesToUpload: File[], imageIdsToDelete: string[]) => Promise<boolean>; // Returns true on success, false on failure

  // Add prop for the item being edited (null for add mode)
  editingItem: ProcessedMenuItem | null;

  vendorId: string | null | undefined; // Pass vendorId from the context/page
}

export default function MenuForm({
  isOpen,
  formType,
  categories,
  onClose,
  onAddCategory,
  onAddMenuItem,
  onUpdateMenuItem, // Receive the update function
  editingItem, // Receive the item being edited
  vendorId,
}: MenuFormProps) {
  // State for Category Form
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");

  // State for Menu Item Form
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemCategoryId, setItemCategoryId] = useState<string | null>(null);
  const [itemImageFiles, setItemImageFiles] = useState<File[]>([]); // State for new image files to upload
  const [existingImages, setExistingImages] = useState<Database["public"]["Tables"]["menu_item_image"]["Row"][]>([]); // State for existing image URLs
  const [imageIdsToDelete, setImageIdsToDelete] = useState<string[]>([]); // State for IDs of images to delete

  const [isSubmitting, setIsSubmitting] = useState(false); // State for form submission loading

  // Effect to populate form when editingItem changes
  useEffect(() => {
    if (isOpen && formType === 'menu' && editingItem) {
      // Populate form fields with editingItem data
      setItemName(editingItem.name);
      setItemDescription(editingItem.description || ""); // Use empty string if description is null
      setItemPrice(editingItem.price?.toString() || ""); // Convert price to string
      setItemCategoryId(editingItem.category_id);
      setExistingImages(editingItem.images || []); // Set existing images
      setItemImageFiles([]); // Clear any previously selected new files
      setImageIdsToDelete([]); // Clear any previously marked images for deletion
    } else if (isOpen && formType === 'menu' && !editingItem) {
        // Reset fields for adding a new item
        setItemName("");
        setItemDescription("");
        setItemPrice("");
        setItemCategoryId(categories.length > 0 ? categories[0].id : null); // Auto-select first category if available
        setItemImageFiles([]);
        setExistingImages([]);
        setImageIdsToDelete([]);
    } else if (isOpen && formType === 'category') {
        // Reset fields for adding a new category
        setCategoryName("");
        setCategoryDescription("");
    }
     // Reset submitting state whenever the form opens/closes or type changes
     setIsSubmitting(false);

  }, [isOpen, formType, editingItem, categories]); // Depend on these states

  // Handle new file selection (allows multiple files)
  const handleNewFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setItemImageFiles(prevFiles => [...prevFiles, ...files]); // Add new files to the list
    // Clear the input value so the same file can be selected again if needed
    event.target.value = '';
  };

  // Handle removing an existing image
  const handleRemoveExistingImage = (imageId: string, imageUrl: string) => {
      // Add the image ID to the list of images to delete
      setImageIdsToDelete(prevIds => [...prevIds, imageId]);
      // Remove the image from the list of existing images displayed
      setExistingImages(prevImages => prevImages.filter(img => img.id !== imageId));

      // Optional: Immediately delete from storage for better responsiveness,
      // but handle potential errors if the item update fails later.
      // A safer approach is to delete from storage only after the main item update is successful.
      // We'll handle deletion in the updateMenuItem context function.
  };

  // Handle removing a newly selected image file before upload
  const handleRemoveNewImageFile = (index: number) => {
      setItemImageFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };


  // Handle category form submission
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) {
        toast.error("Vendor ID is missing.");
        return;
    }
    if (!categoryName.trim()) {
        toast.error("Category name is required.");
        return;
    }

    setIsSubmitting(true);

    const newCategoryPayload: AddCategoryFormPayload = {
      name: categoryName.trim(),
      description: categoryDescription.trim() || null,
    };

    try {
      await onAddCategory(newCategoryPayload);
      // onClose() and toast.success are called inside onAddCategory in context now
      // toast.success("Category added successfully!"); // Removed, handled in context
      // onClose(); // Removed, handled in context
    } catch (error: any) {
      console.error("Error adding category:", error);
      // toast.error is handled in context now
      // toast.error(`Failed to add category: ${error.message || 'Unknown error'}`); // Removed
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle menu item form submission (Add or Edit)
  const handleMenuItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
     if (!vendorId) {
        toast.error("Vendor ID is missing.");
        return;
    }
    if (!itemName.trim() || !itemPrice.trim()) {
        toast.error("Item name and price are required.");
        return;
    }
     if (!itemCategoryId) {
         toast.error("Please select a category.");
         return;
     }

    const price = parseFloat(itemPrice.trim());
    if (isNaN(price) || price < 0) {
        toast.error("Please enter a valid price.");
        return;
    }

    setIsSubmitting(true);

    try {
        if (editingItem) {
            // --- Handle Update ---
            const updatePayload: UpdateMenuItemFormPayload = {
                id: editingItem.id,
                name: itemName.trim(),
                description: itemDescription.trim() || null,
                price: price,
                category_id: itemCategoryId,
                // is_available might be added here if editable
            };

            console.log("Updating menu item:", updatePayload); // Debug log
            console.log("Images to upload:", itemImageFiles); // Debug log
            console.log("Image IDs to delete:", imageIdsToDelete); // Debug log

            // Call the update function from context, passing item data, new files, and IDs to delete
            const success = await onUpdateMenuItem(updatePayload, itemImageFiles, imageIdsToDelete);

            if (success) {
                 // toast.success and onClose are handled inside onUpdateMenuItem in context now
                 toast.success("Menu item updated successfully!"); // Removed
                 onClose(); // Removed
            } else {
                 // toast.error is handled in context now
                 toast.error("Failed to update menu item."); // Removed
            }

        } else {
            // --- Handle Add ---
            const addPayload: AddMenuItemFormPayload = {
               name: itemName.trim(),
               description: itemDescription.trim() || null,
               price: price,
               category_id: itemCategoryId,
            };

            console.log("Adding menu item:", addPayload); // Debug log
            console.log("Image file to upload:", itemImageFiles[0]); // Debug log (assuming single file for add)

            // Call the add function from context, which returns the new item ID
            const addedItem = await onAddMenuItem(addPayload);

            if (!addedItem || !addedItem.id) {
                throw new Error("Failed to retrieve new menu item ID after creation.");
            }
            const newItemId = addedItem.id;

            // If there are image files selected for a new item, upload them
            // Note: The previous version handled image upload *after* calling onAddMenuItem.
            // We can keep that pattern, but the context's addMenuItem should just return the ID.
            // The form then handles the image upload using that ID.
            // Let's refine this: The form should pass the *files* to the context's addMenuItem
            // or a separate addMenuItemWithImage function.
            // Reverting to the pattern where the form handles image upload after getting the ID,
            // as implemented in the previous version.

             // 2. If image files were selected, upload them and add records to menu_item_image
             if (itemImageFiles.length > 0 && newItemId) {
                 // Process each selected file
                 for (const file of itemImageFiles) {
                     const fileExt = file.name.split('.').pop();
                     const filePath = `menu_item_images/${newItemId}/${Math.random()}.${fileExt}`; // Unique path per image

                     console.log("Uploading image to Storage:", filePath); // Debug log

                     const { data: uploadData, error: uploadError } = await supabase.storage
                       .from('vendor_assets') // Replace with your Supabase Storage bucket name
                       .upload(filePath, file);

                     if (uploadError) {
                       console.error("Error uploading image for item", newItemId, ":", uploadError);
                       toast.warn(`Menu item added, but failed to upload image: ${uploadError.message}`);
                       // Continue to next file or finish
                     } else {
                        console.log("Image uploaded successfully, getting public URL..."); // Debug log
                        const { data: publicUrlData } = supabase.storage
                          .from('vendor_assets')
                          .getPublicUrl(filePath);

                        const imageUrl = publicUrlData.publicUrl;
                        console.log("Public image URL:", imageUrl); // Debug log

                        if (imageUrl) {
                            console.log("Inserting image record into menu_item_image..."); // Debug log
                            const { data: imageData, error: imageInsertError } = await supabase
                                .from('menu_item_image')
                                .insert([
                                    {
                                        menu_item_id: newItemId,
                                        image_url: imageUrl,
                                    },
                                ]);

                            if (imageInsertError) {
                                console.error("Error inserting image record for item", newItemId, ":", imageInsertError);
                                toast.warn(`Menu item added, but failed to link image: ${imageInsertError.message}`);
                            } else {
                                console.log("Image record inserted successfully."); // Debug log
                            }
                        }
                     }
                 }
             }

             // toast.success and onClose are handled inside onAddMenuItem in context now
             toast.success("Menu item added successfully!"); // Removed
             onClose(); // Removed

        }

        // Close modal after successful submission (add or update)
        onClose(); // This will also clear editingItem state in parent

    } catch (error: any) {
      console.error("Error submitting menu item:", error);
      toast.error(`Failed to submit menu item: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };


  // Determine modal title based on formType and editingItem presence
  const modalTitle = formType === "category"
    ? "Add Category"
    : editingItem ? "Edit Menu Item" : "Add Menu Item";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
       {/* Modal content is rendered here */}
       {formType === "category" ? (
           // Category Form
           <form onSubmit={handleCategorySubmit} className="space-y-4">
             <div>
               <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700">
                 Category Name
               </label>
               <GlassInput
                 type="text"
                 id="categoryName"
                 value={categoryName}
                 onChange={(e) => setCategoryName(e.target.value)}
                 className="mt-1 block w-full rounded-md !text-black border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                 required
               />
             </div>
             <div>
               <label htmlFor="categoryDescription" className="block text-sm font-medium text-gray-700">
                 Description (Optional)
               </label>
               <GlassTextarea
                 id="categoryDescription"
                 rows={3}
                 value={categoryDescription}
                 onChange={(e) => setCategoryDescription(e.target.value)}
                 className="mt-1 block w-full rounded-md !text-black border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
               ></GlassTextarea>
             </div>
             <div className="flex justify-end">
               <GlassButton
                 type="submit"
                 disabled={isSubmitting}
                 className="!bg-orange-500 hover:!bg-orange-600 !text-white"
               >
                 {isSubmitting ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
                 Add Category
               </GlassButton>
             </div>
           </form>
       ) : (
           // Menu Item Form (Add or Edit)
           <form onSubmit={handleMenuItemSubmit} className="space-y-4">
             <div>
               <label htmlFor="itemName" className="block text-sm font-medium text-gray-700">
                 Item Name
               </label>
               <GlassInput
                 type="text"
                 id="itemName"
                 value={itemName}
                 onChange={(e) => setItemName(e.target.value)}
                 className="mt-1 block w-full rounded-md !text-black border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                 required
               />
             </div>
              <div>
               <label htmlFor="itemDescription" className="block text-sm font-medium text-gray-700">
                 Description (Optional)
               </label>
               <GlassTextarea
                 id="itemDescription"
                 rows={3}
                 value={itemDescription}
                 onChange={(e) => setItemDescription(e.target.value)}
                 className="mt-1 block w-full rounded-md !text-black border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
               ></GlassTextarea>
             </div>
             <div>
               <label htmlFor="itemPrice" className="block text-sm font-medium text-gray-700">
                 Price (₦)
               </label>
               <GlassInput
                 type="number" // Use number type for price
                 id="itemPrice"
                 value={itemPrice}
                 onChange={(e) => setItemPrice(e.target.value)}
                 className="mt-1 block w-full !text-black rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                 min="0" // Ensure price is not negative
                 step="0.01" // Allow decimal values
                 required
               />
             </div>
             <div>
               <label htmlFor="itemCategory" className="block text-sm font-medium text-gray-700">
                 Category
               </label>
               <GlassSelect
                 id="itemCategory"
                 value={itemCategoryId || ""} // Use empty string for initial state if null
                 onChange={(e) => setItemCategoryId(e.target.value || null)} // Set to null if empty string selected
                 className="mt-1 block w-full rounded-md !text-black border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                 required
                 disabled={categories.length === 0} // Disable if no categories
               >
                 <option value="" className="!text-gray-400">
                   Select a category
                 </option> {/* Default empty option */}
                 {categories.map((category) => (
                   <option
                     key={category.id}
                     value={category.id}
                     className="!text-black" // Ensure option text is visible
                   >
                     {category.name}
                   </option>
                 ))}
               </GlassSelect>
                {categories.length === 0 && (
                    <p className="mt-2 text-sm text-orange-600">Please create a category first.</p>
                )}
             </div>
              {/* Image Upload/Management Section */}
              <div>
                <label htmlFor="itemImage" className="block text-sm font-medium text-gray-700 mb-2">
                  Item Images (Optional)
                </label>
                {/* Display Existing Images */}
                {existingImages && existingImages.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-600 mb-1">Existing Images:</h4>
                        <div className="flex flex-wrap gap-2">
                            {existingImages.map((img) => (
                                <div key={img.id} className="relative w-20 h-20 rounded-md overflow-hidden border border-gray-300">
                                    <img
                                        src={img.image_url}
                                        alt="Existing item image"
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://placehold.co/80x80?text=Error'; }}
                                    />
                                    {/* Button to remove existing image */}
                                    <button
                                        type="button" // Important: Prevent form submission
                                        onClick={() => handleRemoveExistingImage(img.id, img.image_url)}
                                        className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full text-xs leading-none"
                                        aria-label="Remove image"
                                    >
                                        <XCircle size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Display Newly Selected Images (Previews) */}
                 {itemImageFiles.length > 0 && (
                     <div className="mb-4">
                         <h4 className="text-sm font-medium text-gray-600 mb-1">New Images to Upload:</h4>
                         <div className="flex flex-wrap gap-2">
                             {itemImageFiles.map((file, index) => (
                                 <div key={index} className="relative w-20 h-20 rounded-md overflow-hidden border border-gray-300">
                                     {/* Use FileReader to create a preview URL */}
                                     <img
                                         src={URL.createObjectURL(file)}
                                         alt={`New image preview ${index + 1}`}
                                         className="w-full h-full object-cover"
                                         onLoad={() => URL.revokeObjectURL(file as any)} // Clean up object URL after loading
                                     />
                                      {/* Button to remove new image file */}
                                     <button
                                         type="button" // Important: Prevent form submission
                                         onClick={() => handleRemoveNewImageFile(index)}
                                         className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full text-xs leading-none"
                                         aria-label="Remove new image"
                                     >
                                        <XCircle size={16} />
                                     </button>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}


                {/* File Input for New Images */}
                <GlassInput
                  type="file"
                  id="itemImage"
                  accept="image/*" // Accept only image files
                  multiple // Allow selecting multiple files
                  onChange={handleNewFileChange}
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-orange-50 file:text-orange-700
                    hover:file:bg-orange-100"
                />
               </div>


             <div className="flex justify-end">
                {/* Disable button if no categories exist for menu item form */}
               <GlassButton
                 type="submit"
                 className="!bg-orange-400 hover:!bg-white hover:!text-black"
                 disabled={isSubmitting || (formType === "menu" && categories.length === 0)}
               >
                 {isSubmitting ? <Loader2 size={18} className="animate-spin mr-2" /> : (editingItem ? "Update Menu Item" : "Add Menu Item")} {/* Button text changes based on mode */}
               </GlassButton>
             </div>
           </form>
       )}
    </Modal>
  );
}
