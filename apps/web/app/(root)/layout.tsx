"use client";

import React from "react";
import { CartProvider } from "@/context/CartContext";
import { NotificationProvider } from "@/context/NotificationContext";

interface RootLayoutProps {
  children: React.ReactNode;
}

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <CartProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </CartProvider>
  );
};

export default RootLayout;
