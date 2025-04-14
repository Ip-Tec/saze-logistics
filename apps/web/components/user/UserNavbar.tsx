// components/UserNavbar.tsx
"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, Utensils, X } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";

export default function UserNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { signOut } = useAuthContext();

  return (
    <nav className="w-full bg-white shadow-md fixed top-0 left-0 z-50">
      <div className="w-auto mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/"
            className="flex text-2xl gap-4 font-bold text-orange-600"
          >
            <Utensils size={22} /> <span> Order Food</span>
          </Link>
        </div>
        <div className="hidden md:flex space-x-6 text-sm font-medium">
          <Link href="/user" className="hover:text-primary">
            Home
          </Link>
          <Link href="/user/orders" className="hover:text-primary">
            Orders
          </Link>
          <Link href="/user/cart" className="hover:text-primary">
            Cart
          </Link>
          <Link href="/user/profile" className="hover:text-primary">
            Profile
          </Link>
          <button
            className="hover:text-red-500"
            onClick={async () => {
              await signOut();
            }}
          >
            Logout
          </button>
        </div>
        {/* Mobile menu icon */}
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-md border-t border-gray-200">
          <ul className="flex flex-col p-4 space-y-4 text-sm font-medium">
            <li>
              <Link href="user/" onClick={() => setIsOpen(false)}>
                Home
              </Link>
            </li>
            <li>
              <Link href="/user/orders" onClick={() => setIsOpen(false)}>
                Orders
              </Link>
            </li>
            <li>
              <Link href="/user/cart" onClick={() => setIsOpen(false)}>
                Cart
              </Link>
            </li>
            <li>
              <Link href="/user/profile" onClick={() => setIsOpen(false)}>
                Profile
              </Link>
            </li>
            <li>
              <button
                className="text-left text-red-500"
                onClick={async () => {
                  await signOut();
                }}
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
