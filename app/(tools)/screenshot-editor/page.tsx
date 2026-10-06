"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CropModal } from "./components/CropModal";
import { Preview } from "./components/Preview";
import { SettingsPanel } from "./components/SettingsPanel";
import { DEFAULTS, Settings, computeLayout, draw, ensureFont } from "./compose";

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
  const [replacing, setReplacing] = useState(false);
  const [cropping, setCropping] = useState(false);
  const [exportScale, setExportScale] = useState<1 | 2>(1);

  const originalRef = useRef<HTMLImageElement | null>(null);

  const flash = useCallback((msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 2500);
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

  const resetCanvas = () => {
    if (originalRef.current) setImg(originalRef.current);
    setS((prev) => ({ ...DEFAULTS, address: prev.address }));
  };

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

  // Load the selected web font, then redraw so the canvas picks it up
  useEffect(() => {
    let alive = true;
    ensureFont(s.textFont, s.textBold).then((loaded) => {
      if (loaded && alive) setS((prev) => ({ ...prev }));
    });
    return () => {
      alive = false;
    };
  }, [s.textFont, s.textBold]);

  const layout = useMemo(() => (img ? computeLayout(img.naturalWidth, img.naturalHeight, s) : null), [img, s]);

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

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-10 lg:py-16">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Screenshot Editor</h1>
      <p className="mt-3 max-w-xl text-muted">
        Add a background, a browser frame, and a soft shadow to any screenshot. Capture a website by URL, or upload your own image.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <SettingsPanel
          s={s}
          setS={setS}
          hasImage={!!img}
          exportScale={exportScale}
          onExportScale={setExportScale}
          copied={notice === "Copied to clipboard"}
          onSave={save}
          onCopy={copy}
        />

        <Preview
          img={img}
          s={s}
          layout={layout}
          replacing={replacing}
          onReplacing={setReplacing}
          onFile={readFile}
          onLoadSource={(src, host) => loadSource(src, host)}
          onCrop={() => setCropping(true)}
          onReset={resetCanvas}
          onPatch={(p) => setS((prev) => ({ ...prev, ...p }))}
        />
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
