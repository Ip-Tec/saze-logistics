import React from "react";

interface GlassSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  children: React.ReactNode;
}

export default function GlassSelect({
  className = "",
  children,
  ...props
}: GlassSelectProps) {
  return (
    <select
      className={`w-full rounded-xl bg-white/10 px-4 py-2 backdrop-blur border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/30 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
