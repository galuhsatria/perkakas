"use client";
import { Eraser, Undo2 } from "lucide-react";
import { btn } from "@/lib/ui/classes";

interface TransformButtonsProps {
  value: string;
  onChange: (value: string) => void;
  previous: string | null;
  onUndo: () => void;
}

export function TransformButtons({ value, onChange, previous, onUndo }: TransformButtonsProps) {
  const transforms = {
    upperCase: (s: string) => s.toUpperCase(),
    lowerCase: (s: string) => s.toLowerCase(),
    titleCase: (s: string) =>
      s.toLowerCase().replace(/(^|\s)(\p{L})/gu, (_, p, c) => p + c.toUpperCase()),
    sentenceCase: (s: string) =>
      s.toLowerCase().replace(/(^\s*|[.!?]\s+)(\p{L})/gu, (_, p, c) => p + c.toUpperCase()),
    clean: (s: string) =>
      s
        .replace(/[ \t]+/g, " ")
        .replace(/ *\n */g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim(),
  };

  const applyTransform = (fn: (s: string) => string) => {
    onChange(fn(value));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button className={btn} onClick={() => applyTransform(transforms.upperCase)}>UPPER</button>
      <button className={btn} onClick={() => applyTransform(transforms.lowerCase)}>lower</button>
      <button className={btn} onClick={() => applyTransform(transforms.titleCase)}>Title Case</button>
      <button className={btn} onClick={() => applyTransform(transforms.sentenceCase)}>Sentence case</button>
      <button className={btn} onClick={() => applyTransform(transforms.clean)} title="Remove extra spaces and blank lines">
        <Eraser className="h-4 w-4" /> Clean up
      </button>
      {previous !== null && (
        <button className={btn} onClick={onUndo}>
          <Undo2 className="h-4 w-4" /> Undo
        </button>
      )}
    </div>
  );
}