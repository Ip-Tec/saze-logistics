// components/vendor/settings/ContactInfoSection.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Loader2, SaveIcon, X } from "lucide-react";
import GlassDiv from "@/components/ui/GlassDiv"; // Assuming GlassDiv exists
import GlassButton from "@/components/ui/GlassButton"; // Assuming GlassButton exists
import Section from "@/components/reuse/Section"; // Assuming Section exists
import Input from "@/components/reuse/Input"; // Assuming Input exists
import DisplayInfo from "@/components/reuse/DisplayInfo"; // Assuming DisplayInfo exists
import { toast } from "react-toastify";

// Import necessary types
import { Database } from "@shared/supabase/types"; // Adjust path if necessary

type VendorProfileType = Database["public"]["Tables"]["profiles"]["Row"];
type UpdateVendorProfilePayload = Database["public"]["Tables"]["profiles"]["Update"];

interface ContactInfoSectionProps {
  profile: VendorProfileType;
  editing: boolean;
  updateProfile: (payload: UpdateVendorProfilePayload) => Promise<boolean>;
  isOverallLoading: boolean;
  isOverallUpdating: boolean;
}

export default function ContactInfoSection({
  profile,
  editing,
  updateProfile,
  isOverallLoading,
  isOverallUpdating,
}: ContactInfoSectionProps) {
  const [contact, setContact] = useState<string | null>(""); // Maps to phone in DB
  const [email, setEmail] = useState<string | null>(""); // Read-only display

   // Keep track of initial value
   const [initialContact, setInitialContact] = useState<string | null>("");


   // Internal saving state for this section
   const [isSaving, setIsSaving] = useState(false);
   const [saveError, setSaveError] = useState<string | null>(null);


  // Effect to initialize state from profile data
  useEffect(() => {
    if (profile) {
      setContact(profile.phone || null);
      setEmail(profile.email || null); // Email is typically not editable here
      setInitialContact(profile.phone || null);
        // Clear local error when profile data is re-synced
      setSaveError(null);
    }
  }, [profile]); // Re-run when profile data changes

   const handleSaveContact = async () => {
       setIsSaving(true);
       setSaveError(null);

       // Only include phone in the payload as email is read-only
       const payload: UpdateVendorProfilePayload = {
           phone: contact?.trim() || null,
       };

       try {
           const success = await updateProfile(payload); // Use the passed update function

           if (success) {
               toast.success("Contact info updated successfully!");
               // Update initial state to reflect saved changes
                setInitialContact(contact?.trim() || null);
           } else {
                // Error toast is likely handled by updateProfile function
               setSaveError("Failed to update contact info."); // Set local error
               toast.error("Failed to update contact info.");
           }
       } catch (error: any) {
           console.error("Error updating contact info:", error);
           setSaveError(error.message || "Failed to update contact info.");
           toast.error(error.message || "Failed to update contact info.");
       } finally {
           setIsSaving(false);
       }
   };

   const handleCancelContact = () => {
       // Revert local state to initial values
       setContact(initialContact);
       // Email state is always synced from profile, no need to revert
        // Clear any active saving state or errors for this section
       setIsSaving(false);
       setSaveError(null);
   };

   const isActionDisabled = isOverallLoading || isOverallUpdating || isSaving;
   // Check if there are any changes to save (only check phone/contact as email is read-only)
   const hasChanges = (contact?.trim() || null) !== (initialContact?.trim() || null);


  return (
    <GlassDiv className="w-full rounded-2xl overflow-hidden md:w-[48%] space-y-4">
      <Section title="Contact">
        {editing ? (
          <>
            {/* Email is read-only */}
            <Input
              label="Email Address"
              value={email || ""}
              onChange={setEmail} // Still need onChange for controlled input
              disabled={true} // Always disabled
              readOnly={true} // Visual indicator it's read-only
              inputClass="!text-black disabled:opacity-70"
            />
            {/* Phone is editable */}
            <Input
              label="Phone / Contact"
              value={contact || ""}
              onChange={setContact}
              disabled={isActionDisabled}
              inputClass="!text-black"
            />
          </>
        ) : (
          <DisplayInfo
            className="!text-black" // Apply text color
            classNameLabel="!text-black"
            classNameValue="!text-gray-600"
            items={[
              { label: "Email Address", value: email || "N/A" },
              { label: "Phone / Contact", value: contact || "N/A" },
            ]}
          />
        )}
      </Section>

       {/* Section specific buttons */}
        {editing && (
            <div className="w-full flex justify-end gap-3 px-4 pb-4">
                 <GlassButton
                     onClick={handleCancelContact}
                     className="text-sm flex items-center gap-1 bg-red-500 hover:bg-red-600"
                     disabled={isActionDisabled}
                 >
                     <X size={16} /> Cancel
                 </GlassButton>
                 <GlassButton
                     onClick={handleSaveContact}
                     className="text-sm flex items-center gap-1"
                     disabled={isActionDisabled || !hasChanges} // Disable if no changes
                 >
                     {isSaving ? (
                         <>
                             <Loader2 size={16} className="animate-spin" /> Saving...
                         </>
                     ) : (
                         <>
                             <SaveIcon size={16} /> Save Contact
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
