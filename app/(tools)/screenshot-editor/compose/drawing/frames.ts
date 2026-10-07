import type { Settings, FrameId, Layout } from "../types";
import { isBorder, FRAMES, BORDERS, CHROME_RATIO, type BorderId } from "../constants";

function fit(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > max) t = t.slice(0, -1);
  return t + "…";
}

export function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawChrome(ctx: CanvasRenderingContext2D, s: Settings, x: number, y: number, w: number, c: number) {
  const f = FRAMES[s.frame as keyof typeof FRAMES];
  const lineH = Math.max(1, c * 0.025);
  ctx.fillStyle = f.bar;
  ctx.fillRect(x, y, w, c);
  ctx.fillStyle = f.line;
  ctx.fillRect(x, y + c - lineH, w, lineH);

  const cy = y + c / 2;
  if (f.style === "mac") {
    ["#FF5F57", "#FEBC2E", "#28C840"].forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x + c * 0.55 + i * c * 0.38, cy, c * 0.13, 0, Math.PI * 2);
      ctx.fill();
    });
  } else {
    ctx.strokeStyle = f.ctrl;
    ctx.lineWidth = Math.max(1, c * 0.04);
    const half = c * 0.14;
    for (let i = 0; i < 3; i++) {
      const cx = x + w - c * (2.5 - i);
      ctx.beginPath();
      if (i === 0) {
        ctx.moveTo(cx - half, cy);
        ctx.lineTo(cx + half, cy);
      } else if (i === 1) {
        ctx.rect(cx - half, cy - half, half * 2, half * 2);
      } else {
        ctx.moveTo(cx - half, cy - half);
        ctx.lineTo(cx + half, cy + half);
        ctx.moveTo(cx + half, cy - half);
        ctx.lineTo(cx - half, cy + half);
      }
      ctx.stroke();
    }
  }

  const text = s.address.trim();
  if (!text) return;
  const pillH = c * 0.56;
  const pillW = f.style === "mac" ? w * 0.5 : Math.max(10, w - c * 4.2);
  const pillX = f.style === "mac" ? x + (w - pillW) / 2 : x + c * 0.5;
  rr(ctx, pillX, cy - pillH / 2, pillW, pillH, pillH / 2);
  ctx.fillStyle = f.pill;
  ctx.fill();
  ctx.fillStyle = f.text;
  ctx.font = `${c * 0.3}px -apple-system, "Segoe UI", system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = f.style === "mac" ? "center" : "left";
  const maxText = pillW - pillH;
  ctx.fillText(fit(ctx, text, maxText), f.style === "mac" ? pillX + pillW / 2 : pillX + pillH * 0.6, cy + c * 0.01);
}

export function paintBorderFrame(
  ctx: CanvasRenderingContext2D,
  id: BorderId,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  b: number
) {
  if (id === "arc") {
    // soft, translucent light ring
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    rr(ctx, x, y, w, h, r);
    ctx.fill();
    const lw = Math.max(1, b * 0.06);
    ctx.lineWidth = lw;
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    rr(ctx, x + lw / 2, y + lw / 2, w - lw, h - lw, Math.max(0, r - lw / 2));
    ctx.stroke();
  } else if (id === "shortboard") {
    // thick dark bezel
    ctx.fillStyle = "#2B2B2E";
    rr(ctx, x, y, w, h, r);
    ctx.fill();
    const lw = Math.max(1, b * 0.08);
    ctx.lineWidth = lw;
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    rr(ctx, x + lw / 2, y + lw / 2, w - lw, h - lw, Math.max(0, r - lw / 2));
    ctx.stroke();
  } else {
    // ruler: light band with tick marks pointing inward from the edge
    ctx.fillStyle = "#ECECEF";
    rr(ctx, x, y, w, h, r);
    ctx.fill();

    const step = Math.max(3, b * 0.5);
    const minor = b * 0.38;
    const major = b * 0.62;
    ctx.strokeStyle = "#9A9AA3";
    ctx.lineWidth = Math.max(1, b * 0.045);
    ctx.lineCap = "butt";
    ctx.beginPath();
    let i = 0;
    for (let px = x + r; px <= x + w - r; px += step, i++) {
      const len = i % 5 === 0 ? major : minor;
      ctx.moveTo(px, y);
      ctx.lineTo(px, y + len);
      ctx.moveTo(px, y + h);
      ctx.lineTo(px, y + h - len);
    }
    i = 0;
    for (let py = y + r; py <= y + h - r; py += step, i++) {
      const len = i % 5 === 0 ? major : minor;
      ctx.moveTo(x, py);
      ctx.lineTo(x + len, py);
      ctx.moveTo(x + w, py);
      ctx.lineTo(x + w - len, py);
    }
    ctx.stroke();
  }
}