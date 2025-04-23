// apps/web/app/(root)/vendor/setting/page.tsx
"use client";

import { toast } from "react-toastify";
import React, { useState, useEffect } from "react";
// Assuming Logo is used elsewhere or can be removed if not needed here
// import Logo from "@/public/images/logo.png";
import GlassDiv from "@/components/ui/GlassDiv";
import GlassButton from "@/components/ui/GlassButton";
// Assuming useVendorProfile is a hook you will implement/modify
import { useVendorProfile } from "@/hooks/useVendorProfile"; // ADJUST PATH IF NECESSARY
import {
  PencilIcon,
  SaveIcon,
  CameraIcon,
  Loader2,
  X,
  User,
} from "lucide-react";
import Section from "@/components/reuse/Section";
import Input from "@/components/reuse/Input";
import TextArea from "@/components/reuse/TextArea";
import DisplayInfo from "@/components/reuse/DisplayInfo";
import ChangePassword from "@/components/auth/ChangePassword"; // Assuming this component exists

// Import the useImageUpload hook we created earlier
import useImageUpload from "@/hooks/useImageUpload"; // ADJUST PATH IF NECESSARY

// Define a type for the expected data structure from useVendorProfile's initial fetch
// This should align with the profiles table fields relevant to a vendor
type InitialProfileData = {
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  logo_url: string | null; // Initial URL from DB
  banner_url: string | null; // Initial URL from DB
  // Add other fields fetched by the hook if needed
};

