// apps/web/app/onboarding/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext"; // Adjust the import path
import { Loader2 } from "lucide-react";

// Import your profile forms (you'll need to create these)
import UserProfileCompletionForm from "@/components/onboarding/UserProfileCompletionForm"; 
import VendorProfileCompletionForm from "@/components/onboarding/VendorProfileCompletionForm"; 
import RiderProfileCompletionForm from "@/components/onboarding/RiderProfileCompletionForm" 
import { supabase } from "@shared/supabaseClient";

export default function OnboardingPage() {
  const { user, isCheckingAuth, getUserProfile } = useAuthContext();
  const router = useRouter();

  const [profileFetchStatus, setProfileFetchStatus] = useState<"loading" | "found" | "not_found">(
    "loading"
  );
   const [userRole, setUserRole] = useState<string | null>(null);


  // Effect to check profile status after AuthContext is done checking
  useEffect(() => {
    const checkProfile = async () => {
      // Wait for the AuthContext's initial check to finish
      if (isCheckingAuth) {
        return;
      }

      // If AuthContext found a full profile, redirect to dashboard
      if (user) {
        console.log("OnboardingPage: Profile found in AuthContext, redirecting.");
        router.replace(`/${user.role}`); // Redirect using replace to avoid back button loops
        return;
      }

      // If AuthContext did NOT find a profile (user is null),
      // fetch the basic user and try fetching the profile again just in case,
      // or assume the user is logged in but profile is missing.
      console.log("OnboardingPage: User is logged in but profile not in context. Checking again...");
      setProfileFetchStatus("loading");

      // We need the user ID to check/create the profile row
      const { data: userData, error: authError } = await supabase.auth.getUser(); // Use supabase directly here to get the current user

      if (authError || !userData?.user) {
          console.error("OnboardingPage: No authenticated user found, redirecting to login.");
          router.replace("/auth/login"); // Should not happen if AuthContext did its job, but safety check
          return;
      }

      // Try fetching the profile again to see if a row exists but was incomplete/not loaded correctly before
      const profile = await getUserProfile(); // Use the context function to ensure consistency

      if (profile) {
          console.log("OnboardingPage: Profile found on second check, redirecting.");
          router.replace(`/${profile.role}`);
      } else {
          console.log("OnboardingPage: Profile still not found. User needs onboarding.");
           // User exists (userData.user) but no profile row exists yet.
           // Or profile exists but role is null/incomplete.
           // We need to know the intended role. This must come from registration metadata.
           // How did you store the intended role during signup?
           // Assuming signup metadata `user.user_metadata.role` holds the intended role.

           const intendedRole = userData.user.user_metadata?.role as string | null;

           if (!intendedRole) {
              console.error("OnboardingPage: User registered without a role metadata. Cannot proceed.");
              // Handle error: User cannot complete profile without a defined role.
              // Maybe force them back to registration with a warning or show an error page.
              // For now, display an error message.
              setProfileFetchStatus("not_found"); // Use "not_found" status to indicate needing profile creation/selection
              setUserRole(null); // Ensure role is null if metadata is missing
              return;
           }

           console.log("OnboardingPage: User needs to complete profile for role:", intendedRole);
           setProfileFetchStatus("not_found"); // Profile not found implies it needs creation or completion
           setUserRole(intendedRole); // Set the intended role from metadata
      }
       // isCheckingAuth becomes false, and then this effect runs.
       // If user is still null, profileFetchStatus remains 'loading' initially,
       // then becomes 'not_found' if the second check fails.
    };

    checkProfile();
  }, [user, isCheckingAuth, router, getUserProfile]); // Rerun if user, check status, router, or getUserProfile changes

  // Show loading state while checking auth or fetching profile
  if (isCheckingAuth || profileFetchStatus === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 size={48} className="animate-spin text-blue-500" />
        <p className="ml-4 text-lg text-gray-700">Checking profile status...</p>
      </div>
    );
  }

  // Render the appropriate form based on the intended role
  // This assumes profileFetchStatus is "not_found" and userRole is set from metadata
  if (profileFetchStatus === "not_found" && userRole) {
    switch (userRole) {
      case "user":
        return <UserProfileCompletionForm />;
      case "vendor":
        return <VendorProfileCompletionForm />;
      case "rider":
        return <RiderProfileCompletionForm />;
      default:
        // Should not happen if role metadata is valid
        return (
          <div className="text-red-600 text-center mt-8">
            <p>Unknown user role detected. Cannot display profile form.</p>
          </div>
        );
    }
  }

   // Fallback state - should ideally be handled by redirects above
  return (
     <div className="text-red-600 text-center mt-8">
       <p>Something went wrong. Could not determine profile status or role.</p>
       {/* Add a link to log out or try again */}
     </div>
   );
}