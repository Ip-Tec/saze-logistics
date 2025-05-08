// components/vendor/settings/AddressSection.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Loader2, SaveIcon, X } from "lucide-react";
import GlassDiv from "@/components/ui/GlassDiv";
import GlassButton from "@/components/ui/GlassButton";
import Section from "@/components/reuse/Section";
import Input from "@/components/reuse/Input";
import DisplayInfo from "@/components/reuse/DisplayInfo";
import { toast } from "react-toastify";

// Import necessary types
import { Database } from "@shared/supabase/types";

type VendorProfileType = Database["public"]["Tables"]["profiles"]["Row"];
type UpdateVendorProfilePayload = Database["public"]["Tables"]["profiles"]["Update"];

interface AddressSectionProps {
  profile: VendorProfileType;
  editing: boolean;
  updateProfile: (payload: UpdateVendorProfilePayload) => Promise<boolean>;
  isOverallLoading: boolean;
  isOverallUpdating: boolean;
}

export default function AddressSection({
  profile,
  editing,
  updateProfile,
  isOverallLoading,
  isOverallUpdating,
}: AddressSectionProps) {
  const [address, setAddress] = useState<string | null>("");

   // Keep track of initial value
   const [initialAddress, setInitialAddress] = useState<string | null>("");

   // Internal saving state for this section
   const [isSaving, setIsSaving] = useState(false);
   const [saveError, setSaveError] = useState<string | null>(null);


  // Effect to initialize state from profile data
  useEffect(() => {
    if (profile) {
      setAddress(profile.address || null);
      setInitialAddress(profile.address || null);
        // Clear local error when profile data is re-synced
      setSaveError(null);
    }
  }, [profile]); // Re-run when profile data changes

   const handleSaveAddress = async () => {
       setIsSaving(true);
       setSaveError(null);

       const payload: UpdateVendorProfilePayload = {
           address: address?.trim() || null,
       };

       try {
           const success = await updateProfile(payload); // Use the passed update function

           if (success) {
               toast.success("Address updated successfully!");
               // Update initial state to reflect saved changes
                setInitialAddress(address?.trim() || null);
           } else {
                // Error toast is likely handled by updateProfile function
               setSaveError("Failed to update address."); // Set local error
               toast.error("Failed to update address.");
           }
       } catch (error: any) {
           console.error("Error updating address:", error);
           setSaveError(error.message || "Failed to update address.");
           toast.error(error.message || "Failed to update address.");
       } finally {
           setIsSaving(false);
       }
   };

   const handleCancelAddress = () => {
       // Revert local state to initial values
       setAddress(initialAddress);
        // Clear any active saving state or errors for this section
       setIsSaving(false);
       setSaveError(null);
   };

   const isActionDisabled = isOverallLoading || isOverallUpdating || isSaving;
    // Check if there are any changes to save
   const hasChanges = (address?.trim() || null) !== (initialAddress?.trim() || null);


  return (
    <GlassDiv className="w-full rounded-2xl overflow-hidden md:w-[48%] space-y-4">
      <Section title="Address" className="!text-black">
        {editing ? (
          <Input
            label="Business Address"
            value={address || ""}
            onChange={setAddress}
            disabled={isActionDisabled}
            inputClass="!text-black placeholder:!text-gray-600"
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

        {/* Section specific buttons */}
        {editing && (
            <div className="w-full flex justify-end gap-3 px-4 pb-4">
                 <GlassButton
                     onClick={handleCancelAddress}
                     className="text-sm flex items-center gap-1 !bg-red-500 hover:!bg-red-600"
                     disabled={isActionDisabled}
                 >
                     <X size={16} /> Cancel
                 </GlassButton>
                 <GlassButton
                     onClick={handleSaveAddress}
                     className="text-sm flex items-center gap-1 !text-black hover:text-orange-500"
                     disabled={isActionDisabled || !hasChanges} // Disable if no changes
                 >
                     {isSaving ? (
                         <>
                             <Loader2 size={16} className="animate-spin" /> Saving...
                         </>
                     ) : (
                         <>
                             <SaveIcon size={16} /> Save Address
                         </>
                     )}
                 </GlassButton>
            </div>
        )}
         {/* Display Section Error */}
        {saveError && (
             <div className="w-full text-red-600 text-sm px-4 pb-4">
                Error: {saveError}
             </div>
        )}
    </GlassDiv>
  );
}
