// context/VendorContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { toast } from "react-toastify";
import { supabase } from "@shared/supabaseClient";
// Import useAuthContext from the correct path
import { useAuthContext } from "./AuthContext"; // Make sure this path is correct
// Import types from your shared types file
import {
  MenuCategory,
  MenuItem,
  AddMenuItemFormPayload,
  UpdateMenuItemFormPayload,
  AddCategoryFormPayload,
} from "@shared/types"; // Make sure this path is correct
// Import Database types
import { Database } from "@shared/supabase/types"; // Adjust path if necessary

// Define the type for the vendor's profile row
type VendorProfileType = Database["public"]["Tables"]["profiles"]["Row"];
// Define the type for the vendor profile update payload
type UpdateVendorProfilePayload =
  Database["public"]["Tables"]["profiles"]["Update"];

// Define the shape of the context value
type VendorContextType = {
  vendorId: string | undefined; // vendorId can be undefined initially or if not a vendor
  categories: MenuCategory[]; // List of categories for the form dropdown
  // Add vendor profile state and update function

  vendorProfile: VendorProfileType | null; // The fetched vendor profile
  isUpdatingProfile: boolean; // Loading state for profile updates
  updateProfileError: Error | null; // Error state for profile updates
  // Add the setter function to the interface
  setUpdateProfileError: React.Dispatch<React.SetStateAction<Error | null>>;

  isLoading: boolean; // Loading state for initial vendor/category fetch in this hook
  fetchError: Error | null; // Error state for initial fetch error
  /**
   * Inserts a new category into the database.
   * Accepts payload from the form, adds vendor_id and created_at internally.
   * Returns the newly created category object or undefined on failure.
   */

  addCategory: (
    category: AddCategoryFormPayload // Accepts the form payload object
  ) => Promise<MenuCategory | undefined> /**
   * Inserts a new menu item into the database.
   * Accepts payload from the form, adds system fields internally.
   * Returns the ID of the newly created menu item or null on failure.
   */;

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
  ) => Promise<boolean> /**
   * Updates the currently logged-in vendor's profile.
   * Accepts a partial profile object with fields to update.
   * Returns true on success, false on failure.
   */;

  updateVendorProfile: (
    updates: UpdateVendorProfilePayload
  ) => Promise<boolean>;
};

// Create the context with an initial undefined value
const VendorContext = createContext<VendorContextType | undefined>(undefined);

const SUPABASE_STORAGE_BUCKET = process.env
  .NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET as string;
