"use client";
import { kbd } from "@/lib/ui/classes";

export function KeyboardHints() {
  return (
    <p className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-muted">
      {[
        ["Space", "start or pause"],
        ["R", "reset"],
        ["S", "skip"],
      ].map(([k, v]) => (
        <span key={k} className="flex items-center gap-1.5">
          <kbd className={kbd}>{k}</kbd>
          {v}
        </span>
      ))}
    </p>
  );
}