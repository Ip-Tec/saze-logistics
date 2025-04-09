"use client"; // This will ensure the component is treated as a client-side component.

import React from "react";
import { useAuthContext } from "@/context/AuthContext";
import GlassComponent from "@/components/ui/glass";

interface RootLayoutProps {
  children: React.ReactNode;
}

const UserLayout: React.FC<RootLayoutProps> = ({ children }) => {
  const { user } = useAuthContext();
  return (
    <GlassComponent>
      {children}
    </GlassComponent>
  );
};

export default UserLayout;
