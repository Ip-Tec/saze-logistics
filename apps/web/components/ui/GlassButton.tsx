import React from "react";

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
}

export default function GlassButton({
  children,
  className = "",
  ...props
}: GlassButtonProps) {
  return (
    <button
      className={`rounded-xl bg-white/10 px-4 py-2 backdrop-blur border border-white/20 shadow-md text-white hover:bg-white/20 transition-all ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
