// CompleteSignupPage.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@shared/supabaseClient";

export default function CompleteSignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        router.push("/auth/login");
        return;
      }

      // Pull metadata directly from the Auth user object
      const { user } = userData;
      const { name, phone, role } = user.user_metadata as {
        name: string;
        phone: string;
        role: string;
      };

      // Insert the profile row in one go
      await supabase
        .from("profiles")
        .insert([{ id: user.id, name, phone, role, email: user.email }]);

      // Redirect to role‑based dashboard
      router.push(`/${role}/`);
    })();
  }, [router]);

  return (
    <div className="flex items-center justify-center bg-transparent">
      <div className="bg-white/45 p-8 shadow-2xl rounded-2xl flex flex-col items-center">
        {/* Spinner */}
        <svg
          className="animate-spin h-12 w-12 text-blue-500 mb-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          ></path>
        </svg>
        <p className="text-gray-700 font-medium">Finishing up… please wait.</p>
      </div>
    </div>
  );
}
