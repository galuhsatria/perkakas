export type FrameId = "none" | "mac-light" | "mac-dark" | "win-light" | "win-dark";
export type BgMode = "gradient" | "solid" | "transparent";
export type Pattern = "none" | "dots" | "grid" | "lines" | "waves";

export interface Settings {
  frame: FrameId;
  address: string;
  bgMode: BgMode;
  c1: string;
  c2: string;
  angle: number;
  solid: string;
  pattern: Pattern;
  patternIntensity: number; // 10-100, acts as zoom: higher = bigger pattern, fewer lines
  patternRotation: number; // 0-360 degrees
  patternOpacity: number; // 5-100 %
  canvas: string;
  size: number; // % of the available area (fixed canvas sizes only)
  padding: number; // % of the shorter side
  roundness: number; // 0-40
  shadow: number; // 0-5
}

export const DEFAULTS: Settings = {
  frame: "mac-light",
  address: "",
  bgMode: "gradient",
  c1: "#FF8A1F",
  c2: "#E65B48",
  angle: 135,
  solid: "#111113",
  pattern: "none",
  patternIntensity: 50,
  patternRotation: 0,
  patternOpacity: 25,
  canvas: "auto",
  size: 90,
  padding: 8,
  roundness: 14,
  shadow: 3,
};

export const PATTERN_OPTIONS: { id: Pattern; label: string }[] = [
  { id: "none", label: "None" },
  { id: "dots", label: "Dots" },
  { id: "grid", label: "Grid" },
  { id: "lines", label: "Lines" },
  { id: "waves", label: "Waves" },
];

export const CANVAS_PRESETS = [
  { id: "auto", label: "Auto", w: 0, h: 0 },
  { id: "square", label: "Square 1:1", w: 1080, h: 1080 },
  { id: "ig", label: "Instagram 4:5", w: 1080, h: 1350 },
  { id: "story", label: "Story 9:16", w: 1080, h: 1920 },
  { id: "x", label: "X post 16:9", w: 1600, h: 900 },
  { id: "linkedin", label: "LinkedIn", w: 1200, h: 627 },
  { id: "og", label: "Open Graph", w: 1200, h: 630 },
  { id: "yt", label: "YouTube thumbnail", w: 1280, h: 720 },
];

export const GRADIENTS = [
  { name: "Ember", c1: "#FF8A1F", c2: "#E65B48" },
  { name: "Sunset", c1: "#FF9A8B", c2: "#FF6A88" },
  { name: "Candy", c1: "#F093FB", c2: "#F5576C" },
  { name: "Grape", c1: "#8E2DE2", c2: "#4A00E0" },
  { name: "Ocean", c1: "#00C6FB", c2: "#005BEA" },
  { name: "Sky", c1: "#A1C4FD", c2: "#C2E9FB" },
  { name: "Aurora", c1: "#43E97B", c2: "#38F9D7" },
  { name: "Mint", c1: "#D4FC79", c2: "#96E6A1" },
  { name: "Peach", c1: "#FFECD2", c2: "#FCB69F" },
  { name: "Night", c1: "#0F2027", c2: "#2C5364" },
  { name: "Slate", c1: "#232526", c2: "#414345" },
  { name: "Cloud", c1: "#FFFFFF", c2: "#D1D5DB" },
];

export const FRAME_OPTIONS: { id: FrameId; label: string }[] = [
  { id: "none", label: "None" },
  { id: "mac-light", label: "macOS light" },
  { id: "mac-dark", label: "macOS dark" },
  { id: "win-light", label: "Windows light" },
  { id: "win-dark", label: "Windows dark" },
];

const FRAMES = {
  "mac-light": { style: "mac", bar: "#F3F4F6", line: "#E5E7EB", pill: "#FFFFFF", text: "#6B7280", ctrl: "#6B7280" },
  "mac-dark": { style: "mac", bar: "#202124", line: "#303134", pill: "#2E2F33", text: "#A1A1AA", ctrl: "#A1A1AA" },
  "win-light": { style: "win", bar: "#F3F3F3", line: "#E0E0E0", pill: "#FFFFFF", text: "#4B5563", ctrl: "#374151" },
  "win-dark": { style: "win", bar: "#1F1F1F", line: "#2E2E2E", pill: "#2B2B2B", text: "#A1A1AA", ctrl: "#D4D4D8" },
} as const;

const CHROME_RATIO = 0.04; // title bar height as a fraction of window width

