import GlassComponent from "@/components/ui/glass";
import VendorSidebar from "@/components/vendor/Sidebar";
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <GlassComponent>
      <div className="flex w-full h-full p-0 m-0">
        <VendorSidebar />
        {children}
      </div>
    </GlassComponent>
  );
}
