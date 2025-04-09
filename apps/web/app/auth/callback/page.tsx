"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@shared/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      const { data: userData, error } = await supabase.auth.getUser();
      if (error || !userData?.user) {
        return router.push("/auth/login");
      }

      const { user } = userData;

      // Check if profile already exists
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      let role = "user";

      if (!profile) {
        const { name = "", phone = "" } = user.user_metadata;
        const { error: insertError } = await supabase.from("profiles").insert({
          id: user.id,
          name,
          email: user.email,
          phone,
          role, 
        });

        if (insertError) {
          console.error("Error inserting profile:", insertError);
        }
      } else {
        role = profile.role;
      }

      router.push(`/${role}`);
    };

    handleRedirect();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-500 text-lg">Redirecting to your dashboard...</p>
    </div>
  );
}
