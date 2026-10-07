"use client";
import { card } from "@/lib/ui/classes";

interface WordCounterStatsProps {
  stats: {
    words: number;
    chars: number;
    noSpace: number;
    sentences: number;
    paragraphs: number;
  };
  readingTime: string;
  speakingTime: string;
}

export function WordCounterStats({ stats, readingTime, speakingTime }: WordCounterStatsProps) {
  const rows: [string, string | number][] = [
    ["Characters without spaces", stats.noSpace],
    ["Sentences", stats.sentences],
    ["Paragraphs", stats.paragraphs],
    ["Reading time", readingTime],
    ["Speaking time", speakingTime],
  ];

  return (
    <section className={card}>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-edge bg-base p-4">
          <p className="text-4xl font-extrabold tabular-nums text-primary">{stats.words}</p>
          <p className="text-sm text-muted">{stats.words === 1 ? "Word" : "Words"}</p>
        </div>
        <div className="rounded-lg border border-edge bg-base p-4">
          <p className="text-4xl font-extrabold tabular-nums">{stats.chars}</p>
          <p className="text-sm text-muted">Characters</p>
        </div>
      </div>
      <dl className="mt-4 flex flex-col">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between border-b border-edge py-2.5 last:border-0">
            <dt className="text-sm text-muted">{k}</dt>
            <dd className="font-semibold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}