import React from "react";

export default function TextArea({
  label,
  value,
  onChange,
  disabled,
  required,
  className
}: {
  label: string;
  value: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block font-medium mb-1">{label}</label>
      <textarea
        className={`w-full border p-2 rounded bg-white/5 text-white ${className}`}
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled} required={required}
      />
    </div>
  );
}
