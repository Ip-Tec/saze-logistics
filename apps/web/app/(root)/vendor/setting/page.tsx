// apps/web/app/(root)/vendor/setting/page.tsx
"use client";

import { toast } from "react-toastify";
import React, { useState, useEffect } from "react";
// import Logo from "@/public/images/logo.png"; // Make sure this path is correct if you use it
import GlassDiv from "@/components/ui/GlassDiv"; // Make sure this component exists
import GlassButton from "@/components/ui/GlassButton"; // Make sure this component exists
// IMPORT useVendor FROM YOUR CONTEXT
import { useVendor } from "@/context/VendorContext"; // Make sure this hook exists and provides necessary states/functions
import {
  PencilIcon,
  SaveIcon,
  CameraIcon,
  Loader2,
  X,
  User,
} from "lucide-react";
import Section from "@/components/reuse/Section"; // Make sure this component exists
import Input from "@/components/reuse/Input"; // Make sure this component exists
import TextArea from "@/components/reuse/TextArea"; // Make sure this component exists
import DisplayInfo from "@/components/reuse/DisplayInfo"; // Make sure this component exists
import ChangePassword from "@/components/auth/ChangePassword"; // Make sure this component exists

// Import the useImageUpload hook we created earlier
import useImageUpload from "@/hooks/useImageUpload";

// Import Database types for profile structure
import { Database } from "@shared/supabase/types"; // Adjust path if necessary
// Define the type for the vendor's profile row for local state type safety
type VendorProfileType = Database["public"]["Tables"]["profiles"]["Row"];
type UpdateVendorProfilePayload =
  Database["public"]["Tables"]["profiles"]["Update"];