export interface Layout {
  W: number;
  H: number;
  win: { x: number; y: number; w: number; h: number };
  chrome: number;
}

export function computeLayout(iw: number, ih: number, s: Settings): Layout {
  const hasFrame = s.frame !== "none";
  const preset = CANVAS_PRESETS.find((p) => p.id === s.canvas) ?? CANVAS_PRESETS[0];
  const ratio = hasFrame ? CHROME_RATIO : 0;

  if (preset.w === 0) {
    const ww = Math.min(iw, 2000);
    const chrome = ww * ratio;
    const wh = (ih * ww) / iw + chrome;
    const pad = (ww * s.padding) / 100;
    return { W: Math.round(ww + 2 * pad), H: Math.round(wh + 2 * pad), win: { x: pad, y: pad, w: ww, h: wh }, chrome };
  }

  const W = preset.w;
  const H = preset.h;
  const pad = (Math.min(W, H) * s.padding) / 100;
  const boxW = Math.max(10, W - 2 * pad);
  const boxH = Math.max(10, H - 2 * pad);
  const aspect = ih / iw + ratio;
  const ww = Math.min(boxW, boxH / aspect) * (s.size / 100);
  const wh = ww * aspect;
  return { W, H, win: { x: (W - ww) / 2, y: (H - wh) / 2, w: ww, h: wh }, chrome: ww * ratio };
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fit(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > max) t = t.slice(0, -1);
  return t + "…";
}

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
    ctx.lineWidth = Math.max(2, step * 0.22);
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
          // sambungkan lewat titik tengah supaya tidak ada sudut
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

function paintBackground(ctx: CanvasRenderingContext2D, W: number, H: number, s: Settings) {
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

function drawChrome(ctx: CanvasRenderingContext2D, s: Settings, x: number, y: number, w: number, c: number) {
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

  const { x, y, w, h } = L.win;
  const r = Math.min((s.roundness * w) / 1000 * 1.2, w / 2, h / 2);

  if (s.shadow > 0) {
    // shadowBlur and offsets ignore the transform, so scale them by hand
    const blur = s.shadow * w * 0.014;
    ctx.save();
    ctx.shadowColor = `rgba(0,0,0,${0.22 + s.shadow * 0.06})`;
    ctx.shadowBlur = blur * scale;
    ctx.shadowOffsetY = blur * 0.45 * scale;
    ctx.fillStyle = "#000";
    rr(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  rr(ctx, x, y, w, h, r);
  ctx.clip();
  if (s.frame !== "none") drawChrome(ctx, s, x, y, w, L.chrome);
  ctx.drawImage(img, x, y + L.chrome, w, h - L.chrome);
  ctx.restore();
  return L;
}

// A small fake UI so people can try the editor without an image
export function makeDemoImage(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 1440;
  c.height = 900;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(0, 0, 1440, 900);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, 1440, 72);
  ctx.fillStyle = "#FF8A1F";
  rr(ctx, 40, 18, 36, 36, 10);
  ctx.fill();
  ctx.fillStyle = "#111827";
  ctx.font = "700 24px system-ui, sans-serif";
  ctx.fillText("Perkakas", 92, 44);
  ctx.fillStyle = "#E5E7EB";
  ctx.fillRect(0, 72, 1440, 2);
  ctx.fillStyle = "#111827";
  ctx.font = "800 52px system-ui, sans-serif";
  ctx.fillText("Every small tool I use,", 80, 190);
  ctx.fillStyle = "#9CA3AF";
  ctx.fillText("in one place.", 80, 255);
  const cols = ["#FF8A1F", "#0099FF", "#E65B48"];
  for (let i = 0; i < 3; i++) {
    const x = 80 + i * 430;
    ctx.fillStyle = "#FFFFFF";
    rr(ctx, x, 330, 390, 400, 20);
    ctx.fill();
    ctx.strokeStyle = "#E5E7EB";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = cols[i];
    rr(ctx, x + 28, 358, 64, 64, 16);
    ctx.fill();
    ctx.fillStyle = "#111827";
    ctx.font = "700 28px system-ui, sans-serif";
    ctx.fillText(["Pomodoro", "QR Code", "Word Count"][i], x + 28, 520);
    ctx.fillStyle = "#6B7280";
    ctx.font = "400 20px system-ui, sans-serif";
    ctx.fillText("Small tool, big help.", x + 28, 558);
  }
  return c;
}
