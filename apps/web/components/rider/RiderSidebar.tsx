// components/rider/Sidebar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, Clock, LogOut } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import GlassButton from "../ui/GlassButton";

export default function RiderSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuthContext();

  // Function to handle the active class logic
  const getLinkClass = (path: string) => {
    return pathname === path
      ? "text-orange-600 bg-white/30 hover:bg-white" // Active state
      : "hover:text-orange-600 hover:bg-black/10"; // Inactive state
  };

  return (
    <aside className="w-60 bg-white/40 shadow-md h-full p-4 hidden md:block">
      {" "}
      <h1 className="text-gray-700 text-2xl font-bold mb-10">Rider Panel</h1>
      <nav className="flex flex-col gap-4 relative h-full">
        {/* Dashboard Link */}
        <Link
          href="/rider"
          className={`flex items-center gap-2 p-2 rounded-md ${getLinkClass("/rider")}`}
        >
          <Home size={18} /> Dashboard
        </Link>

        {/* Current Order Link */}
        <Link
          href="/rider/current-order"
          className={`flex items-center gap-2 p-2 rounded-md ${getLinkClass("/rider/current-order")}`}
        >
          <Package size={18} /> Current Order
        </Link>

        {/* History Link */}
        <Link
          href="/rider/history"
          className={`flex items-center gap-2 p-2 rounded-md ${getLinkClass("/rider/history")}`}
        >
          <Clock size={18} /> History
        </Link>

        {/* Settings Link */}
        <Link
          href="/rider/setting"
          className={`flex items-center gap-2 p-2 rounded-md ${getLinkClass("/rider/setting")}`}
        >
          <Clock size={18} /> Settings
        </Link>

        {/* Logout Link */}
        <GlassButton
          className="!text-white !bg-orange-500 hover:!text-orange-500 hover:!bg-orange-100/60 hover:border-orange-500 cursor-pointer rounded-2xl flex items-center absolute bottom-24 w-full h-8"
          onClick={async () => {
            await signOut();
          }}
        >
          Logout
        </GlassButton>
      </nav>
    </aside>
  );
}
