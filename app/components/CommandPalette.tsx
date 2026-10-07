import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { tools } from "../data/tools";

const items = tools.flatMap((g) => g.site.map((s) => ({ ...s, category: g.category })));

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return items;
    return items.filter((i) => {
      const hay = `${i.name} ${i.description} ${i.category}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }, [query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setIndex(0);
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => setIndex(0), [query]);
  useEffect(() => {
    (listRef.current?.children[index] as HTMLElement | undefined)?.scrollIntoView({ block: "nearest" });
  }, [index]);

  if (!open) return null;

  const go = (link: string) => {
    onClose();
    router.push(link);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[index].link);
    }
  };

  const kbd = "rounded border border-edge bg-base px-1.5 py-0.5 text-xs text-muted";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search tools"
        className="flex max-h-[75vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-edge bg-panel shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-edge px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search tools by name or keyword..."
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={results[index] ? `palette-item-${index}` : undefined}
            className="w-full bg-transparent text-fg outline-none placeholder:text-muted"
          />
          <kbd className={kbd}>ESC</kbd>
        </div>

        {results.length === 0 ? (
          <p className="px-4 py-10 text-center text-muted">No tools match &quot;{query}&quot;. Try another keyword.</p>
        ) : (
          <ul id="palette-list" role="listbox" ref={listRef} className="flex-1 overflow-y-auto p-2">
            {results.map((r, i) => (
              <li
                key={r.link}
                id={`palette-item-${i}`}
                role="option"
                aria-selected={i === index}
                onMouseMove={() => setIndex(i)}
                onClick={() => go(r.link)}
                className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-3 ${
                  i === index ? "bg-edge/60" : "border-transparent"
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                  {r.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-fg">{r.name}</p>
                  <p className="truncate text-sm text-muted">{r.description}</p>
                </div>
                <span className="shrink-0 rounded-full border border-edge px-3 py-1 text-xs text-muted">{r.category}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-edge px-4 py-3 text-xs text-muted">
          <span><kbd className={kbd}>↑</kbd> <kbd className={kbd}>↓</kbd> to navigate</span>
          <span><kbd className={kbd}>Enter</kbd> to open</span>
          <span><kbd className={kbd}>Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
