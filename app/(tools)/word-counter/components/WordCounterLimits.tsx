"use client";
import { card } from "@/lib/ui/classes";
import { LIMITS } from "../constants";

interface WordCounterLimitsProps {
  limitId: string;
  onLimitChange: (id: string) => void;
  stats: { chars: number };
}

export function WordCounterLimits({ limitId, onLimitChange, stats }: WordCounterLimitsProps) {
  const limit = LIMITS.find((l) => l.id === limitId)!;
  const over = limit.max > 0 && stats.chars > limit.max;
  const pct = limit.max > 0 ? Math.min(100, (stats.chars / limit.max) * 100) : 0;
  const barColor = over ? "bg-red-500" : pct >= 90 ? "bg-yellow-400" : "bg-primary";

  return (
    <section className={`${card} flex flex-col gap-4`}>
      <h2 className="font-bold">Character limit</h2>
      <div role="radiogroup" aria-label="Character limit" className="flex flex-wrap gap-2">
        {LIMITS.map((l) => (
          <button
            key={l.id}
            type="button"
            role="radio"
            aria-checked={limitId === l.id}
            onClick={() => onLimitChange(l.id)}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
              limitId === l.id
                ? "border-primary bg-primary/15 font-semibold text-primary"
                : "border-edge text-muted hover:text-fg"
            }`}
          >
            {l.max ? `${l.label} (${l.max})` : l.label}
          </button>
        ))}
      </div>
      {limit.max > 0 && (
        <div>
          <div className="h-2 overflow-hidden rounded-full bg-edge">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <p className={`mt-2 text-sm ${over ? "text-red-400" : "text-muted"}`}>
            {over
              ? `${stats.chars - limit.max} over the limit`
              : `${limit.max - stats.chars} characters left (${stats.chars} of ${limit.max})`}
          </p>
        </div>
      )}
    </section>
  );
}