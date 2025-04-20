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
  signOut: () => Promise<void>;
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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
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

  /** CHECK CURRENT SESSION */
  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const profile = await getUserProfile();
        setUser(profile);
      }

      setIsCheckingAuth(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          const profile = await getUserProfile();
          setUser(profile);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  /** REDIRECT IF NOT AUTHENTICATED */
  useEffect(() => {
    if (isCheckingAuth) return;

    const isPublic = publicRoutes.some((route) =>
      route.endsWith("/*")
        ? pathname.startsWith(route.replace("/*", ""))
        : pathname === route
    );

    if (!isPublic && !user) {
      router.push("/auth/login");
    }
  }, [user, isCheckingAuth, pathname, router]);

  /** REGISTER USER */
  const registerUser = async (
    name: string,
    email: string,
    phone: string,
    password: string,
    role: string
  ) => {
    localStorage.setItem("pending-confirmation-email", email);

    const { error } = await supabase.auth.signUp({
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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);

    const profile = await getUserProfile();
    if (!profile) throw new Error("Profile not found after login");
    setUser(profile);
    return profile;
  };

  /** SIGN OUT */
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    setUser(null);
    router.push("/auth/login");
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
    const { error } = await supabase.auth.updateUser({ password });
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
      throw new Error(authError?.message || "Unable to get authenticated user");
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userData.user.id)
      .single();

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
      throw new Error("No pending confirmation email found.");
    }

    const { error } = await supabase.auth.signUp({
      email,
      password: "dummyPassword", // Supabase workaround
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
