"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import Logo from "@/public/images/logo.png";
import { useSession } from "next-auth/react";

const Header: React.FC = () => {
  const { data: session } = useSession();

  return (
    <div className="w-full fixed top-0 left-0 flex items-center justify-between bg-gradient-to-br from-yellow-400 to-blue-500 shadow-2xl z-50 px-4">
      <Image
        src={Logo}
        alt="Logo"
        width={100}
        height={100}
        className="w-16 h-16"
      />
      {session ? (
        <Link href="/dashboard" className="text-white font-bold">
          Dashboard
        </Link>
      ) : (
        <Link href="/auth/login" className="text-white font-bold">
          Login
        </Link>
      )}
    </div>
  );
};

export default Header;
