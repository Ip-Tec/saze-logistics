import React from "react";

export default function GlassDiv({
  children,
  className = "",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  return (
    <div
      className={`"rounded-2xl bg-white/10 p-5 backdrop-blur border border-white/20 shadow-md " ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
