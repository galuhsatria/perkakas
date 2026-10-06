import { ReactNode } from "react";

const thumb =
  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-md [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-edge [&::-webkit-slider-thumb]:bg-fg [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab " +
  "[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-md [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-edge [&::-moz-range-thumb]:bg-fg [&::-moz-range-thumb]:cursor-grab";

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md border border-edge bg-base px-1.5 py-0.5 font-mono text-[11px] font-semibold text-muted">
      {children}
    </span>
  );
}

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  className?: string;
  stack?: boolean;
};

export function RangeField({ label, value, min, max, step = 1, unit = "", onChange, className = "", stack }: Props) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div
      className={`${
        stack
          ? "flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          : "flex items-center justify-between gap-4"
      } ${className}`}
    >
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-sm font-bold">{label}</span>
        <Badge>{`${value}${unit}`}</Badge>
      </div>
      <div className={`relative flex h-5 w-full items-center ${stack ? "sm:max-w-[200px]" : "max-w-[200px]"}`}>
        <div className="absolute inset-x-0 h-1.5 overflow-hidden rounded-full border border-edge bg-base">
          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <input
          type="range"
          aria-label={label}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`relative h-5 w-full cursor-pointer appearance-none bg-transparent outline-none focus-visible:[&::-webkit-slider-thumb]:ring-2 focus-visible:[&::-webkit-slider-thumb]:ring-primary ${thumb}`}
        />
      </div>
    </div>
  );
}
