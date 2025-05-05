// apps/web/components/auth/RiderSettingsPage.tsx
"use client";

import Input from "@/components/reuse/Input";
import GlassDiv from "@/components/ui/GlassDiv";
import Section from "@/components/reuse/Section";
import React, { useEffect, useState } from "react";
import useImageUpload from "@/hooks/useImageUpload";
import GlassButton from "@/components/ui/GlassButton";
import { useAuthContext } from "@/context/AuthContext";
import { toast, ToastContainer } from "react-toastify";
import DisplayInfo from "@/components/reuse/DisplayInfo";
import ChangePassword from "@/components/auth/ChangePassword";
import { Loader2, PencilIcon, SaveIcon, X } from "lucide-react";

// Import the RiderProfile type from your shared types file
import { RiderProfile } from "@shared/types"; // Adjust the import path as needed
import router from "next/router";

// Define a type for the expected data structure from getUserProfile for this page
// This should align with RiderProfile, but can be Partial if not all fields are guaranteed on fetch
type ProfileDataForRiderSettings = Partial<RiderProfile>;

export default function RiderSettingsPage() {
  const [editing, setEditing] = useState(false);

  // State for profile fields, typed appropriately
  const [name, setName] = useState("");
  const [nin, setNin] = useState('');
  const [vehicleType, setVehicleType] = useState<
    RiderProfile["vehicleType"] | ""
  >(""); // Use union type or empty string
  const [licensePlate, setLicensePlate] = useState("");
  const [contact, setContact] = useState(""); // Maps to RiderProfile.phone
  const [altContact, setAltContact] = useState(""); // Maps to RiderProfile.second_phone
  const [email, setEmail] = useState(""); // Email is often read-only, from BaseUser/RiderProfile

  const [isSaving, setIsSaving] = useState(false);
  // Store initial profile data using the ProfileDataForRiderSettings type
  const [initialProfileData, setInitialProfileData] =
    useState<ProfileDataForRiderSettings>({});

  // Image states (handling uploads will require more complex logic)
  const [riderImage, setRiderImage] = useState<File | null>(null);
  const [vehicleImage, setVehicleImage] = useState<File | null>(null);
  const [riderImageURL, setRiderImageURL] = useState<string | null>(null); // For local preview (URL.createObjectURL)
  const [vehicleImageURL, setVehicleImageURL] = useState<string | null>(null); // For local preview

  const { user, getUserProfile } = useAuthContext(); // Get user (typed as AppUser | null) and profile fetching function

  // Use the custom image upload hook
  // You can specify a different endpoint if needed, e.g., useImageUpload('/api/my-custom-upload')
  // Corrected: Added setUploadError to the destructuring
  const {
    uploadImage,
    isUploading: isImageUploading,
    uploadError,
    setUploadError,
  } = useImageUpload();

  // --- Data Fetching ---
  // Fetch rider profile data when the component mounts or user changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        // Check if user is logged in (user is AppUser | null here)
        try {
          // Fetch the profile. getUserProfile returns AppUser | null
          const profile = await getUserProfile();

          // --- Type Narrowing ---
          // Check if profile is not null AND if it's specifically a RiderProfile
          if (profile && profile.role === "rider") {
            // Inside this block, TypeScript knows 'profile' is of type RiderProfile
            // Now you can safely access RiderProfile specific properties
            setName(profile.name || "");
            setVehicleType(profile.vehicleType || "");
            setLicensePlate(profile.licensePlate || "");
            setContact(profile.phone || ""); // Map 'phone' from profile to 'contact' state
            setAltContact(profile.second_phone || ""); // Map 'second_phone'
            setEmail(profile.email || ""); // Email from profile

            // Store initial data for cancel functionality
            setInitialProfileData({
              nin: profile.nin || "",
              name: profile.name || "",
              vehicleType: profile.vehicleType || "",
              licensePlate: profile.licensePlate || "",
              phone: profile.phone || "",
              second_phone: profile.second_phone || "",
              email: profile.email || "",
              rider_image_url: profile.rider_image_url || undefined,
              vehicle_image_url: profile.vehicle_image_url || undefined,
            });

            // Set initial image previews from fetched URLs
            setRiderImageURL(profile.rider_image_url || null);
            setVehicleImageURL(profile.vehicle_image_url || null);
          } else if (
            profile &&
            (profile.role as "rider" | "user" | "vendor" | "admin") !== "rider"
          ) {
            // Handle case where user is logged in but is NOT a rider
            console.warn(
              `User with role ${profile.role} accessed Rider Settings page.`
            );
            toast.error("You do not have permission to view this page.");
            // Optional: Redirect non-riders, e.g.,
            router.push(profile.role);
          } else {
            // Handle case where getUserProfile returned null (e.g., session expired during fetch)
            console.error("Failed to fetch profile data for logged-in user.");
            toast.error("Failed to load profile data.");
            // Optional: Redirect to login, e.g., router.push('/auth/login');
          }
        } catch (error) {
          console.error("Failed to fetch rider profile:", error);
          toast.error("Failed to load profile data.");
        }
      } else {
        // Handle case where user is null (not logged in)
        console.log(
          "No user logged in, cannot fetch profile for settings page."
        );
        // Optional: Redirect to login, e.g., router.push('/auth/login');
      }
    };
    fetchProfile();
    // Cleanup function for useEffect to revoke object URLs
    return () => {
      if (riderImageURL) URL.revokeObjectURL(riderImageURL);
      if (vehicleImageURL) URL.revokeObjectURL(vehicleImageURL);
    };
  }, [user, getUserProfile]); // Refetch if user or getUserProfile changes
  // --- Image Handling ---
  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File | null>>,
    previewSetter: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Revoke previous object URL if it exists to prevent memory leaks
      if (previewSetter === setRiderImageURL && riderImageURL) {
        URL.revokeObjectURL(riderImageURL);
      }
      if (previewSetter === setVehicleImageURL && vehicleImageURL) {
        URL.revokeObjectURL(vehicleImageURL);
      }

      setter(file);
      previewSetter(URL.createObjectURL(file)); // Create a local URL for preview
    } else {
      // If user cancels file selection, clear the state and preview
      if (previewSetter === setRiderImageURL && riderImageURL) {
        URL.revokeObjectURL(riderImageURL);
      }
      if (previewSetter === setVehicleImageURL && vehicleImageURL) {
        URL.revokeObjectURL(vehicleImageURL);
      }
      setter(null);
      previewSetter(null);
    }
  };

  // Clean up object URLs when component unmounts or image URLs change
  // Note: This useEffect is combined with the data fetching one above for simplicity
  useEffect(() => {
    return () => {
      if (riderImageURL) URL.revokeObjectURL(riderImageURL);
      if (vehicleImageURL) URL.revokeObjectURL(vehicleImageURL);
    };
  }, [riderImageURL, vehicleImageURL]);

  // --- Update/Save Logic ---
  const handleSave = async () => {
    setIsSaving(true);
    setUploadError(null); // Clear previous upload errors

    let uploadedRiderImageUrl: string | undefined =
      initialProfileData.rider_image_url;
    let uploadedVehicleImageUrl: string | undefined =
      initialProfileData.vehicle_image_url;
    let uploadFailed = false;

    // --- Handle Image Uploads First ---
    if (riderImage) {
      const result = await uploadImage(riderImage, "rider_image");
      if (result) {
        uploadedRiderImageUrl = result.url;
      } else {
        // Handle upload error - the hook already sets uploadError state
        uploadFailed = true;
        toast.error("Failed to upload rider image.");
      }
    }

    if (!uploadFailed && vehicleImage) {
      const result = await uploadImage(vehicleImage, "vehicle_image");
      if (result) {
        uploadedVehicleImageUrl = result.url;
      } else {
        // Handle upload error
        uploadFailed = true;
        toast.error("Failed to upload vehicle image.");
      }
    }

    // Stop if any image upload failed
    if (uploadFailed) {
      setIsSaving(false);
      return;
    }

    // Prepare data to send to the API (text fields + new image URLs)
    // Use Partial<RiderProfile> as not all fields might be updated
    const profileDataToUpdate: Partial<RiderProfile> = {
      name,
      nin,
      // Cast vehicleType state to the union type for the API
      vehicleType: vehicleType as RiderProfile["vehicleType"],
      licensePlate,
      phone: contact, // Mapping 'contact' state back to 'phone' column
      second_phone: altContact, // Mapping 'altContact' state back to 'second_phone' column
      // Include the new image URLs if they were uploaded
      rider_image_url: uploadedRiderImageUrl,
      vehicle_image_url: uploadedVehicleImageUrl,
      // Email is typically not updated via profile table
      // email: email // Uncomment if you allow email updates this way and your RLS permits
    };

    // Remove undefined or empty string values if you don't want to send them
    // This helps avoid sending empty strings if a field wasn't touched
    Object.keys(profileDataToUpdate).forEach((key) => {
      const value = (profileDataToUpdate as any)[key];
      // Keep image URLs even if they are null/undefined if that's how your backend handles clearing images
      // If your backend expects undefined to mean "no change" and null to mean "clear", adjust this logic.
      // For now, we'll send null/undefined for images if they weren't updated or were cleared.
      if (
        key !== "rider_image_url" &&
        key !== "vehicle_image_url" &&
        (value === "" || value === undefined)
      ) {
        delete (profileDataToUpdate as any)[key];
      }
      // Optionally, if you want to explicitly send null to clear an image, you can add logic here
      // For example: if (key === 'rider_image_url' && riderImage === null && initialProfileData.rider_image_url) { profileDataToUpdate.rider_image_url = null; }
    });

    // --- Send Profile Data Update ---
    try {
      const response = await fetch("/api/rider-profile", {
        // Ensure this matches your API route file name
        method: "POST", // Or PUT/PATCH depending on your API design
        headers: {
          "Content-Type": "application/json", // Sending JSON data
          // Browser automatically includes cookies for same-origin requests
        },
        body: JSON.stringify(profileDataToUpdate),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || "Profile updated successfully!");
        setEditing(false); // Exit editing mode on success
        // Update initial data state to reflect saved changes, including new image URLs
        setInitialProfileData((prevData) => ({
          ...prevData,
          ...profileDataToUpdate,
        }));
        // Clear the selected files after successful save
        setRiderImage(null);
        setVehicleImage(null);
      } else {
        console.error("Failed to update profile:", result.error);
        toast.error(result.error || "Failed to update profile.");
      }
    } catch (error) {
      console.error("Error during profile update API call:", error);
      toast.error("An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Revoke current object URLs before reverting
    if (riderImageURL && riderImage) URL.revokeObjectURL(riderImageURL);
    if (vehicleImageURL && vehicleImage) URL.revokeObjectURL(vehicleImageURL);

    // Revert state to initial data
    setName(initialProfileData.name || "");
    setVehicleType(initialProfileData.vehicleType || "");
    setLicensePlate(initialProfileData.licensePlate || "");
    setContact(initialProfileData.phone || "");
    setAltContact(initialProfileData.second_phone || "");
    setEmail(initialProfileData.email || ""); // Email is likely read-only anyway
    setNin(initialProfileData.nin || '');

    // Revert image previews to initial URLs
    setRiderImageURL(initialProfileData.rider_image_url || null);
    setVehicleImageURL(initialProfileData.vehicle_image_url || null);
    setRiderImage(null); // Clear selected files
    setVehicleImage(null); // Clear selected files

    setEditing(false); // Exit editing mode
    setUploadError(null); // Clear any upload errors
  };

  // Determine if the save button should be disabled
  const isSaveDisabled = isSaving || isImageUploading;

  // --- Render ---
  return (
    <div className="p-6 w-full flex flex-wrap gap-6 justify-start items-start overflow-y-scroll glass-scrollbar text-gray-800">
      <ToastContainer />
      <div className="w-full flex justify-between items-center">
        <h1 className="text-2xl font-bold">Rider Settings</h1>
        <div className="flex gap-3">
          {editing && (
            <GlassButton
              onClick={handleCancel}
              className="text-sm flex items-center gap-1 !bg-red-500 hover:!bg-red-600 hover:!text-white"
              disabled={isSaveDisabled} // Disable cancel while saving/uploading
            >
              <X size={16} />
              Cancel
            </GlassButton>
          )}
          <GlassButton
            onClick={editing ? handleSave : () => setEditing(true)} // Call handleSave when editing
            className="text-sm flex items-center gap-1 !bg-orange-500 hover:!bg-white hover:!border-orange-500 hover:!border-2"
            disabled={isSaveDisabled} // Disable save while saving or uploading images
          >
            {isSaveDisabled ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {isImageUploading ? "Uploading..." : "Saving..."}
              </>
            ) : editing ? (
              <>
                <SaveIcon size={16} />
                Save
              </>
            ) : (
              <>
                <PencilIcon size={16} />
                Edit
              </>
            )}
          </GlassButton>
        </div>
      </div>

      {/* Display upload error if any */}
      {uploadError && (
        <div className="w-full text-red-600 text-sm mt-2">
          Error: {uploadError}
        </div>
      )}

      <GlassDiv className="w-full rounded-2xl overflow-hidden md:w-[48%] space-y-4">
        <Section title="Personal Information">
          {editing ? (
            <>
              <Input
                label="Full Name"
                value={name}
                onChange={setName}
                disabled={isSaveDisabled} // Disable while saving/uploading
                inputClass="!text-black"
              />
              <Input
                label="National ID Number"
                value={nin}
                onChange={setNin}
                disabled={isSaveDisabled}
                inputClass="!text-black"
              />
              {/* Use a select input for vehicle type to enforce union type */}
              <label className="block">
                <span className="text-gray-700">Vehicle Type</span>
                <select
                  value={vehicleType}
                  onChange={(e) =>
                    setVehicleType(
                      e.target.value as RiderProfile["vehicleType"] | ""
                    )
                  } // Cast value
                  disabled={isSaveDisabled} // Disable while saving/uploading
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-400"
                >
                  <option value="">Select Vehicle Type</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="car">Car</option>
                </select>
              </label>

              <Input
                label="License Plate"
                value={licensePlate}
                onChange={setLicensePlate}
                disabled={isSaveDisabled} // Disable while saving/uploading
                inputClass="!text-black"
              />

              <div className="space-y-2">
                <label className="block font-medium text-gray-700">
                  Rider Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleImageChange(e, setRiderImage, setRiderImageURL)
                  }
                  disabled={isSaveDisabled} // Disable file input while saving/uploading
                />
                {/* Display current image or new preview */}
                {(riderImageURL || initialProfileData.rider_image_url) && (
                  <img
                    src={
                      riderImageURL || initialProfileData.rider_image_url || ""
                    } // Use preview URL or initial URL
                    alt="Rider"
                    className="w-24 h-24 object-cover rounded-full border"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="block font-medium text-gray-700">
                  Vehicle Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleImageChange(e, setVehicleImage, setVehicleImageURL)
                  }
                  disabled={isSaveDisabled} // Disable file input while saving/uploading
                />
                {/* Display current image or new preview */}
                {(vehicleImageURL || initialProfileData.vehicle_image_url) && (
                  <img
                    src={
                      vehicleImageURL ||
                      initialProfileData.vehicle_image_url ||
                      ""
                    } // Use preview URL or initial URL
                    alt="Vehicle"
                    className="w-32 h-24 object-cover rounded border"
                  />
                )}
              </div>
            </>
          ) : (
            <DisplayInfo
              className="!text-black"
              classNameLabel="!text-black"
              classNameValue="!text-gray-400"
              items={[
                { label: "Full Name", value: name },
                { label: "Vehicle Type", value: vehicleType },
                { label: "License Plate", value: licensePlate },
              ]}
            >
              {/* Display images when not editing */}
              <div className="flex gap-4 mt-4">
                {(riderImageURL || initialProfileData.rider_image_url) && (
                  <div>
                    <p className="text-sm text-gray-700 font-medium">
                      Rider Photo
                    </p>
                    <img
                      src={
                        riderImageURL ||
                        initialProfileData.rider_image_url ||
                        ""
                      }
                      alt="Rider"
                      className="w-24 h-24 object-cover rounded-full border"
                    />
                  </div>
                )}
                {(vehicleImageURL || initialProfileData.vehicle_image_url) && (
                  <div>
                    <p className="text-sm text-gray-700 font-medium">
                      Vehicle Photo
                    </p>
                    <img
                      src={
                        vehicleImageURL ||
                        initialProfileData.vehicle_image_url ||
                        ""
                      }
                      alt="Vehicle"
                      className="w-32 h-24 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
            </DisplayInfo>
          )}
        </Section>
      </GlassDiv>

      <GlassDiv className="w-full rounded-2xl overflow-hidden md:w-[48%] space-y-4">
        <Section title="Contact">
          {editing ? (
            <>
              <Input
                divClass="!text-black"
                label="Phone / Contact"
                value={contact}
                onChange={setContact}
                disabled={isSaveDisabled} // Disable while saving/uploading
                inputClass="!text-black"
              />
              <Input
                label="Alternate Contact"
                value={altContact}
                onChange={setAltContact}
                disabled={isSaveDisabled} // Disable while saving/uploading
                inputClass="!text-black"
              />
              {/* Email is often read-only, but include if editable */}
              <Input
                label="Email Address"
                value={email}
                onChange={setEmail}
                disabled={true} // Email often read-only
                inputClass="!text-black"
              />{" "}
            </>
          ) : (
            <DisplayInfo
              className="!text-black"
              classNameLabel="!text-black"
              classNameValue="!text-gray-400"
              items={[
                { label: "Phone / Contact", value: contact },
                { label: "Alternate Contact", value: altContact },
                { label: "Email Address", value: email },
                { label: "NIN", value: initialProfileData.nin ?? "———" }
              ]}
            />
          )}
        </Section>
      </GlassDiv>

      {/* Change Password Component */}
      {/* Ensure ChangePassword component is correctly implemented and imported */}

      {!editing && (
        <ChangePassword
          className="!text-black"
          buttonStyle=" !bg-orange-500 hover:!bg-orange-100 hover:!text-orange-500"
        />
      )}
    </div>
  );
}
