import React from "react";

interface GlassDivClickableProps {
  children: React.ReactNode;
  className?: string;
  onClick: () => void; // onClick handler prop
}

export default function GlassDivClickable({
  children,
  className = "",
  onClick,
}: GlassDivClickableProps) {
  return (
    <div
      className={`rounded-2xl bg-white/10 p-5 backdrop-blur border border-white/20 shadow-md cursor-pointer ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
