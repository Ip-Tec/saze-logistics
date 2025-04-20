import React from 'react'

export default function Input({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
  }) {
    return (
      <div>
        <label className="block font-medium mb-1">{label}</label>
        <input
          type="text"
          className="w-full border p-2 rounded bg-white/5 text-white"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }
  
  
