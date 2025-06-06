import React from 'react'

export default function Input({
    label,
    value,
    divClass,
    onChange,
    disabled,
    readOnly,
    inputClass,
    required,
    maxLength,
    placeholder
  }: {
    label: string;
    value: string;
    divClass?: string;
    inputClass?: string;
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    maxLength?: number;
    placeholder?: string;
    onChange: (v: string) => void;
  }) {
    return (
      <div className={divClass}>
        <label className="block font-medium mb-1">{label}</label>
        <input
          type="text"
          className={`w-full border p-2 rounded bg-white/5 text-white ${inputClass}`}
          value={value}
          onChange={(e) => onChange(e.target.value)} disabled={disabled} readOnly={readOnly} required={required} placeholder={placeholder} maxLength={maxLength}
        />
      </div>
    );
  }
  
  
