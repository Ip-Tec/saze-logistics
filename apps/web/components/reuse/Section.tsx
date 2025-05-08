import React from "react";

export default function Section({
  title,
  children,
  className = "",
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-lg font-semibold">{title}</h3>
      {children}
    </div>
  );
}
