"use client";

import React from "react";

interface RootLayoutProps {
  children: React.ReactNode;
}

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default RootLayout;
