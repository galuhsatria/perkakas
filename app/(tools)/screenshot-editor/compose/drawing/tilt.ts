import type { Settings, Layout, Pt } from "../types";
import { windowRadii } from "../layout";
import { paintWindow } from "./paintWindow";

// 3D tilt: rotate around X (tiltX) then Y (tiltY) with a simple perspective camera.
// (u, v) are local coordinates relative to the window center.
function makeProjector(s: Settings, cx: number, cy: number, w: number, h: number) {
  const ax = (s.tiltX * Math.PI) / 180;
  const ay = (s.tiltY * Math.PI) / 180;
  const ca = Math.cos(ax);
  const sa = Math.sin(ax);
  const cb = Math.cos(ay);
  const sb = Math.sin(ay);
  const d = Math.max(w, h) * 2.4; // camera distance
  return (u: number, v: number): Pt => {
    const y1 = v * ca;
    const z1 = v * sa;
    const x2 = u * cb + z1 * sb;
    const z2 = -u * sb + z1 * cb;
    const f = d / (d - z2);
    return [cx + x2 * f, cy + y1 * f];
  };
}

// Rounded-rect outline as local points (centered), used for the tilted shadow
function outline(w: number, h: number, r: number, seg = 8): Pt[] {
  const pts: Pt[] = [];
  const hw = w / 2;
  const hh = h / 2;
  const corners: [number, number, number][] = [
    [hw - r, -hh + r, -Math.PI / 2],
    [hw - r, hh - r, 0],
    [-hw + r, hh - r, Math.PI / 2],
    [-hw + r, -hh + r, Math.PI],
  ];
  corners.forEach(([cx, cy, a0]) => {
    for (let i = 0; i <= seg; i++) {
      const a = a0 + ((Math.PI / 2) * i) / seg;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  });
  return pts;
}

// Draws one textured triangle: maps the texture triangle (s0,s1,s2) onto (d0,d1,d2)
function drawTri(ctx: CanvasRenderingContext2D, tex: HTMLCanvasElement, d0: Pt, d1: Pt, d2: Pt, s0: Pt, s1: Pt, s2: Pt, eps: number) {
  const A = s1[0] - s0[0];
  const B = s1[1] - s0[1];
  const C = s2[0] - s0[0];
  const D = s2[1] - s0[1];
  const det = A * D - C * B;
  if (!det) return;
  const dx1 = d1[0] - d0[0];
  const dy1 = d1[1] - d0[1];
  const dx2 = d2[0] - d0[0];
  const dy2 = d2[1] - d0[1];
  const a = (dx1 * D - dx2 * B) / det;
  const b = (dy1 * D - dy2 * B) / det;
  const c = (A * dx2 - C * dx1) / det;
  const d = (A * dy2 - C * dy1) / det;
  const e = d0[0] - a * s0[0] - c * s0[1];
  const f = d0[1] - b * s0[0] - d * s0[1];

  // grow the clip triangle a little so neighbouring triangles overlap (no hairline seams)
  const mx = (d0[0] + d1[0] + d2[0]) / 3;
  const my = (d0[1] + d1[1] + d2[1]) / 3;
  const grow = (p: Pt): Pt => {
    const gx = p[0] - mx;
    const gy = p[1] - my;
    const len = Math.hypot(gx, gy) || 1;
    return [p[0] + (gx / len) * eps, p[1] + (gy / len) * eps];
  };
  const g0 = grow(d0);
  const g1 = grow(d1);
  const g2 = grow(d2);

  const x0 = Math.max(0, Math.min(s0[0], s1[0], s2[0]) - 2);
  const y0 = Math.max(0, Math.min(s0[1], s1[1], s2[1]) - 2);
  const x1 = Math.min(tex.width, Math.max(s0[0], s1[0], s2[0]) + 2);
  const y1 = Math.min(tex.height, Math.max(s0[1], s1[1], s2[1]) + 2);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(g0[0], g0[1]);
  ctx.lineTo(g1[0], g1[1]);
  ctx.lineTo(g2[0], g2[1]);
  ctx.closePath();
  ctx.clip();
  ctx.transform(a, b, c, d, e, f);
  ctx.drawImage(tex, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
  ctx.restore();
}

export function paintTilted(ctx: CanvasRenderingContext2D, img: HTMLImageElement, s: Settings, L: Layout, scale: number) {
  const { x, y, w, h } = L.win;
  const { r } = windowRadii(s, w, h, L.inset);

  // 1. render the flat window into a texture
  const ts = scale * Math.min(1, 4096 / Math.max(w * scale, h * scale));
  const tex = document.createElement("canvas");
  tex.width = Math.max(1, Math.round(w * ts));
  tex.height = Math.max(1, Math.round(h * ts));
  const tctx = tex.getContext("2d");
  if (!tctx) return;
  tctx.setTransform(ts, 0, 0, ts, 0, 0);
  tctx.imageSmoothingEnabled = true;
  tctx.imageSmoothingQuality = "high";
  paintWindow(tctx, img, s, L, 0, 0);

  const P = makeProjector(s, x + w / 2, y + h / 2, w, h);

  // 2. shadow from the projected outline
  if (s.shadow > 0) {
    const blur = s.shadow * w * 0.014;
    const off = L.W * 2;
    ctx.save();
    ctx.shadowColor = `rgba(0,0,0,${0.22 + s.shadow * 0.06})`;
    ctx.shadowBlur = blur * scale;
    ctx.shadowOffsetX = off * scale;
    ctx.shadowOffsetY = blur * 0.45 * scale;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    outline(w, h, r).forEach(([u, v], i) => {
      const [px, py] = P(u, v);
      if (i === 0) ctx.moveTo(px - off, py);
      else ctx.lineTo(px - off, py);
    });
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 3. warp the texture with a grid of affine triangles
  const N = 14;
  const tw = tex.width;
  const th = tex.height;
  const eps = 0.75 / scale;
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const u0 = -w / 2 + (w * i) / N;
      const u1 = -w / 2 + (w * (i + 1)) / N;
      const v0 = -h / 2 + (h * j) / N;
      const v1 = -h / 2 + (h * (j + 1)) / N;
      const s00: Pt = [(tw * i) / N, (th * j) / N];
      const s10: Pt = [(tw * (i + 1)) / N, (th * j) / N];
      const s01: Pt = [(tw * i) / N, (th * (j + 1)) / N];
      const s11: Pt = [(tw * (i + 1)) / N, (th * (j + 1)) / N];
      const d00 = P(u0, v0);
      const d10 = P(u1, v0);
      const d01 = P(u0, v1);
      const d11 = P(u1, v1);
      drawTri(ctx, tex, d00, d10, d01, s00, s10, s01, eps);
      drawTri(ctx, tex, d10, d11, d01, s10, s11, s01, eps);
    }
  }
}