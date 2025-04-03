"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/context/AuthContext";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="bg-gradient-to-br from-blue-500 to-yellow-500 min-h-screen flex items-center justify-center">
      <SessionProvider>
        <AuthProvider>{children}</AuthProvider>
      </SessionProvider>
    </div>
  );
};
export default AuthLayout;
