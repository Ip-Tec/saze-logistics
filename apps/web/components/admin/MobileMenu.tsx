// components/admin/MobileMenu.tsx

"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";

interface MobileMenuProps {
  open: boolean;
  navItems: { name: string; href: string }[];
  onClose: () => void;
}

export default function MobileMenu({
  open,
  navItems,
  onClose,
}: MobileMenuProps) {
  const pathname = usePathname();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 text-white overflow-y-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold">Admin Menu</h2>
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="p-2 hover:bg-gray-800 rounded-md"
        >
          <X size={24} />
        </button>
      </div>

      {/* Links */}
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 rounded-md text-base font-medium transition-colors
                  ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
              onClick={onClose}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
