// hooks/useVendorProfile.ts
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { supabase } from "@shared/supabaseClient";
import { useAuthContext } from "@/context/AuthContext";
import { Vendor } from "@shared/types";

// Define the type for the vendor profile data fetched by the hook
// This should match the selected columns from the profiles table
// Based on user's select("*") and their VendorProfile type
export interface VendorProfile extends Vendor {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
  banner_url: string | null;
  email: string;
}

export function useVendorProfile() {
  const { user } = useAuthContext(); // Get the logged-in user
  const vendorId = user?.id;

  // State for the initially fetched profile data
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(
    null
  );
  // State for initial fetch loading and error
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<Error | null>(null); // Error specifically for the initial fetch

  // State for editable form fields (initialized from fetched profile later)
  const [name, setName] = useState("");
  const [description, setDescription] = useState<string | null>("");
  const [address, setAddress] = useState<string | null>("");
  const [contact, setContact] = useState<string | null>(""); // Maps to profiles.phone

  // State for selected image files (for new uploads)
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  // State for image previews (local URLs or fetched URLs)
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Note: isSaving state is managed in the component (VendorSettingsPage)

  // --- 1) Fetch existing vendor profile ---
  useEffect(() => {
    const fetchProfile = async () => {
      if (!vendorId) {
        setIsLoading(false);
        setFetchError(null); // Clear previous errors
        setVendorProfile(null);
        // Clear form state if user logs out or vendorId becomes null
        setName("");
        setDescription(null);
        setAddress(null);
        setContact(null);
        setLogoPreview(null);
        setBannerPreview(null);
        setLogoFile(null);
        setBannerFile(null);
        return;
      }

      setIsLoading(true);
      setFetchError(null); // Clear previous errors

      try {
        // Fetch the profile for the current user where role is 'vendor'
        // Using select("*") as in the user's code, but casting to VendorProfile type
        const { data, error: dbError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", vendorId)
          .eq("role", "vendor") // <-- This filter is key

        if (dbError || !data) {
          console.error("Error fetching vendor profile:", dbError);
          setFetchError(dbError || new Error("Profile data not found."));
          setVendorProfile(null);
          // Clear form state on error/not found
          setName("");
          setDescription(null);
          setAddress(null);
          setContact(null);
          setLogoPreview(null);
          setBannerPreview(null);
          setLogoFile(null);
          setBannerFile(null);
        } else {
          // Set the fetched profile data
          setVendorProfile(data[0] as VendorProfile); // Cast data to the defined type

          // Initialize form state from fetched profile
          setName((data[0] as VendorProfile).name || "");
          setDescription((data[0] as VendorProfile).description || null);
          setAddress((data[0] as VendorProfile).address || null);
          setContact((data[0] as VendorProfile).phone || null);
          setLogoPreview((data[0] as VendorProfile).logo_url || null);
          setBannerPreview((data[0] as VendorProfile).banner_url || null);

          // Clear any previously selected files when new profile is fetched
          setLogoFile(null);
          setBannerFile(null);
        }
      } catch (err: any) {
        console.error(
          "An unexpected error occurred while fetching vendor profile:",
          err
        );
        setFetchError(err);
        setVendorProfile(null);
        // Clear form state on unexpected error
        setName("");
        setDescription(null);
        setAddress(null);
        setContact(null);
        setLogoPreview(null);
        setBannerPreview(null);
        setLogoFile(null);
        setBannerFile(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();

    // Cleanup function to revoke object URLs when component unmounts or vendorId changes
    // This is handled in the component now, but good practice if state was managed here
    // return () => { ... };
  }, [vendorId]); // Re-run effect when the vendorId changes

  // --- 2) upload helper (kept from user's code) ---
  // Note: This uploads directly to Supabase Storage. Ensure RLS is configured.
  const uploadImage = async (
    file: File,
    folder: string
  ): Promise<string | null> => {
    if (!vendorId) {
      toast.error("Not authenticated for upload.");
      return null;
    }
    const fileName = `${vendorId}/${Date.now()}-${file.name}`; // Use vendorId in path
    const filePath = `${folder}/${fileName}`;
    const { error: upErr } = await supabase.storage
      .from("vendor-assets") // Use the correct bucket name
      .upload(filePath, file, {
        cacheControl: "3600", // Example cache control
        upsert: false, // Set to true if you want to overwrite existing files with the same path
      });

    if (upErr) {
      console.error("Supabase Storage Upload Error:", upErr);
      toast.error("Image upload failed: " + upErr.message);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("vendor-assets")
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      console.error("Supabase Storage Get Public URL Error: URL not found");
      toast.error("Failed to get public URL for uploaded image.");
      // Optionally delete the uploaded file if URL retrieval failed
      // await supabase.storage.from("vendor-assets").remove([filePath]);
      return null;
    }

    return urlData.publicUrl;
  };

  // --- 3) update profile (modified from user's code) ---
  // This function is now called from the component's handleSave
  // It handles image uploads and then updates the profile in the DB
  const updateVendorProfile = async (props: any): Promise<boolean> => {
    if (!vendorId) {
      toast.error("Not authenticated for update.");
      return false;
    }

    // isSaving state is managed in the component

    try {
      let logoUrlToSave: string | null | undefined = vendorProfile?.logo_url;
      let bannerUrlToSave: string | null | undefined =
        vendorProfile?.banner_url;

      // --- Handle Image Uploads ---
      // Only upload if a new file has been selected
      if (logoFile) {
        const uploadedUrl = await uploadImage(logoFile, "logos");
        if (uploadedUrl === null) {
          // uploadImage already shows toast, just return failure
          return false;
        }
        logoUrlToSave = uploadedUrl;
      } else if (logoPreview === null && vendorProfile?.logo_url !== null) {
        // If logoPreview is null AND there was an initial logo URL, it means the user cleared the logo
        // If logoPreview is not null but logoFile is null, it means they kept the existing image (preview is the old URL)
        logoUrlToSave = null;
      } else if (
        logoFile === null &&
        logoPreview !== null &&
        vendorProfile?.logo_url !== logoPreview
      ) {
        // This case handles if the user selected a file, then canceled the file picker,
        // but the preview reverted to the original URL. We keep the original URL.
        // It also handles the initial state where logoPreview is the fetched logo_url.
        logoUrlToSave = logoPreview; // Keep the existing URL
      }

      if (bannerFile) {
        const uploadedUrl = await uploadImage(bannerFile, "banners");
        if (uploadedUrl === null) {
          // uploadImage already shows toast, just return failure
          // Also, if banner upload fails, we should probably not save the profile at all,
          // even if logo upload succeeded.
          // Consider adding a check here and potentially reverting logo upload if needed.
          // For simplicity now, just return false.
          return false;
        }
        bannerUrlToSave = uploadedUrl;
      } else if (bannerPreview === null && vendorProfile?.banner_url !== null) {
        // If bannerPreview is null AND there was an initial banner URL, it means the user cleared the banner
        bannerUrlToSave = null;
      } else if (
        bannerFile === null &&
        bannerPreview !== null &&
        vendorProfile?.banner_url !== bannerPreview
      ) {
        // Keep the existing URL
        bannerUrlToSave = bannerPreview;
      }

      const profileUpdateData = {
        name: name,
        description: description,
        address: address,
        phone: contact,
        logo_url: logoUrlToSave,
        banner_url: bannerUrlToSave,
      };

      // Use the Supabase client to update the profile directly
      // Ensure RLS allows vendors to update their own profile row
      const { error: updateError } = await supabase
        .from("profiles")
        .update(profileUpdateData)
        .eq("id", vendorId)
        .eq("role", "vendor");

      if (updateError) {
        console.error("Supabase DB Update Error:", updateError);
        throw updateError; // Throw to be caught by the catch block
      }

      // Update local state to reflect saved changes (previews and files)
      // This is done in the component's handleSave after successful call
      setLogoFile(null);
      setBannerFile(null);
      setLogoPreview(logoUrlToSave || null);
      setBannerPreview(bannerUrlToSave || null);

      // Update the fetched vendorProfile state in the hook with the new values
      setVendorProfile((prevProfile) => {
        if (!prevProfile) return null;
        return {
          ...prevProfile,
          ...profileUpdateData,
          // Ensure nulls are handled correctly after update
          description: profileUpdateData.description,
          address: profileUpdateData.address,
          phone: profileUpdateData.phone,
          logo_url: profileUpdateData.logo_url ?? null,
          banner_url: profileUpdateData.banner_url ?? null,
        };
      });

      toast.success("Profile updated successfully!");
      return true; // Indicate success
    } catch (err: any) {
      console.error("Profile Update Process Error:", err);
      toast.error("Update failed: " + err.message);
      return false;
    }
  };

  return {
    // Data and loading/error state for the initial fetch
    vendorProfile, // The initially fetched profile data
    isLoading, // Loading state for the initial fetch
    fetchError, // Error state for the initial fetch

    // State for editable form fields (managed within the hook)
    name,
    setName,
    description,
    setDescription,
    address,
    setAddress,
    contact,
    setContact,

    // State for image files and previews (managed within the hook)
    logoFile,
    setLogoFile,
    logoPreview,
    setLogoPreview,
    bannerFile,
    setBannerFile,
    bannerPreview,
    setBannerPreview,

    // Function to trigger the update process
    updateVendorProfile, // This function handles upload and DB update
  };
}
