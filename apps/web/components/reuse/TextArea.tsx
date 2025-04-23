import React from "react";

export default function TextArea({
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
      <textarea
        className="w-full border p-2 rounded bg-white/5 text-white"
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}
