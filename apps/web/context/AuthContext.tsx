// apps/web/context/AuthContext.tsx
"use client";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "@shared/supabaseClient";
import { useRouter, usePathname } from "next/navigation";

// Import the AppUser type and other necessary types from your shared types file
// Make sure the path is correct based on your project structure
import { AppUser, User, Vendor, RiderProfile, Admin, NotificationPreferences, Conversation, Call, Order, DeliveryAddress, GeoLocation, OrderItem, MenuCategory, MenuItem, MenuItemImage, FoodDetail, CartItem, PaymentMethodType, PaymentMethod, PaymentStatus, OpeningHours, Permission, OrderStatus, BaseUser } from "@shared/types";


// Define the interface for the Auth Context's props
interface AuthContextProps {
  // The user property is now typed as AppUser (the union of all profile types) or null
  user: AppUser | null;
  signOut: () => Promise<void>;
  registerUser: (
    name: string,
    email: string,
    phone: string,
    password: string,
    role: AppUser['role'] // Use the union type for role
  ) => Promise<void>;
  // loginUser should return the specific profile type based on role,
  // or the AppUser union. Let's type it as Promise<AppUser> for simplicity
  // since it fetches the profile after login.
  loginUser: (email: string, password: string) => Promise<AppUser>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  changePhoneNumber: (newPhone: string) => Promise<void>;
  // getUserProfile should also return the AppUser union or null
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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Define public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/auth",
    "/auth/*", // Wildcard for any path under /auth
    "/auth/login",
    "/auth/register",
    "/auth/confirm-email",
    "/auth/forgot-password",
    "/auth/reset-password", // Added reset-password as it's public
    "/complete-signup" // Added complete-signup as it's public
  ];

  /** CHECK CURRENT SESSION */
  // Effect to check for an existing session on mount and set the user state
  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // If a session exists, fetch the user profile
        const profile = await getUserProfile();
        // Set the user state with the fetched profile (which is typed as AppUser | null)
        setUser(profile);
      }

      setIsCheckingAuth(false);
    };

    init();

    // Listen for authentication state changes (login, logout, token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          // If a session is present after a state change, fetch the profile
          const profile = await getUserProfile();
          setUser(profile);
        } else {
          // If session is null (e.g., after logout), set user state to null
          setUser(null);
        }
      }
    );

    // Cleanup function to unsubscribe from the auth state change listener
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []); // Effect runs only once on mount

  /** REDIRECT IF NOT AUTHENTICATED */
  // Effect to handle redirection for protected routes
  useEffect(() => {
    // Wait until the initial auth check is complete
    if (isCheckingAuth) return;

    // Check if the current pathname is a public route
    const isPublic = publicRoutes.some((route) =>
      route.endsWith("/*")
        ? pathname.startsWith(route.replace("/*", ""))
        : pathname === route
    );

    // If the route is NOT public AND there is no logged-in user, redirect to login
    if (!isPublic && !user) {
      router.push("/auth/login");
    }

    // Optional: Add redirection logic based on user role after login if needed
    // For example, redirect riders to /rider/dashboard, vendors to /vendor/dashboard etc.
    // This would typically happen after a successful login or when the user state is set.
    // You might already handle this in your login page or a dedicated redirect component.

  }, [user, isCheckingAuth, pathname, router]); // Effect runs when user, checking status, pathname, or router changes

  /** REGISTER USER */
  // Function to handle user registration
  const registerUser = async (
    name: string,
    email: string,
    phone: string,
    password: string,
    role: AppUser['role'] // Ensure the role passed is one of the valid AppUser roles
  ) => {
    // Store email temporarily for confirmation flow
    localStorage.setItem("pending-confirmation-email", email);

    // Sign up user with email and password, including profile data in options.data
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone, role }, // Pass profile data here
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/complete-signup`, // Redirect URL after email confirmation
      },
    });

    // Throw error if sign up fails
    if (error) throw new Error(error.message);
  };

  /** LOGIN USER */
  // Function to handle user login with email and password
  const loginUser = async (
    email: string,
    password: string
  ): Promise<AppUser> => { // Type the return as Promise<AppUser>
    // Sign in user with email and password
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Throw error if sign in fails
    if (error) throw new Error(error.message);

    // Fetch the user profile after successful sign-in
    const profile = await getUserProfile();
    // Check if profile was successfully fetched
    if (!profile) throw new Error("Profile not found after login");

    // Set the user state and return the fetched profile
    setUser(profile);
    return profile; // Return the AppUser profile
  };

  /** SIGN OUT */
  // Function to handle user sign out
  const signOut = async () => {
    // Sign out from Supabase Auth
    const { error } = await supabase.auth.signOut();
    // Throw error if sign out fails
    if (error) throw new Error(error.message);
    // Set user state to null and redirect to login page
    setUser(null);
    router.push("/auth/login");
  };

  /** FORGOT PASSWORD */
  // Function to handle forgot password request
  const forgotPassword = async (email: string) => {
    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`, // Redirect URL after clicking email link
    });
    // Throw error if request fails
    if (error) throw new Error(error.message);
  };

  /** RESET PASSWORD */
  // Function to handle password reset after clicking email link
  const resetPassword = async (password: string) => {
    // Update user's password
    const { error } = await supabase.auth.updateUser({ password });
    // Throw error if update fails
    if (error) throw new Error(error.message);
  };

  /** CHANGE PHONE NUMBER */
  // Function to update the user's phone number in the profiles table
  const changePhoneNumber = async (newPhone: string) => {
    // Ensure user is authenticated
    if (!user) throw new Error("User not authenticated");

    // Update the 'phone' column in the 'profiles' table for the current user
    const { error } = await supabase
      .from("profiles")
      .update({ phone: newPhone }) // Assuming 'phone' is the column name
      .eq("id", user.id); // Update the row matching the user's ID

    // Throw error if update fails
    if (error) throw new Error(error.message);
    // Refresh the user profile state after successful update
    setUser(await getUserProfile());
  };

  /** GET USER PROFILE */
  // Function to fetch the user's detailed profile from the database
  // This function is crucial and should fetch data that matches your AppUser structure
  const getUserProfile = async (): Promise<AppUser | null> => { // Type the return as Promise<AppUser | null>
    // Get the authenticated user from the session
    const { data: userData, error: authError } = await supabase.auth.getUser();
    // If no authenticated user or error, return null
    if (authError || !userData?.user) {
      console.error("AuthContext: Unable to get authenticated user:", authError);
      return null;
    }

    // Fetch the profile data from the 'profiles' table based on the user's ID
    // This query needs to select all the fields required for your AppUser union types
    const { data, error } = await supabase
      .from("profiles")
      .select("*") // Select all columns from the profiles table
      .eq("id", userData.user.id) // Filter by the authenticated user's ID
      .single(); // Expecting a single row

    // If there's an error fetching the profile, log it and return null
    if (error) {
      console.error("AuthContext: Error fetching user profile:", error.message);
      return null;
    }

    // If data is found, combine it with base user data and return as AppUser
    // You might need to explicitly cast here if the selected data doesn't exactly match AppUser
    // or if there are conflicts (e.g., BaseUser.phoneNumber vs profiles.phone)
    // Ensure the 'role' field is correctly fetched and present in the data
     if (data && data.role) {
         // Assuming the 'profiles' table contains all fields for the specific role
         // and the 'role' field is correctly populated.
         return data as AppUser; // Cast the fetched data to the AppUser union
     } else {
         console.error("AuthContext: Fetched profile data is missing or has no role:", data);
         return null; // Return null if profile data is incomplete
     }
  };

  /** RESEND CONFIRMATION EMAIL */
  // Function to resend the confirmation email
  const resendConfirmationEmail = async () => {
    // Get the pending confirmation email from local storage
    const email = localStorage.getItem("pending-confirmation-email");
    // Throw error if no email is found
    if (!email) {
      throw new Error("No pending confirmation email found.");
    }

    // Call Supabase Auth signUp again with a dummy password to trigger resend
    const { error } = await supabase.auth.signUp({
      email,
      password: "dummyPassword", // Supabase workaround to trigger resend
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_BASE_URL + "/auth/complete-signup", // Redirect URL
      },
    });

    // Throw error if resend fails
    if (error) throw new Error(error.message);
  };

  // Provide the context value to the children
  return (
    <AuthContext.Provider
      value={{
        user,
        signOut,
        registerUser,
        loginUser,
        forgotPassword,
        resetPassword,
        changePhoneNumber,
        getUserProfile,
        resendConfirmationEmail,
      }}
    >
      {/* Show a loading indicator or null while checking auth */}
      {isCheckingAuth ? (
          // You might want a loading spinner or null here while auth is being checked
          // Returning null or a loading component prevents rendering protected content before auth check
          null // Or <LoadingSpinner />
      ) : (
          // Render children only after auth check is complete
          children
      )}
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
