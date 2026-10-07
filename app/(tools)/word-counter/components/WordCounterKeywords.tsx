"use client";
import { card } from "@/lib/ui/classes";

interface WordCounterKeywordsProps {
  keywords: [string, number][];
  stats: { words: number };
  ignoreCommon: boolean;
  onIgnoreCommonChange: (value: boolean) => void;
}

export function WordCounterKeywords({ keywords, stats, ignoreCommon, onIgnoreCommonChange }: WordCounterKeywordsProps) {
  const maxKeyword = keywords[0]?.[1] ?? 1;

  return (
    <section className={`${card} flex flex-col gap-4`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold">Top words</h2>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={ignoreCommon}
            onChange={(e) => onIgnoreCommonChange(e.target.checked)}
            className="h-4 w-4 accent-[#FF8A1F] text-white"
          />
          Ignore common words
        </label>
      </div>
      {keywords.length === 0 ? (
        <p className="text-sm text-muted">Start typing to see your most used words.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {keywords.map(([word, count]) => (
            <li key={word}>
              <div className="flex items-center justify-between text-sm">
                <span className="truncate font-medium">{word}</span>
                <span className="shrink-0 tabular-nums text-muted">
                  {count}x ({stats.words ? Math.round((count / stats.words) * 100) : 0}%)
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-edge">
                <div className="h-full rounded-full bg-primary/70" style={{ width: `${(count / maxKeyword) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}