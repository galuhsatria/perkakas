"use client";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { iconBtn } from "@/lib/ui/classes";

interface TimerControlsProps {
  running: boolean;
  onToggle: () => void;
  onReset: () => void;
  onSkip: () => void;
}

export function TimerControls({ running, onToggle, onReset, onSkip }: TimerControlsProps) {
  return (
    <div className="mt-6 flex items-center gap-4">
      <button onClick={onReset} aria-label="Reset timer" className={iconBtn}>
        <RotateCcw className="h-5 w-5" />
      </button>
      <button
        onClick={onToggle}
        className="flex min-w-[6rem] items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-lg font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      >
        {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        {running ? "Pause" : "Start"}
      </button>
      <button onClick={onSkip} aria-label="Skip to next session" className={iconBtn}>
        <SkipForward className="h-5 w-5" />
      </button>
    </div>
  );
}