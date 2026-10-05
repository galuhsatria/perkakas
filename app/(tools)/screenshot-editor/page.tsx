"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Crop,
  Download,
  Loader2,
  MousePointerClick,
  Plus,
  RefreshCw,
  RotateCcw,
  X,
} from "lucide-react";
import {
  BgMode,
  CANVAS_PRESETS,
  DEFAULTS,
  FRAME_OPTIONS,
  FrameId,
  GRADIENTS,
  PATTERN_OPTIONS,
  Pattern,
  Settings,
  computeLayout,
  draw,
  makeDemoImage,
} from "./compose";

type Device = "desktop" | "tablet" | "mobile";
type CaptureStatus = { configured: boolean; available: boolean; remaining?: number; limit?: number } | null;

const card = "rounded-xl border border-edge bg-panel p-5";
const input =
  "w-full rounded-lg border border-edge bg-base px-3 py-2 text-fg outline-none placeholder:text-muted focus:border-primary disabled:cursor-not-allowed disabled:opacity-40";
const btn =
  "flex items-center justify-center gap-2 rounded-lg border border-edge px-4 py-2 text-sm font-semibold transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-edge";
const tool =
  "flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:bg-white/5 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary";
const kbd = "rounded border border-edge bg-base px-1.5 py-0.5 font-semibold text-fg";
const checker = {
  backgroundImage: "conic-gradient(#2A2A2E 25%, #1A1A1D 0 50%, #2A2A2E 0 75%, #1A1A1D 0)",
  backgroundSize: "16px 16px",
};

