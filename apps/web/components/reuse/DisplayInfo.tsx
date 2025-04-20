import React from "react";

export default function DisplayInfo({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <div className="space-y-2 text-gray-100">
      {items.map((item, idx) => (
        <div key={idx}>
          <p className="text-sm font-medium text-white">{item.label}</p>
          <p className="text-gray-300">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
