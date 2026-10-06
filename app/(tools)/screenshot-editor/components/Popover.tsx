import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type TriggerArgs = {
  setRef: (el: HTMLElement | null) => void;
  open: boolean;
  toggle: () => void;
};

type Pos = { top?: number; bottom?: number; left: number; width: number; maxHeight: number };

type Props = {
  label: string;
  width?: number;
  header?: ReactNode;
  trigger: (args: TriggerArgs) => ReactNode;
  children: ReactNode;
};

export function Popover({ label, width = 480, header, trigger, children }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const anchorRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const setRef = useCallback((el: HTMLElement | null) => {
    anchorRef.current = el;
  }, []);

  const place = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 8;
    const w = Math.min(width, vw - 16);
    const left = Math.max(8, Math.min(r.right - w, vw - w - 8));
    const below = vh - r.bottom - gap - 8;
    const above = r.top - gap - 8;
    if (below >= 360 || below >= above) {
      setPos({ top: r.bottom + gap, left, width: w, maxHeight: Math.max(200, below) });
    } else {
      setPos({ bottom: vh - r.top + gap, left, width: w, maxHeight: Math.max(200, above) });
    }
  }, [width]);

  useEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    place();
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        anchorRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  return (
    <>
      {trigger({ setRef, open, toggle: () => setOpen((o) => !o) })}
      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label={label}
            style={{
              position: "fixed",
              top: pos.top,
              bottom: pos.bottom,
              left: pos.left,
              width: pos.width,
              maxHeight: pos.maxHeight,
              zIndex: 50,
            }}
            className="flex flex-col overflow-hidden rounded-2xl border border-edge bg-panel text-fg shadow-2xl shadow-black/60 ring-1 ring-white/5"
          >
            {header && (
              <div className="flex shrink-0 items-center gap-2 border-b border-edge bg-base/40 px-4 py-3 text-xs text-muted">
                {header}
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </div>,
          document.body
        )}
    </>
  );
}
