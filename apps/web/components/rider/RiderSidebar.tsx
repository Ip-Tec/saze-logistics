// components/rider/Sidebar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, Clock, LogOut, Menu, X } from "lucide-react"; // Added Menu and X icons
import { useAuthContext } from "@/context/AuthContext";
import GlassButton from "../ui/GlassButton";
import { useState, useEffect } from "react"; // Import useState and useEffect

export default function RiderSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuthContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State to manage sidebar visibility on mobile

  // Close sidebar when the route changes (important for mobile navigation)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Function to handle the active class logic
  const getLinkClass = (path: string) => {
    return pathname === path
      ? "text-orange-600 bg-white/30 hover:bg-white" // Active state
      : "hover:text-orange-600 hover:bg-black/10"; // Inactive state
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white/50 backdrop-blur-md shadow-lg text-gray-700 hover:bg-white"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Overlay (visible only on mobile when sidebar is open) */}
      {isSidebarOpen && (
        <div
          className="fixed h-screen inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`
          w-full md:w-60 bg-white/40 shadow-md h-screen md:h-auto p-4 fixed top-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
          md:static md:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <h1 className="text-gray-700 text-2xl font-bold mb-10">Rider Panel</h1>
        <nav className="flex flex-col gap-4 relative h-auto">
          {/* Dashboard Link */}
          <Link
            href="/rider"
            className={`flex items-center gap-2 p-2 rounded-md ${getLinkClass("/rider")}`}
            onClick={() => setIsSidebarOpen(false)} // Close sidebar on link click (optional, handled by useEffect)
          >
            <Home size={18} /> Dashboard
          </Link>

          {/* Current Order Link */}
          <Link
            href="/rider/current-order"
            className={`flex items-center gap-2 p-2 rounded-md ${getLinkClass("/rider/current-order")}`}
            onClick={() => setIsSidebarOpen(false)} // Close sidebar on link click (optional, handled by useEffect)
          >
            <Package size={18} /> Current Order
          </Link>

          {/* History Link */}
          <Link
            href="/rider/history"
            className={`flex items-center gap-2 p-2 rounded-md ${getLinkClass("/rider/history")}`}
            onClick={() => setIsSidebarOpen(false)} // Close sidebar on link click (optional, handled by useEffect)
          >
            <Clock size={18} /> History
          </Link>

          {/* Settings Link */}
          <Link
            href="/rider/setting"
            className={`flex items-center gap-2 p-2 rounded-md ${getLinkClass("/rider/setting")}`}
            onClick={() => setIsSidebarOpen(false)} // Close sidebar on link click (optional, handled by useEffect)
          >
            <Clock size={18} /> Settings
          </Link>

          {/* Logout Button */}
          {/* Adjusted position to be relative to the sidebar content */}
          <GlassButton
            className="!text-white !bg-orange-500 hover:!text-orange-500 hover:!bg-orange-100/60 hover:border-orange-500 cursor-pointer rounded-2xl flex items-center justify-center gap-2 m-auto w-full"
            onClick={async () => {
              await signOut();
              setIsSidebarOpen(false);
            }}
          >
            <LogOut size={18} /> Logout
          </GlassButton>
        </nav>
      </aside>
    </>
  );
}
