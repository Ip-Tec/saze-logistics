// components/vendor/settings/BusinessInfoSection.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Loader2, SaveIcon, X } from "lucide-react";
import GlassDiv from "@/components/ui/GlassDiv"; // Assuming GlassDiv exists
import GlassButton from "@/components/ui/GlassButton"; // Assuming GlassButton exists
import Section from "@/components/reuse/Section"; // Assuming Section exists
import Input from "@/components/reuse/Input"; // Assuming Input exists
import TextArea from "@/components/reuse/TextArea"; // Assuming TextArea exists
import DisplayInfo from "@/components/reuse/DisplayInfo"; // Assuming DisplayInfo exists
import { toast } from "react-toastify";

// Import necessary types
import { Database } from "@shared/supabase/types"; // Adjust path if necessary

type VendorProfileType = Database["public"]["Tables"]["profiles"]["Row"];
type UpdateVendorProfilePayload = Database["public"]["Tables"]["profiles"]["Update"];

interface BusinessInfoSectionProps {
  profile: VendorProfileType;
  editing: boolean;
  updateProfile: (payload: UpdateVendorProfilePayload) => Promise<boolean>;
  isOverallLoading: boolean;
  isOverallUpdating: boolean;
}

export default function BusinessInfoSection({
  profile,
  editing,
  updateProfile,
  isOverallLoading,
  isOverallUpdating,
}: BusinessInfoSectionProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState<string | null>("");

   // Keep track of initial values
   const [initialName, setInitialName] = useState("");
   const [initialDescription, setInitialDescription] = useState<string | null>("");

   // Internal saving state for this section
   const [isSaving, setIsSaving] = useState(false);
   const [saveError, setSaveError] = useState<string | null>(null);


  // Effect to initialize state from profile data
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setDescription(profile.description || null);
      setInitialName(profile.name || "");
      setInitialDescription(profile.description || null);
       // Clear local error when profile data is re-synced
       setSaveError(null);
    }
  }, [profile]); // Re-run when profile data changes

   const handleSaveInfo = async () => {
       setIsSaving(true);
       setSaveError(null);

       const payload: UpdateVendorProfilePayload = {
           name: name.trim(),
           description: description?.trim() || null,
       };

       try {
           const success = await updateProfile(payload); // Use the passed update function

           if (success) {
               toast.success("Business info updated successfully!");
                // Update initial state to reflect saved changes
               setInitialName(name.trim());
               setInitialDescription(description?.trim() || null);
           } else {
                // Error toast is likely handled by updateProfile function
               setSaveError("Failed to update business info."); // Set local error
               toast.error("Failed to update business info.");
           }
       } catch (error: any) {
           console.error("Error updating business info:", error);
           setSaveError(error.message || "Failed to update business info.");
           toast.error(error.message || "Failed to update business info.");
       } finally {
           setIsSaving(false);
       }
   };

   const handleCancelInfo = () => {
       // Revert local state to initial values
       setName(initialName);
       setDescription(initialDescription);
        // Clear any active saving state or errors for this section
       setIsSaving(false);
       setSaveError(null);
   };

   const isActionDisabled = isOverallLoading || isOverallUpdating || isSaving;
    // Check if there are any changes to save
    const hasChanges = name.trim() !== initialName.trim() ||
                        (description?.trim() || null) !== (initialDescription?.trim() || null);


  return (
    <GlassDiv className="w-full rounded-2xl overflow-hidden md:w-[48%] space-y-4">
      <Section title="Business Information">
        {editing ? (
          <>
            <Input
              label="Business Name"
              value={name || ""}
              onChange={setName}
              disabled={isActionDisabled}
              inputClass="!text-black"
            />
            <TextArea
              label="Description"
              value={description || ""}
              onChange={setDescription}
              disabled={isActionDisabled}
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

       {/* Section specific buttons */}
        {editing && (
            <div className="w-full flex justify-end gap-3 px-4 pb-4">
                 <GlassButton
                     onClick={handleCancelInfo}
                     className="text-sm flex items-center gap-1 bg-red-500 hover:bg-red-600"
                     disabled={isActionDisabled}
                 >
                     <X size={16} /> Cancel
                 </GlassButton>
                 <GlassButton
                     onClick={handleSaveInfo}
                     className="text-sm flex items-center gap-1"
                     disabled={isActionDisabled || !hasChanges} // Disable if no changes
                 >
                     {isSaving ? (
                         <>
                             <Loader2 size={16} className="animate-spin" /> Saving...
                         </>
                     ) : (
                         <>
                             <SaveIcon size={16} /> Save Info
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
