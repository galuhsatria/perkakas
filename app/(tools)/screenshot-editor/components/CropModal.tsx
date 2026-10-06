import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function CropModal({
  img,
  onApply,
  onClose,
}: {
  img: HTMLImageElement;
  onApply: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [sel, setSel] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const pos = (e: React.PointerEvent) => {
    const r = boxRef.current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    };
  };

  const valid = !!sel && sel.w > 0.01 && sel.h > 0.01;

  const apply = () => {
    if (!sel || !valid) return;
    const W = img.naturalWidth;
    const H = img.naturalHeight;
    const sx = Math.round(sel.x * W);
    const sy = Math.round(sel.y * H);
    const sw = Math.max(1, Math.round(sel.w * W));
    const sh = Math.max(1, Math.round(sel.h * H));
    const c = document.createElement("canvas");
    c.width = sw;
    c.height = sh;
    c.getContext("2d")!.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    onApply(c.toDataURL("image/png"));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crop image"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/80 p-4"
    >
      <p className="text-sm text-muted">Drag on the image to choose the area to keep.</p>
      <div
        ref={boxRef}
        className="relative inline-block cursor-crosshair touch-none select-none overflow-hidden rounded-lg"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          const p = pos(e);
          start.current = p;
          setSel({ ...p, w: 0, h: 0 });
        }}
        onPointerMove={(e) => {
          if (!start.current) return;
          const p = pos(e);
          const s0 = start.current;
          setSel({ x: Math.min(s0.x, p.x), y: Math.min(s0.y, p.y), w: Math.abs(p.x - s0.x), h: Math.abs(p.y - s0.y) });
        }}
        onPointerUp={() => (start.current = null)}
        onPointerCancel={() => (start.current = null)}
      >
        <img src={img.src} alt="" draggable={false} className="block max-h-[70vh] max-w-[90vw]" />
        {sel && (
          <div
            className="pointer-events-none absolute border-2 border-primary"
            style={{
              left: `${sel.x * 100}%`,
              top: `${sel.y * 100}%`,
              width: `${sel.w * 100}%`,
              height: `${sel.h * 100}%`,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
            }}
          />
        )}
      </div>
      <div className="flex gap-2">
        <button className="flex items-center justify-center gap-2 rounded-lg border border-edge px-4 py-2 text-sm font-semibold transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-edge" onClick={onClose}>
          <X className="h-4 w-4" /> Cancel
        </button>
        <button
          onClick={apply}
          disabled={!valid}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check className="h-4 w-4" /> Apply crop
        </button>
      </div>
    </div>
  );
}
