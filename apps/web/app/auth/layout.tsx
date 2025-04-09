"use client";

import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="bg-gradient-to-br from-blue-500 to-yellow-500 min-h-screen flex items-center justify-center">
      {children}
    </div>
  );
};
export default AuthLayout;
