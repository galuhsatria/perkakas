"use client";
import { useState, useCallback } from "react";
import { Check, Copy, Trash2 } from "lucide-react";
import { btn, input, kbd } from "@/lib/ui/classes";
import { FONT_SIZES } from "../constants";
import { TransformButtons } from "./TransformButtons";

interface WordCounterEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (selection: string) => void;
  previous: string | null;
  onUndo: () => void;
  fontSize: string;
  onFontSizeChange: (size: string) => void;
  copied: boolean;
  onCopy: () => void;
  onClear: () => void;
}

export function WordCounterEditor({
  value,
  onChange,
  onSelect,
  previous,
  onUndo,
  fontSize,
  onFontSizeChange,
  copied,
  onCopy,
  onClear,
}: WordCounterEditorProps) {
  const fontCls = FONT_SIZES.find((f) => f.id === fontSize)?.cls ?? "text-[1rem]";

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    onSelect("");
  }, [onChange, onSelect]);

  const handleSelect = useCallback((e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const t = e.currentTarget;
    onSelect(t.value.slice(t.selectionStart, t.selectionEnd));
  }, [onSelect]);

  return (
    <section className="rounded-xl border border-edge bg-panel p-5">
      <TransformButtons value={value} onChange={onChange} previous={previous} onUndo={onUndo} />

      <textarea
        value={value}
        onChange={handleChange}
        onSelect={handleSelect}
        rows={14}
        placeholder="Type or paste your text here..."
        aria-label="Text to count"
        className={`mt-4 min-h-[320px] w-full resize-y rounded-lg border border-edge bg-base p-4 leading-relaxed text-fg outline-none placeholder:text-muted focus:border-primary ${fontCls}`}
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted" aria-live="polite">
          Select part of the text to count only that part.
        </p>
        <div className="flex items-center gap-2">
          <div role="radiogroup" aria-label="Text size" className="flex rounded-lg border border-edge p-0.5">
            {FONT_SIZES.map((f) => (
              <button
                key={f.id}
                role="radio"
                aria-checked={fontSize === f.id}
                onClick={() => onFontSizeChange(f.id)}
                className={`h-8 w-8 rounded-md text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                  fontSize === f.id ? "bg-white/10 text-fg" : "text-muted hover:text-fg"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button className={btn} onClick={onCopy} disabled={!value}>
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button className={btn} disabled={!value} onClick={onClear}>
            <Trash2 className="h-4 w-4" /> Clear
          </button>
        </div>
      </div>
    </section>
  );
}