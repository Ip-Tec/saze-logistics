// components/vendor/settings/ProfileImageSection.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CameraIcon, Loader2, SaveIcon, X } from "lucide-react";
import GlassDiv from "@/components/ui/GlassDiv"; // Assuming GlassDiv exists
import GlassButton from "@/components/ui/GlassButton"; // Assuming GlassButton exists
import { toast } from "react-toastify";

// Import necessary types
import { Database } from "@shared/supabase/types"; // Adjust path if necessary
import useImageUpload from "@/hooks/useImageUpload"; // Assuming useImageUpload hook exists

type VendorProfileType = Database["public"]["Tables"]["profiles"]["Row"];
type UpdateVendorProfilePayload =
  Database["public"]["Tables"]["profiles"]["Update"];

interface ProfileImageSectionProps {
  profile: VendorProfileType;
  editing: boolean;
  // Pass the update function from the parent/context
  updateProfile: (payload: UpdateVendorProfilePayload) => Promise<boolean>;
  // Pass the initial load/update states from the parent/context for button disabling
  isOverallLoading: boolean; // e.g., isLoadingProfile from context
  isOverallUpdating: boolean; // e.g., isUpdatingProfile from context
}

// Dummy image for fallback - replace with your actual default
const DefaultImage = "/images/logo.png"; // Adjust path if needed

