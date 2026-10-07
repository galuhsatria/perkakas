import type { Settings } from "../types";
import { TEXT_FONT_OPTIONS } from "../constants";

function fontCss(s: Settings, size: number) {
  const def = TEXT_FONT_OPTIONS.find((f) => f.id === s.textFont) ?? TEXT_FONT_OPTIONS[0];
  return `${s.textBold ? 700 : 400} ${size}px ${def.stack}`;
}

let measureCtx: CanvasRenderingContext2D | null = null;

/** Bounding box of the overlay text in canvas (logical) units, or null when there is no text. */
export function measureTextBox(s: Settings, W: number, H: number) {
  if (!s.text.trim() || typeof document === "undefined") return null;
  if (!measureCtx) measureCtx = document.createElement("canvas").getContext("2d");
  const ctx = measureCtx;
  if (!ctx) return null;
  const lines = s.text.replace(/\s+$/, "").split("\n");
  const size = (W * s.textSize) / 100;
  const lh = size * 1.25;
  ctx.font = fontCss(s, size);
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width), size * 0.5);
  const h = (lines.length - 1) * lh + size;
  const cx = (W * s.textX) / 100;
  const cy = (H * s.textY) / 100;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

export function paintText(ctx: CanvasRenderingContext2D, W: number, H: number, s: Settings) {
  if (!s.text.trim()) return;
  const lines = s.text.replace(/\s+$/, "").split("\n");
  const size = (W * s.textSize) / 100;
  const lh = size * 1.25;
  ctx.save();
  ctx.font = fontCss(s, size);
  ctx.fillStyle = s.textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const cx = (W * s.textX) / 100;
  const top = (H * s.textY) / 100 - ((lines.length - 1) * lh) / 2;
  lines.forEach((line, i) => ctx.fillText(line, cx, top + i * lh));
  ctx.restore();
}