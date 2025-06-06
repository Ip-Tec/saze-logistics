// components/onboarding/RiderProfileCompletionForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { supabase } from "@shared/supabaseClient";
import { Database } from "@shared/supabase/types";
import { toast } from "react-toastify";
import { Loader2, CameraIcon, XCircle, Bike, Car, IdCard } from "lucide-react";
import Input from "@/components/reuse/Input";
import GlassButton from "@/components/ui/GlassButton";
import useImageUpload from "@/hooks/useImageUpload";

// Extend your Database types if 'nin' is not yet in the profiles table
// For this example, I'll assume you'll add it to your Supabase `profiles` table.
// Make sure your Supabase `profiles` table has a column named `nin` of type `text`.
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"] & {
  nin?: string | null;
};
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"] & {
  nin?: string | null;
};

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
  const [vehicleType, setVehicleType] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [nin, setNin] = useState("");

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
  } = useImageUpload("/api/upload-image");

  // Use useImageUpload for vehicle image
  const {
    uploadImage: uploadVehicleImage,
    isUploading: isVehicleImageUploading,
    uploadError: vehicleImageUploadError,
    setUploadError: setVehicleImageUploadError,
    clearError: clearVehicleImageUploadError,
  } = useImageUpload("/api/upload-image"); 

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
      setPreview(null);
    }
    clearImageUploadErrors();
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
    if (!metadata) {
      toast.error("User not logged in.");
      return;
    }

    // Added NIN validation
    if (
      !vehicleType.trim() ||
      !licensePlate.trim() ||
      !nin.trim() || // Validate NIN
      (!riderImageFile && !riderImagePreview) ||
      (!vehicleImageFile && !vehicleImagePreview)
    ) {
      toast.error("Please fill in all required fields and select images.");
      return;
    }

    // Basic NIN format validation (e.g., 11 digits for Nigeria)
    if (!/^\d{11}$/.test(nin.trim())) {
      toast.error(
        "Please enter a valid 11-digit National Identity Number (NIN)."
      );
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
      }
    }

    if (uploadFailed) {
      setIsSubmitting(false);
      return; // Stop if image upload failed
    }

    // --- Prepare Profile Data ---
    const profileData: ProfileInsert = {
      id: metadata.sub, // Link to auth user ID
      role: "rider", // Explicitly set/confirm the role
      name: metadata.name || "New Rider", // Get name from auth metadata or default
      email: metadata.email, // Get email from auth
      phone: metadata.phone.trim() || "", // Get phone from auth metadata or form
      address: null,
      rider_image_url: riderImageUrl,
      vehicleType: vehicleType.trim(),
      licensePlate: licensePlate.trim(),
      vehicle_image_url: vehicleImageUrl,
      nin: nin.trim(),
      banner_url: null,
      description: null,
      logo_url: null,
      second_phone: null,
      created_at: new Date().toISOString(),
    };

    try {
      const { error: insertError } = await supabase
        .from("profiles")
        .insert([profileData]);

      if (insertError && insertError.code === "23505") {
        console.warn("Profile already exists, attempting update instead.");
        const updateData: ProfileUpdate = {
          name: profileData.name,
          phone: profileData.phone,
          rider_image_url: profileData.rider_image_url,
          vehicleType: profileData.vehicleType,
          licensePlate: profileData.licensePlate,
          vehicle_image_url: profileData.vehicle_image_url,
          nin: profileData.nin,
        };
        const { error: updateError } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", metadata.sub);

        if (updateError) {
          console.error("Error updating rider profile:", updateError);
          toast.error(`Failed to update profile: ${updateError.message}`);
          setIsSubmitting(false);
          return;
        }
        console.log("Rider profile updated successfully.");
        router.replace("/rider");
      } else if (insertError) {
        console.error("Error creating rider profile:", insertError);
        toast.error(`Failed to create profile: ${insertError.message}`);
        setIsSubmitting(false);
        return;
      } else {
        console.log("Rider profile created successfully.");
      }

      await getUserProfile();

      toast.success("Rider profile completed successfully!");
      router.replace("/rider");
    } catch (error: any) {
      console.error("Unexpected error completing rider profile:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSaveDisabled = isSubmitting || isImageUploading;

  // Helper to get vehicle icon
  const getVehicleIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "motorcycle":
        return <Bike size={20} />; // Using Bike for motorcycle
      case "car":
        return <Car size={20} />;
      case "bicycle":
        return <Bike size={20} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="conta p-8 w-full">
        {/* Increased max-w-4xl */}
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-2">
          Complete Your Rider Profile
        </h2>
        <p className="text-center text-gray-600 mb-8">
          Tell us more about yourself and your vehicle to get started.
        </p>
        {/* Display image upload errors */}
        {imageUploadError && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md mb-4 flex items-center justify-between">
            <span>{imageUploadError}</span>
            <XCircle
              size={18}
              className="cursor-pointer"
              onClick={clearImageUploadErrors}
            />
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Added lg:grid-cols-3 */}
            {/* Basic Info (Display from Auth User) */}
            <div className="p-4 border-2 border-green-300 bg-bgeen-200 rounded-lg shadow-xl">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Your Account Details
              </h3>
              <p className="text-gray-700 text-sm mb-1">
                <strong>ID:</strong> {user?.id || metadata.sub}
              </p>
              <p className="text-gray-700 text-sm mb-1">
                <strong>Email:</strong> {user?.email || metadata.email}
              </p>
              <p className="text-gray-700 text-sm mb-1">
                <strong>Name:</strong>{" "}
                {user?.name || metadata.name || "Not provided"}
              </p>
              <p className="text-gray-700 text-sm">
                <strong>Phone:</strong>{" "}
                {user?.phoneNumber || metadata.phone || "Not provided"}
              </p>
            </div>
            {/* Rider Image Upload Section */}
            <div className="border border-gray-200 bg-white/60 rounded-lg shadow-xl p-5 flex flex-col items-center justify-center">
              <label className="block text-base font-semibold text-gray-800 mb-3">
                Rider Profile Photo <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col items-center justify-center mb-4">
                {riderImagePreview ? (
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-orange-400 shadow-md flex items-center justify-center bg-gray-100">
                    <img
                      src={riderImagePreview}
                      alt="Rider Preview"
                      className="w-full h-full object-cover"
                    />
                    {!isSaveDisabled && (
                      <button
                        type="button"
                        onClick={() => handleRemoveImage("rider")}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
                        aria-label="Remove rider image"
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center text-gray-400 bg-gray-100">
                    <CameraIcon size={36} />
                  </div>
                )}
              </div>
              <input
                id="rider-image-upload"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e, "rider")}
                className="hidden"
                disabled={isSaveDisabled}
                required={!riderImagePreview}
              />
              <label
                htmlFor="rider-image-upload"
                className={`block w-full text-center px-4 py-2 rounded-md transition-colors ${
                  isSaveDisabled
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-orange-500 text-white hover:bg-orange-600 cursor-pointer"
                } font-medium`}
              >
                {riderImagePreview ? "Change Photo" : "Upload Photo"}
              </label>
              <p className="text-xs text-gray-500 text-center mt-2">
                JPG, PNG, or GIF. Max 5MB.
              </p>
            </div>
            {/* NIN Input Field */}
            <div className="border border-gray-200 bg-white/60 rounded-lg shadow-xl p-5 flex flex-col justify-center">
              <label
                htmlFor="nin"
                className="block text-base font-semibold text-gray-800 mb-3"
              >
                National Identity Number (NIN){" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <IdCard size={20} className="absolute left-3 text-gray-400" />
                <Input
                  required
                  label=""
                  value={nin}
                  maxLength={11}
                  onChange={setNin}
                  disabled={isSaveDisabled}
                  placeholder="e.g., 12345678901"
                  inputClass="!text-gray-900 pl-10 pr-3 py-2 placeholder:!text-gray-400 border rounded-md w-full focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Please enter your 11-digit NIN.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vehicle Information Section */}
            <div className="p-5 border border-gray-200 bg-white/60 rounded-lg shadow-xl">
              <h3 className="text-base font-semibold text-gray-800 mb-3">
                Vehicle Details
              </h3>

              {/* Vehicle Type */}
              <div>
                <label
                  htmlFor="vehicle-type"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Vehicle Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="vehicle-type"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    disabled={isSaveDisabled}
                    required
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md bg-white text-gray-900 appearance-none"
                  >
                    <option value="" disabled>
                      Select vehicle type
                    </option>
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Bicycle">Bicycle</option>
                    <option value="Car">Car</option>
                    {/* Add more vehicle types as needed */}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    {getVehicleIcon(vehicleType)}
                  </div>
                </div>
              </div>

              {/* License Plate */}
              <Input
                label="License Plate Number"
                value={licensePlate}
                onChange={setLicensePlate}
                disabled={isSaveDisabled}
                required
                inputClass="!text-gray-900 placeholder:!text-gray-400"
                placeholder="e.g., ABC-123-DE"
              />
            </div>

            {/* Vehicle Image Upload */}
            <div className="p-5 border border-gray-200 bg-white/60 rounded-lg shadow-xl flex flex-col items-center justify-center">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Photo <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col items-center justify-center mb-4">
                {vehicleImagePreview ? (
                  <div className="relative w-48 h-32 rounded-lg overflow-hidden border-4 border-orange-400 shadow-md flex items-center justify-center bg-gray-100">
                    <img
                      src={vehicleImagePreview}
                      alt="Vehicle Preview"
                      className="w-full h-full object-cover"
                    />
                    {!isSaveDisabled && (
                      <button
                        type="button"
                        onClick={() => handleRemoveImage("vehicle")}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
                        aria-label="Remove vehicle image"
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-48 h-32 rounded-lg border-4 border-dashed border-gray-300 flex items-center justify-center text-gray-400 bg-gray-100">
                    <CameraIcon size={36} />
                  </div>
                )}
              </div>
              <input
                id="vehicle-image-upload"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e, "vehicle")}
                className="hidden"
                disabled={isSaveDisabled}
                required={!vehicleImagePreview}
              />
              <label
                htmlFor="vehicle-image-upload"
                className={`block w-full text-center px-4 py-2 rounded-md transition-colors ${
                  isSaveDisabled
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-orange-500 text-white hover:bg-orange-600 cursor-pointer"
                } font-medium`}
              >
                {vehicleImagePreview ? "Change Photo" : "Upload Photo"}
              </label>
              <p className="text-xs text-gray-500 text-center mt-2">
                JPG, PNG, or GIF. Max 5MB.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <GlassButton
            type="submit"
            disabled={isSaveDisabled}
            className={`md:w-1/2 my-2 w-full m-auto flex items-center justify-center space-x-2 py-3 rounded-md font-semibold text-lg transition-all duration-300 ease-in-out ${
              isSaveDisabled
                ? "!bg-orange-300 !text-white cursor-not-allowed opacity-70"
                : "!bg-orange-600 !text-white hover:!bg-orange-700 shadow-lg hover:shadow-xl"
            }`}
          >
            {isSaveDisabled ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span className="ml-2">
                  {isImageUploading
                    ? "Uploading Images..."
                    : "Saving Profile..."}
                </span>
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
