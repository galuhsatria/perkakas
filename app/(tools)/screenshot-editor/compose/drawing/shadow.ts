import type { Settings, Layout } from "../types";
import { windowRadii } from "../layout";
import { rr } from "./frames";

export function drawShadow(ctx: CanvasRenderingContext2D, s: Settings, L: Layout, scale: number) {
  const { x, y, w, h } = L.win;
  const { r } = windowRadii(s, w, h, L.inset);

  if (s.shadow > 0) {
    // shadowBlur and offsets ignore the transform, so scale them by hand.
    // The shape is drawn far off-canvas and only its shadow is shifted back in,
    // so no black fill shows through translucent frames (Arc).
    const blur = s.shadow * w * 0.014;
    const off = L.W * 2;
    ctx.save();
    ctx.shadowColor = `rgba(0,0,0,${0.22 + s.shadow * 0.06})`;
    ctx.shadowBlur = blur * scale;
    ctx.shadowOffsetX = off * scale;
    ctx.shadowOffsetY = blur * 0.45 * scale;
    ctx.fillStyle = "#000";
    rr(ctx, x - off, y, w, h, r);
    ctx.fill();
    ctx.restore();
  }
}