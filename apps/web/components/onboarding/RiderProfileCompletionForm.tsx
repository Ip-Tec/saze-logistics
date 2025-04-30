// components/onboarding/RiderProfileCompletionForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext"; // Adjust import path
import { supabase } from "@shared/supabaseClient"; // Adjust import path
import { Database } from "@shared/supabase/types"; // Adjust import path
import { toast } from "react-toastify";
import { Loader2, CameraIcon, XCircle } from "lucide-react"; // Assuming you have these icons
import Input from "@/components/reuse/Input"; // Assuming your Input component path
import GlassButton from "@/components/ui/GlassButton"; // Assuming your GlassButton path
import useImageUpload from "@/hooks/useImageUpload"; // Adjust your useImageUpload hook path

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

interface RiderProfileCompletionFormProps {
  metadata: MetaDataProps;
}

export default function RiderProfileCompletionForm({
  metadata,
}: RiderProfileCompletionFormProps) {
  const { user, getUserProfile } = useAuthContext();
  const router = useRouter();

  // State for rider-specific fields
  const [vehicleType, setVehicleType] = useState(""); // e.g., 'Motorcycle', 'Bicycle'
  const [licensePlate, setLicensePlate] = useState("");

  // State for images
  const [riderImageFile, setRiderImageFile] = useState<File | null>(null);
  const [riderImagePreview, setRiderImagePreview] = useState<string | null>(
    null
  );
  const [vehicleImageFile, setVehicleImageFile] = useState<File | null>(null);
  const [vehicleImagePreview, setVehicleImagePreview] = useState<string | null>(
    null
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use useImageUpload for rider image
  const {
    uploadImage: uploadRiderImage,
    isUploading: isRiderImageUploading,
    uploadError: riderImageUploadError,
    setUploadError: setRiderImageUploadError,
    clearError: clearRiderImageUploadError,
  } = useImageUpload("/api/upload-image"); // Assuming generic upload endpoint

  // Use useImageUpload for vehicle image
  const {
    uploadImage: uploadVehicleImage,
    isUploading: isVehicleImageUploading,
    uploadError: vehicleImageUploadError,
    setUploadError: setVehicleImageUploadError,
    clearError: clearVehicleImageUploadError,
  } = useImageUpload("/api/upload-image"); // Same endpoint, different state

  const isImageUploading = isRiderImageUploading || isVehicleImageUploading;
  const imageUploadError = riderImageUploadError || vehicleImageUploadError;
  const clearImageUploadErrors = () => {
    clearRiderImageUploadError();
    clearVehicleImageUploadError();
  };

  // Handle file change for images
  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "rider" | "vehicle"
  ) => {
    const file = e.target.files?.[0];
    const setFile = type === "rider" ? setRiderImageFile : setVehicleImageFile;
    const setPreview =
      type === "rider" ? setRiderImagePreview : setVehicleImagePreview;
    const currentPreview =
      type === "rider" ? riderImagePreview : vehicleImagePreview;

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
  const handleRemoveImage = (type: "rider" | "vehicle") => {
    const setFile = type === "rider" ? setRiderImageFile : setVehicleImageFile;
    const setPreview =
      type === "rider" ? setRiderImagePreview : setVehicleImagePreview;
    const currentPreview =
      type === "rider" ? riderImagePreview : vehicleImagePreview;

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
      !vehicleType.trim() ||
      !licensePlate.trim() ||
      (!riderImageFile && !riderImagePreview) ||
      (!vehicleImageFile && !vehicleImagePreview)
    ) {
      toast.error("Please fill in all required fields and select images.");
      return;
    }

    setIsSubmitting(true);
    clearImageUploadErrors(); // Clear previous errors before submitting

    let riderImageUrl: string | null =
      riderImagePreview && !riderImagePreview.startsWith("blob:")
        ? riderImagePreview
        : null; // Keep existing URL if any
    let vehicleImageUrl: string | null =
      vehicleImagePreview && !vehicleImagePreview.startsWith("blob:")
        ? vehicleImagePreview
        : null; // Keep existing URL if any
    let uploadFailed = false;

    // --- Upload Images First ---
    if (riderImageFile) {
      const result = await uploadRiderImage(riderImageFile, "rider_image"); // Pass file and type
      if (result?.url) {
        riderImageUrl = result.url;
      } else {
        uploadFailed = true;
        // Toast handled by hook or add here
        // toast.error("Failed to upload rider image.");
      }
    }
    if (!uploadFailed && vehicleImageFile) {
      const result = await uploadVehicleImage(
        vehicleImageFile,
        "vehicle_image"
      ); // Pass file and type
      if (result?.url) {
        vehicleImageUrl = result.url;
      } else {
        uploadFailed = true;
        // Toast handled by hook or add here
        // toast.error("Failed to upload vehicle image.");
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
      role: "rider", // Explicitly set/confirm the role
      name: user.name || "New Rider", // Get name from auth metadata or default
      email: user.email, // Get email from auth
      phone: user.phoneNumber.trim() || "", // Get phone from auth metadata or form, ensure it's not null/undefined
      address: null, // Riders might not have a primary address stored here
      rider_image_url: riderImageUrl, // Add image URLs
      vehicleType: vehicleType.trim(),
      licensePlate: licensePlate.trim(),
      vehicle_image_url: vehicleImageUrl,
      // Ensure other required fields from profiles table are handled (even if null)
      banner_url: null,
      description: null,
      logo_url: null,
      second_phone: null,
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
          name: profileData.name, // Can update name
          phone: profileData.phone, // Can update phone
          rider_image_url: profileData.rider_image_url,
          vehicleType: profileData.vehicleType,
          licensePlate: profileData.licensePlate,
          vehicle_image_url: profileData.vehicle_image_url,
          // Only include fields you allow updating here
        };
        const { error: updateError } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", user.id); // Ensure updating the correct row

        if (updateError) {
          console.error("Error updating rider profile:", updateError);
          toast.error(`Failed to update profile: ${updateError.message}`);
          setIsSubmitting(false);
          return;
        }
        console.log("Rider profile updated successfully.");
      } else if (insertError) {
        console.error("Error creating rider profile:", insertError);
        toast.error(`Failed to create profile: ${insertError.message}`);
        setIsSubmitting(false);
        return;
      } else {
        console.log("Rider profile created successfully.");
      }

      // Refresh user state in AuthContext
      await getUserProfile(); // This fetches the updated profile row

      toast.success("Rider profile completed successfully!");
      router.replace("/rider"); // Redirect to rider dashboard
    } catch (error: any) {
      console.error("Unexpected error completing rider profile:", error);
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
        <h2 className="text-2xl font-bold mb-6">Complete Rider Profile</h2>

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
              <strong>Name:</strong> {user?.name || "Not provided"}
            </p>
            <p>
              <strong>Phone:</strong> {user?.phoneNumber || "Not provided"}
            </p>
          </div>

          {/* Rider Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rider Image
            </label>
            {riderImagePreview && (
              <div className="relative w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden border border-gray-300">
                <img
                  src={riderImagePreview}
                  alt="Rider Preview"
                  className="w-full h-full object-cover"
                />
                {!isSubmitting && ( // Allow removal only when not submitting
                  <button
                    type="button"
                    onClick={() => handleRemoveImage("rider")}
                    className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full text-xs"
                    aria-label="Remove rider image"
                  >
                    <XCircle size={16} />
                  </button>
                )}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e, "rider")}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={isSaveDisabled}
              required={!riderImagePreview} // Required if no preview exists
            />
          </div>

          {/* Vehicle Type */}
          <Input
            label="Vehicle Type"
            value={vehicleType}
            onChange={setVehicleType}
            disabled={isSaveDisabled}
            required
            inputClass="text-black" // Ensure text is black
          />

          {/* License Plate */}
          <Input
            label="License Plate"
            value={licensePlate}
            onChange={setLicensePlate}
            disabled={isSaveDisabled}
            required
            inputClass="text-black" // Ensure text is black
          />

          {/* Vehicle Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle Image
            </label>
            {vehicleImagePreview && (
              <div className="relative w-32 h-20 mx-auto mb-3 rounded-md overflow-hidden border border-gray-300">
                <img
                  src={vehicleImagePreview}
                  alt="Vehicle Preview"
                  className="w-full h-full object-cover"
                />
                {!isSubmitting && ( // Allow removal only when not submitting
                  <button
                    type="button"
                    onClick={() => handleRemoveImage("vehicle")}
                    className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full text-xs"
                    aria-label="Remove vehicle image"
                  >
                    <XCircle size={16} />
                  </button>
                )}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e, "vehicle")}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={isSaveDisabled}
              required={!vehicleImagePreview} // Required if no preview exists
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
