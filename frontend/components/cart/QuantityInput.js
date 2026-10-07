'use client';
import { Minus, Plus } from 'lucide-react';

export default function QuantityInput({ value, onChange, max = 20, min = 1, disabled = false, size = 'md', label = 'Quantity' }) {
  const s = size === 'sm' ? 'size-9' : 'size-12';
  const btn = `${s} flex cursor-pointer items-center justify-center hover:bg-bone disabled:cursor-not-allowed disabled:opacity-40`;
  return (
    <div className="inline-flex items-center border border-black" role="group" aria-label={label}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={disabled || value <= min} aria-label="Decrease quantity">
        <Minus className="size-4" />
      </button>
      <span className={`${size === 'sm' ? 'w-8' : 'w-10'} text-center font-bold tabular-nums`} aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={disabled || value >= max} aria-label="Increase quantity">
        <Plus className="size-4" />
      </button>
    </div>
  );
}
