// apps/web/context/AuthContext.tsx
"use client";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@shared/supabaseClient";
import { useRouter, usePathname } from "next/navigation";

// Import the AppUser type and other necessary types from your shared types file
// Make sure the path is correct based on your project structure
import {
  AppUser, // Make sure these specific types (User, Vendor, RiderProfile, Admin)
  // are defined in @shared/types and include common profile fields like name, email, phone, role
  User,
  Vendor,
  RiderProfile,
  Admin,
} from "@shared/types";

// Define the interface for the Auth Context's props
interface AuthContextProps {
  // The user property is now typed as AppUser (the union of all profile types) or null
  user: AppUser | null;
  signOut: () => Promise<void>;
  isCheckingAuth: boolean; // State indicating if the initial auth check is in progress
  // registerUser should correctly save role in auth metadata

  registerUser: (
    name: string,
    email: string,
    phone: string,
    password: string,
    role: AppUser["role"] // Use the union type for role
  ) => Promise<void>; // loginUser should return the specific profile type or throw error if profile missing for existing users

  loginUser: (email: string, password: string) => Promise<AppUser>;

  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  changePhoneNumber: (newPhone: string) => Promise<void>; // getUserProfile should fetch and return the AppUser union or null

  getUserProfile: () => Promise<AppUser | null>;

  resendConfirmationEmail: () => Promise<void>;
}

// Create the context with a default undefined value
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Auth Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const publicRoutes = [
    "/", "/auth", "/auth/*", "/onboarding",
    "/auth/login", "/auth/register", "/auth/confirm-email",
    "/auth/forgot-password", "/auth/reset-password",
  ];
  const authPages = [
    "/auth/login", "/auth/register", "/auth/confirm-email",
    "/auth/forgot-password", "/auth/reset-password", "/onboarding",
  ];

 // Fetch profile from Supabase
 async function getUserProfile(): Promise<AppUser | null> {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();
  if (error || !data?.role) return null;
  return data as AppUser;
}

// Memoized fetch-and-set helper with guard
const hasFetched = useRef(false);
const fetchAndSetProfile = useCallback(async () => {
  if (hasFetched.current) return;
  hasFetched.current = true;
  const profile = await getUserProfile();
  setUser(profile);
}, []);

// 1. Initial load
useEffect(() => {
  supabase.auth.getSession()
    .then(({ data: { session } }) => {
      if (session) fetchAndSetProfile();
      else setIsCheckingAuth(false);
    })
    .catch(() => setIsCheckingAuth(false));
}, [fetchAndSetProfile]);

// 2. Auth state listener
useEffect(() => {
  const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
    if (session) fetchAndSetProfile();
    else setUser(null);
  });
  return () => listener.subscription.unsubscribe();
}, [fetchAndSetProfile]);

