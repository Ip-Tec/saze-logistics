// app/(root)/onboarding/OnboardingClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";

// Assuming these are client components
import UserProfileCompletionForm from "@/components/onboarding/UserProfileCompletionForm";
import VendorProfileCompletionForm from "@/components/onboarding/VendorProfileCompletionForm";
import RiderProfileCompletionForm from "@/components/onboarding/RiderProfileCompletionForm";

// Re-define MetaDataProps for client component
type MetaDataProps = {
  id: string;
  sub: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  [key: string]: string | boolean;
  email_verified: boolean | string;
  phone_verified: boolean | string;
};

interface OnboardingClientProps {
  initialProfileStatus: "loading" | "found" | "not_found";
  initialUserRole: string | null;
  initialSessionMetadata: MetaDataProps;
}

export default function OnboardingClient({
  initialProfileStatus,
  initialUserRole,
  initialSessionMetadata,
}: OnboardingClientProps) {
  const router = useRouter();
  const [profileStatus, setProfileStatus] = useState(initialProfileStatus);
  const [userRole, setUserRole] = useState(initialUserRole);
  const [sessionMetadata] = useState(initialSessionMetadata);

  // This useEffect will only run if client-side re-checks are absolutely necessary.
  // In most cases, the server component should have already decided the flow.
  // You might remove this useEffect entirely if the server logic handles all initial checks.
  useEffect(() => {
    if (profileStatus === "found" && userRole) {
      // If the server component passed "found", just redirect on client mount
      router.replace(`/${userRole}`);
    }
  }, [profileStatus, userRole, router]);

  // Display loading state while server props are being processed or initial client-side check
  if (profileStatus === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 size={48} className="animate-spin text-orange-500" />
        <p className="ml-4 text-lg text-gray-700">Checking profile status...</p>
      </div>
    );
  }

  // Render the appropriate form if profile not found and role is determined
  if (profileStatus === "not_found" && userRole) {
    switch (userRole) {
      case "user":
        return (
          <>
            <UserProfileCompletionForm metadata={sessionMetadata} />
            <ToastContainer />
          </>
        );
      case "vendor":
        return (
          <>
            <VendorProfileCompletionForm metadata={sessionMetadata} />
            <ToastContainer />
          </>
        );
      case "rider":
        return (
          <>
            <RiderProfileCompletionForm metadata={sessionMetadata} />
            <ToastContainer />
          </>
        );
      default:
        return (
          <div className="text-red-600 text-center mt-8">
            <p>Unknown role: {userRole}. Cannot continue.</p>
            <ToastContainer />
          </div>
        );
    }
  }

  // Fallback for unexpected states
  return (
    <div className="text-red-600 text-center mt-8">
      <p>
        Something went wrong. Profile status undetermined or no role provided.
      </p>
      <ToastContainer />
    </div>
  );
}
