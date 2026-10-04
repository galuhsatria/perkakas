"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Eraser, Trash2, Undo2 } from "lucide-react";

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
];

const FONT_SIZES = [
  { id: "sm", label: "S", cls: "text-sm" },
  { id: "md", label: "M", cls: "text-[1rem]" },
  { id: "lg", label: "L", cls: "text-lg" },
];

const card = "rounded-xl border border-edge bg-panel p-5";
const btn =
  "flex items-center justify-center gap-2 rounded-lg border border-edge px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-edge";

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

function Chips({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
            value === o.id
              ? "border-primary bg-primary/15 font-semibold text-primary"
              : "border-edge text-muted hover:text-fg"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function WordCounter() {
  const [value, setValue] = useState("");
  const [previous, setPrevious] = useState<string | null>(null);
  const [selection, setSelection] = useState("");
  const [fontSize, setFontSize] = useState("md");
  const [limitId, setLimitId] = useState("none");
  const [ignoreCommon, setIgnoreCommon] = useState(true);
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("word-counter:text");
      if (saved) setValue(saved);
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("word-counter:text", value);
    } catch {}
  }, [loaded, value]);

  const stats = useMemo(() => analyze(value), [value]);
  const selStats = useMemo(() => analyze(selection), [selection]);

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

  const limit = LIMITS.find((l) => l.id === limitId)!;
  const over = limit.max > 0 && stats.chars > limit.max;
  const pct = limit.max > 0 ? Math.min(100, (stats.chars / limit.max) * 100) : 0;
  const barColor = over ? "bg-red-500" : pct >= 90 ? "bg-yellow-400" : "bg-primary";

  const transform = (fn: (s: string) => string) => {
    const next = fn(value);
    if (next === value) return;
    setPrevious(value);
    setValue(next);
    setSelection("");
  };

  const clean = (s: string) =>
    s
      .replace(/[ \t]+/g, " ")
      .replace(/ *\n */g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  const titleCase = (s: string) => s.toLowerCase().replace(/(^|\s)(\p{L})/gu, (_, p, c) => p + c.toUpperCase());
  const sentenceCase = (s: string) =>
    s.toLowerCase().replace(/(^\s*|[.!?]\s+)(\p{L})/gu, (_, p, c) => p + c.toUpperCase());

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const rows: [string, string | number][] = [
    ["Words", stats.words],
    ["Characters", stats.chars],
    ["Characters without spaces", stats.noSpace],
    ["Sentences", stats.sentences],
    ["Paragraphs", stats.paragraphs],
    ["Reading time", fmtTime(stats.words, 200)],
    ["Speaking time", fmtTime(stats.words, 130)],
  ];

  const fontCls = FONT_SIZES.find((f) => f.id === fontSize)!.cls;
  const maxKeyword = keywords[0]?.[1] ?? 1;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-10 lg:py-16">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Word Counter</h1>
      <p className="mt-3 max-w-xl text-muted">
        Count words, characters, and reading time as you type. Your text stays in your browser.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Editor */}
        <section className={card}>
          <div className="flex flex-wrap items-center gap-2">
            <button className={btn} onClick={() => transform((s) => s.toUpperCase())}>UPPER</button>
            <button className={btn} onClick={() => transform((s) => s.toLowerCase())}>lower</button>
            <button className={btn} onClick={() => transform(titleCase)}>Title Case</button>
            <button className={btn} onClick={() => transform(sentenceCase)}>Sentence case</button>
            <button className={btn} onClick={() => transform(clean)} title="Remove extra spaces and blank lines">
              <Eraser className="h-4 w-4" /> Clean up
            </button>
            {previous !== null && (
              <button
                className={btn}
                onClick={() => {
                  setValue(previous);
                  setPrevious(null);
                  setSelection("");
                }}
              >
                <Undo2 className="h-4 w-4" /> Undo
              </button>
            )}
          </div>

          <textarea
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSelection("");
            }}
            onSelect={(e) => {
              const t = e.currentTarget;
              setSelection(t.value.slice(t.selectionStart, t.selectionEnd));
            }}
            rows={14}
            placeholder="Type or paste your text here..."
            aria-label="Text to count"
            className={`mt-4 min-h-[320px] w-full resize-y rounded-lg border border-edge bg-base p-4 leading-relaxed text-fg outline-none placeholder:text-muted focus:border-primary ${fontCls}`}
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted" aria-live="polite">
              {selection
                ? `Selected: ${selStats.words} ${selStats.words === 1 ? "word" : "words"}, ${selStats.chars} characters`
                : "Select part of the text to count only that part."}
            </p>
            <div className="flex items-center gap-2">
              <div role="radiogroup" aria-label="Text size" className="flex rounded-lg border border-edge p-0.5">
                {FONT_SIZES.map((f) => (
                  <button
                    key={f.id}
                    role="radio"
                    aria-checked={fontSize === f.id}
                    onClick={() => setFontSize(f.id)}
                    className={`h-8 w-8 rounded-md text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                      fontSize === f.id ? "bg-white/10 text-fg" : "text-muted hover:text-fg"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <button className={btn} onClick={copy} disabled={!value}>
                {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                className={btn}
                disabled={!value}
                onClick={() => {
                  setPrevious(value);
                  setValue("");
                  setSelection("");
                }}
              >
                <Trash2 className="h-4 w-4" /> Clear
              </button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="flex flex-col gap-6">
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
              {rows.slice(2).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b border-edge py-2.5 last:border-0">
                  <dt className="text-sm text-muted">{k}</dt>
                  <dd className="font-semibold tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className={`${card} flex flex-col gap-4`}>
            <h2 className="font-bold">Character limit</h2>
            <Chips
              label="Character limit"
              value={limitId}
              onChange={setLimitId}
              options={LIMITS.map((l) => ({ id: l.id, label: l.max ? `${l.label} (${l.max})` : l.label }))}
            />
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

          <section className={`${card} flex flex-col gap-4`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold">Top words</h2>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={ignoreCommon}
                  onChange={(e) => setIgnoreCommon(e.target.checked)}
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
        </div>
      </div>
    </div>
  );
}
