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
import { signIn, signOut, useSession } from "next-auth/react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  second_phone?: string;
  role: string;
  created_at: string;
}

interface AuthContextProps {
  user: UserProfile | null;
  signIn: typeof signIn;
  signOut: typeof signOut;
  registerUser: (
    name: string,
    email: string,
    phone: string,
    password: string,
    role: string
  ) => Promise<void>;
  loginUser: (email: string, password: string) => Promise<UserProfile>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  changePhoneNumber: (newPhone: string) => Promise<void>;
  getUserProfile: () => Promise<UserProfile | null>;
  resendConfirmationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { data: session } = useSession();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const publicRoutes = [
    "/",
    "/auth",
    "/auth/*",
    "/auth/login",
    "/auth/register",
    "/auth/confirm-email",
    "/auth/forgot-password",
  ];
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // If session exists, fetch profile, then turn off loading
    if (session?.user) {
      getUserProfile().then((u) => {
        setUser(u);
        setIsCheckingAuth(false);
      });
    } else {
      setIsCheckingAuth(false);
    }
  }, [session, isMounted]);

  useEffect(() => {
    // Don’t redirect while we’re still checking auth
    if (isCheckingAuth || user) return;

    const isPublic = publicRoutes.some((publicRoute) =>
      publicRoute.endsWith("/*")
        ? pathname.startsWith(publicRoute.replace("/*", ""))
        : pathname === publicRoute
    );
    if (!isPublic) {
      router.push("/auth/login");
    }
  }, [user, isMounted, isCheckingAuth, pathname, router]);

  /** REGISTER USER */
  const registerUser = async (
    name: string,
    email: string,
    phone: string,
    password: string,
    role: string
  ) => {
    localStorage.setItem("pending-confirmation-email", email);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone, role },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/complete-signup`,
      },
    });

    if (error) throw new Error(error.message);
  };

  /** LOGIN USER */
  const loginUser = async (
    email: string,
    password: string
  ): Promise<UserProfile> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log({ data, error });

    if (error) throw new Error(error.message);

    const profile = await getUserProfile();
    console.log({ profile });
    if (!profile) {
      throw new Error("Profile not found after login");
    }
    setUser(profile);
    return profile;
  };

  /** FORGOT PASSWORD */
  const forgotPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(error.message);
  };

  /** RESET PASSWORD */
  const resetPassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password,
    });
    if (error) throw new Error(error.message);
  };

  /** CHANGE PHONE NUMBER */
  const changePhoneNumber = async (newPhone: string) => {
    if (!user) throw new Error("User not authenticated");
    const { error } = await supabase
      .from("profiles")
      .update({ phone: newPhone })
      .eq("id", user.id);
    if (error) throw new Error(error.message);
    setUser(await getUserProfile());
  };

  /** GET USER PROFILE */
  const getUserProfile = async (): Promise<UserProfile | null> => {
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData?.user) {
      console.error("Error fetching authenticated user:", authError?.message);
      throw new Error(
        authError?.message || "Error fetching authenticated user"
      );
      return null;
    }
    const userId = userData.user.id;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    console.log({ data, error });
    if (error) {
      console.error("Error fetching user profile:", error.message);
      return null;
    }
    return data;
  };

  /** RESEND CONFIRMATION EMAIL */
  const resendConfirmationEmail = async () => {
    const email = localStorage.getItem("pending-confirmation-email");
    if (!email) {
      throw new Error(
        "No pending confirmation email found. Please try logging in."
      );
    }
    // This call uses signUp as a workaround. In production, you might implement a dedicated endpoint.
    const { data, error } = await supabase.auth.signUp({
      email,
      password: "dummyPassword", // Using a dummy value; in production consider a secure approach
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_BASE_URL + "/auth/complete-signup",
      },
    });
    if (error) throw new Error(error.message);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn,
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
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
