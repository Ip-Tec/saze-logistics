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

// Define context interface
interface AuthContextProps {
  user: any;
  signIn: typeof signIn;
  signOut: typeof signOut;
  registerUser: (
    name: string,
    email: string,
    phone: string,
    password: string,
    role: string
  ) => Promise<any>;
  loginUser: (email: string, password: string) => Promise<any>;
  forgotPassword: (email: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { data: session } = useSession();
  const [user, setUser] = useState<any>(session?.user || null);

  useEffect(() => {
    setUser(session?.user || null);
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
      options: {
        data: { name, role },
      },
    });
    if (error) throw new Error(error.message);
    return data;
  };

  /** LOGIN USER */
  const loginUser = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
    return data;
  };

  /** FORGOT PASSWORD */
  const forgotPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(error.message);
  };

  return (
    <AuthContext.Provider
      value={{ user, signIn, signOut, registerUser, loginUser, forgotPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
