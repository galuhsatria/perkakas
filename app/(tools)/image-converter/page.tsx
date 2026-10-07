"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2, Trash2, Upload, X } from "lucide-react";
import { encodeBmp, wrapIco, zipStore } from "./encoders";

type FormatId = "png" | "jpeg" | "webp" | "avif" | "bmp" | "ico";

interface Format {
  id: FormatId;
  label: string;
  mime: string;
  ext: string;
  lossy: boolean;
  alpha: boolean; // can keep transparency
  note?: string;
}

const FORMATS: Format[] = [
  { id: "png", label: "PNG", mime: "image/png", ext: "png", lossy: false, alpha: true },
  { id: "jpeg", label: "JPG", mime: "image/jpeg", ext: "jpg", lossy: true, alpha: false },
  { id: "webp", label: "WebP", mime: "image/webp", ext: "webp", lossy: true, alpha: true },
  {
    id: "avif",
    label: "AVIF",
    mime: "image/avif",
    ext: "avif",
    lossy: true,
    alpha: true,
    note: "Smallest files, but some older apps can't open AVIF.",
  },
  {
    id: "bmp",
    label: "BMP",
    mime: "image/bmp",
    ext: "bmp",
    lossy: false,
    alpha: false,
    note: "BMP has no compression, so files are large.",
  },
  {
    id: "ico",
    label: "ICO",
    mime: "image/x-icon",
    ext: "ico",
    lossy: false,
    alpha: true,
    note: "Saved as a square icon up to 256 px, with the image centered.",
  },
];

interface Source {
  draw: CanvasImageSource;
  w: number;
  h: number;
  revoke?: () => void;
}

interface Item {
  id: string;
  name: string;
  type: string;
  size: number;
  w: number;
  h: number;
  thumb: string;
  status: "loading" | "queued" | "converting" | "done" | "error";
  error?: string;
  out?: { blob: Blob; w: number; h: number; key: string; label: string; ext: string };
}

interface Opts {
  quality: number;
  bg: string;
  resize: boolean;
  maxW: number;
  maxH: number;
}

const MAX_FILE = 60 * 1024 * 1024;

const card = "rounded-xl border border-edge bg-panel p-5";
const input =
  "w-full rounded-lg border border-edge bg-base px-3 py-2 text-fg outline-none placeholder:text-muted focus:border-primary disabled:opacity-40";
const btn =
  "flex items-center justify-center gap-2 rounded-lg border border-edge px-4 py-2 text-sm font-semibold transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-edge";

const typeLabel = (t: string, name: string) => {
  const sub = (t.split("/")[1] || name.split(".").pop() || "image").replace("svg+xml", "svg").replace("x-icon", "ico").replace("vnd.microsoft.icon", "ico");
  return sub === "jpeg" ? "JPG" : sub.toUpperCase();
};

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

const baseName = (name: string) => name.replace(/\.[^.]+$/, "") || "image";

async function loadSource(file: File): Promise<Source> {
  const isSvg = file.type === "image/svg+xml" || /\.svg$/i.test(file.name);

  if (!isSvg && typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file); // respects EXIF orientation
      return { draw: bmp, w: bmp.width, h: bmp.height, revoke: () => bmp.close?.() };
    } catch {}
  }

  const url = URL.createObjectURL(file);
  const img = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("decode"));
      img.src = url;
    });
  } catch {
    URL.revokeObjectURL(url);
    throw new Error(/\.(heic|heif)$/i.test(file.name) || /hei[cf]/i.test(file.type)
      ? "This browser can't open HEIC files. Safari can, or convert it elsewhere first."
      : "This file can't be read as an image.");
  }

  let w = img.naturalWidth;
  let h = img.naturalHeight;
  if (isSvg) {
    // Vector files have no real pixel size: render them big enough to stay sharp
    if (!w || !h) {
      w = 1024;
      h = 1024;
    }
    if (w < 1024) {
      h = Math.round((h * 1024) / w);
      w = 1024;
    }
  }
  return { draw: img, w, h, revoke: () => URL.revokeObjectURL(url) };
}

function toBlob(canvas: HTMLCanvasElement, mime: string, quality?: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, quality));
}

async function canEncode(mime: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 1;
  const b = await toBlob(c, mime, 0.8);
  return !!b && b.type === mime;
}

