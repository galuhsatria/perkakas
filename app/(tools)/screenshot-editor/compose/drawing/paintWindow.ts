import type { Settings, Layout } from "../types";
import { isBorder } from "../constants";
import { rr } from "./frames";
import { windowRadii } from "../layout";
import { drawChrome } from "./frames";
import { paintBorderFrame } from "./frames";

export function paintWindow(ctx: CanvasRenderingContext2D, img: HTMLImageElement, s: Settings, L: Layout, x: number, y: number) {
  const { w, h } = L.win;
  const b = L.inset;
  const { r, rIn } = windowRadii(s, w, h, b);
  const ix = x + b;
  const iy = y + b + L.chrome;
  const iw = w - 2 * b;
  const ih = h - 2 * b - L.chrome;

  ctx.save();
  rr(ctx, x, y, w, h, r);
  ctx.clip();
  if (isBorder(s.frame)) {
    paintBorderFrame(ctx, s.frame, x, y, w, h, r, b);
    ctx.save();
    rr(ctx, ix, iy, iw, ih, rIn);
    ctx.clip();
    ctx.drawImage(img, ix, iy, iw, ih);
    ctx.restore();
  } else {
    if (s.frame !== "none") drawChrome(ctx, s, x, y, w, L.chrome);
    ctx.drawImage(img, x, y + L.chrome, w, h - L.chrome);
  }
  ctx.restore();
}