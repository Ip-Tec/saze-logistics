// app/(root)/onboarding/page.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";
import { type Database } from "@shared/supabase/types";

// Import your client component
import OnboardingClient from "./OnboardingClient";

// Define interfaces for data passed to client component
interface UserProfile {
  id: string;
  name: string | null;
  role: string | null;
  // Add other profile fields you might fetch from your 'profiles' table
  // e.g., avatar_url, bio, etc.
}

// Ensure MetaDataProps is accessible or redefined if needed
type ServerMetaDataProps = {
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

export const dynamic = "force-dynamic"; // Ensure this page is always dynamic

export default async function OnboardingPageServer() {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          return cookieStore.getAll();
        },
        async setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch (error) {
            console.error("Error setting cookies in API route:", error);
          }
        },
      },
    }
  );

  // 1. Get session and user data from Supabase on the server
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    console.error(
      "Server: No active session found or session error:",
      sessionError
    );
    redirect("/auth/login");
  }

  const user = session.user;
  const sessionMetadata: ServerMetaDataProps =
    user.user_metadata as ServerMetaDataProps;
  const userRole = sessionMetadata.role;

  if (!userRole) {
    console.error("Server: User has no role metadata in session.");
    // This scenario should ideally be handled during signup, but if it happens,
    // we still need to show an onboarding form or error.
    return (
      <OnboardingClient
        initialProfileStatus="not_found"
        initialUserRole={null} // Or a generic "needs_role_selection" role
        initialSessionMetadata={sessionMetadata}
      />
    );
  }

  // 2. Fetch user profile from your 'profiles' table
  // Assuming 'profiles' table stores the completed user profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles") // Replace with your actual profiles table name
    .select("id, name, role") // Select necessary fields
    .eq("id", user.id)
    .single();

  if (profileError && profileError.code !== "PGRST116") {
    // PGRST116 means "no rows found" for .single()
    console.error("Server: Error fetching user profile from DB:", profileError);
    // You might want to display a generic error page or log this for investigation
    // For now, treat it as profile not found.
  }

  if (profile && profile.role === userRole) {
    // If profile found AND its role matches the session role, assume onboarding is complete
    console.log(
      `Server: Profile found for ${userRole}, redirecting to /${userRole}`
    );
    redirect(`/${userRole}`); // Redirect to the user's dashboard based on role
  }

  // If we reach here, it means:
  // - No profile was found in the 'profiles' table for this user OR
  // - The found profile's role doesn't match the session's role (unlikely, but good to cover)
  // - Or there was a PGRST116 error (no row found), which means onboarding is needed.
  console.log(`Server: Onboarding needed for role: ${userRole}`);

  return (
    <OnboardingClient
      initialProfileStatus="not_found"
      initialUserRole={userRole}
      initialSessionMetadata={sessionMetadata}
    />
  );
}
