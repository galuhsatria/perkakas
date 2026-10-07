"use client";
import { card } from "@/lib/ui/classes";
import { fmtFocus } from "@/lib/utils/timer";

interface StatsPanelProps {
  stats: { date: string; sessions: number; seconds: number };
  cycle: number;
  interval: number;
  onClear: () => void;
}

export function StatsPanel({ stats, cycle, interval, onClear }: StatsPanelProps) {
  const focusTime = fmtFocus(stats.seconds);

  return (
    <section className={card}>
      <h2 className="font-bold">Today</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-edge bg-base p-3">
          <p className="text-2xl font-extrabold tabular-nums">{stats.sessions}</p>
          <p className="text-xs text-muted">Sessions done</p>
        </div>
        <div className="rounded-lg border border-edge bg-base p-3">
          <p className="text-2xl font-extrabold tabular-nums">{focusTime}</p>
          <p className="text-xs text-muted">Focus time</p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2" aria-label={`${cycle} of ${interval} sessions done`}>
        {Array.from({ length: interval }).map((_, i) => (
          <span key={i} className={`h-2.5 flex-1 rounded-full ${i < cycle ? "bg-primary" : "bg-edge"}`} />
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">
        {cycle >= interval
          ? "Long break is up next."
          : `${interval - cycle} more ${interval - cycle === 1 ? "session" : "sessions"} until a long break.`}
      </p>
      <button onClick={onClear} className="mt-4 text-xs text-muted underline underline-offset-4 hover:text-fg">
        Clear today&apos;s progress
      </button>
    </section>
  );
}