// components/vendor/settings/ContactInfoSection.tsx
"use client";

import { toast } from "react-toastify";
import Input from "@/components/reuse/Input";
import GlassDiv from "@/components/ui/GlassDiv";
import Section from "@/components/reuse/Section";
import React, { useState, useEffect } from "react";
import { Loader2, SaveIcon, X } from "lucide-react";
import GlassButton from "@/components/ui/GlassButton";
import DisplayInfo from "@/components/reuse/DisplayInfo";

// Import necessary types
// ASSUMING types have been updated to include phone_2 in profiles table
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
  // State for the first contact number (maps to phone in DB)
  const [contact, setContact] = useState<string | null>("");
  // State for the second contact number (maps to phone_2 in DB - assuming column name)
  const [contact2, setContact2] = useState<string | null>("");
  // Email is read-only display
  const [email, setEmail] = useState<string | null>("");

  // Keep track of initial values for comparison and cancel
  const [initialContact, setInitialContact] = useState<string | null>("");
  const [initialContact2, setInitialContact2] = useState<string | null>("");

  // Internal saving state for this section
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Effect to initialize state from profile data
  useEffect(() => {
    if (profile) {
      setContact(profile.phone || null);
      setContact2(profile.second_phone || null); // Initialize state from profile.phone_2 (assuming column name)
      setEmail(profile.email || null);

      setInitialContact(profile.phone || null);
      setInitialContact2(profile.second_phone || null); // Initialize initial state from profile.phone_2

      // Clear local error when profile data is re-synced
      setSaveError(null);
    }
  }, [profile]); // Re-run when profile data changes

  const handleSaveContact = async () => {
    setIsSaving(true);
    setSaveError(null);

    // Only include phone and phone_2 in the payload. Email is read-only.
    // Pass undefined if the field is empty to potentially null out the DB value
    const payload: UpdateVendorProfilePayload = {
      phone: contact?.trim() || undefined,
      second_phone: contact2?.trim() || undefined, // Include the second number in the payload
    };

    try {
      const success = await updateProfile(payload); // Use the passed update function

      if (success) {
        toast.success("Contact info updated successfully!");
        // Update initial state to reflect saved changes
        setInitialContact(contact?.trim() || null);
        setInitialContact2(contact2?.trim() || null); // Update initialContact2 after save
      } else {
        // Error toast is likely handled by updateProfile function in context
        setSaveError("Failed to update contact info."); // Set local error
        // A more specific error might be available from updateProfile if it returns it
        toast.error("Failed to update contact info."); // Ensure a toast appears
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
    // Revert local state to initial values for both numbers
    setContact(initialContact);
    setContact2(initialContact2);
    // Email state is always synced from profile, no need to revert

    // Clear any active saving state or errors for this section
    setIsSaving(false);
    setSaveError(null);
  };

  const isActionDisabled = isOverallLoading || isOverallUpdating || isSaving;

  // Check if there are any changes to save (check both phone fields)
  const hasChanges =
    (contact?.trim() || null) !== (initialContact?.trim() || null) ||
    (contact2?.trim() || null) !== (initialContact2?.trim() || null);


  return (
    <GlassDiv className="w-full rounded-2xl overflow-hidden md:w-[48%] space-y-4">
      <Section title="Contact" className="!text-black">
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
            {/* First Phone is editable */}
            <Input
              label="Phone / Contact (1)" // Added (1) for clarity
              value={contact || ""}
              onChange={setContact}
              disabled={isActionDisabled}
              inputClass="!text-black"
            />
            {/* Second Phone is editable */}
            <Input
              label="Phone / Contact (2)"
              value={contact2 || ""} // Bind to the new contact2 state
              onChange={setContact2} // Bind to the new setContact2 setter
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
              { label: "Phone / Contact (1)", value: contact || "N/A" }, // Display first number
              { label: "Phone / Contact (2)", value: contact2 || "N/A" }, // Display second number
            ]}
          />
        )}
      </Section>

      {/* Section specific buttons */}
      {editing && (
        <div className="w-full flex justify-end gap-3 px-4 pb-4">
          <GlassButton
            onClick={handleCancelContact}
            className="text-sm flex items-center gap-1 !bg-red-500 hover:!bg-red-600"
            disabled={isActionDisabled}
          >
            <X size={16} /> Cancel
          </GlassButton>
          <GlassButton
            onClick={handleSaveContact}
            className="text-sm flex items-center gap-1 !text-black hover:text-orange-500"
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