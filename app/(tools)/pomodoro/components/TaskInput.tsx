"use client";
import { input } from "@/lib/ui/classes";

interface TaskInputProps {
  task: string;
  onChange: (task: string) => void;
}

export function TaskInput({ task, onChange }: TaskInputProps) {
  return (
    <input
      value={task}
      onChange={(e) => onChange(e.target.value)}
      maxLength={80}
      placeholder="What are you working on?"
      aria-label="Current task"
      className={`${input} mt-8 max-w-xs text-center`}
    />
  );
}