"use client";
import { Search } from "lucide-react";

// Trigger only: the palette itself lives in AppShell so Ctrl/Cmd+K works on every page.
export default function SearchBar() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("open-palette"))}
      className="flex w-full max-w-xl items-center gap-3 rounded-xl border border-edge bg-panel px-4 py-3 text-left shadow-soft transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
    >
      <Search className="h-4 w-4 text-muted" />
      <span className="flex-1 text-muted">Search tools</span>
      <kbd className="hidden shrink-0 rounded-md border border-edge px-2 py-0.5 text-xs text-muted sm:block">Ctrl K</kbd>
    </button>
  );
}