// Provider component
export const VendorProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Correctly destructure isCheckingAuth from useAuthContext
  const { user, isCheckingAuth } = useAuthContext(); // AuthContext doesn't expose a general 'error' state in its context value,
  // individual function calls return errors.
  // Use user.id directly as vendorId
  const vendorId = user?.id;

  const [categories, setCategories] = useState<MenuCategory[]>([]); // Add state for vendor profile
  const [vendorProfile, setVendorProfile] = useState<VendorProfileType | null>(
    null
  );

  const [isLoading, setIsLoading] = useState(true); // State for initial loading (auth + vendor/category/profile check)
  const [fetchError, setFetchError] = useState<Error | null>(null); // State for initial fetch error
  // Add state for profile update

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [updateProfileError, setUpdateProfileError] = useState<Error | null>(
    null
  ); // --- Initial Data Fetch (Vendor Check, Profile, and Categories) ---
  // Fetch vendor status, profile, and categories when auth state changes

  useEffect(() => {
    const fetchVendorData = async () => {
      // Wait for authentication state to load from AuthContext
      if (!isCheckingAuth) {
        console.log("useEffect: Auth is checking, setting isLoading(true)");
        setIsLoading(true); // Keep vendor context loading while auth is checking
        setFetchError(null); // Clear any previous errors
        setVendorProfile(null); // Clear profile
        setCategories([]); // Clear categories while waiting/checking
        return;
      } // After auth is checked, check if user is authenticated
      console.log("useEffect: Auth check finished.", { user }); // Log after auth check

      if (!user) {
        console.log(
          "useEffect: No user found after auth check, setting isLoading(false)"
        );
        // User is not authenticated
        setIsLoading(false); // Stop loading
        setFetchError(new Error("User not authenticated."));
        setVendorProfile(null);
        setCategories([]);
        return;
      } // If user is authenticated, proceed to check if they are a vendor and fetch data
      console.log("useEffect: User found, starting vendor data fetch.");

      setIsLoading(true); // Start loading for vendor-specific data
      setFetchError(null); // Clear previous errors
      setVendorProfile(null); // Clear profile before refetching
      setCategories([]); // Clear categories before refetching

      try {
        // 1. Fetch the user's profile to check role and get profile data
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*") // Select all fields for the profile page
          .eq("id", user.id)
          .single();
        console.log("Fetched profile:", { profile });
        if (profileError) {
          console.error("Error fetching profile:", profileError);
          setFetchError(profileError);
          setVendorProfile(null);
          setCategories([]); // Do not return here, continue to check role if data exists partially
        } else {
          setVendorProfile(profile); // Store the fetched profile data
        } // Check if the fetched profile exists and has the 'vendor' role

        if (!profile || profile.role !== "vendor") {
          // User is authenticated but not a vendor or profile fetch failed critically
          console.log(
            "Not a vendor or profile not found, setting error and isLoading(false)"
          );

          setFetchError(
            new Error(
              "Access denied: User is not a vendor or profile not found."
            )
          );
          setVendorProfile(null); // Ensure profile is null if not a vendor
          setCategories([]);
          return; // Stop here if not a vendor
        } // 2. If user is a vendor, fetch their categories

        const { data: catData, error: catErr } = await supabase
          .from("menu_category")
          .select("*")
          .eq("vendor_id", user.id) // Use user.id as vendor_id
          .order("name", { ascending: true });

        if (catErr) {
          console.error("Error fetching categories:", catErr);
          setFetchError(catErr); // Overwrite previous profile error if category fails
          setCategories([]);
          return; // Stop if categories fail
        } // If both profile and categories are successful
        // setVendorProfile(profile); // Already set above if profile fetch was successful

        setCategories(catData || []);
        setFetchError(null); // Clear error on overall success
      } catch (error: any) {
        console.error("Unexpected error during vendor data fetch:", error);
        setFetchError(error);
        setVendorProfile(null);
        setCategories([]);
        toast.error("Failed to load vendor data.");
      } finally {
        console.log("useEffect finally block: setting isLoading(false)"); // Log finally
        setIsLoading(false); // Stop loading
      }
    };

    fetchVendorData(); // Execute the fetch function
  }, [user?.id, isCheckingAuth]); // Re-run effect when user.id or auth checking state changes
  // --- Profile Update Function ---

  const updateVendorProfile = async (
    updates: UpdateVendorProfilePayload
  ): Promise<boolean> => {
    if (!vendorId) {
      console.error("Cannot update profile: Vendor ID is missing.");
      toast.error("Not authenticated as a vendor.");
      return false;
    }

    setIsUpdatingProfile(true);
    setUpdateProfileError(null); // Clear previous update error

    try {
      console.log(
        "Attempting to update profile for vendor:",
        vendorId,
        "with data:",
        updates
      );
      const { data, error } = await supabase
        .from("profiles")
        .update(updates) // Pass the update payload
        .eq("id", vendorId) // Ensure you only update the current vendor's profile
        .select() // Select the updated row to refresh state
        .single();

      if (error) {
        console.error("Supabase error updating vendor profile:", error);
        setUpdateProfileError(error);
        toast.error(`Failed to update profile: ${error.message}`);
        return false; // Indicate failure
      } else {
        console.log("Profile updated successfully:", data); // Update the local state with the returned data
        setVendorProfile(data); // toast.success("Profile updated successfully!"); // Toast moved to component
        return true; // Indicate success
      }
    } catch (error: any) {
      console.error("Unexpected error updating vendor profile:", error);
      setUpdateProfileError(error);
      toast.error("An unexpected error occurred while updating profile.");
      return false; // Indicate failure
    } finally {
      setIsUpdatingProfile(false);
    }
  }; // --- Mutation Functions (Existing menu/category functions remain) ---
  // Function to add a category - Accepts payload from form

  const addCategory = async (
    category: AddCategoryFormPayload
  ): Promise<MenuCategory | undefined> => {
    if (!vendorId) {
      toast.error("Not authenticated as a vendor.");
      return undefined;
    } // Add vendor_id and created_at here before inserting

    const categoryToInsert = {
      ...category,
      vendor_id: vendorId, // created_at should ideally be set by a database default or server-side
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
      } // Optimistically update categories state in the context

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
  }; // Function to add a menu item - Accepts payload from form
  // It adds system fields and returns the new item's ID

  const addMenuItem = async (
    item: AddMenuItemFormPayload
  ): Promise<{ id: string } | null> => {
    if (!vendorId) {
      toast.error("Not authenticated as a vendor.");
      return null; // Return null on failure
    } // Add vendor_id, created_at, is_available here before inserting

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
      } // Do NOT update menuItems state here. MenuList will refetch or use Realtime.
      // toast.success("Menu item added successfully!"); // Toast moved to component

      return data; // Return the inserted item's ID ({ id: string })
    } catch (error: any) {
      console.error("Unexpected error adding menu item:", error);
      toast.error("An unexpected error occurred while adding menu item.");
      return null;
    }
  }; // Function to update a menu item and handle image changes
  // NOTE: This function handles image uploads and deletion *within the context*.
  // If you prefer to handle image uploads via the API route from the component
  // (like you started to structure in VendorSettingsPage), you would remove
  // the image upload/delete logic from here and updateMenuItem would only
  // receive the item update payload and potentially image URLs.
  // For now, keeping the image logic here as it was provided.

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
          category_id: item.category_id, // Update other fields like is_available if they are editable
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
          ); // Continue without deleting from storage, but delete the DB records
        }

        const storagePathsToDelete =
          (imagesToDeleteData
            ?.map((img) => {
              // Extract the path from the public URL
              // Assuming the public URL is like [supabase_url]/storage/v1/object/public/[bucket_name]/[path_in_bucket]
              // Split by the bucket name and take the part after it
              const pathParts = img.image_url.split(
                `/${SUPABASE_STORAGE_BUCKET}/`
              ); // Use the bucket name constant
              if (pathParts.length > 1) {
                return pathParts[1]; // The path within the bucket
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
          ); // Continue to delete from storage if paths were found
        } else {
          console.log("Image records deleted from DB successfully."); // Debug log
        } // Delete the actual files from storage

        if (storagePathsToDelete.length > 0) {
          const { data: storageDeleteData, error: storageDeleteError } =
            await supabase.storage
              .from(SUPABASE_STORAGE_BUCKET)
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
      } // 3. Upload new images

      if (imagesToUpload.length > 0) {
        console.log("Uploading new images...", imagesToUpload); // Debug log
        const uploadPromises = imagesToUpload.map(async (file) => {
          const fileExt = file.name.split(".").pop(); // Use a unique identifier for the file path within the item's directory
          const uniqueFileName = `${uuidv4()}.${fileExt}`; // Ensure uuidv4 is imported if used here
          const filePath = `menu_item_images/${item.id}/${uniqueFileName}`;

          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from(SUPABASE_STORAGE_BUCKET) // !! ENSURE THIS MATCHES YOUR ACTUAL BUCKET NAME !!
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
              .from(SUPABASE_STORAGE_BUCKET) // !! ENSURE THIS MATCHES YOUR ACTUAL BUCKET NAME !!
              .getPublicUrl(filePath);
            return publicUrlData.publicUrl; // Return the public URL
          }
        }); // Wait for all upload promises to resolve

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
            ); // Continue, main item update was successful
          } else {
            console.log("New image records inserted successfully."); // Debug log
          }
        }
      } // If we reached here without returning false from a critical error
      // toast.success("Menu item updated successfully!"); // Toast moved to component
      // MenuList will refetch or use Realtime to show the updated data

      return true; // Indicate overall success
    } catch (error: any) {
      console.error("Unexpected error updating menu item:", error);
      toast.error(
        `An unexpected error occurred while updating menu item: ${error.message}`
      );
      return false; // Indicate failure
    }
  }; // Provide the context value

  // Assume you have a constant for your Supabase storage bucket name
  // const SUPABASE_STORAGE_BUCKET = "your_bucket_name"; // Make sure this is defined

  return (
    <VendorContext.Provider
      value={{
        vendorId,
        categories,
        vendorProfile, // Expose the vendor profile
        isUpdatingProfile, // Expose profile update loading
        updateProfileError, // Expose profile update error
        setUpdateProfileError, // *** Add the setter here ***
        isLoading, // This hook's loading state for initial fetch
        fetchError, // This hook's error state for initial fetch
        addCategory,
        addMenuItem,
        updateMenuItem, // Expose the update function
        updateVendorProfile, // Expose the profile update function
      }}
    >
            {children}   {" "}
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

function uuidv4() {
  throw new Error("Function not implemented.");
}
