"use client";

import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { supabase } from "@shared/supabaseClient";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  secondPhone?: string;
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
  loginUser: (email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  changePhoneNumber: (newPhone: string) => Promise<void>;
  getUserProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { data: session } = useSession();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (session?.user) {
      getUserProfile().then(setUser);
    } else {
      setUser(null);
    }
  }, [session]);

  /** REGISTER USER */
  const registerUser = async (
    name: string,
    email: string,
    phone: string,
    password: string,
    role: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw new Error(error.message);

    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: data.user.id,
          name,
          phone,
          role,
        },
      ]);

      if (profileError) throw new Error(profileError.message);
    }
  };

  /** LOGIN USER */
  const loginUser = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);
    setUser(await getUserProfile());
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
      return null;
    }

    const userId = userData.user.id;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, email, phone, secondPhone, role, created_at")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error.message);
      return null;
    }

    return data;
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