export default function VendorSettingsPage() {
  const [editing, setEditing] = useState(false); // Use states to manage form inputs (local component state)

  const [name, setName] = useState("");
  const [description, setDescription] = useState<string | null>("");
  const [address, setAddress] = useState<string | null>(""); // Map 'contact' input to 'phone' field in DB
  const [contact, setContact] = useState<string | null>(""); // Map 'email' input to 'email' field in DB (email should likely not be editable here if it's linked to auth)
  const [email, setEmail] = useState<string | null>(""); // Assuming email is displayed, maybe not editable
  // State for selected image files (for new uploads)

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null); // State for image previews (local URLs for new files OR fetched URLs for existing)

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null); // State to store initial profile data from the hook for cancel functionality

  const [initialProfileData, setInitialProfileData] =
    useState<VendorProfileType | null>(null); // Use the custom image upload hook
  // We'll use separate instances for logo and banner uploads
  // The hook should internally handle the API call to your upload endpoint

  const {
    uploadImage: uploadLogoImage, // Renamed to be specific
    isUploading: isLogoUploading,
    uploadError: logoUploadError,
    setUploadError: setLogoUploadError, // Hook provides this setter
  } = useImageUpload("/api/upload-image");

  const {
    uploadImage: uploadBannerImage, // Renamed to be specific
    isUploading: isBannerUploading,
    uploadError: bannerUploadError,
    setUploadError: setBannerUploadError, // Hook provides this setter
  } = useImageUpload("/api/upload-image"); // Use the same endpoint for banner
  // Combine image uploading states and errors

  const isImageUploading = isLogoUploading || isBannerUploading;
  const imageUploadError = logoUploadError || bannerUploadError; // Removed clearImageUploadErrors function - using individual setters now
  // Consume the vendor context
  const {
    vendorProfile: fetchedProfile, // Rename to avoid conflict with local state
    isLoading: isLoadingProfile, // Use context's initial load state
    fetchError, // Use context's initial fetch error
    updateVendorProfile, // Use context's profile update function
    isUpdatingProfile, // Use context's profile update loading state
    updateProfileError, // Use context's profile update error state
    setUpdateProfileError, // Added to allow clearing context error
  } = useVendor(); // Effect to populate form state when the profile is fetched or changes

  useEffect(() => {
    if (fetchedProfile) {
      // Initialize local state from fetched profile
      setName(fetchedProfile.name || "");
      setDescription(fetchedProfile.description || null);
      setAddress(fetchedProfile.address || null);
      setContact(fetchedProfile.phone || null); // Map phone from profile to contact state
      setEmail(fetchedProfile.email || null); // Map email from profile to email state
      // Set initial image previews from fetched URLs

      setLogoPreview(fetchedProfile.logo_url || null);
      setBannerPreview(fetchedProfile.banner_url || null); // Store initial fetched data for cancel

      setInitialProfileData(fetchedProfile); // Store the entire fetched object
    }
  }, [fetchedProfile]); // Re-run when fetchedProfile from context changes
  // Cleanup function to revoke object URLs when component unmounts or previews change
  // This is important for memory management of local file previews

  useEffect(() => {
    return () => {
      // Only revoke if the preview is a local object URL created from a File
      if (logoFile && logoPreview && logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
      if (bannerFile && bannerPreview && bannerPreview.startsWith("blob:")) {
        URL.revokeObjectURL(bannerPreview);
      }
    }; // Dependencies should include previews only if they are being used outside the cleanup
    // Including the files in dependencies might cause unnecessary re-runs if they are
    // only used in the cleanup. Let's stick to just the previews here.
  }, [logoPreview, bannerPreview]); // --- Image Handling ---

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "banner"
  ) => {
    const file = e.target.files?.[0];
    const setter = type === "logo" ? setLogoFile : setBannerFile;
    const previewSetter = type === "logo" ? setLogoPreview : setBannerPreview;
    const currentPreview = type === "logo" ? logoPreview : bannerPreview; // const currentFile = type === "logo" ? logoFile : bannerFile; // Current file state - not strictly needed here
    if (file) {
      // Revoke previous object URL if it exists and is a local URL
      if (currentPreview && currentPreview.startsWith("blob:")) {
        URL.revokeObjectURL(currentPreview);
      }
      setter(file);
      previewSetter(URL.createObjectURL(file)); // Create a local URL for preview
    } else {
      // If user cancels file selection (input value cleared)
      // Revoke current object URL if it exists and is a local URL
      if (currentPreview && currentPreview.startsWith("blob:")) {
        URL.revokeObjectURL(currentPreview);
      }
      setter(null); // Clear the file state
      // Revert preview to initial fetched URL if available
      if (type === "logo") {
        setLogoPreview(initialProfileData?.logo_url || null);
      } else {
        setBannerPreview(initialProfileData?.banner_url || null);
      }
    } // Clear any previous image upload errors when a new file is selected/cleared for that type
    if (type === "logo") setLogoUploadError(null); // Use setUploadError to clear
    if (type === "banner") setBannerUploadError(null); // Use setUploadError to clear
  }; // --- Save Logic ---

  const handleSave = async () => {
    // Clear any previous upload/update errors
    setLogoUploadError(null); // Use setUploadError to clear
    setBannerUploadError(null); // Use setUploadError to clear
    setUpdateProfileError(null); // Clear context update error
    // Start combining saving states
    // The button will be disabled based on isUpdatingProfile || isImageUploading

    let uploadedLogoUrl: string | null | undefined =
      initialProfileData?.logo_url;
    let uploadedBannerUrl: string | null | undefined =
      initialProfileData?.banner_url;
    let uploadFailed = false; // --- Handle Image Uploads First ---
    // Only upload if a new file is selected (logoFile is not null)

    if (logoFile) {
      const result = await uploadLogoImage(logoFile); // Use uploadLogoImage
      if (result?.url) {
        // Check if upload was successful and returned a URL
        uploadedLogoUrl = result.url;
      } else {
        // uploadImage hook should set its error state
        uploadFailed = true; // Toast is handled by the hook or can be added here
        // toast.error("Failed to upload logo image."); // Handled by hook
      }
    } else if (logoPreview === null && initialProfileData?.logo_url !== null) {
      // If logoPreview is null AND there was an initial logo URL,
      // it means the user explicitly cleared the logo. Set URL to null for update.
      uploadedLogoUrl = null;
    } // else: logoFile is null and logoPreview is the same as initialProfileData?.logo_url, so no change to logo_url
    if (!uploadFailed && bannerFile) {
      // Only proceed with banner upload if logo upload didn't fail
      const result = await uploadBannerImage(bannerFile); // Use uploadBannerImage
      if (result?.url) {
        // Check if upload was successful and returned a URL
        uploadedBannerUrl = result.url;
      } else {
        // uploadBannerImage hook should set its error state
        uploadFailed = true; // Toast is handled by the hook or can be added here
        // toast.error("Failed to upload banner image."); // Handled by hook
      }
    } else if (
      bannerPreview === null &&
      initialProfileData?.banner_url !== null
    ) {
      // If bannerPreview is null AND there was an initial banner URL, it means the user cleared the banner
      uploadedBannerUrl = null;
    } // else: bannerFile is null and bannerPreview is the same as initialProfileData?.banner_url, so no change to banner_url
    // If any image upload failed, stop here. The image upload hook/component
    // is responsible for showing the specific upload error toast.
    if (uploadFailed) {
      // The button will remain disabled due to isImageUploading state managed by the hook
      return; // Stop the save process
    } // Prepare data to send to the context's update function
    // This object includes text fields AND the final image URLs (newly uploaded or existing)

    const profileDataToUpdate: UpdateVendorProfilePayload = {
      name: name.trim(), // Trim whitespace
      description: description?.trim() || null, // Trim or set to null if empty
      address: address?.trim() || null, // Trim or set to null if empty
      phone: contact?.trim() || undefined, // Map contact state to phone field
      // email: email.trim(), // Email is often not editable, but include if it is
      logo_url: uploadedLogoUrl,
      banner_url: uploadedBannerUrl,
    }; // --- Send Profile Data Update via context function ---

    const success = await updateVendorProfile(profileDataToUpdate); // isUpdatingProfile state is handled by the context hook

    if (success) {
      toast.success("Profile updated successfully!");
      setEditing(false); // The context's updateVendorProfile function already updates
      // the fetchedProfile state in the context, which in turn
      // triggers the useEffect to update the local state and initialProfileData.
      // No need to manually update initialProfileData here.
      // Clear the selected files state after successful save
      setLogoFile(null);
      setBannerFile(null);
    } else {
      // Error handling and toast are done inside the context's updateVendorProfile function
      // The updateProfileError state in the context will be set.
    }
  };

  const handleCancel = () => {
    // Revoke current object URLs for *newly selected* files only
    if (logoFile && logoPreview && logoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreview);
    }
    if (bannerFile && bannerPreview && bannerPreview.startsWith("blob:")) {
      URL.revokeObjectURL(bannerPreview);
    } // Revert state to initial data from fetched profile

    if (initialProfileData) {
      setName(initialProfileData.name || "");
      setDescription(initialProfileData.description || null);
      setAddress(initialProfileData.address || null);
      setContact(initialProfileData.phone || null); // Revert phone field to contact state
      setEmail(initialProfileData.email || null); // Revert email field to email state
      // Revert image previews to initial fetched URLs

      setLogoPreview(initialProfileData.logo_url || null);
      setBannerPreview(initialProfileData.banner_url || null);
    } else {
      // If initial data wasn't loaded, clear everything
      setName("");
      setDescription(null);
      setAddress(null);
      setContact(null);
      setEmail(null);
      setLogoPreview(null);
      setBannerPreview(null);
    } // Clear selected files state

    setLogoFile(null);
    setBannerFile(null);

    setEditing(false); // Exit editing mode
    setLogoUploadError(null); // Use setUploadError to clear any upload errors
    setBannerUploadError(null); // Use setUploadError to clear any upload errors
    setUpdateProfileError(null); // Clear any update errors from context
  }; // Determine if the save button should be disabled
  // Button is disabled if any saving/uploading is in progress or initial profile is loading

  const isSaveDisabled =
    isUpdatingProfile || isImageUploading || isLoadingProfile; // --- Render ---
  // Show loading state for initial profile fetch from context

  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center h-full text-gray-800">
        <Loader2 size={32} className="animate-spin text-orange-500" />
        <p className="ml-2">Loading vendor profile...</p>
      </div>
    );
  } // Show error state for initial profile fetch from context

  if (fetchError) {
    return (
      <div className="text-red-600 text-center mt-8">
        <p>Failed to load vendor profile.</p>
        <p>{fetchError.message}</p> {/* Display fetch error message */}
      </div>
    );
  } // If no profile data is fetched and not loading/error, might indicate user is not a vendor or not logged in

  if (!fetchedProfile) {
    // isLoadingProfile is false, fetchError is null, but fetchedProfile is null
    return (
      <div className="text-gray-700 text-center mt-8">
        <p>
          Could not load vendor profile. Please ensure you are logged in as a
          vendor and your profile exists.
        </p>
        {/* Optional: Link to login or dashboard */}
      </div>
    );
  }

  return (
    // Use fetchedProfile.id as a key if rendering different sections based on vendor,
    // but likely not needed for the main page layout itself.
    <div className="p-6 flex flex-wrap gap-6 text-white !bg-blue-950/20 w-full h-auto overflow-y-auto glass-scrollbar">
      <div className="w-full flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vendor Settings</h1>
        {/* ToastContainer should be in your root layout or app */}
        {/* Make sure you have a ToastContainer component in your root layout or equivalent */}

        <div className="flex gap-3">
          {editing && (
            <GlassButton
              onClick={handleCancel}
              className="text-sm flex items-center gap-1 bg-red-500 hover:bg-red-600"
              disabled={isUpdatingProfile || isImageUploading} // Disable cancel while saving/uploading
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

                {isUpdatingProfile
                  ? "Saving..."
                  : isImageUploading
                    ? "Uploading Images..."
                    : "Processing..."}
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
      {/* Display upload error from hook */}
      {imageUploadError && (
        <div className="w-full text-red-600 text-sm mt-2">
          Image Upload Error: {imageUploadError}
        </div>
      )}
      {/* Display update error from context */}
      {updateProfileError && (
        <div className="w-full text-red-600 text-sm mt-2">
          Profile Update Error: {updateProfileError.message}
        </div>
      )}

      <GlassDiv className="w-full overflow-hidden !p-0 !rounded-2xl">
        {/* Removed fixed height */}
        <div className="relative w-full h-60 bg-gray-200 flex items-center justify-center text-gray-500">
          {/* Added fallback background */}
          {/* Display banner image preview or fetched URL */}
          {bannerPreview ? (
            <img 
              src={bannerPreview}
              alt="Banner Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Handle image load errors
                e.currentTarget.onerror = null;
                e.currentTarget.src =
                  "https://placehold.co/800x240?text=Image+Error"; // Fallback image
              }}
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
        </div>

        <div className="absolute bottom-18 left-6 transform translate-y-1/2">
          {/* Adjusted position */}
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-gray-300 flex items-center justify-center text-gray-600">
            {/* Added fallback background */}
            {/* Display logo image preview or fetched URL */}
            {logoPreview ? (
              <img // Using standard img for now
                src={logoPreview}
                alt="Logo Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Handle image load errors
                  e.currentTarget.onerror = null;
                  e.currentTarget.src =
                    "https://placehold.co/128x128?text=Image+Error"; // Fallback image
                }}
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
      </GlassDiv>
      {/* Personal Info */}
      <div className="flex w-full flex-wrap justify-between items-center">
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
              className="!text-black" // Apply text color to DisplayInfo container
              classNameLabel="!text-black" // Label color (adjust if needed)
              classNameValue="!text-gray-600" // Value color (adjust if needed)
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
      </div>
      {/* Contact */}
      <GlassDiv className="w-full rounded-2xl overflow-hidden md:w-[48%] space-y-4">
        <Section title="Contact">
          {editing ? (
            <>
              {/* Ensure the email input maps to the email state */}

              <Input
                label="Email Address"
                value={email || ""}
                onChange={setEmail} // Use setEmail here
                disabled={isSaveDisabled || true} // Email often not editable if tied to auth, disable it
                inputClass="!text-black disabled:opacity-70"
                readOnly={true} // Make it readonly
              />

              {/* Ensure the phone input maps to the contact state which maps to phone in DB */}

              <Input
                label="Phone / Contact"
                value={contact || ""} // Use contact state here
                onChange={setContact} // Use setContact here
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
                // Display email and phone from local state (synced with fetchedProfile)
                { label: "Email Address", value: email || "N/A" },
                { label: "Phone / Contact", value: contact || "N/A" },
              ]}
            />
          )}
        </Section>
      </GlassDiv>
      {/* Password */}
      {/* Assuming ChangePassword component exists and handles its own logic */}
      {!editing && <ChangePassword className="" />}
    </div>
  );
}
