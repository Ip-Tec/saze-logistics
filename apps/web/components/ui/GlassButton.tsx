import Link from "next/link";
import React from "react";

interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
  href?: string;
}

export default function GlassButton({
  children,
  className = "",
  href,
  ...props
}: GlassButtonProps) {
    
  const baseClass = `rounded-xl cursor-pointer bg-white/10 px-4 py-2 backdrop-blur border border-white/20 shadow-md text-white hover:bg-white hover:text-black transition-all ${className}`;

  if (href) {
    return (
      <Link href={href} className={baseClass}>
        {children}
      </Link>
    );
  }

  return (
    <button className={baseClass} {...props}>
      {children}
    </button>
  );
}