/* ------------------------------------------------------------------ */
/* Dropdown: custom listbox (keyboard + screen reader friendly)        */
/* ------------------------------------------------------------------ */
function Dropdown<T extends string>({
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

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // Keep the active option visible inside the list
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

        <div
          aria-hidden={!open}
          className={`absolute left-0 right-0 z-40 rounded-xl border border-edge bg-panel p-1.5 shadow-2xl shadow-black/60 ring-1 ring-white/5 transition duration-150 ${
            up ? "bottom-full mb-2 origin-bottom" : "top-full mt-2 origin-top"
          } ${
            open
              ? "visible translate-y-0 scale-100 opacity-100"
              : `invisible scale-95 opacity-0 ${up ? "translate-y-1" : "-translate-y-1"}`
          }`}
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

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="flex justify-between text-muted">
        {label}
        <span className="tabular-nums text-fg">
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[#FF8A1F]"
      />
    </label>
  );
}

function Switch({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${disabled ? "opacity-40" : ""}`}>
      <span className="text-sm font-medium">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
          checked ? "bg-primary" : "bg-edge"
        }`}
      >
        <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-3 text-sm text-muted">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-11 shrink-0 cursor-pointer rounded-md border border-edge bg-base p-1"
      />
      <span className="flex-1">{label}</span>
      <span className="font-mono text-xs text-fg">{value.toUpperCase()}</span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Capture options popover (sits inside the URL field)                 */
/* ------------------------------------------------------------------ */
function CaptureOptions({
  device,
  onDevice,
  fullPage,
  onFullPage,
  delay,
  onDelay,
}: {
  device: Device;
  onDevice: (d: Device) => void;
  fullPage: boolean;
  onFullPage: (v: boolean) => void;
  delay: number;
  onDelay: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0" onKeyDown={(e) => e.key === "Escape" && !e.defaultPrevented && setOpen(false)}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
          open ? "border-primary text-primary" : "border-edge text-muted"
        }`}
      >
        Options
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Capture options"
          className="absolute right-0 top-full z-40 mt-2 flex w-72 flex-col gap-4 rounded-xl border border-edge bg-panel p-4 text-left shadow-2xl shadow-black/60 ring-1 ring-white/5"
        >
          <Dropdown<Device>
            label="Device"
            caption="Device"
            value={device}
            onChange={onDevice}
            options={[
              { id: "desktop", label: "Desktop" },
              { id: "tablet", label: "Tablet" },
              { id: "mobile", label: "Mobile" },
            ]}
          />
          <Switch label="Full page" checked={fullPage} onChange={onFullPage} />
          <Slider label="Wait before capture" value={delay} min={0} max={3000} step={250} unit=" ms" onChange={onDelay} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Crop modal: drag to select the area to keep                         */
/* ------------------------------------------------------------------ */
function CropModal({
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
        <button className={btn} onClick={onClose}>
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

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("load"));
    i.src = src;
  });

export default function ScreenshotEditor() {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [notice, setNotice] = useState("");
  const [dragging, setDragging] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [cropping, setCropping] = useState(false);

  const [status, setStatus] = useState<CaptureStatus>(null);
  const [limitHit, setLimitHit] = useState(false);
  const [url, setUrl] = useState("");
  const [device, setDevice] = useState<Device>("desktop");
  const [fullPage, setFullPage] = useState(false);
  const [delay, setDelay] = useState(500);
  const [busy, setBusy] = useState(false);
  const [captureError, setCaptureError] = useState("");

  const [exportScale, setExportScale] = useState<1 | 2>(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // The image as first loaded, so "Reset canvas" can undo crops
  const originalRef = useRef<HTMLImageElement | null>(null);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setS((prev) => ({ ...prev, [key]: value }));
  const flash = useCallback((msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 2500);
  }, []);

  const captureOff = limitHit || !status || !status.configured || !status.available;
  const captureMessage = !status
    ? ""
    : !status.configured
    ? "Website capture isn't set up yet. You can still upload, paste, or drop an image."
    : limitHit || !status.available
    ? "Website capture limit reached. Upload, paste, or drop an image instead."
    : typeof status.remaining === "number"
    ? `${status.remaining} ${status.remaining === 1 ? "capture" : "captures"} left this month`
    : "";

  useEffect(() => {
    fetch("/api/screenshot", { cache: "no-store" })
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ configured: false, available: false }));
  }, []);

  const loadSource = useCallback(
    async (src: string, host?: string, edit = false) => {
      try {
        const i = await loadImage(src);
        if (!edit) originalRef.current = i;
        setImg(i);
        setReplacing(false);
        if (host) setS((prev) => ({ ...prev, address: host }));
      } catch {
        flash("Could not read that image.");
      }
    },
    [flash]
  );

  const readFile = useCallback(
    (file?: File | null) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) return flash("Please choose an image file.");
      if (file.size > 15 * 1024 * 1024) return flash("Image must be under 15 MB.");
      const reader = new FileReader();
      reader.onload = () => loadSource(String(reader.result));
      reader.readAsDataURL(file);
    },
    [flash, loadSource]
  );

  // Undo crops and put every style setting back to its default
  const resetCanvas = () => {
    if (originalRef.current) setImg(originalRef.current);
    setS((prev) => ({ ...DEFAULTS, address: prev.address }));
  };

  // Paste an image from the clipboard
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith("image/"));
      const file = item?.getAsFile();
      if (file) {
        e.preventDefault();
        readFile(file);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [readFile]);

  const layout = useMemo(() => (img ? computeLayout(img.naturalWidth, img.naturalHeight, s) : null), [img, s]);

  // Live preview (re-draw when the canvas comes back after "Replace")
  useEffect(() => {
    if (!img || !layout || !canvasRef.current) return;
    const scale = Math.min(1, 1400 / Math.max(layout.W, layout.H));
    const id = requestAnimationFrame(() => canvasRef.current && draw(canvasRef.current, img, s, scale));
    return () => cancelAnimationFrame(id);
  }, [img, s, layout, replacing]);

  const render = async (type: "image/png" | "image/jpeg") => {
    if (!img || !layout) return null;
    const scale = Math.min(exportScale, 4096 / Math.max(layout.W, layout.H));
    const c = document.createElement("canvas");
    draw(c, img, s, scale, type === "image/jpeg" ? "#FFFFFF" : undefined);
    return new Promise<Blob | null>((resolve) => c.toBlob(resolve, type, 0.92));
  };

  const save = async (type: "image/png" | "image/jpeg") => {
    const blob = await render(type);
    if (!blob) return flash("Could not export the image.");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `screenshot.${type === "image/png" ? "png" : "jpg"}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const copy = async () => {
    try {
      const blob = await render("image/png");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob as Blob })]);
      flash("Copied to clipboard");
    } catch {
      flash("Copy is not supported in this browser");
    }
  };

  // Ctrl/Cmd + S saves, Ctrl/Cmd + C copies the result
  const actions = useRef({ save, copy });
  actions.current = { save, copy };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || !img || cropping) return;
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        actions.current.save("image/png");
      } else if (e.key.toLowerCase() === "c" && !window.getSelection()?.toString()) {
        e.preventDefault();
        actions.current.copy();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [img, cropping]);

  const capture = async () => {
    if (captureOff || busy || !url.trim()) return;
    setBusy(true);
    setCaptureError("");
    try {
      const res = await fetch("/api/screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, device, fullPage, delay }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.image) {
        if (data?.code === "limit_reached") {
          setLimitHit(true);
          setCaptureError("");
        } else if (res.status === 413) {
          setCaptureError("That capture is too large. Turn off full page and try again.");
        } else {
          setCaptureError(data?.error ?? "Capture failed. Try again, or upload an image instead.");
        }
        return;
      }
      let host = "";
      try {
        host = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname;
      } catch {}
      await loadSource(data.image, host);
      setStatus((prev) =>
        prev && typeof prev.remaining === "number" ? { ...prev, remaining: Math.max(0, prev.remaining - 1) } : prev
      );
    } catch {
      setCaptureError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const transparent = s.bgMode === "transparent";
  const canvasIsAuto = s.canvas === "auto";
  const showImage = !!img && !replacing;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-10 lg:py-16">
      {/* Hidden file input lives here so "Add your image" and "Replace" always work */}
      <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => readFile(e.target.files?.[0])} />

      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Screenshot Editor</h1>
      <p className="mt-3 max-w-xl text-muted">
        Add a background, a browser frame, and a soft shadow to any screenshot. Capture a website by URL, or upload your own image.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Controls */}
        <div className="flex flex-col gap-6">
          <section className={`${card} flex flex-col gap-4`}>
            <h2 className="font-bold">Frame</h2>
            <Dropdown<FrameId> label="Frame" value={s.frame} onChange={(v) => set("frame", v)} options={FRAME_OPTIONS} />
            {s.frame !== "none" && (
              <input
                value={s.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="Address bar text (optional)"
                aria-label="Address bar text"
                className={input}
              />
            )}
          </section>

          <section className={`${card} flex flex-col gap-4`}>
            <h2 className="font-bold">Background</h2>
            <Dropdown<BgMode>
              label="Background type"
              value={s.bgMode}
              onChange={(v) => set("bgMode", v)}
              options={[
                { id: "gradient", label: "Gradient" },
                { id: "solid", label: "Solid" },
                { id: "transparent", label: "Transparent" },
              ]}
            />
            {s.bgMode === "gradient" && (
              <>
                <div className="grid grid-cols-6 gap-2">
                  {GRADIENTS.map((g) => {
                    const on = s.c1 === g.c1 && s.c2 === g.c2;
                    return (
                      <button
                        key={g.name}
                        type="button"
                        aria-label={`${g.name} gradient`}
                        aria-pressed={on}
                        onClick={() => setS((p) => ({ ...p, c1: g.c1, c2: g.c2 }))}
                        className={`aspect-square rounded-lg border-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                          on ? "border-white" : "border-transparent hover:border-edge"
                        }`}
                        style={{ backgroundImage: `linear-gradient(135deg, ${g.c1}, ${g.c2})` }}
                      />
                    );
                  })}
                </div>
                <ColorField label="Start color" value={s.c1} onChange={(v) => set("c1", v)} />
                <ColorField label="End color" value={s.c2} onChange={(v) => set("c2", v)} />
                <Slider label="Angle" value={s.angle} min={0} max={360} step={15} unit="°" onChange={(v) => set("angle", v)} />
              </>
            )}
            {s.bgMode === "solid" && <ColorField label="Color" value={s.solid} onChange={(v) => set("solid", v)} />}
            {!transparent && (
              <div className="flex flex-col gap-4">
                <Dropdown<Pattern>
                  label="Pattern"
                  caption="Pattern"
                  value={s.pattern}
                  onChange={(v) => set("pattern", v)}
                  options={PATTERN_OPTIONS}
                />
                {s.pattern !== "none" && (
                  <>
                    <Slider
                      label="Pattern intensity"
                      value={s.patternIntensity}
                      min={10}
                      max={100}
                      unit="%"
                      onChange={(v) => set("patternIntensity", v)}
                    />
                    <Slider
                      label="Pattern rotation"
                      value={s.patternRotation}
                      min={0}
                      max={360}
                      step={5}
                      unit="°"
                      onChange={(v) => set("patternRotation", v)}
                    />
                    <Slider
                      label="Pattern opacity"
                      value={s.patternOpacity}
                      min={5}
                      max={100}
                      unit="%"
                      onChange={(v) => set("patternOpacity", v)}
                    />
                  </>
                )}
              </div>
            )}
          </section>

          <section className={`${card} flex flex-col gap-4`}>
            <h2 className="font-bold">Style</h2>
            {!canvasIsAuto && <Slider label="Size" value={s.size} min={40} max={100} unit="%" onChange={(v) => set("size", v)} />}
            <Slider label="Padding" value={s.padding} min={0} max={25} unit="%" onChange={(v) => set("padding", v)} />
            <Slider label="Roundness" value={s.roundness} min={0} max={40} onChange={(v) => set("roundness", v)} />
            <Slider label="Shadow" value={s.shadow} min={0} max={5} onChange={(v) => set("shadow", v)} />
          </section>

          <section className={`${card} flex flex-col gap-4`}>
            <h2 className="font-bold">Canvas size</h2>
            <Dropdown<string>
              label="Canvas size"
              value={s.canvas}
              onChange={(v) => set("canvas", v)}
              options={CANVAS_PRESETS.map((p) => ({ id: p.id, label: p.label }))}
            />
          </section>
        </div>

        {/* Preview */}
        <section className={`${card} order-first h-max lg:sticky lg:top-6 lg:order-last`}>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              readFile(e.dataTransfer.files?.[0]);
            }}
            className={`relative flex min-h-[420px] items-center justify-center rounded-lg p-4 transition-colors ${
              showImage ? "pt-16" : ""
            } ${dragging ? "ring-2 ring-primary" : ""}`}
            style={showImage && transparent ? checker : { backgroundColor: "#0A0A0A" }}
          >
            {img && !replacing ? (
              <div className="group relative max-w-full">
                <canvas
                  ref={canvasRef}
                  aria-label="Screenshot preview"
                  className="block"
                  style={{ maxWidth: "100%", maxHeight: "68vh", width: "auto", height: "auto" }}
                />

                {/* Floating toolbar: shows on hover / focus, always visible on touch */}
                <div className="absolute bottom-full left-1/2 z-10 -translate-x-1/2 pb-2.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
                  <div className="relative flex divide-x divide-edge rounded-xl border border-edge bg-base shadow-xl shadow-black/50">
                    <button type="button" className={`${tool} rounded-l-xl`} onClick={() => setCropping(true)}>
                      <Crop className="h-4 w-4" /> Crop
                    </button>
                    <button type="button" className={tool} onClick={() => setReplacing(true)}>
                      <RefreshCw className="h-4 w-4" />
                      <span>
                        Replace<span className="hidden sm:inline"> screenshot</span>
                      </span>
                    </button>
                    <button type="button" className={`${tool} rounded-r-xl`} onClick={resetCanvas}>
                      <RotateCcw className="h-4 w-4" />
                      <span>
                        Reset<span className="hidden sm:inline"> canvas</span>
                      </span>
                    </button>
                    <span
                      aria-hidden
                      className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-edge bg-base"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative w-full max-w-md rounded-2xl border border-edge bg-panel shadow-2xl shadow-black/40">
                {replacing && (
                  <button
                    type="button"
                    aria-label="Cancel replace"
                    onClick={() => setReplacing(false)}
                    className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full text-muted transition-colors hover:bg-white/10 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                <p className="rounded-t-2xl border-b border-edge bg-base/40 px-10 py-4 text-center text-xs leading-relaxed text-muted">
                  Drag-n-drop your image here, use <kbd className={kbd}>Ctrl</kbd> + <kbd className={kbd}>V</kbd> to paste from clipboard
                </p>

                <div className="grid grid-cols-2 gap-4 px-6 py-8">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="group flex flex-col items-center gap-3 rounded-xl py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <span className="grid h-12 w-12 place-items-center rounded-full border border-dashed border-edge text-muted transition-colors group-hover:border-primary group-hover:text-primary">
                      <Plus className="h-5 w-5" />
                    </span>
                    Add your image
                  </button>
                  <button
                    type="button"
                    onClick={() => loadSource(makeDemoImage().toDataURL("image/png"))}
                    className="group flex flex-col items-center gap-3 rounded-xl py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <span className="grid h-12 w-12 place-items-center rounded-full border border-dashed border-edge text-muted transition-colors group-hover:border-primary group-hover:text-primary">
                      <MousePointerClick className="h-5 w-5" />
                    </span>
                    Try demo image
                  </button>
                </div>

                <div className="relative border-t border-edge">
                  <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-edge bg-panel px-3 py-0.5 text-xs font-semibold text-muted">
                    Or
                  </span>
                </div>

                <div className="px-6 pb-6 pt-8 text-center">
                  <p className="font-bold">Add screenshot from website/link</p>

                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-edge bg-base p-1.5 transition-colors focus-within:border-primary">
                    <input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && capture()}
                      disabled={captureOff}
                      placeholder="enter URL, e.g twitter.com"
                      aria-label="Website address"
                      className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-fg outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-40"
                    />
                    {!captureOff && (
                      <CaptureOptions
                        device={device}
                        onDevice={setDevice}
                        fullPage={fullPage}
                        onFullPage={setFullPage}
                        delay={delay}
                        onDelay={setDelay}
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={capture}
                    disabled={captureOff || busy || !url.trim()}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-black transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Capture website screenshot"}
                  </button>

                  {captureMessage && (
                    <p
                      className={`mt-3 rounded-lg px-3 py-2 text-xs ${
                        captureOff ? "border border-primary/40 bg-primary/10 text-primary" : "text-muted"
                      }`}
                      role="status"
                    >
                      {captureMessage}
                    </p>
                  )}
                  {captureError && (
                    <p className="mt-3 text-xs text-red-400" role="alert">
                      {captureError}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted" role="status">
              {notice || (layout ? `${Math.round(layout.W * exportScale)} × ${Math.round(layout.H * exportScale)} px` : "No image yet")}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <div role="radiogroup" aria-label="Export resolution" className="flex rounded-lg border border-edge p-0.5">
                {([1, 2] as const).map((n) => (
                  <button
                    key={n}
                    role="radio"
                    aria-checked={exportScale === n}
                    onClick={() => setExportScale(n)}
                    className={`h-8 rounded-md px-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                      exportScale === n ? "bg-white/10 text-fg" : "text-muted hover:text-fg"
                    }`}
                  >
                    {n}x
                  </button>
                ))}
              </div>
              <button className={btn} disabled={!img} onClick={() => save("image/png")}>
                <Download className="h-4 w-4" /> PNG
              </button>
              <button className={btn} disabled={!img} onClick={() => save("image/jpeg")}>
                <Download className="h-4 w-4" /> JPG
              </button>
              <button className={btn} disabled={!img} onClick={copy}>
                {notice === "Copied to clipboard" ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                Copy
              </button>
            </div>
          </div>
          {img && (
            <p className="mt-3 text-xs text-muted">
              Shortcuts: <kbd className={kbd}>Ctrl S</kbd> save PNG, <kbd className={kbd}>Ctrl C</kbd> copy image.
            </p>
          )}
        </section>
      </div>

      {cropping && img && (
        <CropModal
          img={img}
          onClose={() => setCropping(false)}
          onApply={(dataUrl) => {
            setCropping(false);
            loadSource(dataUrl, undefined, true);
          }}
        />
      )}
    </div>
  );
}
