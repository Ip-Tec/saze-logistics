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
// Import useAuthContext from the correct path
import { useAuthContext } from "./AuthContext";
// Import types from your shared types file
import {
  MenuCategory,
  MenuItem,
  AddMenuItemFormPayload,
  UpdateMenuItemFormPayload,
  AddCategoryFormPayload,
} from "@shared/types";
// Import Database types
import { Database } from "@shared/supabase/types";

// Define the shape of the context value
type VendorContextType = {
  vendorId: string | undefined; // vendorId can be undefined initially or if not a vendor
  categories: MenuCategory[]; // List of categories for the form dropdown
  // menuItems state is now managed within MenuList
  // menuItems: MenuItem[]; // REMOVED
  isLoading: boolean; // Loading state for initial vendor/category fetch in this hook
  fetchError: Error | null; // Error state for initial vendor/category fetch in this hook

  /**
   * Inserts a new category into the database.
   * Accepts payload from the form, adds vendor_id and created_at internally.
   * Returns the newly created category object or undefined on failure.
   */
  addCategory: (
    category: AddCategoryFormPayload // Accepts the form payload object
  ) => Promise<MenuCategory | undefined>;

  /**
   * Inserts a new menu item into the database.
   * Accepts payload from the form, adds system fields internally.
   * Returns the ID of the newly created menu item or null on failure.
   */
  addMenuItem: (
    item: AddMenuItemFormPayload // Accepts the form payload object
  ) => Promise<{ id: string } | null>; // Returns the ID or null

  /**
   * Updates an existing menu item and handles image changes.
   * Accepts update payload, new image files, and IDs of images to delete.
   * Returns true on success, false on failure.
   */
  updateMenuItem: (
    item: UpdateMenuItemFormPayload,
    imagesToUpload: File[],
    imageIdsToDelete: string[]
  ) => Promise<boolean>;
};

// Create the context with an initial undefined value
const VendorContext = createContext<VendorContextType | undefined>(undefined);

