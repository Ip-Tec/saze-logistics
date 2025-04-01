import React from "react";
import Image from "next/image";
import Logo from "@/public/images/logo.png";
const Header = () => {
  return (
    <div className="w-full fixed top-0 left-0 flex items-center justify-between bg-gradient-to-br from-yellow-400 to-blue-500 shadow-2xl z-50">
      <Image
        src={Logo}
        alt="Logo"
        width={100}
        height={100}
        className="w-16 h-16"
      />
    </div>
  );
};

export default Header;