export default function ProfileImageSection({
  profile,
  editing,
  updateProfile,
  isOverallLoading,
  isOverallUpdating,
}: ProfileImageSectionProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Keep track of initial URLs to know if they've been cleared
  const [initialLogoUrl, setInitialLogoUrl] = useState<string | null>(null);
  const [initialBannerUrl, setInitialBannerUrl] = useState<string | null>(null);

  // Use separate instances of the image upload hook
  const {
    uploadImage: uploadLogoImage,
    isUploading: isLogoUploading,
    uploadError: logoUploadError,
    setUploadError: setLogoUploadError,
  } = useImageUpload("/api/upload-image"); // Adjust endpoint if needed

  const {
    uploadImage: uploadBannerImage,
    isUploading: isBannerUploading,
    uploadError: bannerUploadError,
    setUploadError: setBannerUploadError,
  } = useImageUpload("/api/upload-image"); // Adjust endpoint if needed

  // Internal saving state for this section
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Effect to initialize state from profile data
  useEffect(() => {
    if (profile) {
      setLogoPreview(profile.logo_url || null);
      setBannerPreview(profile.banner_url || null);
      setInitialLogoUrl(profile.logo_url || null);
      setInitialBannerUrl(profile.banner_url || null);
      // Clear any pending file selections when profile data is re-synced
      setLogoFile(null);
      setBannerFile(null);
    }
  }, [profile]); // Re-run when profile data changes (e.g., after parent fetch or save)

  // Effect to clean up object URLs
  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
      if (bannerPreview && bannerPreview.startsWith("blob:")) {
        URL.revokeObjectURL(bannerPreview);
      }
    };
  }, [logoPreview, bannerPreview]);

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "banner"
  ) => {
    const file = e.target.files?.[0];
    const setter = type === "logo" ? setLogoFile : setBannerFile;
    const previewSetter = type === "logo" ? setLogoPreview : setBannerPreview;
    const currentPreview = type === "logo" ? logoPreview : bannerPreview;

    if (file) {
      if (currentPreview && currentPreview.startsWith("blob:")) {
        URL.revokeObjectURL(currentPreview);
      }
      setter(file);
      previewSetter(URL.createObjectURL(file));
    } else {
      // If user cancels file selection (input value cleared)
      if (currentPreview && currentPreview.startsWith("blob:")) {
        URL.revokeObjectURL(currentPreview);
      }
      setter(null);
      // Revert preview to initial fetched URL if available for this type
      if (type === "logo") {
        setLogoPreview(initialLogoUrl);
      } else {
        setBannerPreview(initialBannerUrl);
      }
    }
    // Clear any previous upload errors for this type when file changes
    if (type === "logo") setLogoUploadError(null);
    if (type === "banner") setBannerUploadError(null);
  };

  const handleSaveImages = async () => {
    setIsSaving(true);
    setSaveError(null);
    setLogoUploadError(null);
    setBannerUploadError(null);

    let newLogoUrl: string | null | undefined = initialLogoUrl;
    let newBannerUrl: string | null | undefined = initialBannerUrl;
    let uploadFailed = false;

    // 1. Upload Logo if a new file is selected
    if (logoFile) {
      const result = await uploadLogoImage(logoFile, "logo");
      if (result?.url) {
        newLogoUrl = result.url;
      } else {
        uploadFailed = true;
        // uploadImage hook should set logoUploadError
      }
    } else if (logoPreview === null && initialLogoUrl !== null) {
      // User cleared the logo by clicking 'X' or cancelling file input after selecting a file
      newLogoUrl = null;
    } // Else: logoFile is null and logoPreview matches initialLogoUrl, no change needed

    // 2. Upload Banner if a new file is selected and logo upload didn't fail
    if (!uploadFailed && bannerFile) {
      const result = await uploadBannerImage(bannerFile, "banner");
      if (result?.url) {
        newBannerUrl = result.url;
      } else {
        uploadFailed = true;
        // uploadImage hook should set bannerUploadError
      }
    } else if (bannerPreview === null && initialBannerUrl !== null) {
      // User cleared the banner
      newBannerUrl = null;
    } // Else: bannerFile is null and bannerPreview matches initialBannerUrl, no change needed

    if (uploadFailed) {
      setIsSaving(false);
      // The specific upload error is already set by the hook
      toast.error(
        logoUploadError || bannerUploadError || "Image upload failed."
      );
      return; // Stop the save process if upload failed
    }

    // 3. Update profile with the new URLs
    try {
      const success = await updateProfile({
        logo_url: newLogoUrl,
        banner_url: newBannerUrl,
      });

      if (success) {
        toast.success("Images updated successfully!");
        // Update initial URLs to the newly saved ones
        setInitialLogoUrl(
          newLogoUrl === undefined ? initialLogoUrl : newLogoUrl
        ); // Handle undefined case
        setInitialBannerUrl(
          newBannerUrl === undefined ? initialBannerUrl : newBannerUrl
        ); // Handle undefined case
        // Clear the selected files state after successful save
        setLogoFile(null);
        setBannerFile(null);
        // No need to manually set previews, the useEffect triggered by profile change will handle it
      } else {
        // Error toast is likely handled by the updateProfile function in the parent/context
        setSaveError("Failed to update images."); // Set local save error if parent update failed
        toast.error("Failed to update images.");
      }
    } catch (error: any) {
      console.error("Error updating profile images:", error);
      setSaveError(error.message || "Failed to update images.");
      toast.error(error.message || "Failed to update images.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelImages = () => {
    // Revoke object URLs for currently selected files
    if (logoFile && logoPreview && logoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreview);
    }
    if (bannerFile && bannerPreview && bannerPreview.startsWith("blob:")) {
      URL.revokeObjectURL(bannerPreview);
    }

    // Revert local state to initial fetched URLs
    setLogoFile(null);
    setBannerFile(null);
    setLogoPreview(initialLogoUrl);
    setBannerPreview(initialBannerUrl);

    // Clear any active saving/uploading state or errors for this section
    setIsSaving(false);
    setSaveError(null);
    setLogoUploadError(null);
    setBannerUploadError(null);
  };

  const isSavingOrUploading = isSaving || isLogoUploading || isBannerUploading;
  const isActionDisabled =
    isOverallLoading || isOverallUpdating || isSavingOrUploading;
  // Check if there are any changes to save
  const hasChanges =
    logoFile !== null ||
    bannerFile !== null || // New file selected
    logoPreview !== initialLogoUrl ||
    bannerPreview !== initialBannerUrl; // Existing image cleared/changed preview

  return (
    <GlassDiv className="w-full overflow-hidden !p-0 !rounded-2xl">
      <div className="relative w-full h-72 bg-gray-200 flex items-center justify-center text-gray-500">
        {/* Display banner image preview or fetched URL */}
        {bannerPreview ? (
          <img
            src={bannerPreview}
            alt="Banner Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
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
              disabled={isActionDisabled}
              key={bannerPreview} // Key helps reset input if preview changes
            />
          </label>
        )}
        {editing && bannerPreview && (
          <button
            className="absolute top-2 right-12 bg-red-500/50 text-white p-1 rounded-full cursor-pointer"
            onClick={() =>
              handleImageChange({ target: { files: null } } as any, "banner")
            } // Simulate clear
            disabled={isActionDisabled}
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="absolute bottom-16 left-6 transform translate-y-1/2 z-10">
        {" "}
        {/* Adjusted position and z-index */}
        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-gray-300 flex items-center justify-center text-gray-600">
          {/* Display logo image preview or fetched URL */}
          {logoPreview ? (
            <img
              src={logoPreview}
              alt="Logo Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src =
                  "https://placehold.co/128x128?text=Image+Error"; // Fallback image
              }}
            />
          ) : (
            <span>No Logo</span>
          )}

          {editing && (
            <label className="absolute bottom-2 right-6 bg-black/50 text-white p-1 rounded-full cursor-pointer">
              <CameraIcon size={16}/>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleImageChange(e, "logo")}
                disabled={isActionDisabled}
                key={logoPreview} // Key helps reset input
              />
            </label>
          )}
          {editing && logoPreview && (
            <button
              className="absolute bottom-2 right-10 bg-red-500/50 text-white p-1 rounded-full cursor-pointer"
              onClick={() =>
                handleImageChange({ target: { files: null } } as any, "logo")
              } // Simulate clear
              disabled={isActionDisabled}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Button Container (Offset to align with the rest of the content below the banner/logo) */}
      <div className="w-full flex justify-end">
        {/* Added padding top to account for logo overlap */}
        {editing && (
          <div className="w-full flex justify-end -mt-16 mr-3 absolute">
            <GlassButton
              onClick={handleCancelImages}
              className="text-sm flex items-center gap-1 !bg-red-500 hover:!bg-red-600 mr-2"
              disabled={isActionDisabled}
            >
              <X size={16} /> Cancel
            </GlassButton>

            <GlassButton
              onClick={handleSaveImages}
              className="text-sm flex items-center gap-1 !text-black hover:text-orange-500"
              disabled={isActionDisabled || !hasChanges} // Disable if no changes
            >
              {isSavingOrUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {isSaving ? "Saving..." : "Uploading Images..."}
                </>
              ) : (
                <>
                  <SaveIcon size={16} /> Save Images
                </>
              )}
            </GlassButton>
          </div>
        )}
      </div>

      {/* Display Section Error */}
      {(logoUploadError || bannerUploadError || saveError) && (
        <div className="w-full text-red-600 text-sm px-4 pb-4">
          Error: {logoUploadError || bannerUploadError || saveError}
        </div>
      )}
    </GlassDiv>
  );
}
