"use client";

import React from "react";
import { CartProvider } from "@/context/CartContext";

interface RootLayoutProps {
  children: React.ReactNode;
}

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <CartProvider>
      <div>{children}</div>
    </CartProvider>
  );
};

export default RootLayout;
