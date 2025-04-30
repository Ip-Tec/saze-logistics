// components/onboarding/VendorProfileCompletionForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext"; // Adjust import path
import { supabase } from "@shared/supabaseClient"; // Adjust import path
import { Database } from "@shared/supabase/types"; // Adjust import path
import { toast } from "react-toastify";
import { Loader2, CameraIcon, XCircle } from "lucide-react"; // Assuming icons
import Input from "@/components/reuse/Input"; // Assuming Input component
import TextArea from "@/components/reuse/TextArea"; // Assuming TextArea component
import GlassButton from "@/components/ui/GlassButton"; // Assuming GlassButton
import useImageUpload from "@/hooks/useImageUpload"; // Adjust useImageUpload hook path

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

type MetaDataProps = {
  sub: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  email_verified: boolean | string;
  phone_verified: boolean | string;
};

interface VendorProfileCompletionFormProps {
  metadata: MetaDataProps;
}

export default function VendorProfileCompletionForm({
  metadata,
}: VendorProfileCompletionFormProps) {
  const { user, getUserProfile } = useAuthContext();
  const router = useRouter();

  // State for vendor-specific fields
  const [businessName, setBusinessName] = useState(user?.name || ""); // Use name from auth metadata
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState(user?.phoneNumber || ""); // Use phone from auth metadata
  const [email, setEmail] = useState(user?.email || ""); // Use email from auth metadata (display only)

  // State for images
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use useImageUpload for logo
  const {
    uploadImage: uploadLogoImage,
    isUploading: isLogoUploading,
    uploadError: logoUploadError,
    setUploadError: setLogoUploadError,
    clearError: clearLogoUploadError,
  } = useImageUpload("/api/upload-image"); // Assuming generic upload endpoint

  // Use useImageUpload for banner
  const {
    uploadImage: uploadBannerImage,
    isUploading: isBannerUploading,
    uploadError: bannerUploadError,
    setUploadError: setBannerUploadError,
    clearError: clearBannerUploadError,
  } = useImageUpload("/api/upload-image"); // Same endpoint, different state

  const isImageUploading = isLogoUploading || isBannerUploading;
  const imageUploadError = logoUploadError || bannerUploadError;
  const clearImageUploadErrors = () => {
    clearLogoUploadError();
    clearBannerUploadError();
  };

  // Handle file change for images
  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "banner"
  ) => {
    const file = e.target.files?.[0];
    const setFile = type === "logo" ? setLogoFile : setBannerFile;
    const setPreview = type === "logo" ? setLogoPreview : setBannerPreview;
    const currentPreview = type === "logo" ? logoPreview : bannerPreview;

    if (file) {
      if (currentPreview && currentPreview.startsWith("blob:")) {
        URL.revokeObjectURL(currentPreview);
      }
      setFile(file);
      setPreview(URL.createObjectURL(file));
    } else {
      if (currentPreview && currentPreview.startsWith("blob:")) {
        URL.revokeObjectURL(currentPreview);
      }
      setFile(null);
      setPreview(null); // Clear preview on file deselection
    }
    clearImageUploadErrors(); // Clear errors when changing files
  };

  // Handle removing a selected image file preview
  const handleRemoveImage = (type: "logo" | "banner") => {
    const setFile = type === "logo" ? setLogoFile : setBannerFile;
    const setPreview = type === "logo" ? setLogoPreview : setBannerPreview;
    const currentPreview = type === "logo" ? logoPreview : bannerPreview;

    if (currentPreview && currentPreview.startsWith("blob:")) {
      URL.revokeObjectURL(currentPreview);
    }
    setFile(null);
    setPreview(null);
    clearImageUploadErrors(); // Clear errors when removing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("User not logged in.");
      return;
    }
    if (
      !businessName.trim() ||
      !phone.trim() ||
      !address.trim() ||
      !description.trim() ||
      (!logoFile && !logoPreview) ||
      (!bannerFile && !bannerPreview)
    ) {
      toast.error("Please fill in all required fields and select images.");
      return;
    }

    setIsSubmitting(true);
    clearImageUploadErrors(); // Clear previous errors before submitting

    let logoImageUrl: string | null =
      logoPreview && !logoPreview.startsWith("blob:") ? logoPreview : null; // Keep existing URL if any
    let bannerImageUrl: string | null =
      bannerPreview && !bannerPreview.startsWith("blob:")
        ? bannerPreview
        : null; // Keep existing URL if any
    let uploadFailed = false;

    // --- Upload Images First ---
    if (logoFile) {
      const result = await uploadLogoImage(logoFile, "logo"); // Pass file and type
      if (result?.url) {
        logoImageUrl = result.url;
      } else {
        uploadFailed = true;
        toast.error("Failed to upload logo image.");
      }
    }
    if (!uploadFailed && bannerFile) {
      const result = await uploadBannerImage(bannerFile, "banner"); // Pass file and type
      if (result?.url) {
        bannerImageUrl = result.url;
      } else {
        uploadFailed = true;
        toast.error("Failed to upload banner image.");
      }
    }

    if (uploadFailed) {
      setIsSubmitting(false);
      return; // Stop if image upload failed
    }

    // --- Prepare Profile Data ---
    // Assuming the user row was created during signup with basic info and role in metadata
    // We are now completing the profile row in the 'profiles' table
    const profileData: ProfileInsert = {
      // Use Insert type for potential new row
      id: user.id, // Link to auth user ID
      role: "vendor", // Explicitly set/confirm the role
      name: businessName.trim(), // Use business name from form
      email: user.email, // Get email from auth
      phone: phone.trim(), // Use phone from form
      address: address.trim(), // Use address from form
      description: description.trim(), // Use description from form
      logo_url: logoImageUrl, // Add image URLs
      banner_url: bannerImageUrl, // Add image URLs
      // Ensure other required fields from profiles table are handled (even if null)
      licensePlate: null,
      rider_image_url: null,
      second_phone: null,
      vehicleType: null,
      vehicle_image_url: null,
      created_at: new Date().toISOString(), // Set creation timestamp
    };

    try {
      // Attempt to insert the profile. If it already exists (e.g., partial creation during signup), update instead.
      const { error: insertError } = await supabase
        .from("profiles")
        .insert([profileData]);

      if (insertError && insertError.code === "23505") {
        // Unique violation - profile exists
        console.warn("Profile already exists, attempting update instead.");
        const updateData: ProfileUpdate = {
          // Use Update type
          name: profileData.name,
          phone: profileData.phone,
          address: profileData.address,
          description: profileData.description,
          logo_url: profileData.logo_url,
          banner_url: profileData.banner_url,
          // Only include fields you allow updating here
        };
        const { error: updateError } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", user.id); // Ensure updating the correct row

        if (updateError) {
          console.error("Error updating vendor profile:", updateError);
          toast.error(`Failed to update profile: ${updateError.message}`);
          setIsSubmitting(false);
          return;
        }
        console.log("Vendor profile updated successfully.");
      } else if (insertError) {
        console.error("Error creating vendor profile:", insertError);
        toast.error(`Failed to create profile: ${insertError.message}`);
        setIsSubmitting(false);
        return;
      } else {
        console.log("Vendor profile created successfully.");
      }

      // Refresh user state in AuthContext
      await getUserProfile(); // This fetches the updated profile row

      toast.success("Vendor profile completed successfully!");
      router.replace("/vendor"); // Redirect to vendor dashboard
    } catch (error: any) {
      console.error("Unexpected error completing vendor profile:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Disable button while submitting or uploading images
  const isSaveDisabled = isSubmitting || isImageUploading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-gray-800">
        <h2 className="text-2xl font-bold mb-6">Complete Vendor Profile</h2>

        {/* Display image upload errors */}
        {imageUploadError && (
          <div className="text-red-600 text-sm mb-4">{imageUploadError}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info (Display from Auth User) */}
          <div>
            <p>
              <strong>Email:</strong> {user?.email}
            </p>
            <p>
              <strong>Intended Role:</strong> vendor
            </p>{" "}
            {/* Explicitly show role */}
          </div>

          {/* Business Name */}
          <Input
            label="Business Name"
            value={businessName}
            onChange={setBusinessName}
            disabled={isSaveDisabled}
            required
            inputClass="text-black"
          />

          {/* Phone Number */}
          <Input
            label="Business Phone Number"
            value={phone}
            onChange={setPhone}
            disabled={isSaveDisabled}
            required
            inputClass="text-black"
          />

          {/* Business Address */}
          <Input
            label="Business Address"
            value={address}
            onChange={setAddress}
            disabled={isSaveDisabled}
            required
            inputClass="text-black"
          />

          {/* Description */}
          <TextArea
            label="Business Description"
            value={description}
            onChange={setDescription}
            disabled={isSaveDisabled}
            required
          />

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Logo
            </label>
            {logoPreview && (
              <div className="relative w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden border border-gray-300">
                <img
                  src={logoPreview}
                  alt="Logo Preview"
                  className="w-full h-full object-cover"
                />
                {!isSubmitting && ( // Allow removal only when not submitting
                  <button
                    type="button"
                    onClick={() => handleRemoveImage("logo")}
                    className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full text-xs"
                    aria-label="Remove logo image"
                  >
                    <XCircle size={16} />
                  </button>
                )}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e, "logo")}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={isSaveDisabled}
              required={!logoPreview} // Required if no preview exists
            />
          </div>

          {/* Banner Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Banner
            </label>
            {bannerPreview && (
              <div className="relative w-full h-40 mx-auto mb-3 rounded-md overflow-hidden border border-gray-300">
                {" "}
                {/* Adjust size */}
                <img
                  src={bannerPreview}
                  alt="Banner Preview"
                  className="w-full h-full object-cover"
                />
                {!isSubmitting && ( // Allow removal only when not submitting
                  <button
                    type="button"
                    onClick={() => handleRemoveImage("banner")}
                    className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full text-xs"
                    aria-label="Remove banner image"
                  >
                    <XCircle size={16} />
                  </button>
                )}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e, "banner")}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={isSaveDisabled}
              required={!bannerPreview} // Required if no preview exists
            />
          </div>

          {/* Submit Button */}
          <GlassButton
            type="submit"
            disabled={isSaveDisabled}
            className={`w-full flex items-center justify-center space-x-2 ${
              isSaveDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 cursor-pointer"
            } text-white px-6 py-3 rounded-lg`}
          >
            {isSaveDisabled ? (
              <>
                <Loader2 size={20} className="animate-spin mr-2" />
                {isImageUploading ? "Uploading Images..." : "Saving Profile..."}
              </>
            ) : (
              "Complete Profile"
            )}
          </GlassButton>
        </form>
      </div>
    </div>
  );
}
