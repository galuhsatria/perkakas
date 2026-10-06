import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export function Dropdown<T extends string>({
  label,
  caption,
  value,
  options,
  onChange,
}: {
  label: string;
  caption?: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [up, setUp] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const uid = useId();

  const selectedIndex = Math.max(0, options.findIndex((o) => o.id === value));
  const selected = options[selectedIndex];

  const openMenu = () => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (r) {
      const below = window.innerHeight - r.bottom;
      setUp(below < 290 && r.top > below);
    }
    setActive(selectedIndex);
    setOpen(true);
  };

  const choose = (i: number) => {
    onChange(options[i].id);
    setOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const el = list?.children[active] as HTMLElement | undefined;
    if (!list || !el) return;
    if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop;
    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight;
  }, [open, active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => (i + 1) % options.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => (i - 1 + options.length) % options.length);
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(active);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        if (e.key.length === 1) {
          const k = e.key.toLowerCase();
          const next = options.findIndex((o, i) => i > active && o.label.toLowerCase().startsWith(k));
          const first = next === -1 ? options.findIndex((o) => o.label.toLowerCase().startsWith(k)) : next;
          if (first !== -1) setActive(first);
        }
    }
  };

  const listId = `${uid}-list`;

  return (
    <div className="block">
      {caption && <p className="mb-2 text-sm text-muted">{caption}</p>}
      <div ref={wrapRef} className="relative">
        <button
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-label={label}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open ? `${uid}-opt-${active}` : undefined}
          onClick={() => (open ? setOpen(false) : openMenu())}
          onKeyDown={onKeyDown}
          className={`group flex w-full items-center justify-between gap-3 rounded-xl border bg-base px-3.5 py-2.5 text-left text-sm font-medium text-fg transition-colors hover:border-primary/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
            open ? "border-primary" : "border-edge"
          }`}
        >
          <span className="truncate">{selected?.label}</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-hover:text-fg ${open ? "rotate-180 text-primary" : ""}`}
          />
        </button>

        {/* `hidden` (display:none) when closed so the absolute menu doesn't add to the parent's scroll height */}
        <div
          aria-hidden={!open}
          className={`absolute left-0 right-0 z-40 rounded-xl border border-edge bg-panel p-1.5 shadow-2xl shadow-black/60 ring-1 ring-white/5 ${
            up ? "bottom-full mb-2 origin-bottom" : "top-full mt-2 origin-top"
          } ${open ? "block" : "hidden"}`}
        >
          <ul ref={listRef} id={listId} role="listbox" aria-label={label} className="relative max-h-64 overflow-y-auto">
            {options.map((o, i) => {
              const isSelected = o.id === value;
              return (
                <li
                  key={o.id}
                  id={`${uid}-opt-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(i)}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isSelected ? "font-semibold text-primary" : "text-fg"
                  } ${i === active ? (isSelected ? "bg-primary/15" : "bg-white/10") : ""}`}
                >
                  <span className="truncate">{o.label}</span>
                  {isSelected && <Check className="h-4 w-4 shrink-0" />}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
