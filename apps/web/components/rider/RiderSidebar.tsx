// components/rider/Sidebar.tsx
import { Home, Package, Clock, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // to get the current pathname
import GlassDivClickable from "../ui/GlassDivClickable";
import { signOut } from "next-auth/react";

export default function RiderSidebar() {
  const pathname = usePathname(); // Get the current route

  // Function to handle the active class logic
  const getLinkClass = (path: string) => {
    return pathname === path
      ? "text-blue-600 bg-white/30 hover:bg-black/50" // Active state
      : "hover:text-blue-600 hover:bg-black/10"; // Inactive state
  };

  return (
    <aside className="w-60 bg-white/40 shadow-md h-full p-4 hidden md:block">
      {" "}
      <h1 className="text-gray-700 text-2xl font-bold mb-10">Vendor Panel</h1>
      <nav className="flex flex-col gap-4 relative h-full">
        {/* Dashboard Link */}
        <Link
          href="/rider/dashboard"
          className={`flex items-center gap-2 p-2 rounded-md ${getLinkClass("/rider/dashboard")}`}
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
        <GlassDivClickable
          onClick={signOut}
          className={`flex items-center absolute bottom-18 w-full bg-red-700/55 gap-2 p-2 rounded-md ${getLinkClass("/logout")}`}
        >
          <LogOut size={18} /> Logout
        </GlassDivClickable>
      </nav>
    </aside>
  );
}
