"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, ImagePlus, RotateCcw } from "lucide-react";

type Kind = "any" | "apple" | "maskable";
type Source = "text" | "image";

const ICONS: { file: string; size: number; kind: Kind; purpose: string }[] = [
  { file: "apple-touch-icon.png", size: 180, kind: "apple", purpose: "iOS home screen" },
  { file: "icon-192.png", size: 192, kind: "any", purpose: "Android and manifest" },
  { file: "icon-512.png", size: 512, kind: "any", purpose: "Install and splash screen" },
  { file: "maskable-512.png", size: 512, kind: "maskable", purpose: "Android adaptive icon" },
];

const SWATCHES = ["#FF8A1F", "#0A0A0A", "#FFFFFF", "#2563EB", "#16A34A", "#DC2626"];

const DEFAULTS = {
  source: "text" as Source,
  text: "P",
  textColor: "#FFFFFF",
  bg: "#FF8A1F",
  scale: 62,
  radius: 22,
};
type Opts = typeof DEFAULTS;

const card = "rounded-xl border border-edge bg-panel p-5";
const pill =
  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";
const input =
  "w-full rounded-lg border border-edge bg-base px-3 py-2 text-fg outline-none focus:border-primary";
const smallBtn =
  "flex items-center justify-center gap-1.5 rounded-full border border-edge px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-primary hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40";

const checker = {
  backgroundImage:
    "linear-gradient(45deg,#1b1b1e 25%,transparent 25%),linear-gradient(-45deg,#1b1b1e 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#1b1b1e 75%),linear-gradient(-45deg,transparent 75%,#1b1b1e 75%)",
  backgroundSize: "16px 16px",
  backgroundPosition: "0 0,0 8px,8px -8px,-8px 0",
  backgroundColor: "#111113",
} as const;

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function render(kind: Kind, size: number, o: Opts, logo: HTMLImageElement | null) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // "any" icons get rounded corners with transparent edges.
  // Apple and maskable icons are full-bleed squares: the OS applies its own mask.
  ctx.fillStyle = o.bg;
  if (kind === "any") {
    roundedRect(ctx, 0, 0, size, size, (size * o.radius) / 100);
    ctx.fill();
  } else {
    ctx.fillRect(0, 0, size, size);
  }

  // Maskable icons keep the logo inside the safe zone so Android can crop safely
  const box = size * (o.scale / 100) * (kind === "maskable" ? 0.8 : 1);

  if (o.source === "image" && logo) {
    const ratio = Math.min(box / logo.naturalWidth, box / logo.naturalHeight);
    const w = logo.naturalWidth * ratio;
    const h = logo.naturalHeight * ratio;
    ctx.drawImage(logo, (size - w) / 2, (size - h) / 2, w, h);
  } else if (o.source === "text" && o.text.trim()) {
    const label = o.text.trim();
    const family = "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif";
    let fs = box * 0.95;
    ctx.font = `800 ${fs}px ${family}`;
    const width = ctx.measureText(label).width;
    if (width > box) {
      fs *= box / width;
      ctx.font = `800 ${fs}px ${family}`;
    }
    const m = ctx.measureText(label);
    ctx.fillStyle = o.textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(label, size / 2, size / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
  }
  return canvas;
}

const toBlob = (c: HTMLCanvasElement) => new Promise<Blob | null>((res) => c.toBlob(res, "image/png"));

function saveBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// Minimal ZIP writer (no compression), so no extra dependency is needed
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function makeZip(files: { name: string; data: Uint8Array }[]) {
  const enc = new TextEncoder();
  const now = new Date();
  const time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const f of files) {
    const name = enc.encode(f.name);
    const crc = crc32(f.data);

    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(10, time, true);
    lv.setUint16(12, date, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, f.data.length, true);
    lv.setUint32(22, f.data.length, true);
    lv.setUint16(26, name.length, true);
    local.set(name, 30);

    const cen = new Uint8Array(46 + name.length);
    const cv = new DataView(cen.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(12, time, true);
    cv.setUint16(14, date, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, f.data.length, true);
    cv.setUint32(24, f.data.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    cen.set(name, 46);

    parts.push(local, f.data);
    central.push(cen);
    offset += local.length + f.data.length;
  }

  const cdSize = central.reduce((n, c) => n + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, offset, true);

  return new Blob([...parts, ...central, end] as BlobPart[], { type: "application/zip" });
}

const MANIFEST_SNIPPET = `icons: [
  { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
],`;

export default function Page() {
  const [opts, setOpts] = useState<Opts>(DEFAULTS);
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const [logoName, setLogoName] = useState("");
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Opts>(key: K, value: Opts[K]) => setOpts((o) => ({ ...o, [key]: value }));

  // Redraw the previews whenever an option or the logo changes
  useEffect(() => {
    const next: Record<string, string> = {};
    for (const i of ICONS) next[i.file] = render(i.kind, i.size, opts, logo).toDataURL("image/png");
    setPreviews(next);
  }, [opts, logo]);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(id);
  }, [copied]);

  const loadFile = (file?: File | null) => {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) return setError("Please choose an image file (PNG, SVG, JPG or WebP).");
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setLogo(img);
      setLogoName(file.name);
      set("source", "image");
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      setError("This image could not be read. Try a PNG or SVG.");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const downloadOne = async (i: (typeof ICONS)[number]) => {
    const blob = await toBlob(render(i.kind, i.size, opts, logo));
    if (blob) saveBlob(blob, i.file);
  };

  const downloadAll = async () => {
    setBusy(true);
    try {
      const files: { name: string; data: Uint8Array }[] = [];
      for (const i of ICONS) {
        const blob = await toBlob(render(i.kind, i.size, opts, logo));
        if (blob) files.push({ name: `icons/${i.file}`, data: new Uint8Array(await blob.arrayBuffer()) });
      }
      saveBlob(makeZip(files), "pwa-icons.zip");
    } finally {
      setBusy(false);
    }
  };

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(MANIFEST_SNIPPET);
      setCopied(true);
    } catch {}
  };

  const canExport = useMemo(
    () => (opts.source === "image" ? !!logo : opts.text.trim().length > 0),
    [opts.source, opts.text, logo]
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-10 lg:py-16">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">PWA Icon Generator</h1>
      <p className="mt-3 max-w-lg text-muted">
        Turn a logo or a few letters into every icon a PWA needs: Apple touch icon, 192, 512 and maskable. It runs in
        your browser, nothing is uploaded.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Previews */}
        <section className={card}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold">Your icons</h2>
            <button
              onClick={downloadAll}
              disabled={!canExport || busy}
              className="flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              {busy ? "Preparing..." : "Download all (.zip)"}
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {ICONS.map((i) => (
              <div key={i.file} className="rounded-lg border border-edge bg-base p-4">
                <div
                  className="relative mx-auto flex h-36 w-36 items-center justify-center overflow-hidden rounded-lg"
                  style={checker}
                >
                  {previews[i.file] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previews[i.file]} alt={i.file} className="h-full w-full object-contain" />
                  )}
                  {i.kind === "maskable" && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-1/2 top-1/2 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/60"
                    />
                  )}
                </div>
                <p className="mt-4 text-sm font-semibold">{i.file}</p>
                <p className="text-xs text-muted">
                  {i.size}x{i.size} · {i.purpose}
                </p>
                <button onClick={() => downloadOne(i)} disabled={!canExport} className={`${smallBtn} mt-3`}>
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted">
            The dashed circle on the maskable icon is the safe zone. Android may crop everything outside it.
          </p>
        </section>

        {/* Controls */}
        <div className="flex flex-col gap-6">
          <section className={`${card} flex flex-col gap-4`}>
            <h2 className="font-bold">Source</h2>
            <div role="tablist" aria-label="Icon source" className="flex w-fit rounded-full border border-edge p-1">
              {(["text", "image"] as Source[]).map((s) => (
                <button
                  key={s}
                  role="tab"
                  aria-selected={opts.source === s}
                  onClick={() => set("source", s)}
                  className={`${pill} ${opts.source === s ? "bg-white/10 text-fg" : "text-muted hover:text-fg"}`}
                >
                  {s === "text" ? "Letters" : "Logo image"}
                </button>
              ))}
            </div>

            {opts.source === "text" ? (
              <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="text-muted">Letters (1 to 3)</span>
                  <input
                    value={opts.text}
                    onChange={(e) => set("text", e.target.value.slice(0, 3))}
                    maxLength={3}
                    aria-label="Icon letters"
                    className={`${input} text-center text-lg font-bold`}
                  />
                </label>
                <label className="flex flex-col items-center gap-1.5 text-sm">
                  <span className="text-muted">Color</span>
                  <input
                    type="color"
                    value={opts.textColor}
                    onChange={(e) => set("textColor", e.target.value.toUpperCase())}
                    aria-label="Letter color"
                    className="h-10 w-12 cursor-pointer rounded-lg border border-edge bg-base p-1"
                  />
                </label>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  loadFile(e.dataTransfer.files[0]);
                }}
                className={`flex flex-col items-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
                  dragging ? "border-primary bg-primary/5" : "border-edge"
                }`}
              >
                <ImagePlus className="h-7 w-7 text-muted" aria-hidden />
                <p className="mt-2 text-sm text-muted">
                  {logoName ? logoName : "Drop a logo here. Square, 512px or larger works best."}
                </p>
                <button onClick={() => fileRef.current?.click()} className={`${smallBtn} mt-3`}>
                  {logoName ? "Change image" : "Choose image"}
                </button>
                {error && (
                  <p role="alert" className="mt-3 text-xs text-red-400">
                    {error}
                  </p>
                )}
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => loadFile(e.target.files?.[0])}
              className="hidden"
              aria-label="Upload logo"
            />
          </section>

          <section className={`${card} flex flex-col gap-4`}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Style</h2>
              <button
                onClick={() => {
                  setOpts(DEFAULTS);
                  setLogo(null);
                  setLogoName("");
                  setError("");
                }}
                aria-label="Reset all options"
                className="flex items-center gap-1.5 text-xs text-muted underline underline-offset-4 hover:text-fg"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            </div>

            <div>
              <p className="mb-2 text-sm text-muted">Background</p>
              <div className="flex flex-wrap items-center gap-3">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    onClick={() => set("bg", c)}
                    aria-label={`Background ${c}`}
                    aria-pressed={opts.bg === c}
                    className={`h-8 w-8 rounded-full border-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                      opts.bg === c ? "border-primary" : "border-edge hover:border-muted"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <label
                  title="Custom color"
                  className="relative h-8 w-8 cursor-pointer overflow-hidden rounded-full border-2 border-edge hover:border-muted"
                  style={{ background: "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)" }}
                >
                  <span className="sr-only">Custom background color</span>
                  <input
                    type="color"
                    value={opts.bg}
                    onChange={(e) => set("bg", e.target.value.toUpperCase())}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </label>
              </div>
            </div>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="flex justify-between text-muted">
                <span>Logo size</span>
                <span className="tabular-nums">{opts.scale}%</span>
              </span>
              <input
                type="range"
                min={30}
                max={100}
                value={opts.scale}
                onChange={(e) => set("scale", Number(e.target.value))}
                className="accent-[#FF8A1F]"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="flex justify-between text-muted">
                <span>Corner radius (192 and 512 icons)</span>
                <span className="tabular-nums">{opts.radius}%</span>
              </span>
              <input
                type="range"
                min={0}
                max={50}
                value={opts.radius}
                onChange={(e) => set("radius", Number(e.target.value))}
                className="accent-[#FF8A1F]"
              />
            </label>
          </section>

          <section className={card}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Manifest</h2>
              <button onClick={copySnippet} className={smallBtn}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="mt-3 overflow-x-auto rounded-lg border border-edge bg-base p-3 text-[11px] leading-relaxed text-muted">
              {MANIFEST_SNIPPET}
            </pre>
            <ul className="mt-3 list-disc space-y-1.5 pl-4 text-xs text-muted">
              <li>Unzip into your project as public/icons/.</li>
              <li>Apple and maskable icons are full squares. The system rounds them.</li>
              <li>Maskable icons shrink the logo a little so nothing gets cropped.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
