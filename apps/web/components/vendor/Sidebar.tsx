"use client";
import { useRouter, usePathname } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
const links = [
  { name: "Dashboard", href: "/vendor" },
  { name: "Orders", href: "/vendor/orders" },
  { name: "Menu", href: "/vendor/menu" },
  { name: "Settings", href: "/vendor/settings" },
];

export default function VendorSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useAuthContext();

  return (
    <div className="p-6 w-[18rem] h-[90vh] flex flex-col justify-between bg-black/30">
      <div>
        <h1 className="text-white text-2xl font-bold mb-10">Vendor Panel</h1>
        <nav className="flex flex-col gap-3">
          {links.map((link) => (
            <button
              key={link.name}
              onClick={() => router.push(link.href)}
              className={`text-left px-4 py-2 rounded-xl transition cursor-pointer font-medium ${
                pathname === link.href
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:bg-white/10"
              }`}
            >
              {link.name}
            </button>
          ))}
        </nav>
      </div>

      <button
        className="text-red-400 bg-rose-50 hover:text-red-500 cursor-pointer rounded-2xl p-2 text-sm mt-10"
        onClick={async () => {
          await signOut();
        }}
      >
        Logout
      </button>
    </div>
  );
}
