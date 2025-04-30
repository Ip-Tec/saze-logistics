// apps/web/context/AuthContext.tsx
"use client";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@shared/supabaseClient";
import { useRouter, usePathname } from "next/navigation";

// Import the AppUser type and other necessary types from your shared types file
// Make sure the path is correct based on your project structure
import {
  AppUser,
  // Make sure these specific types (User, Vendor, RiderProfile, Admin)
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
  ) => Promise<void>;

  // loginUser should return the specific profile type or throw error if profile missing for existing users
  loginUser: (email: string, password: string) => Promise<AppUser>;

  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  changePhoneNumber: (newPhone: string) => Promise<void>;

  // getUserProfile should fetch and return the AppUser union or null
  getUserProfile: () => Promise<AppUser | null>;

  resendConfirmationEmail: () => Promise<void>;
}

// Create the context with a default undefined value
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Auth Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // The user state is now typed as AppUser or null
  const [user, setUser] = useState<AppUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // State to track initial auth check
  const router = useRouter();
  const pathname = usePathname();

  // Define public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/auth",
    "/auth/*",
    "/onboarding",
    "/auth/login",
    "/auth/register",
    "/auth/confirm-email",
    "/auth/forgot-password",
    "/auth/reset-password",
  ];

  // --- GET USER PROFILE FUNCTION (Declared with 'function' for hoisting) ---
  /**
   * Function to fetch the user's detailed profile from the database.
   * This function returns null if no profile is found or if there's an error.
   */
  // MODIFIED: Changed from 'const getUserProfile = async ...' to 'async function getUserProfile ...'
  async function getUserProfile(): Promise<AppUser | null> {
    console.log("AuthContext: getUserProfile called.");
    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData?.user) {
      console.warn(
        "AuthContext: No authenticated user found when fetching profile."
      );
      return null;
    }

    console.log(
      `AuthContext: Attempting to fetch profile for user ID: ${userData.user.id}`
    );

    const { data, error } = await supabase
      .from("profiles")
      .select("*") // Select all columns as per your profiles table
      .eq("id", userData.user.id)
      .single();

    if (error) {
      // Log the specific Supabase error details
      console.error(
        "AuthContext: Supabase error fetching user profile:",
        error
      );
      // Note: A 'PostgrestInterpretationAttribute' error or similar
      // might indicate the row was not found, which is expected for new users.
      // We return null for any error or no data, signaling profile not found.
      console.log(
        `AuthContext: Profile not found for user ${userData.user.id} (or other DB error).`
      );
      return null;
    }

    // If data is found, check for the role and return it cast as AppUser
    if (data && data.role) {
      console.log(
        `AuthContext: Profile found for user ${userData.user.id} with role: ${data.role}.`
      );
      // Ensure your AppUser type correctly matches the shape of the 'data' object here.
      return data as AppUser;
    } else {
      // This case means a row was found, but it's missing the 'role' or is empty.
      // This could indicate an incomplete profile creation. Treat as profile not found/incomplete.
      console.warn(
        `AuthContext: Profile data found for user ${userData.user.id} but missing role or is incomplete. Data:`,
        data
      );
      return null;
    }
  }

  /** CHECK CURRENT SESSION & PROFILE STATUS */
  // Effect to check for an existing session on mount and set the user state
  // Also handles redirection if profile is missing
  useEffect(() => {
    const handleAuthStateChange = async (session: any | null) => {
      console.log(
        "AuthContext: Auth state change detected. Session:",
        session ? "present" : "null"
      ); // Added log

      if (session) {
        console.log("AuthContext: Session found, attempting to fetch profile.");
        try {
          // getUserProfile is now declared with 'function', so it's hoisted and available here
          const profile = await getUserProfile(); // Try fetching the profile

          if (profile) {
            console.log("AuthContext: Profile found. Setting user state.");
            setUser(profile);

            // Optional: Redirect logged-in users from auth/onboarding pages to their dashboard
            const authRelatedPaths = [
              "/auth/login",
              "/auth/register",
              "/auth/confirm-email",
              "/auth/forgot-password",
              "/auth/reset-password",
              "/onboarding",
            ];
            if (authRelatedPaths.includes(pathname)) {
              console.log(
                `AuthContext: Redirecting authenticated user from ${pathname} to /${profile.role}`
              );
              router.replace(`/${profile.role}`); // Redirect to role-specific dashboard
            }
          } else {
            console.log("AuthContext: Session found, but profile NOT found.");
            setUser(null); // Set user to null if profile is missing

            // --- REDIRECT TO ONBOARDING IF PROFILE IS MISSING ---
            // If user is logged in (session exists) but profile is null,
            // and they are NOT already on the onboarding page, redirect them there.
            if (pathname !== "/onboarding") {
              console.log(
                "AuthContext: Profile missing, redirecting to /onboarding."
              );
              router.replace("/onboarding");
            } else {
              console.log(
                "AuthContext: Profile missing, already on /onboarding."
              );
            }
          }
        } catch (error) {
          console.error(
            "AuthContext: Error during profile fetch after auth state change:",
            error
          );
          setUser(null); // Ensure user is null on error
          // Decide redirection on error: to login or a generic error page?
          // For now, let the non-public route redirect handle it, or redirect to login.
          if (pathname !== "/auth/login" && !publicRoutes.includes(pathname)) {
            // Avoid infinite loops
            router.replace("/auth/login");
          }
        } finally {
          // Set checking state to false after the initial check completes,
          // or after an auth state change has been fully processed.
          if (isCheckingAuth) {
            // Only set false if it was initially true
            console.log("AuthContext: Initial auth check finished.");
            setIsCheckingAuth(false);
          }
        }
      } else {
        // No session found or user logged out
        console.log(
          "AuthContext: No session found or user logged out. Setting user to null."
        );
        setUser(null);

        // If checking was initially true, it's now finished
        if (isCheckingAuth) {
          console.log("AuthContext: Initial auth check finished (no session).");
          setIsCheckingAuth(false);
        }
      }
    };

    // Initial check on mount
    console.log("AuthContext: Running initial getSession check.");
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        handleAuthStateChange(session);
        console.log({ session });
      })
      .catch((error) => {
        console.error("AuthContext: Error during initial getSession:", error);
        setIsCheckingAuth(false); // Ensure checking is false even on error
        setUser(null);
        if (pathname !== "/auth/login" && !publicRoutes.includes(pathname)) {
          router.replace("/auth/login");
        }
      });

    // Listen for authentication state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`AuthContext: onAuthStateChange event: ${event}`);
        // We only process the session change here, the logic is in handleAuthStateChange
        handleAuthStateChange(session);
      }
    );

    // Cleanup function to unsubscribe from the auth state change listener
    return () => {
      console.log("AuthContext: Cleaning up auth state listener.");
      listener.subscription.unsubscribe();
    };
    // Removed getUserProfile from dependency array as it's now hoisted.
    // Add back if getUserProfile somehow depends on component state/props (unlikely).
  }, [pathname, router, publicRoutes]);

  /** PROTECTED ROUTE REDIRECT */
  // Keep the existing redirect effect for protected routes
  useEffect(() => {
    console.log(
      `AuthContext: Protected route redirect check. Path: ${pathname}, User: ${user ? "present" : "null"}, Checking: ${isCheckingAuth}`
    );
    // Wait until the initial auth check is complete
    if (isCheckingAuth) {
      console.log(
        "AuthContext: Still checking auth, skipping protected route redirect."
      );
      return;
    }

    // Check if the current pathname is a public route
    const isPublic = publicRoutes.some((route) =>
      route.endsWith("/*")
        ? pathname.startsWith(route.replace("/*", ""))
        : pathname === route
    );

    // If the route is NOT public AND there is no logged-in user, redirect to login
    if (!isPublic && !user) {
      console.log(
        "AuthContext: Not public and no user, redirecting to /auth/login."
      );
      router.push("/auth/login");
    } else {
      console.log(
        "AuthContext: Protected route check passed or path is public."
      );
    }
  }, [user, isCheckingAuth, pathname, router, publicRoutes]); // Depend on publicRoutes as well

  /** REGISTER USER */
  // Function to handle user registration
  const registerUser = async (
    name: string,
    email: string,
    phone: string,
    password: string,
    role: AppUser["role"] // Ensure the role passed is one of the valid AppUser roles
  ) => {
    console.log("AuthContext: registerUser called for email:", email);
    // No need to store email in local storage if emailRedirectTo goes to onboarding
    // localStorage.setItem("pending-confirmation-email", email);

    // Sign up user with email and password, including profile data in options.data
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone, role }, // Pass initial profile data including role
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding`, // <-- Redirect to the onboarding page after confirmation
      },
    });

    // Throw error if sign up fails
    if (error) {
      console.error("AuthContext: registerUser failed:", error.message);
      throw new Error(error.message);
    }

    // Handle case where user object is returned but requires confirmation
    if (data?.user && !data.session) {
      console.log(
        "AuthContext: registerUser successful, email confirmation required."
      );
      // Optionally store email for resend logic if needed later
      localStorage.setItem("pending-confirmation-email", email);
      // You might want to redirect the user to a "check your email" page here
      // router.push('/auth/check-email'); // Example
    } else {
      console.log(
        "AuthContext: registerUser successful, session created (e.g., via phone auth or auto-confirm)."
      );
      // If session is created immediately (less common for email/password with confirmation),
      // the onAuthStateChange listener will pick it up and handle profile creation/onboarding redirect.
    }
  };

  /** LOGIN USER */
  // Function to handle user login with email and password
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
      throw new Error(error.message); // Keep throwing error for login failures
    }

    console.log(
      "AuthContext: signInWithPassword successful, attempting immediate profile fetch for return value."
    );
    // getUserProfile is now declared with 'function', so it's hoisted and available here
    const profile = await getUserProfile();

    if (!profile) {
      console.error("AuthContext: Profile not found immediately after login.");
      throw new Error("Profile not found after login");
    }
    return profile;
  };

  /** SIGN OUT */
  const signOut = async () => {
    console.log("AuthContext: signOut called.");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("AuthContext: signOut failed:", error.message);
      throw new Error(error.message);
    }
    console.log("AuthContext: signOut successful.");
    // The onAuthStateChange listener will handle setting user to null and redirecting to login
  };

  /** FORGOT PASSWORD */
  const forgotPassword = async (email: string) => {
    console.log("AuthContext: forgotPassword called for email:", email);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Ensure this redirect matches your reset password page route
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password`,
    });
    if (error) {
      console.error("AuthContext: forgotPassword failed:", error.message);
      throw new Error(error.message);
    }
    console.log("AuthContext: forgotPassword successful.");
  };

  /** RESET PASSWORD */
  const resetPassword = async (password: string) => {
    console.log("AuthContext: resetPassword called.");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      console.error("AuthContext: resetPassword failed:", error.message);
      throw new Error(error.message);
    }
    console.log("AuthContext: resetPassword successful.");
    // User is now logged in with new password, onAuthStateChange listener will update state/redirect
  };

  /** CHANGE PHONE NUMBER */
  // Assuming this function updates the profiles table directly
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
    // Refresh the user state in AuthContext by re-fetching the profile
    // This ensures the user object in context is updated with the new phone number
    // getUserProfile is now declared with 'function', so it's hoisted and available here
    const updatedProfile = await getUserProfile();
    if (updatedProfile) {
      setUser(updatedProfile);
      console.log("AuthContext: User state updated with new phone number.");
    } else {
      // This case is unlikely if update succeeded, but handle if getUserProfile fails
      console.warn(
        "AuthContext: Failed to refresh user profile after phone number change."
      );
    }
  };

  /** RESEND CONFIRMATION EMAIL */
  // Function to resend the confirmation email
  const resendConfirmationEmail = async () => {
    console.log("AuthContext: resendConfirmationEmail called.");
    // Get the pending confirmation email from local storage
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

    // Call Supabase Auth signUp again with a dummy password to trigger resend
    // Ensure this matches the options used during initial signup if possible
    const { error } = await supabase.auth.signUp({
      email,
      password: "dummyPassword", // Supabase workaround to trigger resend
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding`, // Ensure this matches your signup redirect
        // Do NOT include data: { name, phone, role } here unless resending requires it.
        // The user already exists; we just need to resend the email.
      },
    });

    if (error) {
      console.error(
        "AuthContext: resendConfirmationEmail failed:",
        error.message
      );
      // Handle specific errors like 'rate limited'
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
    // Remove pending email from local storage? Or keep until confirmed?
    // localStorage.removeItem('pending-confirmation-email');
  };

  // Render children regardless of auth state, protected route effect handles redirection
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
  // Throw error if the hook is used outside of the AuthProvider
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
