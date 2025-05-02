"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import Logo from "@/public/images/logo.png";
import { supabase } from "@shared/supabaseClient";

const Header: React.FC = () => {
  const [session, setSession] = React.useState<any>(null);

  React.useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };
    getSession();
  }, []);

  return (
    <div className="w-full fixed top-0 left-0 flex items-center justify-between bg-gradient-to-br from-yellow-400 to-blue-500 shadow-2xl z-50 px-4">
      <Image
        src={Logo}
        alt="Logo"
        width={100}
        height={1000}scale-250
        className="w-24 h-24 scale-150"
      />
      {session ? (
        <Link href={session?.user?.user_metadata?.role} className="text-white font-bold">
          Dashboard
        </Link>
      ) : (
        <Link href="/auth/login" className="text-white font-bold">
          Login
        </Link>
      )}
    </div>
  );
};export default Header;
