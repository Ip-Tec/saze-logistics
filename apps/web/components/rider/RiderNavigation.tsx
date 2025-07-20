"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, Clock, User, LogOut } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import GlassButton from "../ui/GlassButton";

// Define navigation items in an array for cleaner code
const navItems = [
  { href: "/rider", label: "Dashboard", icon: Home },
  { href: "/rider/current-order", label: "Current", icon: Package },
  { href: "/rider/history", label: "History", icon: Clock },
  { href: "/rider/setting", label: "Profile", icon: User },
];

export default function RiderNavigation() {
  const pathname = usePathname();
  const { signOut } = useAuthContext();

  // --- 1. Mobile Bottom Navigation ---
  const MobileBottomNav = () => (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/60 backdrop-blur-md border-t border-gray-200/80 shadow-t-lg">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 w-full text-xs font-medium transition-colors ${
                isActive ? "text-orange-600" : "text-gray-500 hover:text-orange-500"
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );

  // --- 2. Desktop Sidebar (Your old sidebar, simplified) ---
  const DesktopSidebar = () => {
    const getLinkClass = (path: string) => {
      return pathname === path
        ? "text-orange-600 bg-white/30" // Active state
        : "text-gray-700 hover:text-orange-600 hover:bg-black/10"; // Inactive state
    };

    return (
      <aside className="hidden md:flex flex-col w-60 bg-white shadow-lg p-4 h-full">
        <h1 className="text-gray-700 text-2xl font-bold mb-10">Rider Panel</h1>
        <nav className="flex flex-col flex-grow gap-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-lg font-semibold transition-colors ${getLinkClass(
                item.href
              )}`}
            >
              <item.icon size={20} /> {item.label}
            </Link>
          ))}
        </nav>
        
        {/* Logout Button pushed to the bottom */}
        <div className="mt-auto">
          <GlassButton
            className="!text-white !bg-orange-500 hover:!bg-orange-100/60 hover:!text-orange-500 w-full flex items-center justify-center gap-2"
            onClick={signOut}
          >
            <LogOut size={18} /> Logout
          </GlassButton>
        </div>
      </aside>
    );
  };
  
  // --- 3. Render Both ---
  // Tailwind's responsive classes will handle showing the correct one.
  return (
    <>
      <DesktopSidebar />
      <MobileBottomNav />
    </>
  );
}