import React from "react";

export default function InputPassword({
  label,
  value,
  onChange,
  disabled
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block font-medium mb-1">{label}</label>
      <input
        type="password"
        className={`w-full border p-2 rounded bg-white/5 ${disabled ? "bg-gray-300/50 cursor-not-allowed" : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
