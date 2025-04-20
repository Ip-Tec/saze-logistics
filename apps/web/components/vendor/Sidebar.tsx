"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import GlassButton from "../ui/GlassButton";

const links = [
  { name: "Dashboard", href: "/vendor" },
  { name: "Orders", href: "/vendor/orders" },
  { name: "Menu", href: "/vendor/menu" },
  { name: "Setting", href: "/vendor/setting" },
];

export default function VendorSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuthContext();

  return (
    <div className="p-6 w-[18rem] h-[90vh] flex flex-col justify-between bg-black/10">
      <div>
        <h1 className="text-white text-2xl font-bold mb-10">Vendor Panel</h1>
        <nav className="flex flex-col gap-3">
          {links.map((link) => (
            <GlassButton
              key={link.name}
              href={link.href}
              className={`block text-left px-4 py-2 rounded-xl transition font-medium ${
                pathname === link.href
                  ? "!bg-white !text-orange-500 hover:!text-orange-300"
                  : "!text-orange-500/70 hover:!bg-orange-400 hover:!text-white"
              }`}
            >
              {link.name}
            </GlassButton>
          ))}
        </nav>
      </div>

      <GlassButton
        className="!text-white !bg-orange-500 hover:!text-orange-500 hover:!bg-orange-100/60 hover:border-orange-500 cursor-pointer rounded-2xl p-2 text-sm mt-10"
        onClick={async () => {
          await signOut();
        }}
      >
        Logout
      </GlassButton>
    </div>
  );
}
