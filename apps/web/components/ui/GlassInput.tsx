import React from "react";

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export default function GlassInput({
  className = "",
  ...props
}: GlassInputProps) {
  return (
    <input
      className={`w-full rounded-xl bg-white/10 px-4 py-2 backdrop-blur border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 ${className}`}
      {...props}
    />
  );
}
