// apps/web/app/auth/onboarding/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

import UserProfileCompletionForm from "@/components/onboarding/UserProfileCompletionForm";
import VendorProfileCompletionForm from "@/components/onboarding/VendorProfileCompletionForm";
import RiderProfileCompletionForm from "@/components/onboarding/RiderProfileCompletionForm";

import { supabase } from "@shared/supabaseClient";
import { toast, ToastContainer } from "react-toastify";

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

export default function OnboardingPage() {
  const { user, isCheckingAuth, getUserProfile } = useAuthContext();
  const router = useRouter();

  const [profileFetchStatus, setProfileFetchStatus] = useState<
    "loading" | "found" | "not_found"
  >("loading");

  const [userRole, setUserRole] = useState<string | null>(null);
  const [sessionMetadata, setSessionMetadata] = useState<MetaDataProps>({
    id: "",
    sub: "",
    name: "",
    role: "",
    email: "",
    phone: "",
    email_verified: false,
    phone_verified: false,
  });

  // Fetch session metadata
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSessionMetadata(session.user.user_metadata as MetaDataProps);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      }
    };

    fetchSession();
  }, []);

  // Main profile logic
  useEffect(() => {
    const handleProfileCheck = async () => {
      if (isCheckingAuth) return;

      if (user) {
        router.replace(`/${user.role}`);
        return;
      }

      setProfileFetchStatus("loading");

      const { data: userData, error: authError } = await supabase.auth.getUser();

      if (authError || !userData?.user) {
        console.error("No authenticated user found");
        toast.error(authError?.message || "Authentication error.");
        router.replace("/auth/login");
        return;
      }

      const profile = await getUserProfile();
      if (profile) {
        setProfileFetchStatus("found");
        router.replace(`/${profile.role}`);
        return (<ToastContainer />);
      }

      const intendedRole = userData.user.user_metadata?.role as string | null;

      if (!intendedRole) {
        console.error("User has no role metadata.");
        toast.error("User has no role metadata.");
        setProfileFetchStatus("not_found");
        setUserRole(null);
        return (<ToastContainer />);
      }

      setUserRole(intendedRole);
      setProfileFetchStatus("not_found");
    };

    handleProfileCheck();
  }, [user, isCheckingAuth, router, getUserProfile]);
console.log({isCheckingAuth})
  // Loading UI
  if (isCheckingAuth || profileFetchStatus === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 size={48} className="animate-spin text-orange-500" />
        <p className="ml-4 text-lg text-gray-700">Checking profile status...</p>
      </div>
    );
  }

  // Profile form based on role
  if (profileFetchStatus === "not_found" && userRole) {
    switch (userRole) {
      case "user":
        return <UserProfileCompletionForm metadata={sessionMetadata} />;
      case "vendor":
        return <VendorProfileCompletionForm metadata={sessionMetadata} />;
      case "rider":
        return <RiderProfileCompletionForm metadata={sessionMetadata} />;
      default:
        return (
          <div className="text-red-600 text-center mt-8">
            <p>Unknown role: {userRole}. Cannot continue.</p>
          </div>
        );
    }
  }

  // Fallback
  return (
    <div className="text-red-600 text-center mt-8">
      <p>Something went wrong. Profile status undetermined.</p>
    </div>
  );
}
