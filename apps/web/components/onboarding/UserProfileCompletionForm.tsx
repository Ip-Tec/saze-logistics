// components/onboarding/UserProfileCompletionForm.tsx
"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import GlassDiv from "@/components/ui/GlassDiv";
import { supabase } from "@shared/supabaseClient";
import { Database } from "@shared/supabase/types";
import { useAuthContext } from "@/context/AuthContext";
import { toast, ToastContainer } from "react-toastify";

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
interface UserProfileCompletionFormProps {
  metadata: MetaDataProps;
}

export default function UserProfileCompletionForm({
  metadata,
}: UserProfileCompletionFormProps) {
  const { user, getUserProfile } = useAuthContext();
  const router = useRouter();
  console.log("metadata", { metadata });

  const [address, setAddress] = useState("");
  const [secondPhone, setSecondPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ user });
    // if (!user) {
    //   toast.error("User not logged in.");
    //   return;
    // }
    // Ensure all non-nullable fields from profiles table are included,
    // even if they are null or default values.
    const profileData: ProfileInsert = {
      id: metadata.sub,
      role: "user",
      name: metadata.name,
      email: metadata.email,
      phone: metadata.phone || user?.phoneNumber || "",
      address: address.trim() || null,
      second_phone: secondPhone.trim() || null,
      banner_url: null,
      created_at: new Date().toISOString(),
      description: null,
      licensePlate: null,
      logo_url: null,
      rider_image_url: null,
      vehicle_image_url: null,
      vehicleType: null,
    };

    try {
      // Try inserting first. If it conflicts, the profile already exists, so update.
      const { error: insertError } = await supabase
        .from("profiles")
        .insert([profileData]);

      if (insertError && insertError.code === "23505") {
        // Error code for unique violation (profile already exists)
        console.warn("Profile already exists, attempting update instead.");
        // Use data from the form and metadata for the update payload
        const updateData: ProfileUpdate = {
          name: metadata.name,
          phone: profileData.phone, // Update primary phone if necessary
          address: profileData.address, // Update address from state
          second_phone: profileData.second_phone, // Update second_phone from state
          // Only include fields you allow updating here
          // Exclude id and role from update
        };
        const { error: updateError } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", user?.id);

        if (updateError) {
          console.error("Error updating user profile:", updateError);
          toast.error(`Failed to update profile: ${updateError.message}`);
          setIsSubmitting(false);
          return;
        }
        console.log("User profile updated successfully.");
      } else if (insertError) {
        console.error("Error inserting user profile:", insertError);
        toast.error(`Failed to create profile: ${insertError.message}`);
        setIsSubmitting(false);
        return;
      } else {
        console.log("User profile created successfully.");
      }

      // Refresh user state in AuthContext
      await getUserProfile();

      toast.success("Profile completed successfully!");
      router.replace("/user");
    } catch (error: any) {
      console.error("Unexpected error completing user profile:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassDiv className="flex justify-center items-center h-screen !bg-orange-500/10">
      <ToastContainer />
      <GlassDiv className="p-8 !w-full !max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Complete User Profile
        </h2>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 flex flex-col justify-center items-center"
        >
          {/* Display non-editable fields from Auth user / Metadata */}
          {/* Using metadata here assumes your /onboarding page fetches user metadata and passes it */}
          <div className="text-gray-700 w-full px-4 mb-4">
            {/* Added some spacing */}
            <p>
              <strong>Name: </strong> {metadata.name || user?.name || "N/A"}
            </p>
            <p>
              <strong>Email: </strong> {metadata.email || user?.email || "N/A"}
            </p>
            <p>
              <strong>Primary Phone: </strong>
              {metadata.phone || user?.phoneNumber || "N/A"}
              {/* Use metadata.phone or user?.phone */}
            </p>
          </div>

          {/* Delivery Address field - Using standard input for testing */}
          <label>
            Delivery Address*:
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              placeholder="Enter delivery address"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-orange-500 !text-black forcus:!border-orange-500"
              disabled={isSubmitting}
            />
          </label>

          {/* Second Phone Number field - Using standard input for testing */}
          <label>
            Second Phone Number:
            <input
              type="text"
              value={secondPhone}
              onChange={(e) => setSecondPhone(e.target.value)}
              placeholder="Enter second phone number (Optional)"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-orange-500 !text-black forcus:!border-orange-500"
              disabled={isSubmitting}
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex items-center justify-center space-x-2 ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600 cursor-pointer"
            } text-white px-6 py-3 rounded-lg`}
          >
            {isSubmitting && (
              <Loader2 size={20} className="animate-spin mr-2" />
            )}
            Complete Profile
          </button>
        </form>
      </GlassDiv>
    </GlassDiv>
  );
}
