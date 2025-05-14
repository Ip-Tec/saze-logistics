// components/admin/SidebarItem.tsx

"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

interface SidebarItemProps {
  name: string;
  href: string;
  icon?: ReactNode;
}

export default function SidebarItem({ name, href, icon }: SidebarItemProps) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={`
            flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors
            ${
              active
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }
          `}
    >
      {icon && <span className="mr-3">{icon}</span>}
      <span>{name}</span>
    </Link>
  );
}
