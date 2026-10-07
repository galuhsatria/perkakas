import type { Settings, Layout } from "./types";
import { computeLayout, windowRadii } from "./layout";
import { paintBackground, paintText, paintTilted, drawShadow, paintWindow } from "./drawing";

export function draw(canvas: HTMLCanvasElement, img: HTMLImageElement, s: Settings, scale: number, flatten?: string): Layout {
  const L = computeLayout(img.naturalWidth, img.naturalHeight, s);
  canvas.width = Math.max(1, Math.round(L.W * scale));
  canvas.height = Math.max(1, Math.round(L.H * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return L;

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, L.W, L.H);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (flatten) {
    ctx.fillStyle = flatten;
    ctx.fillRect(0, 0, L.W, L.H);
  }
  paintBackground(ctx, L.W, L.H, s);

  if (s.tiltX !== 0 || s.tiltY !== 0) {
    paintTilted(ctx, img, s, L, scale);
  } else {
    const { x, y, w, h } = L.win;
    const { r } = windowRadii(s, w, h, L.inset);
    drawShadow(ctx, s, L, scale);
    paintWindow(ctx, img, s, L, x, y);
  }
  paintText(ctx, L.W, L.H, s);
  return L;
}