async function convertImage(src: Source, fmt: Format, o: Opts): Promise<{ blob: Blob; w: number; h: number }> {
  let w = src.w;
  let h = src.h;
  if (o.resize) {
    const kx = o.maxW > 0 ? o.maxW / w : Infinity;
    const ky = o.maxH > 0 ? o.maxH / h : Infinity;
    const k = Math.min(1, kx, ky); // never upscale
    w = Math.max(1, Math.round(w * k));
    h = Math.max(1, Math.round(h * k));
  }

  const canvas = document.createElement("canvas");

  if (fmt.id === "ico") {
    const size = Math.min(256, Math.max(w, h));
    const k = size / Math.max(w, h);
    const dw = Math.max(1, Math.round(w * k));
    const dh = Math.max(1, Math.round(h * k));
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src.draw, (size - dw) / 2, (size - dh) / 2, dw, dh);
    const png = await toBlob(canvas, "image/png");
    if (!png) throw new Error("Could not create the icon.");
    return { blob: wrapIco(new Uint8Array(await png.arrayBuffer()), size), w: size, h: size };
  }

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This image is too large for your browser to convert.");
  ctx.imageSmoothingQuality = "high";
  if (!fmt.alpha) {
    ctx.fillStyle = o.bg; // fill transparent areas, since this format can't store them
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(src.draw, 0, 0, w, h);

  if (fmt.id === "bmp") return { blob: encodeBmp(ctx.getImageData(0, 0, w, h)), w, h };

  const blob = await toBlob(canvas, fmt.mime, fmt.lossy ? o.quality / 100 : undefined);
  if (!blob) throw new Error("This image is too large for your browser to convert.");
  if (blob.type !== fmt.mime) throw new Error(`This browser can't save ${fmt.label} files.`);
  return { blob, w, h };
}

