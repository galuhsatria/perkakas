import { useMemo } from "react";

const STOP_WORDS = new Set(
  (
    "the a an and or but of to in on at for with is are was were be been it its this that as by from i you he she we they " +
    "yang dan di ke dari untuk dengan pada ini itu adalah atau saya kamu kita akan juga tidak dalam ada sebagai oleh"
  ).split(" ")
);

const LIMITS = [
  { id: "none", label: "No limit", max: 0 },
  { id: "x", label: "X post", max: 280 },
  { id: "sms", label: "SMS", max: 160 },
  { id: "meta", label: "Meta description", max: 160 },
  { id: "title", label: "Title tag", max: 60 },
  { id: "ig", label: "Instagram caption", max: 2200 },
] as const;

function analyze(t: string) {
  const words = t.match(/\S+/g)?.length ?? 0;
  const chars = Array.from(t).length;
  const noSpace = Array.from(t.replace(/\s/g, "")).length;
  const sentences = (t.match(/[^.!?\n]+[.!?]*/g) || []).filter((s) => /\S/.test(s)).length;
  const paragraphs = t.split("\n").filter((p) => p.trim()).length;
  return { words, chars, noSpace, sentences, paragraphs };
}

function fmtTime(words: number, wpm: number) {
  const total = Math.round((words / wpm) * 60);
  if (total < 60) return `${total} sec`;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return s ? `${m} min ${s} sec` : `${m} min`;
}

export function useWordAnalysis(value: string, ignoreCommon: boolean) {
  const stats = useMemo(() => analyze(value), [value]);

  const keywords = useMemo(() => {
    const tokens = value.toLowerCase().match(/[\p{L}\p{N}']+/gu) || [];
    const counts = new Map<string, number>();
    tokens.forEach((w) => {
      if (ignoreCommon && (STOP_WORDS.has(w) || w.length < 2)) return;
      counts.set(w, (counts.get(w) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8);
  }, [value, ignoreCommon]);

  const selStats = useMemo(() => analyze(""), []); // placeholder, will be overridden by selection

  return {
    stats,
    keywords,
    analyze,
    fmtTime,
    LIMITS,
    STOP_WORDS,
  };
}

export function useSelectionAnalysis(selection: string) {
  return useMemo(() => analyze(selection), [selection]);
}