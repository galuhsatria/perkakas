import { Crop, Loader2, MousePointerClick, Plus, RefreshCw, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Settings, computeLayout, draw, makeDemoImage, measureTextBox } from "../compose";
import { CaptureOptions } from "./CaptureOptions";

type Device = "desktop" | "tablet" | "mobile";
type CaptureStatus = { configured: boolean; available: boolean; remaining?: number; limit?: number } | null;
type Layout = ReturnType<typeof computeLayout>;

const checker = {
  backgroundImage: "conic-gradient(#2A2A2E 25%, #1A1A1D 0 50%, #2A2A2E 0 75%, #1A1A1D 0)",
  backgroundSize: "16px 16px",
};

type Props = {
  img: HTMLImageElement | null;
  s: Settings;
  layout: Layout | null;
  replacing: boolean;
  onReplacing: (v: boolean) => void;
  onFile: (file?: File | null) => void;
  onLoadSource: (src: string, host?: string) => Promise<void> | void;
  onCrop: () => void;
  onReset: () => void;
  onPatch: (p: Partial<Settings>) => void;
};

const clamp = (v: number) => Math.round(Math.min(100, Math.max(0, v)) * 10) / 10;
const clampRange = (v: number, min = -100, max = 100) => Math.round(Math.min(max, Math.max(min, v)) * 10) / 10;

export function Preview({ img, s, layout, replacing, onReplacing, onFile, onLoadSource, onCrop, onReset, onPatch }: Props) {
  const [dragging, setDragging] = useState(false);
  const textDrag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const winDrag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  const [status, setStatus] = useState<CaptureStatus>(null);
  const [limitHit, setLimitHit] = useState(false);
  const [url, setUrl] = useState("");
  const [device, setDevice] = useState<Device>("desktop");
  const [fullPage, setFullPage] = useState(false);
  const [delay, setDelay] = useState(500);
  const [busy, setBusy] = useState(false);
  const [captureError, setCaptureError] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!img || !layout || !canvasRef.current) return;
    const scale = Math.min(1, 1400 / Math.max(layout.W, layout.H));
    const id = requestAnimationFrame(() => canvasRef.current && draw(canvasRef.current, img, s, scale));
    return () => cancelAnimationFrame(id);
  }, [img, s, layout, replacing]);

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
      await onLoadSource(data.image, host);
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
  const showImage = !!img && !replacing;

  // Drag the image itself anywhere, even partly outside the canvas
  const canMove = !!layout;
  const onWinDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canMove) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    winDrag.current = { px: e.clientX, py: e.clientY, x: s.offsetX, y: s.offsetY };
  };
  const onWinMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = winDrag.current;
    if (!d || !layout) return;
    const k = e.currentTarget.getBoundingClientRect().width / layout.W;
    onPatch({
      offsetX: clampRange(d.x + ((e.clientX - d.px) / k / layout.W) * 100),
      offsetY: clampRange(d.y + ((e.clientY - d.py) / k / layout.H) * 100),
    });
  };
  const onWinUp = () => {
    winDrag.current = null;
  };

  // Draggable handle over the overlay text
  const textBox = showImage && layout ? measureTextBox(s, layout.W, layout.H) : null;
  const pad = layout && textBox ? Math.max(textBox.h * 0.2, layout.W * 0.008) : 0;

  const onTextDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    textDrag.current = { px: e.clientX, py: e.clientY, x: s.textX, y: s.textY };
  };
  const onTextMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = textDrag.current;
    const c = canvasRef.current;
    if (!d || !c) return;
    const r = c.getBoundingClientRect();
    onPatch({
      textX: clamp(d.x + ((e.clientX - d.px) / r.width) * 100),
      textY: clamp(d.y + ((e.clientY - d.py) / r.height) * 100),
    });
  };
  const onTextUp = () => {
    textDrag.current = null;
  };
  const onTextKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 5 : 1;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    onPatch({ textX: clamp(s.textX + m[0]), textY: clamp(s.textY + m[1]) });
  };

  return (
    <section className="card order-first h-max lg:sticky lg:top-6 lg:order-1">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onFile(e.dataTransfer.files?.[0]);
        }}
        className={`relative flex min-h-[420px] items-center justify-center rounded-lg p-4 transition-colors ${
          showImage ? "pt-16" : ""
        } ${dragging ? "ring-2 ring-primary" : ""}`}
        style={showImage && transparent ? checker : { backgroundColor: "#0A0A0A" }}
      >
        {showImage ? (
          <div className="group relative max-w-full">
            <canvas
              ref={canvasRef}
              aria-label="Screenshot preview"
              onPointerDown={onWinDown}
              onPointerMove={onWinMove}
              onPointerUp={onWinUp}
              onPointerCancel={onWinUp}
              className={`block ${canMove ? "cursor-grab touch-none active:cursor-grabbing" : ""}`}
              style={{ maxWidth: "100%", maxHeight: "68vh", width: "auto", height: "auto" }}
            />

            {textBox && layout && (
              <div
                role="button"
                tabIndex={0}
                aria-label="Move text (drag, or use arrow keys)"
                onPointerDown={onTextDown}
                onPointerMove={onTextMove}
                onPointerUp={onTextUp}
                onPointerCancel={onTextUp}
                onKeyDown={onTextKey}
                className="absolute z-[5] cursor-move touch-none rounded border border-dashed border-transparent transition-colors hover:border-white/70 focus-visible:border-white/70 focus-visible:outline-none"
                style={{
                  left: `${((textBox.x - pad) / layout.W) * 100}%`,
                  top: `${((textBox.y - pad) / layout.H) * 100}%`,
                  width: `${((textBox.w + 2 * pad) / layout.W) * 100}%`,
                  height: `${((textBox.h + 2 * pad) / layout.H) * 100}%`,
                }}
              />
            )}

            <div className="absolute bottom-full left-1/2 z-10 -translate-x-1/2 pb-2.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
              <div className="relative flex divide-x divide-edge rounded-xl border border-edge bg-base shadow-xl shadow-black/50">
                <button type="button" className="tool rounded-l-xl" onClick={onCrop}>
                  <Crop className="h-4 w-4" /> Crop
                </button>
                <button type="button" className="tool" onClick={() => onReplacing(true)}>
                  <RefreshCw className="h-4 w-4" />
                  <span>
                    Replace<span className="hidden sm:inline"> screenshot</span>
                  </span>
                </button>
                <button type="button" className="tool rounded-r-xl" onClick={onReset}>
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
                onClick={() => onReplacing(false)}
                className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full text-muted transition-colors hover:bg-white/10 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <p className="rounded-t-2xl border-b border-edge bg-base/40 px-10 py-4 text-center text-xs leading-relaxed text-muted">
              Drag-n-drop your image here, use <kbd className="kbd">Ctrl</kbd> + <kbd className="kbd">V</kbd> to paste from clipboard
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
                onClick={() => onLoadSource(makeDemoImage().toDataURL("image/png"))}
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
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
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

      {img && (
        <p className="mt-3 text-xs text-muted">
          Shortcuts: <kbd className="kbd">Ctrl S</kbd> save PNG, <kbd className="kbd">Ctrl C</kbd> copy image.
        </p>
      )}
    </section>
  );
}
