// components/onboarding/UserProfileCompletionForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { supabase } from "@shared/supabaseClient";
import { Database } from "@shared/supabase/types"; // Adjust import path
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];

export default function UserProfileCompletionForm() {
  const { user, getUserProfile } = useAuthContext();
  const router = useRouter();

  const [address, setAddress] = useState(""); // Example field
  const [phone, setPhone] = useState(user?.phoneNumber || ""); // Pre-fill if available from auth metadata
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("User not logged in.");
      return;
    }
    setIsSubmitting(true);

    const profileData: ProfileInsert = {
      id: user.id, // MUST set ID to match auth user
      role: 'user', // Set the role explicitly
      name: 'Full User', // Use name from auth metadata or default
      email: user.email, // Use email from auth
      phone: phone.trim(), // Use phone from form
      address: address.trim() || null, // Use address from form
      // Add other user-specific fields here
    };

    try {
        // Try inserting first. If it conflicts, the profile already exists, so update.
        const { error: insertError } = await supabase.from('profiles').insert([profileData]);

        if (insertError && insertError.code === '23505') { // Error code for unique violation (profile already exists)
             console.warn("Profile already exists, attempting update instead.");
             const updateData: ProfileUpdate = { // Use update type for payload
                 name: profileData.name,
                 phone: profileData.phone,
                 address: profileData.address,
                 // Exclude id and role from update if they shouldn't be changed
             };
             const { error: updateError } = await supabase
                 .from('profiles')
                 .update(updateData)
                 .eq('id', user.id);

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
      await getUserProfile(); // This should update the user state in context

      toast.success("Profile completed successfully!");
      router.replace("/user"); // Redirect to user dashboard
    } catch (error: any) {
      console.error("Unexpected error completing user profile:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Complete User Profile</h2>
        {/* Display any context errors like profile not found during initial check */}
        {/* Although this page is for *creating* the profile, display general errors if helpful */}
        {/* {updateProfileError && <p className="text-red-500 mb-4">{updateProfileError.message}</p>} */}

        <form onSubmit={handleSubmit} className="space-y-4">
           {/* Display non-editable fields from Auth user */}
           <div className="text-gray-700">
               <p><strong>Email:</strong> {user?.email}</p>
               <p><strong>Name:</strong> {user?.name || 'Not provided'}</p> {/* Display name from metadata */}
               <p><strong>Role:</strong> {user?.role || 'user'}</p> {/* Display intended role */}
           </div>

           {/* Phone field (might be pre-filled) */}
           <label className="block">
             <span className="text-gray-700">Phone Number</span>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-blue-400 text-black"
                required
                disabled={isSubmitting}
              />
           </label>

          {/* Address field */}
          <label className="block">
             <span className="text-gray-700">Delivery Address</span>
             <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-blue-400 text-black"
                required
                disabled={isSubmitting}
             />
          </label>

          {/* Add other user-specific fields */}

          <button
            type="submit"
            disabled={isSubmitting}
             className={`w-full flex items-center justify-center space-x-2 ${
               isSubmitting
                 ? "bg-gray-400 cursor-not-allowed"
                 : "bg-blue-500 hover:bg-blue-600 cursor-pointer"
             } text-white px-6 py-3 rounded-lg`}
          >
            {isSubmitting && <Loader2 size={20} className="animate-spin mr-2" />}
            Complete Profile
          </button>
        </form>
      </div>
    </div>
  );
}