// Provider component
export const VendorProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Correctly destructure isCheckingAuth from useAuthContext
  const { user, isCheckingAuth } = useAuthContext();
  // AuthContext doesn't expose a general 'error' state in its context value,
  // individual function calls return errors.

  // Use user.id directly as vendorId
  const vendorId = user?.id;

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  // menuItems state is now managed within MenuList
  // const [menuItems, setMenuItems] = useState<MenuItem[]>([]); // REMOVED

  const [isLoading, setIsLoading] = useState(true); // State for initial loading (auth + vendor/category check)
  const [fetchError, setFetchError] = useState<Error | null>(null); // State for initial fetch error

  // --- Initial Data Fetch (Vendor Check and Categories) ---
  // Fetch vendor status and categories when auth state changes
  useEffect(() => {
    const fetchVendorData = async () => {
      // Wait for authentication state to load from AuthContext
      if (isCheckingAuth) {
        setIsLoading(true); // Keep vendor context loading while auth is checking
        setFetchError(null); // Clear any previous errors
        setCategories([]); // Clear categories while waiting/checking
        return;
      }

      // After auth is checked, check if user is authenticated
      if (!user) {
        // User is not authenticated
        setIsLoading(false); // Stop loading
        setFetchError(new Error("User not authenticated.")); // Set auth error
        setCategories([]); // Clear categories
        return;
      }

      // If user is authenticated, proceed to check if they are a vendor and fetch data
      setIsLoading(true); // Start loading for vendor-specific data
      setFetchError(null); // Clear previous errors

      try {
        // Verify if the authenticated user is a vendor and get their profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles") // Assuming 'profiles' table stores user roles
          .select("id, role")
          .eq("id", user.id)
          .single();

        if (profileError) {
          // Handle profile fetch error
          console.error("Error fetching profile:", profileError);
          setFetchError(profileError);
          setCategories([]);
          return;
        }

        if (profile?.role !== "vendor") {
          // User is authenticated but not a vendor
          setFetchError(new Error("Access denied: User is not a vendor."));
          setCategories([]);
          return;
        }

        // If user is a vendor, fetch their categories
        const { data: catData, error: catErr } = await supabase
          .from("menu_category")
          .select("*")
          .eq("vendor_id", user.id) // Use user.id as vendor_id
          .order("name", { ascending: true });

        if (catErr) {
          console.error("Error fetching categories:", catErr);
          setFetchError(catErr);
          setCategories([]);
          return;
        }

        setCategories(catData || []);
        setFetchError(null); // Clear error on success
      } catch (error: any) {
        console.error("Unexpected error during vendor data fetch:", error);
        setFetchError(error);
        setCategories([]);
        toast.error("Failed to load vendor data.");
      } finally {
        setIsLoading(false); // Stop loading
      }
    };

    fetchVendorData(); // Execute the fetch function
  }, [user?.id, isCheckingAuth]); // Re-run effect when user.id or auth checking state changes

  // --- Mutation Functions ---

  // Function to add a category - Accepts payload from form
  const addCategory = async (
    category: AddCategoryFormPayload
  ): Promise<MenuCategory | undefined> => {
    if (!vendorId) {
      toast.error("Not authenticated as a vendor.");
      return undefined;
    }

    // Add vendor_id and created_at here before inserting
    const categoryToInsert = {
      ...category,
      vendor_id: vendorId,
      // created_at should ideally be set by a database default or server-side
      created_at: new Date().toISOString(), // Client-side timestamp
    };

    try {
      const { data, error } = await supabase
        .from("menu_category")
        .insert(categoryToInsert)
        .select() // Select the inserted row to get its data
        .single(); // Expecting one row back

      if (error) {
        console.error("Supabase error inserting category:", error);
        toast.error(`Could not add category: ${error.message}`);
        return undefined;
      }

      // Optimistically update categories state in the context
      if (data) {
        setCategories((prev) => [...prev, data]);
        toast.success("Category added successfully!");
        return data; // Return the newly created category
      }

      return undefined; // Should not reach here if no error and no data
    } catch (error: any) {
      console.error("Unexpected error adding category:", error);
      toast.error("An unexpected error occurred while adding category.");
      return undefined;
    }
  };

  // Function to add a menu item - Accepts payload from form
  // It adds system fields and returns the new item's ID
  const addMenuItem = async (
    item: AddMenuItemFormPayload
  ): Promise<{ id: string } | null> => {
    if (!vendorId) {
      toast.error("Not authenticated as a vendor.");
      return null; // Return null on failure
    }

    // Add vendor_id, created_at, is_available here before inserting
    const itemToInsert = {
      ...item,
      vendor_id: vendorId,
      created_at: new Date().toISOString(), // Client-side timestamp
      is_available: true, // Defaulting to true for new items
    };

    try {
      // Insert into menu_item and select only the ID
      const { data, error } = await supabase
        .from("menu_item")
        .insert(itemToInsert)
        .select("id") // Select only the ID
        .single(); // Expecting one row back

      if (error) {
        console.error("Supabase error inserting menu item:", error);
        toast.error(`Could not add menu item: ${error.message}`);
        return null; // Return null on failure
      }

      // Do NOT update menuItems state here. MenuList will refetch or use Realtime.
      toast.success("Menu item added successfully!");
      return data; // Return the inserted item's ID ({ id: string })
    } catch (error: any) {
      console.error("Unexpected error adding menu item:", error);
      toast.error("An unexpected error occurred while adding menu item.");
      return null;
    }
  };

  // Function to update a menu item and handle image changes
  const updateMenuItem = async (
    item: UpdateMenuItemFormPayload,
    imagesToUpload: File[],
    imageIdsToDelete: string[]
  ): Promise<boolean> => {
    if (!vendorId) {
      toast.error("Not authenticated as a vendor.");
      return false; // Return false on failure
    }

    try {
      // 1. Update the main menu_item record
      console.log("Updating menu_item record:", item.id, item); // Debug log
      const { error: updateError } = await supabase
        .from("menu_item")
        .update({
          name: item.name,
          description: item.description,
          price: item.price,
          category_id: item.category_id,
          // Update other fields like is_available if they are editable
        })
        .eq("id", item.id)
        .eq("vendor_id", vendorId); // Ensure vendor owns the item

      if (updateError) {
        console.error("Supabase error updating menu item:", updateError);
        toast.error(`Could not update menu item: ${updateError.message}`);
        return false; // Indicate failure
      }
      console.log("Menu item record updated successfully."); // Debug log

      // 2. Delete images marked for deletion
      if (imageIdsToDelete.length > 0) {
        console.log("Deleting image records:", imageIdsToDelete); // Debug log
        // First, get the storage paths of the images to delete
        const { data: imagesToDeleteData, error: fetchImageError } =
          await supabase
            .from("menu_item_image")
            .select("id, image_url")
            .in("id", imageIdsToDelete);

        if (fetchImageError) {
          console.error(
            "Error fetching image URLs for deletion:",
            fetchImageError
          );
          toast.warn(
            `Menu item updated, but failed to find images for deletion: ${fetchImageError.message}`
          );
          // Continue without deleting from storage, but delete the DB records
        }

        const storagePathsToDelete =
          (imagesToDeleteData
            ?.map((img) => {
              // Extract the path from the public URL
              // Assuming the public URL is like [supabase_url]/storage/v1/object/public/[bucket_name]/[path_in_bucket]
              const pathParts = img.image_url.split("/public/");
              if (pathParts.length > 1) {
                const storagePath = pathParts[1].substring(
                  pathParts[1].indexOf("/") + 1
                ); // Get path after bucket name
                return storagePath;
              }
              return null;
            })
            .filter((path) => path !== null) as string[]) || []; // Filter out nulls and cast

        console.log("Storage paths to delete:", storagePathsToDelete); // Debug log

        // Delete the image records from the database
        const { error: deleteDbError } = await supabase
          .from("menu_item_image")
          .delete()
          .in("id", imageIdsToDelete);

        if (deleteDbError) {
          console.error(
            "Supabase error deleting image records:",
            deleteDbError
          );
          toast.warn(
            `Menu item updated, but failed to remove image links: ${deleteDbError.message}`
          );
          // Continue to delete from storage if paths were found
        } else {
          console.log("Image records deleted from DB successfully."); // Debug log
        }

        // Delete the actual files from storage
        if (storagePathsToDelete.length > 0) {
          const { data: storageDeleteData, error: storageDeleteError } =
            await supabase.storage
              .from("vendorassets") // Replace with your bucket name
              .remove(storagePathsToDelete);

          if (storageDeleteError) {
            console.error(
              "Supabase error deleting image files from storage:",
              storageDeleteError
            );
            toast.warn(
              `Menu item updated, but failed to delete image files: ${storageDeleteError.message}`
            );
          } else {
            console.log(
              "Image files deleted from Storage successfully.",
              storageDeleteData
            ); // Debug log
          }
        }
      }

      // 3. Upload new images
      if (imagesToUpload.length > 0) {
        console.log("Uploading new images...", imagesToUpload); // Debug log
        const uploadPromises = imagesToUpload.map(async (file) => {
          const fileExt = file.name.split(".").pop();
          // Use the item ID in the storage path
          const filePath = `menu_item_images/${item.id}/${Math.random()}.${fileExt}`;

          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("vendorassets") // Replace with your bucket name
              .upload(filePath, file);

          if (uploadError) {
            console.error("Error uploading new image:", file.name, uploadError);
            toast.warn(
              `Failed to upload image ${file.name}: ${uploadError.message}`
            );
            return null; // Indicate failure for this specific upload
          } else {
            console.log("New image uploaded successfully:", file.name); // Debug log
            // Get the public URL
            const { data: publicUrlData } = supabase.storage
              .from("vendorassets") // Replace with your bucket name
              .getPublicUrl(filePath);
            return publicUrlData.publicUrl; // Return the public URL
          }
        });

        // Wait for all upload promises to resolve
        const uploadedImageUrls = (await Promise.all(uploadPromises)).filter(
          (url) => url !== null
        ) as string[];
        console.log("Successfully uploaded image URLs:", uploadedImageUrls); // Debug log

        // Insert new image records into the database
        if (uploadedImageUrls.length > 0) {
          const imageRecordsToInsert = uploadedImageUrls.map((url) => ({
            menu_item_id: item.id,
            image_url: url,
          }));

          console.log("Inserting new image records:", imageRecordsToInsert); // Debug log
          const { error: insertError } = await supabase
            .from("menu_item_image")
            .insert(imageRecordsToInsert);

          if (insertError) {
            console.error(
              "Supabase error inserting new image records:",
              insertError
            );
            toast.warn(
              `Menu item updated, but failed to link new images: ${insertError.message}`
            );
            // Continue, main item update was successful
          } else {
            console.log("New image records inserted successfully."); // Debug log
          }
        }
      }

      // If we reached here without returning false from a critical error
      toast.success("Menu item updated successfully!");
      // MenuList will refetch or use Realtime to show the updated data
      return true; // Indicate overall success
    } catch (error: any) {
      console.error("Unexpected error updating menu item:", error);
      toast.error(
        `An unexpected error occurred while updating menu item: ${error.message}`
      );
      return false; // Indicate failure
    }
  };

  // Provide the context value
  return (
    <VendorContext.Provider
      value={{
        vendorId,
        categories,
        // setCategories is not exposed as it's managed internally
        // menuItems and setMenuItems are removed
        isLoading, // This hook's loading state
        fetchError, // This hook's error state
        addCategory,
        addMenuItem,
        updateMenuItem, // Expose the update function
      }}
    >
      {children}
    </VendorContext.Provider>
  );
};

// Hook to consume the context
export const useVendor = (): VendorContextType => {
  const ctx = useContext(VendorContext);
  if (!ctx) {
    throw new Error("useVendor must be used within VendorProvider");
  }
  return ctx;
};