function download(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export default function ImageConverter() {
  const [items, setItems] = useState<Item[]>([]);
  const [formatId, setFormatId] = useState<FormatId>("jpeg");
  const [quality, setQuality] = useState(85);
  const [bg, setBg] = useState("#FFFFFF");
  const [resize, setResize] = useState(false);
  const [maxW, setMaxW] = useState(1920);
  const [maxH, setMaxH] = useState(0);
  const [supported, setSupported] = useState<Record<string, boolean>>({ webp: true, avif: false });
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState("");
  const [zipping, setZipping] = useState(false);
  const [version, setVersion] = useState(0);

  const fileRef = useRef<HTMLInputElement>(null);
  const sources = useRef(new Map<string, Source>());
  const itemsRef = useRef<Item[]>([]);
  itemsRef.current = items;
  const runRef = useRef(0);
  const cancelRuns = useCallback(() => {
    runRef.current += 1;
  }, []);

  const fmt = FORMATS.find((f) => f.id === formatId)!;
  // Only settings that affect the chosen format are part of the key, so unrelated tweaks don't re-encode
  const settingsKey = [fmt.id, fmt.lossy ? quality : "", fmt.alpha ? "" : bg, resize ? `${maxW}x${maxH}` : "orig"].join("|");

  const flash = useCallback((msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3000);
  }, []);

  useEffect(() => {
    Promise.all([canEncode("image/webp"), canEncode("image/avif")]).then(([webp, avif]) => setSupported({ webp, avif }));
  }, []);

  const patch = useCallback((id: string, changes: Partial<Item>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...changes } : it)));
  }, []);

  const addFiles = useCallback(
    (list: FileList | File[] | null | undefined) => {
      const files = Array.from(list ?? []).filter((f) => f.type.startsWith("image/") || /\.(heic|heif|avif|ico|bmp|svg|webp|gif|png|jpe?g)$/i.test(f.name));
      if (files.length === 0) return flash("Please choose image files.");

      files.forEach((file) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const base: Item = {
          id,
          name: file.name,
          type: file.type,
          size: file.size,
          w: 0,
          h: 0,
          thumb: URL.createObjectURL(file),
          status: "loading",
        };
        if (file.size > MAX_FILE) {
          setItems((prev) => [...prev, { ...base, status: "error", error: "File is larger than 60 MB." }]);
          return;
        }
        setItems((prev) => [...prev, base]);
        loadSource(file)
          .then((src) => {
            sources.current.set(id, src);
            patch(id, { w: src.w, h: src.h, status: "queued" });
            setVersion((v) => v + 1);
          })
          .catch((e: Error) => patch(id, { status: "error", error: e.message }));
      });
    },
    [flash, patch]
  );

  // Paste images from the clipboard
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
      if (files.length) {
        e.preventDefault();
        addFiles(files);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addFiles]);

  // Convert everything whenever files or relevant settings change
  useEffect(() => {
    const opts: Opts = { quality, bg, resize, maxW, maxH };
    const timer = setTimeout(async () => {
      const run = ++runRef.current;
      for (const it of itemsRef.current) {
        if (runRef.current !== run) return;
        const src = sources.current.get(it.id);
        if (!src) continue;
        if (it.status === "done" && it.out?.key === settingsKey) continue;
        patch(it.id, { status: "converting", error: undefined });
        try {
          const r = await convertImage(src, fmt, opts);
          if (runRef.current !== run) return;
          patch(it.id, { status: "done", out: { ...r, key: settingsKey, label: fmt.label, ext: fmt.ext } });
        } catch (e) {
          if (runRef.current !== run) return;
          patch(it.id, { status: "error", error: (e as Error).message, out: undefined });
        }
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      cancelRuns();
    };
    // quality, bg, resize, maxW and maxH are all captured by settingsKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, settingsKey, fmt, patch, cancelRuns]);

  // Free memory on unmount
  useEffect(() => {
    const map = sources.current;
    return () => {
      map.forEach((s) => s.revoke?.());
      itemsRef.current.forEach((it) => URL.revokeObjectURL(it.thumb));
    };
  }, []);

  const remove = (id: string) => {
    const it = itemsRef.current.find((i) => i.id === id);
    if (it) URL.revokeObjectURL(it.thumb);
    sources.current.get(id)?.revoke?.();
    sources.current.delete(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearAll = () => {
    itemsRef.current.forEach((it) => URL.revokeObjectURL(it.thumb));
    sources.current.forEach((s) => s.revoke?.());
    sources.current.clear();
    cancelRuns();
    setItems([]);
  };

  const outName = (it: Item) => `${baseName(it.name)}.${it.out?.ext ?? fmt.ext}`;

  // An item is "fresh" when its result matches the current settings
  const isFresh = (i: Item) => i.status === "done" && !!i.out && i.out.key === settingsKey;
  const isWorking = (i: Item) => i.status === "loading" || i.status === "queued" || i.status === "converting" || (i.status === "done" && !isFresh(i));

  const downloadAll = async () => {
    const done = items.filter(isFresh);
    if (done.length === 0) return;
    setZipping(true);
    try {
      const used = new Map<string, number>();
      const files = await Promise.all(
        done.map(async (it) => {
          let name = outName(it);
          const n = (used.get(name) ?? 0) + 1;
          used.set(name, n);
          if (n > 1) name = name.replace(/(\.[^.]+)$/, ` (${n})$1`);
          return { name, data: new Uint8Array(await it.out!.blob.arrayBuffer()) };
        })
      );
      download(zipStore(files), `converted-${fmt.ext}.zip`);
    } catch {
      flash("Could not create the ZIP file.");
    } finally {
      setZipping(false);
    }
  };

  const done = items.filter(isFresh);
  const busy = items.some(isWorking);
  const totalIn = done.reduce((s, i) => s + i.size, 0);
  const totalOut = done.reduce((s, i) => s + i.out!.blob.size, 0);
  const change = totalIn > 0 ? Math.round((1 - totalOut / totalIn) * 100) : 0;

  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      addFiles(e.dataTransfer.files);
    },
  };

  const disabledFormat = (f: Format) => (f.id === "webp" ? !supported.webp : f.id === "avif" ? !supported.avif : false);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-10 lg:py-16">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Image Converter</h1>
      <p className="mt-3 max-w-xl text-muted">
        Convert images between PNG, JPG, WebP, AVIF, BMP, and ICO. Files never leave your browser.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Settings */}
        <section className={`${card} flex h-max flex-col gap-5 lg:sticky lg:top-6`}>
          <div>
            <h2 className="mb-3 font-bold">Convert to</h2>
            <div role="radiogroup" aria-label="Output format" className="flex flex-wrap gap-2">
              {FORMATS.map((f) => {
                const off = disabledFormat(f);
                return (
                  <button
                    key={f.id}
                    type="button"
                    role="radio"
                    aria-checked={formatId === f.id}
                    disabled={off}
                    title={off ? "Your browser can't save this format" : undefined}
                    onClick={() => setFormatId(f.id)}
                    className={`rounded-full border px-4 py-1.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40 ${
                      formatId === f.id ? "border-primary bg-primary/15 font-semibold text-primary" : "border-edge text-muted hover:text-fg"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
            {fmt.note && <p className="mt-3 text-xs text-muted">{fmt.note}</p>}
          </div>

          {fmt.lossy && (
            <label className="block text-sm">
              <span className="flex justify-between text-muted">
                Quality
                <span className="tabular-nums text-fg">{quality}%</span>
              </span>
              <input
                type="range"
                min={1}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="mt-2 w-full accent-[#FF8A1F]"
              />
              <span className="mt-1 block text-xs text-muted">Lower means a smaller file and softer detail.</span>
            </label>
          )}

          {!fmt.alpha && (
            <label className="flex items-center gap-3 text-sm text-muted">
              <input
                type="color"
                value={bg}
                onChange={(e) => setBg(e.target.value.toUpperCase())}
                className="h-9 w-11 shrink-0 cursor-pointer rounded-md border border-edge bg-base p-1"
              />
              <span className="flex-1">
                Background
                <span className="block text-xs">Fills transparent areas, since {fmt.label} can&apos;t store them.</span>
              </span>
            </label>
          )}

          <div className="border-t border-edge pt-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Resize</span>
              <button
                type="button"
                role="switch"
                aria-checked={resize}
                aria-label="Resize images"
                onClick={() => setResize(!resize)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                  resize ? "bg-primary" : "bg-edge"
                }`}
              >
                <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${resize ? "translate-x-5" : ""}`} />
              </button>
            </div>
            {resize && (
              <div className="mt-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm text-muted">
                    Max width
                    <input
                      type="number"
                      min={0}
                      value={maxW || ""}
                      placeholder="auto"
                      onChange={(e) => setMaxW(Math.max(0, Number(e.target.value) || 0))}
                      className={`${input} mt-1.5`}
                    />
                  </label>
                  <label className="text-sm text-muted">
                    Max height
                    <input
                      type="number"
                      min={0}
                      value={maxH || ""}
                      placeholder="auto"
                      onChange={(e) => setMaxH(Math.max(0, Number(e.target.value) || 0))}
                      className={`${input} mt-1.5`}
                    />
                  </label>
                </div>
                <p className="mt-2 text-xs text-muted">Images keep their proportions and are never enlarged.</p>
              </div>
            )}
          </div>

          <p className="border-t border-edge pt-4 text-xs text-muted">
            Converting also removes metadata such as location and camera info. Animated GIFs keep only their first frame.
          </p>
        </section>

        {/* Files */}
        <section className="flex flex-col gap-4">
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,.heic,.heif,.avif,.ico,.bmp,.svg"
            className="sr-only"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />

          <div
            {...dropHandlers}
            className={`flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center transition-colors ${
              dragging ? "border-primary bg-primary/10" : "border-edge"
            } ${items.length === 0 ? "min-h-[300px]" : ""}`}
          >
            <Upload className="h-8 w-8 text-muted" />
            <p className="mt-3 font-semibold">Drop images here, or paste with Ctrl V</p>
            <p className="mt-1 max-w-md text-sm text-muted">
              Reads PNG, JPG, WebP, AVIF, GIF, BMP, SVG, and ICO. HEIC works only in browsers that can open it, such as Safari.
            </p>
            <button className={`${btn} mt-4`} onClick={() => fileRef.current?.click()}>
              Choose files
            </button>
          </div>

          {items.length > 0 && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted" role="status">
                  {notice ||
                    (busy
                      ? "Converting..."
                      : done.length > 0
                      ? `${done.length} ${done.length === 1 ? "file" : "files"}: ${fmtBytes(totalIn)} to ${fmtBytes(totalOut)} (${change >= 0 ? "-" : "+"}${Math.abs(change)}%)`
                      : "")}
                </p>
                <div className="flex gap-2">
                  <button className={btn} onClick={downloadAll} disabled={done.length === 0 || zipping}>
                    {zipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {done.length > 1 ? "Download all (ZIP)" : "Download"}
                  </button>
                  <button className={btn} onClick={clearAll}>
                    <Trash2 className="h-4 w-4" /> Clear
                  </button>
                </div>
              </div>

              <ul className="flex flex-col gap-3">
                {items.map((it) => {
                  const fresh = isFresh(it);
                  const diff = it.out ? Math.round((1 - it.out.blob.size / it.size) * 100) : 0;
                  return (
                    <li key={it.id} className="flex items-center gap-4 rounded-xl border border-edge bg-panel p-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-edge bg-base">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={it.thumb}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{it.name}</p>
                        {it.status === "error" ? (
                          <p className="text-sm text-red-400">{it.error}</p>
                        ) : (
                          <p className="text-sm text-muted">
                            {typeLabel(it.type, it.name)}
                            {it.w ? `, ${it.w}×${it.h}` : ""}, {fmtBytes(it.size)}
                            {fresh && it.out && (
                              <>
                                {" "}
                                to <span className="font-semibold text-fg">{it.out.label}</span>, {it.out.w}×{it.out.h}, {fmtBytes(it.out.blob.size)}{" "}
                                <span className={diff >= 0 ? "text-primary" : "text-muted"}>
                                  ({diff >= 0 ? "-" : "+"}
                                  {Math.abs(diff)}%)
                                </span>
                              </>
                            )}
                          </p>
                        )}
                      </div>
                      {isWorking(it) && (
                        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted" aria-label="Working" />
                      )}
                      {fresh && it.out && (
                        <button
                          className={btn}
                          aria-label={`Download ${outName(it)}`}
                          onClick={() => download(it.out!.blob, outName(it))}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => remove(it.id)}
                        aria-label={`Remove ${it.name}`}
                        className="shrink-0 rounded-md p-1.5 text-muted transition-colors hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
