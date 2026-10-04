"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, ImagePlus, RotateCcw } from "lucide-react";

type Status = "idle" | "loading" | "done" | "error";
type View = "result" | "original";

const MAX_MB = 15;
const SWATCHES = [
  { label: "Transparent", value: "transparent" },
  { label: "White", value: "#FFFFFF" },
  { label: "Black", value: "#000000" },
  { label: "Orange", value: "#FF8A1F" },
];

const card = "rounded-xl border border-edge bg-panel p-5";
const pill =
  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";
const iconBtn =
  "flex h-12 w-12 items-center justify-center rounded-full border border-edge text-muted transition-colors hover:border-primary hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";

const checker = {
  backgroundImage:
    "linear-gradient(45deg,#1b1b1e 25%,transparent 25%),linear-gradient(-45deg,#1b1b1e 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#1b1b1e 75%),linear-gradient(-45deg,transparent 75%,#1b1b1e 75%)",
  backgroundSize: "20px 20px",
  backgroundPosition: "0 0,0 10px,10px -10px,-10px 0",
  backgroundColor: "#111113",
} as const;

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("");
  const [error, setError] = useState("");
  const [bg, setBg] = useState("transparent");
  const [view, setView] = useState<View>("result");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Object URLs are tracked in a ref and revoked explicitly (never from state-based effect cleanups)
  const urls = useRef<{ orig?: string; res?: string }>({});
  const revokeUrls = () => {
    if (urls.current.orig) URL.revokeObjectURL(urls.current.orig);
    if (urls.current.res) URL.revokeObjectURL(urls.current.res);
    urls.current = {};
  };
  useEffect(() => {
    return () => {
      if (urls.current.orig) URL.revokeObjectURL(urls.current.orig);
      if (urls.current.res) URL.revokeObjectURL(urls.current.res);
    };
  }, []);

  const process = useCallback(async (f: File) => {
    setError("");
    if (!f.type.startsWith("image/")) return setError("Please choose an image file (PNG, JPG or WebP).");
    if (f.size > MAX_MB * 1024 * 1024) return setError(`The image is too large. Max size is ${MAX_MB} MB.`);

    revokeUrls();
    const orig = URL.createObjectURL(f);
    urls.current.orig = orig;
    setFile(f);
    setOriginalUrl(orig);
    setResultBlob(null);
    setResultUrl("");
    setView("result");
    setProgress(0);
    setPhase("Starting");
    setStatus("loading");

    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(f, {
        output: { format: "image/png" },
        progress: (key: string, current: number, total: number) => {
          setPhase(key.startsWith("fetch") ? "Downloading AI model (first time only)" : "Removing background");
          if (total) setProgress(Math.round((current / total) * 100));
        },
      });
      const res = URL.createObjectURL(blob);
      urls.current.res = res;
      setResultBlob(blob);
      setResultUrl(res);
      setStatus("done");
    } catch {
      setError("Something went wrong while processing the image. Try another image or reload the page.");
      setStatus("error");
    }
  }, []);

  const onFiles = (files: FileList | null) => {
    const f = files?.[0];
    if (f) process(f);
  };

  const reset = () => {
    revokeUrls();
    setFile(null);
    setOriginalUrl("");
    setResultBlob(null);
    setResultUrl("");
    setStatus("idle");
    setError("");
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const download = async () => {
    if (!resultBlob || !file) return;
    const img = await loadImage(resultUrl);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (bg !== "transparent") {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0);
    canvas.toBlob((b) => {
      if (!b) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = `${file.name.replace(/\.[^.]+$/, "")}-no-bg.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, "image/png");
  };

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const f = Array.from(e.clipboardData?.files ?? []).find((x) => x.type.startsWith("image/"));
      if (f) process(f);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [process]);

  const done = status === "done";

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-10 lg:py-16">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Background Remover</h1>
      <p className="mt-3 max-w-lg text-muted">
        Remove the background from any image in seconds. It runs in your browser, so your image is never uploaded.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Workspace */}
        <section className={`${card} flex flex-col items-center py-8`}>
          {status === "idle" || status === "error" ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                onFiles(e.dataTransfer.files);
              }}
              className={`flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors ${
                dragging ? "border-primary bg-primary/5" : "border-edge"
              }`}
            >
              <ImagePlus className="h-10 w-10 text-muted" aria-hidden />
              <p className="mt-4 font-semibold">Drop an image here</p>
              <p className="mt-1 text-sm text-muted">or paste with Ctrl+V. PNG, JPG or WebP, up to {MAX_MB} MB.</p>
              <button
                onClick={() => inputRef.current?.click()}
                className="mt-6 rounded-full bg-primary px-6 py-2 font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              >
                Choose image
              </button>
              {error && (
                <p role="alert" className="mt-5 max-w-sm text-sm text-red-400">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <>
              <div role="tablist" aria-label="Preview" className="flex rounded-full border border-edge p-1">
                {(["result", "original"] as View[]).map((v) => (
                  <button
                    key={v}
                    role="tab"
                    aria-selected={view === v}
                    onClick={() => setView(v)}
                    disabled={!done}
                    className={`${pill} ${view === v ? "bg-white/10 text-fg" : "text-muted hover:text-fg"} disabled:opacity-50`}
                  >
                    {v === "result" ? "Result" : "Original"}
                  </button>
                ))}
              </div>

              <div
                className="relative mt-6 flex min-h-[18rem] w-full items-center justify-center overflow-hidden rounded-lg border border-edge"
                style={view === "result" && bg === "transparent" ? checker : { backgroundColor: view === "result" ? bg : "#0A0A0A" }}
              >
                <img
                  key={view}
                  src={view === "result" && done ? resultUrl : originalUrl}
                  alt={view === "result" ? "Image with background removed" : "Original image"}
                  className={`max-h-[28rem] w-auto max-w-full object-contain ${status === "loading" ? "opacity-40" : ""}`}
                />
                {status === "loading" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-base/60 px-8 text-center">
                    <p className="text-sm font-semibold">{phase}</p>
                    <div
                      className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-edge"
                      role="progressbar"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs tabular-nums text-muted">{progress}%</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center gap-4">
                <button onClick={reset} aria-label="Start over with another image" className={iconBtn}>
                  <RotateCcw className="h-5 w-5" />
                </button>
                <button
                  onClick={download}
                  disabled={!done}
                  className="flex min-w-[6rem] items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-lg font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Download className="h-5 w-5" />
                  Download
                </button>
              </div>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={(e) => onFiles(e.target.files)}
            className="hidden"
            aria-label="Upload image"
          />
        </section>

        {/* Side panel */}
        <div className="flex flex-col gap-6">
          <section className={card}>
            <h2 className="font-bold">Background</h2>
            <p className="mt-1 text-xs text-muted">Applied to the preview and the downloaded file.</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {SWATCHES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setBg(s.value)}
                  aria-label={s.label}
                  aria-pressed={bg === s.value}
                  title={s.label}
                  className={`h-9 w-9 rounded-full border-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                    bg === s.value ? "border-primary" : "border-edge hover:border-muted"
                  }`}
                  style={s.value === "transparent" ? checker : { backgroundColor: s.value }}
                />
              ))}
              <label
                title="Custom color"
                className="relative h-9 w-9 cursor-pointer overflow-hidden rounded-full border-2 border-edge hover:border-muted"
                style={{ background: "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)" }}
              >
                <span className="sr-only">Custom color</span>
                <input
                  type="color"
                  onChange={(e) => setBg(e.target.value.toUpperCase())}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
            </div>
          </section>

          <section className={card}>
            <h2 className="font-bold">Tips</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-4 text-xs text-muted">
              <li>The first image takes longer because the AI model has to download (about 40 to 80 MB). After that it is cached.</li>
              <li>Works best on photos with a clear subject: people, products, pets.</li>
              <li>Download is a PNG at the original resolution.</li>
              <li>Everything stays on your device.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
