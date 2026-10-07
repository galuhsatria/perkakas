"use client";
import { useMemo, useState } from "react";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { useCopyToClipboard } from "@/lib/hooks/useCopyToClipboard";
import { useWordAnalysis, useSelectionAnalysis } from "@/lib/hooks/useWordAnalysis";
import { WordCounterEditor } from "./components/WordCounterEditor";
import { WordCounterStats } from "./components/WordCounterStats";
import { WordCounterLimits } from "./components/WordCounterLimits";
import { WordCounterKeywords } from "./components/WordCounterKeywords";

export default function WordCounter() {
  const [value, setValue, loaded] = useLocalStorage("word-counter:text", "");
  const [previous, setPrevious] = useState<string | null>(null);
  const [selection, setSelection] = useState("");
  const [fontSize, setFontSize] = useState("md");
  const [limitId, setLimitId] = useState("none");
  const [ignoreCommon, setIgnoreCommon] = useState(true);
  const { copied, copy } = useCopyToClipboard();

  const handleCopy = () => copy(value);

  const { stats, keywords, fmtTime, LIMITS } = useWordAnalysis(value, ignoreCommon);
  const selStats = useSelectionAnalysis(selection);

  const transform = (fn: (s: string) => string) => {
    const next = fn(value);
    if (next === value) return;
    setPrevious(value);
    setValue(next);
    setSelection("");
  };

  const handleUndo = () => {
    if (previous !== null) {
      setValue(previous);
      setPrevious(null);
      setSelection("");
    }
  };

  const handleClear = () => {
    setPrevious(value);
    setValue("");
    setSelection("");
  };

  const readingTime = fmtTime(stats.words, 200);
  const speakingTime = fmtTime(stats.words, 130);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-10 lg:py-16">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Word Counter</h1>
      <p className="mt-3 max-w-xl text-muted">
        Count words, characters, and reading time as you type. Your text stays in your browser.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">
        <WordCounterEditor
          value={value}
          onChange={setValue}
          onSelect={setSelection}
          previous={previous}
          onUndo={handleUndo}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          copied={copied}
          onCopy={handleCopy}
          onClear={handleClear}
        />

        <div className="flex flex-col gap-6">
          <WordCounterStats stats={stats} readingTime={readingTime} speakingTime={speakingTime} />
          <WordCounterLimits limitId={limitId} onLimitChange={setLimitId} stats={stats} />
          <WordCounterKeywords
            keywords={keywords}
            stats={stats}
            ignoreCommon={ignoreCommon}
            onIgnoreCommonChange={setIgnoreCommon}
          />
        </div>
      </div>
    </div>
  );
}