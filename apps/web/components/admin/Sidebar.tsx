"use client";

import MobileMenu from "./MobileMenu";
import SidebarItem from "./SidebarItem";
import { useState, useEffect, ReactNode } from "react";
import GlassButton from "../ui/GlassButton";
import {
  Bell,
  ClipboardList,
  CreditCard,
  FileText,
  Home,
  LogOut,
  Menu,
  Settings,
  Shield,
  Truck,
  Users,
  X,
} from "lucide-react";
import { supabaseFE } from "@shared/supabaseClient";
import { useAuthContext } from "@/context/AuthContext";

interface NavItem {
  name: string;
  href: string;
  roles: string[];
  icon?: ReactNode;
}

const ALL_NAV: NavItem[] = [
  {
    name: "Dashboard",
    icon: <Home size={20} />,
    href: "/admin",
    roles: ["admin", "supporter"],
  },
  // {
  //   name: "People",
  //   icon: <Users size={20} />,
  //   href: "/admin/people",
  //   roles: ["admin"],
  // },
  {
    name: "Users",
    icon: <Users size={20} />,
    href: "/admin/users",
    roles: ["admin"],
  },
  {
    name: "Vendors",
    href: "/admin/vendors",
    icon: <ClipboardList size={20} />,
    roles: ["admin", "supporter"],
  },
  {
    name: "Riders",
    icon: <Truck size={20} />,
    href: "/admin/riders",
    roles: ["admin", "supporter"],
  },
  {
    href: "/admin/products",
    name: "Products & Categories",
    icon: <FileText size={20} />,
    roles: ["admin", "supporter"],
  },
  {
    href: "/admin/orders",
    name: "Orders & Deliveries",
    icon: <FileText size={20} />,
    roles: ["admin", "supporter"],
  },
  {
    href: "/admin/payments",
    roles: ["admin"],
    icon: <CreditCard size={20} />,
    name: "Payments & Transactions",
  },
  {
    href: "/admin/reports",
    roles: ["admin"],
    name: "Analytics & Reports",
    icon: <FileText size={20} />,
  },
  {
    name: "Content Management",
    href: "/admin/content",
    roles: ["admin", "supporter"],
    icon: <FileText size={20} />,
  },
  {
    name: "Notifications & Support",
    href: "/admin/support",
    roles: ["admin", "supporter"],
    icon: <Bell size={20} />,
  },
  {
    name: "Settings & Configuration",
    href: "/admin/settings",
    roles: ["admin"],
    icon: <Settings size={20} />,
  },
  {
    name: "Security & Logs",
    href: "/admin/security",
    roles: ["admin"],
    icon: <Shield size={20} />,
  },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, signOut, isCheckingAuth } = useAuthContext();

  useEffect(() => {
    console.log("AuthContext.user →", { user });
    // Only log once the initial auth check is done
    if (!isCheckingAuth) {
      console.log("🔐 AuthContext.user →", user);
    }
  }, [isCheckingAuth, user]);

  useEffect(() => {
    let isMounted = true;

    async function loadRole() {
      // Use the user from context instead
      if (!isMounted) return;

      // 2. If no user logged in → guest
      if (!user) {
        setNavItems(ALL_NAV.filter((it) => it.roles.includes("guest")));
        setLoading(false);
        return;
      }

      // 3. We already fetched role in context, so we can skip calling Supabase again.
      //    Directly filter by user.role:
      setNavItems(ALL_NAV.filter((it) => it.roles.includes(user.role)));
      setLoading(false);
    }

    loadRole();

    // re-run whenever user or isCheckingAuth changes
  }, [user, isCheckingAuth]);

  return (
    <>
      {/* Mobile toggler */}
      <div className="md:hidden p-4 flex justify-between items-center border-b border-gray-800 bg-gray-900 glass-scrollbar">
        <button onClick={() => setOpen((o) => !o)}>
          {open ? (
            <X size={24} className="text-white z-50" />
          ) : (
            <Menu size={24} className="text-white" />
          )}
        </button>
        <span className="text-lg font-semibold text-white">
          {loading ? "Loading..." : "Admin Panel"}
        </span>
      </div>

      {/* Mobile menu overlay */}
      <MobileMenu
        open={open}
        navItems={navItems}
        onClose={() => setOpen(false)}
      />

      {/* Desktop sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-gray-900 text-white shadow-xl z-50
          transform transition-transform duration-300 ease-in-out glass-scrollbar w-full
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:w-64
        `}
      >
        <div className="h-full overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>

            <button onClick={() => setOpen((o) => !o)}>
              {open && <X size={24} className="text-white" />}
            </button>
          </div>

          {loading ? (
            <div className="text-gray-400">Loading…</div>
          ) : (
            navItems.map((item) => (
              <SidebarItem
                key={item.href}
                name={item.name}
                href={item.href}
                icon={item.icon}
              />
            ))
          )}
          <GlassButton
            className="!text-white !bg-orange-500 hover:!text-orange-500 hover:!bg-white hover:border-none cursor-pointer rounded-2xl p-2 text-sm mt-6 md:mt-10 w-full flex items-center justify-center gap-2  z-20"
            onClick={async () => {
              await signOut();
            }}
          >
            {/* Add a Logout icon for consistency with RiderSidebar */}
            <LogOut size={18} /> Logout
          </GlassButton>
        </div>
      </aside>
    </>
  );
}
