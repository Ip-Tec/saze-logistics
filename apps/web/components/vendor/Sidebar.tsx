// components/vendor/VendorSidebar.tsx
"use client";

import { usePathname } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import GlassButton from "../ui/GlassButton";
// Import icons for mobile toggle
import { LogOut, Menu, X } from "lucide-react";
// Import useState and useEffect for managing mobile sidebar state
import { useState, useEffect } from "react";

const links = [
  { name: "Dashboard", href: "/vendor" },
  { name: "Orders", href: "/vendor/orders" },
  { name: "Menu", href: "/vendor/menu" },
  { name: "Setting", href: "/vendor/setting" },
];

export default function VendorSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuthContext();
  // State to manage sidebar visibility on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar when the route changes (important for mobile navigation)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Function to handle the active class logic (can be simplified or kept)
  // Keeping it for consistency with your RiderSidebar
  const getLinkClass = (path: string) => {
    return pathname === path
      ? "!bg-white !text-orange-500 hover:!text-orange-300" // Active state
      : "!text-orange-500/70 hover:!bg-orange-400 hover:!text-white"; // Inactive state
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      {/* Mobile Menu Button (visible only on small screens) */}
      <button
        className="md:hidden fixed top-4 left-4 z-[90] p-2 rounded-md bg-white/50 backdrop-blur-md shadow-lg text-gray-700 hover:bg-white"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        {isSidebarOpen ? (
          <X size={24} className="text-red-500" />
        ) : (
          <Menu size={24} />
        )}
      </button>

      {/* Sidebar Overlay (visible only on mobile when sidebar is open) */}
      {isSidebarOpen && (
        <div
          className="fixed h-screen inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleSidebar} // Close sidebar when clicking overlay
          aria-hidden="true"
        ></div>
      )}

      {/* Main container div (Sidebar) */}
      {/*
        On medium screens (md) and up:
        - w-[18rem], h-[90vh]
        - md:flex md:relative md:translate-x-0 md:z-auto (visible, static)

        On small screens (default):
        - w-full, h-screen
        - fixed top-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        - Initially hidden (-translate-x-full)
        - Visibility controlled by isSidebarOpen state (translate-x-0 when open)
      */}
      <div
        className={`
        p-6 w-full h-screen flex flex-col justify-between overflow-y-auto
        bg-black/10 text-white 
        md:w-[18rem] md:h-[90vh] md:flex md:relative md:translate-x-0 md:z-auto 
        fixed top-0 left-0 z-50 transform transition-transform duration-300 ease-in-out 
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
    `}
      >
        <div>
          {/* Adjust heading size for smaller screens */}
          <h1 className="text-xl md:text-2xl font-bold mb-6 md:mb-10">
            Vendor Panel
          </h1>

          {/* Optional: Add a close button inside the sidebar for mobile */}
          {/* This is an alternative to the fixed button and overlay click */}

          {isSidebarOpen && (
            <button
              onClick={toggleSidebar} // Or setIsSidebarOpen(false)
              className="absolute top-4 right-4 text-white md:hidden focus:outline-none"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          )}

          {/* Navigation links */}
          <nav className="flex flex-col gap-3">
            {links.map((link) => (
              <GlassButton
                className={`block text-left px-4 py-2 rounded-xl transition font-medium w-full
                  ${getLinkClass(link.href)} 
              `}
                onClick={() => setIsSidebarOpen(false)}
                key={link.name}
                href={link.href}
              >
                {link.name}
              </GlassButton>
            ))}
          </nav>
        </div>

        {/* Logout button */}
        <GlassButton
          className="
            !text-white !bg-orange-500 hover:!text-orange-500 hover:!bg-orange-100/60 hover:border-orange-500
            cursor-pointer rounded-2xl p-2 text-sm mt-6 md:mt-10 w-full // Ensure full width on mobile
            flex items-center justify-center gap-2 // Added flex properties for icon alignment
        "
          onClick={async () => {
            await signOut();
            setIsSidebarOpen(false); // Close sidebar after logout
          }}
        >
          {/* Add a Logout icon for consistency with RiderSidebar */}
          <LogOut size={18} /> Logout
        </GlassButton>
      </div>
    </>
  );
}
