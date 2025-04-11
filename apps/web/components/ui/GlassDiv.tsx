import React from "react";

export default function GlassDiv({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`"rounded-2xl bg-white/10 p-5 backdrop-blur border border-white/20 shadow-md " ${className}`}
    >
      {children}
    </div>
  );
}
