"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, Globe, ImagePlus, Loader2, Sparkles, Upload } from "lucide-react";
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
const checker = {
  backgroundImage: "conic-gradient(#2A2A2E 25%, #1A1A1D 0 50%, #2A2A2E 0 75%, #1A1A1D 0)",
  backgroundSize: "16px 16px",
};

function Chips<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
            value === o.id ? "border-primary bg-primary/15 font-semibold text-primary" : "border-edge text-muted hover:text-fg"
          }`}
        >
          {o.label}
        </button>
      ))}
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
    async (src: string, host?: string) => {
      try {
        const i = await loadImage(src);
        setImg(i);
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

  // Live preview
  useEffect(() => {
    if (!img || !layout || !canvasRef.current) return;
    const scale = Math.min(1, 1400 / Math.max(layout.W, layout.H));
    const id = requestAnimationFrame(() => canvasRef.current && draw(canvasRef.current, img, s, scale));
    return () => cancelAnimationFrame(id);
  }, [img, s, layout]);

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
      if (!(e.metaKey || e.ctrlKey) || !img) return;
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
  }, [img]);

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

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-10 lg:py-16">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Screenshot Editor</h1>
      <p className="mt-3 max-w-xl text-muted">
        Add a background, a browser frame, and a soft shadow to any screenshot. Capture a website by URL, or upload your own image.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Controls */}
        <div className="flex flex-col gap-6">
          <section className={`${card} flex flex-col gap-4`}>
            <h2 className="font-bold">Image</h2>
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => readFile(e.target.files?.[0])} />
            <div className="grid grid-cols-2 gap-2">
              <button className={btn} onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4" /> Upload image
              </button>
              <button className={btn} onClick={() => loadSource(makeDemoImage().toDataURL("image/png"))}>
                <Sparkles className="h-4 w-4" /> Try demo
              </button>
            </div>
            <p className="text-xs text-muted">
              You can also drop an image on the preview or paste one with{" "}
              <kbd className="rounded border border-edge bg-base px-1.5 py-0.5 font-semibold text-fg">Ctrl</kbd>{" "}
              <kbd className="rounded border border-edge bg-base px-1.5 py-0.5 font-semibold text-fg">V</kbd>.
            </p>

            <div className="border-t border-edge pt-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Globe className="h-4 w-4" /> Capture a website
              </p>
              <div className="flex gap-2">
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && capture()}
                  disabled={captureOff}
                  placeholder="example.com"
                  aria-label="Website address"
                  className={input}
                />
                <button
                  onClick={capture}
                  disabled={captureOff || busy || !url.trim()}
                  className="flex w-24 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-black transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Capture"}
                </button>
              </div>

              {!captureOff && (
                <div className="mt-3 flex flex-col gap-3">
                  <Chips<Device>
                    label="Device"
                    value={device}
                    onChange={setDevice}
                    options={[
                      { id: "desktop", label: "Desktop" },
                      { id: "tablet", label: "Tablet" },
                      { id: "mobile", label: "Mobile" },
                    ]}
                  />
                  <Switch label="Full page" checked={fullPage} onChange={setFullPage} />
                  <Slider label="Wait before capture" value={delay} min={0} max={3000} step={250} unit=" ms" onChange={setDelay} />
                </div>
              )}

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
          </section>

          <section className={`${card} flex flex-col gap-4`}>
            <h2 className="font-bold">Frame</h2>
            <Chips<FrameId> label="Frame" value={s.frame} onChange={(v) => set("frame", v)} options={FRAME_OPTIONS} />
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
            <Chips<BgMode>
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
                <div>
                  <p className="mb-2 text-sm text-muted">Pattern</p>
                  <Chips<Pattern>
                    label="Pattern"
                    value={s.pattern}
                    onChange={(v) => set("pattern", v)}
                    options={PATTERN_OPTIONS}
                  />
                </div>
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
            <Chips<string>
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
            className={`flex min-h-[320px] items-center justify-center rounded-lg p-4 transition-colors ${
              dragging ? "ring-2 ring-primary" : ""
            }`}
            style={img && transparent ? checker : { backgroundColor: "#0A0A0A" }}
          >
            {img ? (
              <canvas
                ref={canvasRef}
                aria-label="Screenshot preview"
                style={{ maxWidth: "100%", maxHeight: "68vh", width: "auto", height: "auto" }}
              />
            ) : (
              <div className="flex max-w-sm flex-col items-center text-center">
                <ImagePlus className="h-10 w-10 text-muted" />
                <p className="mt-4 font-semibold">Drop, paste, or upload a screenshot</p>
                <p className="mt-1 text-sm text-muted">Or capture a website from its address. Your edits stay in your browser.</p>
                <button className={`${btn} mt-5`} onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4" /> Choose image
                </button>
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
              Shortcuts:{" "}
              <kbd className="rounded border border-edge bg-base px-1.5 py-0.5 font-semibold text-fg">Ctrl S</kbd> save PNG,{" "}
              <kbd className="rounded border border-edge bg-base px-1.5 py-0.5 font-semibold text-fg">Ctrl C</kbd> copy image.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
