"use client";

import React from "react";
import { AuthProvider } from "@/context/AuthContext"; // Adjust path if needed

const Providers = ({ children }: { children: React.ReactNode }) => {
  return <AuthProvider>{children}</AuthProvider>;
};

export default Providers;
