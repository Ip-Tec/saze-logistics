import GlassComponent from "@/components/ui/glass";
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <GlassComponent
    >
      {children}
    </GlassComponent>
  );
}
