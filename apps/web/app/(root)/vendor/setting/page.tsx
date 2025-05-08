// apps/web/app/(root)/vendor/setting/page.tsx
"use client";

import { toast } from "react-toastify";
import React, { useState, useEffect } from "react";

import { useVendor } from "@/context/VendorContext";

import { PencilIcon, Loader2, X } from "lucide-react";
import GlassButton from "@/components/ui/GlassButton";
import ChangePassword from "@/components/auth/ChangePassword";

// Import the new section components
import ProfileImageSection from "@/components/vendor/settings/ProfileImageSection";
import BusinessInfoSection from "@/components/vendor/settings/BusinessInfoSection";
import AddressSection from "@/components/vendor/settings/AddressSection";
import ContactInfoSection from "@/components/vendor/settings/ContactInfoSection";

// Import Database types (still needed for profile type)
import { Database } from "@shared/supabase/types"; // Adjust path if necessary
type VendorProfileType = Database["public"]["Tables"]["profiles"]["Row"];
type UpdateVendorProfilePayload =
  Database["public"]["Tables"]["profiles"]["Update"];

export default function VendorSettingsPage() {
  // Keep global editing state
  const [editing, setEditing] = useState(false);

  // Consume the vendor context for initial profile fetch and update function
  const {
    vendorProfile: fetchedProfile,
    isLoading: isLoadingProfile,
    fetchError,
    updateVendorProfile, // This function will be passed down
    isUpdatingProfile, // Keep for overall saving feedback if needed, or rely on section states
    updateProfileError, // Keep for overall error feedback if needed
    setUpdateProfileError, // Keep to clear global error
  } = useVendor();

  // Effect to clear global update error when profile is re-synced or editing starts/stops
  useEffect(() => {
    setUpdateProfileError(null);
  }, [fetchedProfile, editing, setUpdateProfileError]);
  console.log({ isLoadingProfile, fetchedProfile, fetchError });
  // Show loading state for initial profile fetch from context
  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-800">
        <Loader2 size={32} className="animate-spin text-orange-500" />
        <p className="ml-2 text-gray-700">Loading vendor profile...</p>
      </div>
    );
  }

  // Show error state for initial profile fetch from context
  if (fetchError) {
    return (
      <div className="text-red-600 text-center mt-8">
        <p>Failed to load vendor profile.</p>
        <p>{fetchError.message}</p> {/* Display fetch error message */}
      </div>
    );
  }

  // If no profile data is fetched and not loading/error, might indicate user is not a vendor or not logged in
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

  // Passed down function for sections to update the profile
  // This wrapper ensures the parent state/context's update function is used
  const handleSectionUpdate = async (
    payload: UpdateVendorProfilePayload
  ): Promise<boolean> => {
    // Optionally set a global updating state here if needed, but section states handle it
    // setIsUpdatingProfile(true); // Assuming context provides this setter
    const success = await updateVendorProfile(payload);
    // Optionally reset global updating state
    // setIsUpdatingProfile(false);
    return success;
  };

  return (
    <div className="p-6 flex flex-col gap-6 text-white w-full h-full overflow-y-auto glass-scrollbar">
      {" "}
      {/* Changed flex-wrap to flex-col */}
      <div className="w-full flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Vendor Settings</h1>{" "}
        {/* Adjust text color */}
        {/* ToastContainer is typically handled in the root layout */}
        <div className="flex gap-3">
          {/* Keep the single Edit/Cancel button for the page */}
          {editing ? (
            <GlassButton
              onClick={() => setEditing(false)} // Simply exit editing mode
              className="text-sm flex items-center gap-1 !bg-red-500 hover:!bg-red-600"
              // Disable only if any section is currently saving/uploading or overall loading
              disabled={isUpdatingProfile || isLoadingProfile} // Rely on overall states or pass child states up if needed
            >
              <X size={16} /> Done Editing {/* Changed from Cancel */}
            </GlassButton>
          ) : (
            <GlassButton
              onClick={() => setEditing(true)}
              className="text-sm flex items-center gap-1 !bg-orange-500 hover:!bg-orange-200"
              disabled={isLoadingProfile} // Disable while initial profile is loading
            >
              <PencilIcon size={16} /> Edit Profile
            </GlassButton>
          )}
        </div>
      </div>

      {/* Display global update error from context */}
      {updateProfileError && (
        <div className="w-full text-red-600 text-sm mt-2">
          Profile Update Error: {updateProfileError.message}
        </div>
      )}

      {/* Render Section Components */}
      <ProfileImageSection
        profile={fetchedProfile}
        editing={editing}
        updateProfile={handleSectionUpdate} // Pass the update handler
        isOverallLoading={isLoadingProfile}
        isOverallUpdating={isUpdatingProfile}
      />
      {/* Use flex-wrap or grid within a container if you want them side-by-side */}
      <div className="flex flex-wrap gap-6">
        <BusinessInfoSection
          profile={fetchedProfile}
          editing={editing}
          updateProfile={handleSectionUpdate}
          isOverallLoading={isLoadingProfile}
          isOverallUpdating={isUpdatingProfile}
        />
        <AddressSection
          profile={fetchedProfile}
          editing={editing}
          updateProfile={handleSectionUpdate}
          isOverallLoading={isLoadingProfile}
          isOverallUpdating={isUpdatingProfile}
        />
        <ContactInfoSection
          profile={fetchedProfile}
          editing={editing}
          updateProfile={handleSectionUpdate}
          isOverallLoading={isLoadingProfile}
          isOverallUpdating={isUpdatingProfile}
        />
      </div>
      {/* Change Password Section (remains separate) */}
      {/* It should manage its own state and use the auth context for password changes */}
      {!editing && <ChangePassword className="mt-6 !text-gray-600" buttonStyle="!bg-orange-500 hover:!bg-orange-700 hover:!text-white" />} {/* Add margin top */}
    </div>
  );
}
