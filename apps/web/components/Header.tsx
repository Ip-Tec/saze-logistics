"use client";

import Link from "next/link";
import React, { useState } from "react";
import { Menu, X } from "lucide-react";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <header className="w-full bg-orange-500 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-white">
          Sazee Logistics
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex space-x-6">
          <Link
            href="/auth"
            className="text-white hover:text-yellow-100 font-medium"
          >
            Join Us
          </Link>
          {/* <Link
            href="/services"
            className="text-white hover:text-yellow-100 font-medium"
          >
            Services
          </Link>
          <Link
            href="/auth"
            className="text-white hover:text-yellow-100 font-medium"
          >
            Become a Partner
          </Link>
          <Link
            href="/contact"
            className="text-white hover:text-yellow-100 font-medium"
          >
            Contact
          </Link> */}
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-white" onClick={toggleMenu}>
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Links */}
      {menuOpen && (
        <nav className="md:hidden flex flex-col bg-orange-400 px-4 pb-4 space-y-3">
          <Link
            href="#track"
            className="text-white hover:text-yellow-100 font-medium"
          >
            Track Package
          </Link>
        
        </nav>
      )}
    </header>
  );
};

export default Header;
