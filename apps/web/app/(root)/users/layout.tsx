"use client"; // This will ensure the component is treated as a client-side component.

import React from "react";
import { useAuthContext } from "@/context/AuthContext";

interface RootLayoutProps {
  children: React.ReactNode;
}

const UserLayout: React.FC<RootLayoutProps> = ({ children }) => {
  const { user } = useAuthContext();
  return (
    <div>
      UserLayout {children}
      <div>{user?.name}</div>
      <div>{user?.phone}</div>
      <div>{user?.role}</div>
      <div>{user?.email}</div>
      <div>{user?.secondPhone}</div>
      <div>{user?.created_at}</div>
    </div>
  );
};

export default UserLayout;
