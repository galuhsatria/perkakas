"use client";
import { card } from "@/lib/ui/classes";

interface TimerCircleProps {
  mode: "focus" | "short" | "long";
  remaining: number;
  running: boolean;
  settings: { focus: number; short: number; long: number };
  onModeChange: (mode: "focus" | "short" | "long") => void;
}

export function TimerCircle({ mode, remaining, running, settings, onModeChange }: TimerCircleProps) {
  const LABEL = { focus: "Focus", short: "Short break", long: "Long break" };
  const total = settings[mode] * 60;
  const progress = 1 - remaining / total;
  const R = 124;
  const C = 2 * Math.PI * R;
  const ring = mode === "focus" ? "#FF8A1F" : "#FAFAFA";

  return (
    <section className={`flex flex-col items-center py-6`}>
      <div role="tablist" aria-label="Timer mode" className="flex rounded-full border border-edge p-1">
        {["focus", "short", "long"].map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => onModeChange(m as "focus" | "short" | "long")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
              mode === m ? "bg-white/10 text-fg" : "text-muted hover:text-fg"
            }`}
          >
            {LABEL[m as "focus" | "short" | "long"]}
          </button>
        ))}
      </div>

      <div className="relative mt-8 h-72 w-72">
        <svg viewBox="0 0 280 280" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx="140" cy="140" r={R} fill="none" stroke="#26262A" strokeWidth="10" />
          <circle
            cx="140"
            cy="140"
            r={R}
            fill="none"
            stroke={ring}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * progress}
            style={{ transition: "stroke-dashoffset 0.25s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-6xl font-extrabold tabular-nums" aria-live="off">
            {remaining > 0 ? (Math.floor(remaining / 60).toString().padStart(2, "0") + ":" + (remaining % 60).toString().padStart(2, "0")) : "00:00"}
          </p>
          <p className="mt-1 text-sm text-muted">{running ? `${LABEL[mode]} in progress` : LABEL[mode]}</p>
        </div>
      </div>
    </section>
  );
}