export default function VendorSettingsPage() {
  const [editing, setEditing] = useState(false); // State for profile fields (managed by the hook, initialized here)

  const [name, setName] = useState("");
  const [description, setDescription] = useState<string | null>("");
  const [address, setAddress] = useState<string | null>("");
  const [contact, setContact] = useState<string | null>(""); // Maps to profiles.phone
  const [email, setEmail] = useState<string | null>(""); // Maps to profiles.phone

  // State for selected image files (for new uploads)
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  // State for image previews (local URLs or fetched URLs)
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false); // Store initial profile data (fetched from DB) for cancel functionality

  const [initialProfileData, setInitialProfileData] =
    useState<InitialProfileData | null>(null);

  // Use the custom image upload hook
  // We'll use separate instances if needed, but one can handle both if endpoint is generic
  const {
    uploadImage,
    isUploading: isLogoUploading,
    uploadError: logoUploadError,
    setUploadError: setLogoUploadError,
  } = useImageUpload("/api/upload-image"); // Assuming /api/upload-image is your endpoint
  const {
    uploadImage: uploadBannerImage,
    isUploading: isBannerUploading,
    uploadError: bannerUploadError,
    setUploadError: setBannerUploadError,
  } = useImageUpload("/api/upload-image"); // Same endpoint, separate state

  // Combine image uploading states and errors
  const isImageUploading = isLogoUploading || isBannerUploading;
  const imageUploadError = logoUploadError || bannerUploadError;
  const clearImageUploadErrors = () => {
    setLogoUploadError(null);
    setBannerUploadError(null);
  };

  // Assuming useVendorProfile fetches initial data and provides setters/update function
  // You will need to implement/modify this hook.
  // It should fetch the vendor profile data when the component mounts or user changes.
  const {
    vendorProfile: fetchedProfile,
    isLoading: isLoadingProfile,
    fetchError: fetchError,
    updateVendorProfile: hookUpdateProfile,
  } = useVendorProfile();

  useEffect(() => {
    if (fetchedProfile) {
      // Initialize state from fetched profile
      setName(fetchedProfile.name || "");
      setDescription(fetchedProfile.description || null);
      setAddress(fetchedProfile.address || null);
      setContact(fetchedProfile.phone || null);

      // Set initial image previews from fetched URLs
      setLogoPreview(fetchedProfile.logo_url || null);
      setBannerPreview(fetchedProfile.banner_url || null);

      // Store initial fetched data for cancel
      setInitialProfileData({
        name: fetchedProfile.name || "",
        description: fetchedProfile.description || null,
        address: fetchedProfile.address || null,
        phone: fetchedProfile.phone || null,
        logo_url: fetchedProfile.logo_url || null,
        banner_url: fetchedProfile.banner_url || null,
      });
    }
  }, [fetchedProfile]); // Re-run when fetchedProfile changes

  // Cleanup function to revoke object URLs when component unmounts or previews change
  useEffect(() => {
    return () => {
      if (logoFile && logoPreview) URL.revokeObjectURL(logoPreview);
      if (bannerFile && bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [logoFile, logoPreview, bannerFile, bannerPreview]); // --- Image Handling ---

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "banner"
  ) => {
    const file = e.target.files?.[0];
    const setter = type === "logo" ? setLogoFile : setBannerFile;
    const previewSetter = type === "logo" ? setLogoPreview : setBannerPreview;
    const currentPreview = type === "logo" ? logoPreview : bannerPreview;
    const currentFile = type === "logo" ? logoFile : bannerFile;

    if (file) {
      // Revoke previous object URL if it exists to prevent memory leaks
      if (currentPreview && currentFile) {
        // Only revoke if it was a local file preview
        URL.revokeObjectURL(currentPreview);
      }
      setter(file);
      previewSetter(URL.createObjectURL(file)); // Create a local URL for preview
    } else {
      // If user cancels file selection, clear the state and preview
      if (currentPreview && currentFile) {
        // Only revoke if it was a local file preview
        URL.revokeObjectURL(currentPreview);
      }
      setter(null);
      // If clearing, revert preview to initial fetched URL if available
      if (type === "logo") {
        setLogoPreview(initialProfileData?.logo_url || null);
      } else {
        setBannerPreview(initialProfileData?.banner_url || null);
      }
    }
  }; // --- Save Logic ---

  const handleSave = async () => {
    setIsSaving(true);
    clearImageUploadErrors(); // Clear previous upload errors

    let uploadedLogoUrl: string | null | undefined =
      initialProfileData?.logo_url;
    let uploadedBannerUrl: string | null | undefined =
      initialProfileData?.banner_url;
    let uploadFailed = false;

    // --- Handle Image Uploads First ---
    if (logoFile) {
      const result = await uploadImage(logoFile);
      if (result) {
        uploadedLogoUrl = result.url;
      } else {
        // Handle upload error - the hook already sets uploadError state
        uploadFailed = true;
        toast.error("Failed to upload logo image.");
      }
    } else if (logoPreview === null && initialProfileData?.logo_url !== null) {
      // If logoPreview is null AND there was an initial logo URL, it means the user cleared the logo
      uploadedLogoUrl = null;
    }

    if (!uploadFailed && bannerFile) {
      const result = await uploadBannerImage(bannerFile);
      if (result) {
        uploadedBannerUrl = result.url;
      } else {
        // Handle upload error
        uploadFailed = true;
        toast.error("Failed to upload banner image.");
      }
    } else if (
      bannerPreview === null &&
      initialProfileData?.banner_url !== null
    ) {
      // If bannerPreview is null AND there was an initial banner URL, it means the user cleared the banner
      uploadedBannerUrl = null;
    }

    // Stop if any image upload failed
    if (uploadFailed) {
      setIsSaving(false);
      return;
    }

    // Prepare data to send to the API (text fields + new image URLs)
    // Use Partial<VendorProfileType> if you have a specific type for vendor profile
    const profileDataToUpdate = {
      name,
      description,
      address,
      phone: contact,
      logo_url: uploadedLogoUrl,
      banner_url: uploadedBannerUrl,
      email: email,
    };

    // Remove undefined or empty string values if you don't want to send them
    // This helps avoid sending empty strings if a field wasn't touched,
    // but keep nulls for images if they were explicitly cleared.
    Object.keys(profileDataToUpdate).forEach((key) => {
      const value = (profileDataToUpdate as any)[key];
      // Keep image URLs (null, undefined, or string) as they indicate the desired state
      if (
        key !== "logo_url" &&
        key !== "banner_url" &&
        (value === "" || value === undefined)
      ) {
        delete (profileDataToUpdate as any)[key];
      }
    });

    // --- Send Profile Data Update via hook's function ---
    // Assuming hookUpdateProfile handles the API call to /api/vendor-profile
    // It should accept the profile data to update and return a success boolean or similar
    const success = await hookUpdateProfile(profileDataToUpdate);

    setIsSaving(false);

    if (success) {
      toast.success("Profile updated successfully!");
      setEditing(false);
      // Update initial profile data state to reflect saved changes, including new image URLs
      setInitialProfileData((prevData) => ({
        ...prevData,
        ...profileDataToUpdate,
        logo_url: profileDataToUpdate.logo_url ?? null,
        banner_url: profileDataToUpdate.banner_url ?? null,
      }));
      // Clear the selected files after successful save
      setLogoFile(null);
      setBannerFile(null);
    } else {
      // Error handling is likely done inside the hook, but show a generic toast if hook doesn't
      // toast.error("Failed to update profile.");
    }
  };

  const handleCancel = () => {
    // Revoke current object URLs before reverting
    if (logoFile && logoPreview) URL.revokeObjectURL(logoPreview);
    if (bannerFile && bannerPreview) URL.revokeObjectURL(bannerPreview); // Revert state to initial data from fetched profile

    if (initialProfileData) {
      setName(initialProfileData.name || "");
      setDescription(initialProfileData.description || null);
      setAddress(initialProfileData.address || null);
      setContact(initialProfileData.phone || null);
      // Revert image previews to initial fetched URLs
      setLogoPreview(initialProfileData.logo_url || null);
      setBannerPreview(initialProfileData.banner_url || null);
    } else {
      // If initial data wasn't loaded, clear everything
      setName("");
      setDescription(null);
      setAddress(null);
      setContact(null);
      setLogoPreview(null);
      setBannerPreview(null);
    }

    // Clear selected files
    setLogoFile(null);
    setBannerFile(null);

    setEditing(false); // Exit editing mode
    clearImageUploadErrors(); // Clear any upload errors
  };

  // Determine if the save button should be disabled
  const isSaveDisabled = isSaving || isImageUploading || isLoadingProfile; // --- Render ---

  // Show loading state for initial profile fetch
  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center h-full text-gray-800">
        <Loader2 size={32} className="animate-spin text-orange-500" />
        <p className="ml-2">Loading vendor profile...</p>
      </div>
    );
  }

  // Show error state for initial profile fetch
  if (fetchError) {
    return (
      <div className="text-red-600 text-center mt-8">
        <p>Failed to load vendor profile.</p>
        <p>{fetchError.message}</p>
        {/* Display fetch error message */}
      </div>
    );
  }

  // If no profile data is fetched and no error, might indicate user is not a vendor or not logged in
  if (!fetchedProfile && !isLoadingProfile && !fetchError) {
    return (
      <div className="text-gray-700 text-center mt-8">
        <p>
          Could not load vendor profile. Please ensure you are logged in as a
          vendor.
        </p>
        {/* Optional: Link to login or dashboard */}
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-wrap gap-6 text-white !bg-blue-950/20 w-full h-auto overflow-y-auto glass-scrollbar">
      <div className="w-full flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vendor Settings</h1>
        {/* ToastContainer should be in your root layout or app */}
        {/* <ToastContainer /> */}
        <div className="flex gap-3">
          {editing && (
            <GlassButton
              onClick={handleCancel}
              className="text-sm flex items-center gap-1 bg-red-500 hover:bg-red-600"
              disabled={isSaveDisabled} // Disable cancel while saving/uploading
            >
              <X size={16} /> Cancel
            </GlassButton>
          )}
          <GlassButton
            onClick={editing ? handleSave : () => setEditing(true)}
            className="text-sm flex items-center gap-1"
            disabled={isSaveDisabled} // Disable while saving or uploading images
          >
            {isSaveDisabled ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {isImageUploading ? "Uploading..." : "Saving..."}
              </>
            ) : editing ? (
              <>
                <SaveIcon size={16} /> Save
              </>
            ) : (
              <>
                <PencilIcon size={16} /> Edit
              </>
            )}
          </GlassButton>
        </div>
      </div>
      {/* Display upload error if any */}
      {imageUploadError && (
        <div className="w-full text-red-600 text-sm mt-2">
          Image Upload Error: {imageUploadError}
        </div>
      )}
      <GlassDiv className="w-full rounded-2xl overflow-hidden">
        {/* Removed fixed height */}
        <div className="relative w-full h-60 bg-gray-200 flex items-center justify-center text-gray-500">
          {/* Added fallback background */}
          {/* Display banner image preview or fetched URL */}
          {bannerPreview ? (
            <img
              src={bannerPreview}
              alt="Banner Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <span>No Banner Image</span>
          )}
          {editing && (
            <label className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full cursor-pointer">
              <CameraIcon size={18} />
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleImageChange(e, "banner")}
                disabled={isSaveDisabled} // Disable file input while saving/uploading
              />
            </label>
          )}
          <div className="absolute bottom-0 left-6 transform translate-y-1/2">
            {/* Adjusted position */}
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-gray-300 flex items-center justify-center text-gray-600">
              {/* Added fallback background */}
              {/* Display logo image preview or fetched URL */}
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>No Logo</span>
              )}
              {editing && (
                <label className="absolute bottom-2 right-2 bg-black/50 text-white p-1 rounded-full cursor-pointer">
                  {/* Adjusted position */}
                  <CameraIcon size={16} />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, "logo")}
                    disabled={isSaveDisabled} // Disable file input while saving/uploading
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      </GlassDiv>
      {/* Personal Info */}
      <GlassDiv className="w-full rounded-2xl overflow-hidden md:w-[48%] space-y-4">
        <Section title="Business Information">
          {/* Adjusted title */}
          {editing ? (
            <>
              <Input
                label="Business Name"
                value={name || ""} // Use empty string for controlled input
                onChange={setName}
                disabled={isSaveDisabled} // Disable while saving/uploading
                inputClass="!text-black"
              />
              <TextArea
                label="Description"
                value={description || ""} // Use empty string for controlled input
                onChange={setDescription}
                disabled={isSaveDisabled}
              />
            </>
          ) : (
            <DisplayInfo
              className="!text-black" // Apply text color to DisplayInfo
              classNameLabel="!text-black"
              classNameValue="!text-gray-600"
              items={[
                { label: "Business Name", value: name || "N/A" },
                { label: "Description", value: description || "N/A" },
              ]}
            />
          )}
        </Section>
      </GlassDiv>
      {/* Address */}
      <GlassDiv className="w-full rounded-2xl overflow-hidden md:w-[48%] space-y-4">
        <Section title="Address">
          {editing ? (
            <Input
              label="Business Address"
              value={address || ""} // Use empty string for controlled input
              onChange={setAddress}
              disabled={isSaveDisabled} // Disable while saving/uploading
              inputClass="!text-black"
            />
          ) : (
            <DisplayInfo
              className="!text-black" // Apply text color
              classNameLabel="!text-black"
              classNameValue="!text-gray-600"
              items={[{ label: "Business Address", value: address || "N/A" }]}
            />
          )}
        </Section>
      </GlassDiv>
      {/* Contact */}
      <GlassDiv className="w-full rounded-2xl overflow-hidden md:w-[48%] space-y-4">
        <Section title="Contact">
          {editing ? (
            <>
              <Input
                label="Email Address"
                value={email || ""} // Use empty string for controlled input
                onChange={setContact}
                disabled={isSaveDisabled} // Disable while saving/uploading
                inputClass="!text-black"
              />
              <Input
                label="Phone / Contact"
                value={contact || ""} // Use empty string for controlled input
                onChange={setContact}
                disabled={isSaveDisabled} // Disable while saving/uploading
                inputClass="!text-black"
              />
            </>
          ) : (
            <DisplayInfo
              className="!text-black" // Apply text color
              classNameLabel="!text-black"
              classNameValue="!text-gray-600"
              items={[
                { label: "Phone / Contact", value: contact || "N/A" },
                { label: "Email Address", value: contact || "N/A" },
              ]}
            />
          )}
        </Section>
      </GlassDiv>

      {/* Password */}
      {!editing && <ChangePassword className="" />}
    </div>
  );
}
