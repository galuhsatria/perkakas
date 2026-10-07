import type { Settings } from "../types";

function paintPattern(ctx: CanvasRenderingContext2D, W: number, H: number, s: Settings) {
  // Intensity works like zoom: the higher it is, the bigger the pattern and the fewer the lines.
  // 50% = default size, 100% ≈ 2.8x, 25% ≈ 0.35x. Raise the exponent for a stronger zoom.
  const zoom = Math.pow(Math.max(0.2, s.patternIntensity / 50), 1.5);
  const step = Math.max(8, Math.max(24, Math.min(W, H) / 26) * zoom);
  const alpha = Math.min(1, Math.max(0, s.patternOpacity / 100));
  const color = `rgba(255,255,255,${alpha})`;
  const baseLine = Math.max(1, step / 24);

  // Draw on a square big enough to cover the canvas at any rotation
  const d = Math.hypot(W, H);
  const x0 = W / 2 - d / 2;
  const y0 = H / 2 - d / 2;

  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate((s.patternRotation * Math.PI) / 180);
  ctx.translate(-W / 2, -H / 2);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = baseLine;
  ctx.lineCap = "round";

  if (s.pattern === "dots") {
    const radius = step * 0.07;
    for (let y = y0 + step / 2; y < y0 + d; y += step)
      for (let x = x0 + step / 2; x < x0 + d; x += step) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
  } else if (s.pattern === "grid") {
    ctx.beginPath();
    for (let x = x0; x <= x0 + d; x += step) {
      ctx.moveTo(x, y0);
      ctx.lineTo(x, y0 + d);
    }
    for (let y = y0; y <= y0 + d; y += step) {
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + d, y);
    }
    ctx.stroke();
  } else if (s.pattern === "lines") {
    ctx.beginPath();
    for (let kx = x0 - d; kx < x0 + d; kx += step) {
      ctx.moveTo(kx, y0);
      ctx.lineTo(kx + d, y0 + d);
    }
    ctx.stroke();
  } else if (s.pattern === "waves") {
    ctx.lineWidth = Math.max(2, step * 0.18);
    const spacing = step * 0.9;
    const amp = step * 0.9;
    const wavelength = step * 9;
    const dx = Math.max(1, step / 40);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    for (let y = y0; y <= y0 + d; y += spacing) {
      ctx.beginPath();
      let px = x0;
      let py = 0;
      for (let x = x0; x <= x0 + d; x += dx) {
        const t = ((x - x0) / wavelength) * Math.PI * 2;
        const yy = y + Math.sin(t) * amp;
        if (x === x0) {
          ctx.moveTo(x, yy);
        } else {
          // connect through midpoint so there are no sharp corners
          ctx.quadraticCurveTo(px, py, (px + x) / 2, (py + yy) / 2);
        }
        px = x;
        py = yy;
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function paintBackground(ctx: CanvasRenderingContext2D, W: number, H: number, s: Settings) {
  if (s.bgMode === "transparent") return;
  if (s.bgMode === "solid") {
    ctx.fillStyle = s.solid;
  } else {
    const t = (s.angle * Math.PI) / 180;
    const dx = Math.sin(t);
    const dy = -Math.cos(t);
    const len = Math.abs(W * dx) + Math.abs(H * dy);
    const g = ctx.createLinearGradient(W / 2 - (dx * len) / 2, H / 2 - (dy * len) / 2, W / 2 + (dx * len) / 2, H / 2 + (dy * len) / 2);
    g.addColorStop(0, s.c1);
    g.addColorStop(1, s.c2);
    ctx.fillStyle = g;
  }
  ctx.fillRect(0, 0, W, H);

  if (s.pattern === "none") return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.clip();
  paintPattern(ctx, W, H, s);
  ctx.restore();
}