// 3. Redirect logic
useEffect(() => {
  if (isCheckingAuth) return;
  const isPublic = publicRoutes.some(route =>
    route.endsWith("/*") ? pathname.startsWith(route.replace("/*", "")) : pathname === route
  );

  if (user) {
    if (authPages.includes(pathname)) {
      router.replace(`/${user.role}`);
    }
  } else if (!isPublic) {
    router.replace("/auth/login");
  }
}, [user, isCheckingAuth, pathname, router]);
  
  /** REGISTER USER */
  const registerUser = async (
    name: string,
    email: string,
    phone: string,
    password: string,
    role: AppUser["role"]
  ) => {
    console.log("AuthContext: registerUser called for email:", email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone, role }, // Pass initial profile data including role in metadata
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding`,
      },
    });

    if (error) {
      console.error("AuthContext: registerUser failed:", error.message);
      throw new Error(error.message);
    }

    if (data?.user && !data.session) {
      console.log(
        "AuthContext: registerUser successful, email confirmation required."
      );
      localStorage.setItem("pending-confirmation-email", email); // Optionally redirect to a check-email page
      // router.push('/auth/check-email');
    } else {
      console.log(
        "AuthContext: registerUser successful, session created immediately."
      ); // The onAuthStateChange listener will handle state update and potential onboarding redirect
    }
  }; /** LOGIN USER */

  const loginUser = async (
    email: string,
    password: string
  ): Promise<AppUser> => {
    console.log("AuthContext: loginUser called for email:", email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("AuthContext: loginUser failed:", error.message);
      throw new Error(error.message);
    } // Upon successful signInWithPassword, the onAuthStateChange listener will trigger.
    // That listener handles fetching the profile, setting the user state,
    // and redirecting to onboarding if the profile is missing *and* metadata suggests a new user.
    // The immediate getUserProfile call here is primarily to fulfill the Promise<AppUser> return type
    // contract for this specific function call, allowing the calling component (e.g., login page)
    // to optionally get the profile immediately.

    console.log(
      "AuthContext: signInWithPassword successful, attempting immediate profile fetch."
    );
    const profile = await getUserProfile(); // Fetch profile immediately after sign-in

    if (!profile) {
      console.warn(
        "AuthContext: Profile not found immediately after login. Onboarding redirect handled by listener."
      ); // Even though listener handles onboarding redirect, we still throw
      // for the function's contract if profile is expected immediately.
      throw new Error("Profile not found immediately after login");
    }

    console.log("AuthContext: Profile found immediately after login."); // Note: setUser(profile) might be called here *and* concurrently in the listener.
    // Rely on the listener as the primary source of truth for state updates and redirects.
    return profile;
  }; /** SIGN OUT */

  const signOut = async () => {
    console.log("AuthContext: signOut called.");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("AuthContext: signOut failed:", error.message);
      throw new Error(error.message);
    }
    console.log("AuthContext: signOut successful."); // The onAuthStateChange listener will handle setting user to null and the protected route useEffect will redirect to login if needed.
    router.replace("/auth/login"); // Explicitly redirect to login page after signOut call completes successfully
  }; /** FORGOT PASSWORD */

  const forgotPassword = async (email: string) => {
    console.log("AuthContext: forgotPassword called for email:", email);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password`,
    });
    if (error) {
      console.error("AuthContext: forgotPassword failed:", error.message);
      throw new Error(error.message);
    }
    console.log("AuthContext: forgotPassword successful.");
  }; /** RESET PASSWORD */

  const resetPassword = async (password: string) => {
    console.log("AuthContext: resetPassword called.");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      console.error("AuthContext: resetPassword failed:", error.message);
      throw new Error(error.message);
    }
    console.log("AuthContext: resetPassword successful."); // The onAuthStateChange listener will handle state update and potential dashboard redirect
  }; /** CHANGE PHONE NUMBER */

  const changePhoneNumber = async (newPhone: string) => {
    console.log("AuthContext: changePhoneNumber called.");
    if (!user) {
      console.error(
        "AuthContext: changePhoneNumber failed, user not authenticated."
      );
      throw new Error("User not authenticated");
    }

    console.log(
      `AuthContext: Attempting to update phone for user ${user.id} to ${newPhone}`
    );

    const { error } = await supabase
      .from("profiles")
      .update({ phone: newPhone })
      .eq("id", user.id);

    if (error) {
      console.error("AuthContext: changePhoneNumber failed:", error.message);
      throw new Error(error.message);
    }

    console.log(
      "AuthContext: changePhoneNumber successful, refreshing profile."
    );
    const updatedProfile = await getUserProfile();
    if (updatedProfile) {
      setUser(updatedProfile);
      console.log("AuthContext: User state updated with new phone number.");
    } else {
      console.warn(
        "AuthContext: Failed to refresh user profile after phone number change."
      );
    }
  }; /** RESEND CONFIRMATION EMAIL */

  const resendConfirmationEmail = async () => {
    console.log("AuthContext: resendConfirmationEmail called.");
    const email = localStorage.getItem("pending-confirmation-email");

    if (!email) {
      console.error(
        "AuthContext: resendConfirmationEmail failed, no pending email found in local storage."
      );
      throw new Error("No pending confirmation email found.");
    }

    console.log(
      `AuthContext: Attempting to resend confirmation email to ${email}`
    );

    const { error } = await supabase.auth.signUp({
      email,
      password: "dummyPassword", // Supabase workaround to trigger resend
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding`,
      },
    });

    if (error) {
      console.error(
        "AuthContext: resendConfirmationEmail failed:",
        error.message
      );
      if (error.message.includes("rate limited")) {
        throw new Error(
          "Please wait before requesting another confirmation email."
        );
      }
      throw new Error(error.message);
    }
    console.log(
      `AuthContext: Confirmation email resent successfully to ${email}.`
    );
  }; // Render children regardless of auth state, protected route effect handles redirection

  /** Get Profile */
  const getProfile = async () => {
    console.log("AuthContext: getUserProfile called.");
    if (!user) {
      console.error(
        "AuthContext: getUser " + "Profile failed, user not authenticated."
      );
      throw new Error("User not authenticated");
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
      if (profileError) {
        console.error(
          "AuthContext: getUserProfile failed:",
          profileError.message
        );
        throw new Error(profileError.message);
      }
      console.log("AuthContext: getUserProfile successful.");
      return profile;
    };
  

  return (
    <AuthContext.Provider
      value={{
        user,
        signOut,
        registerUser,
        loginUser,
        resetPassword,
        isCheckingAuth,
        getUserProfile,
        forgotPassword,
        changePhoneNumber,
        resendConfirmationEmail,
      }}
    >
    {children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily access the Auth Context
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
