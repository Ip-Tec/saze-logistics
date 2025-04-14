"use client";

import { Minus, Plus } from "lucide-react";

interface QuantityPickerProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  className?: string;
}

export default function QuantityPicker({
  quantity,
  onIncrease,
  onDecrease,
  className = "",
}: QuantityPickerProps) {
  return (
    <div
      className={`flex items-center border border-gray-300 rounded-xl overflow-hidden ${className}`}
    >
      <button
        onClick={onDecrease}
        className="px-3 py-2 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        disabled={quantity <= 0}
      >
        <Minus size={18} />
      </button>
      <span className="px-4 min-w-[30px] text-center">{quantity}</span>
      <button
        onClick={onIncrease}
        className="px-3 py-2 text-gray-700 hover:bg-gray-100"
      >
        <Plus size={18} />
      </button>
    </div>
  );
}
