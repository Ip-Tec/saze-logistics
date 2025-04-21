import React from "react";

export default function DisplayInfo({
  items,
  children,
  className = "",
  classNameLabel = "",
  classNameValue = "",
}: {
  items: { label: string; value: string, icon?: React.ReactNode, link?: string }[];
  children?: React.ReactNode;
  className?: string;
  classNameLabel?: string;
  classNameValue?: string;
}) {
  return (
    <div className={`space-y-2 text-gray-100 ${className}`}>
      {items.map((item, idx) => (
        <div key={idx}>
          <p className={`text-sm font-medium text-white ${classNameLabel}`}>
            {item.label}
          </p>
          <p className={`text-gray-300 ${classNameValue}`}>{item.value}</p>
        </div>
      ))}
      {children} {/* Render children here */}
    </div>
  );
}
