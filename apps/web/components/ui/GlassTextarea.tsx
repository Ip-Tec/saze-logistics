import React from "react";

interface GlassTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export default function GlassTextarea({
  className = "",
  ...props
}: GlassTextareaProps) {
  return (
    <textarea
      className={`w-full rounded-xl bg-white/10 px-4 py-2 backdrop-blur border border-white/20 text-white placeholder-white/60 resize-none focus:outline-none focus:ring-2 focus:ring-white/30 ${className}`}
      {...props}
    />
  );
}
