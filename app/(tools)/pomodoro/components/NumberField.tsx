"use client";
import { input } from "@/lib/ui/classes";

interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}

export function NumberField({ label, value, min, max, onChange }: NumberFieldProps) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))}
        className={input}
      />
    </label>
  );
}