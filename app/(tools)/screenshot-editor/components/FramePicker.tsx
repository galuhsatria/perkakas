import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DEFAULTS, FRAME_OPTIONS, FrameId, Settings, draw } from "../compose";

let thumbPromise: Promise<HTMLImageElement> | null = null;
const getThumbImage = () => {
  if (!thumbPromise) {
    thumbPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const c = document.createElement("canvas");
      c.width = 320;
      c.height = 200;
      const ctx = c.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.fillStyle = "#D4D4D8";
        ctx.fillRect(24, 28, 120, 12);
        ctx.fillStyle = "#E4E4E7";
        ctx.fillRect(24, 54, 220, 8);
        ctx.fillRect(24, 70, 180, 8);
        ctx.fillStyle = "#F1F1F3";
        ctx.fillRect(24, 104, 128, 72);
        ctx.fillRect(168, 104, 128, 72);
        ctx.fillStyle = "#A1A1AA";
        ctx.fillRect(36, 116, 48, 8);
        ctx.fillRect(180, 116, 48, 8);
      }
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("thumb"));
      i.src = c.toDataURL("image/png");
    });
  }
  return thumbPromise;
};

const THUMB_PX = 170;

function FrameThumb({
  img,
  frame,
  roundness,
  shadow,
}: {
  img: HTMLImageElement | null;
  frame: FrameId;
  roundness: number;
  shadow: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!img || !c) return;
    const t = {
      ...DEFAULTS,
      frame,
      roundness,
      shadow,
      bgMode: "gradient",
      c1: "#A1A1AA",
      c2: "#71717A",
      angle: 135,
      pattern: "none",
      canvas: "og",
      size: 84,
      padding: 6,
      address: "",
    } as Settings;
    const dpr = Math.max(2, window.devicePixelRatio || 1);
    draw(c, img, t, (THUMB_PX * dpr) / 1200);
  }, [img, frame, roundness, shadow]);

  return <canvas ref={ref} aria-hidden className="block h-auto w-full rounded-lg" style={{ aspectRatio: "1200 / 630" }} />;
}

type Props = {
  s: Settings;
  patch: (p: Partial<Settings>) => void;
};

export function FramePicker({ s, patch }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    let alive = true;
    getThumbImage()
      .then((i) => alive && setImg(i))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="p-4">
      <div className="flex items-center gap-2">
        <input
          value={s.address}
          onChange={(e) => patch({ address: e.target.value })}
          placeholder="Enter URL to show in frame"
          aria-label="Address bar text"
          className="input"
        />
        <button type="button" className="btn shrink-0" onClick={() => patch({ address: "" })}>
          Clear
        </button>
      </div>

      <div role="radiogroup" aria-label="Frame" className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FRAME_OPTIONS.map((f) => {
          const on = s.frame === f.id;
          return (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => patch({ frame: f.id })}
              className={`relative flex flex-col items-center gap-2 rounded-xl border p-2 pb-2.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                on ? "border-primary bg-primary/10" : "border-edge bg-base hover:border-primary/60"
              }`}
            >
              <FrameThumb img={img} frame={f.id} roundness={s.roundness} shadow={s.shadow} />
              <span className={`w-full truncate text-center text-xs font-medium ${on ? "text-primary" : "text-muted"}`}>
                {f.label}
              </span>
              {on && (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-black">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
