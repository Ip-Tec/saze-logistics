"use client";

import Link from "next/link";
import React from "react";

const Header = () => {
  return (
    <header className="w-full px-8 py-4 flex justify-between items-center shadow-md bg-orange-400">
      <Link href="/" className="text-xl font-bold text-white">
        Sazee Logistics
      </Link>
      <nav className="flex space-x-6">
        <Link
          href="/track"
          className="text-white hover:text-gray-100 font-medium"
        >
          Track Package
        </Link>
        <Link
          href="/services"
          className="text-white hover:text-gray-100 font-medium"
        >
          Services
        </Link>
        <Link
          href="/partner"
          className="text-white hover:text-gray-100 font-medium"
        >
          Become a Partner
        </Link>
        <Link
          href="/contact"
          className="text-white hover:text-gray-100 font-medium"
        >
          Contact
        </Link>
      </nav>
    </header>
  );
};

export default Header;
