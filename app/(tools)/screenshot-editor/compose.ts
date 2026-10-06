export type FrameId =
  | "none"
  | "arc"
  | "shortboard"
  | "ruler"
  | "mac-light"
  | "mac-dark"
  | "win-light"
  | "win-dark";
export type BgMode = "gradient" | "solid" | "transparent";
export type Pattern = "none" | "dots" | "grid" | "lines" | "waves";
export type TextFont =
  | "system"
  | "georgia"
  | "system-mono"
  | "inter"
  | "poppins"
  | "montserrat"
  | "space-grotesk"
  | "oswald"
  | "bebas"
  | "playfair"
  | "lora"
  | "dm-serif"
  | "roboto-slab"
  | "jetbrains"
  | "pacifico"
  | "caveat";

const SANS = '-apple-system, "Segoe UI", system-ui, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

interface TextFontDef {
  id: TextFont;
  label: string;
  stack: string;
  /** Google Fonts family name; loaded on demand when selected */
  google?: string;
  /** weights to request from Google Fonts */
  weights?: string;
}

export const TEXT_FONT_OPTIONS: TextFontDef[] = [
  { id: "system", label: "System Sans", stack: SANS },
  { id: "georgia", label: "Georgia", stack: SERIF },
  { id: "system-mono", label: "System Mono", stack: MONO },
  { id: "inter", label: "Inter", google: "Inter", weights: "400;700", stack: `"Inter", ${SANS}` },
  { id: "poppins", label: "Poppins", google: "Poppins", weights: "400;700", stack: `"Poppins", ${SANS}` },
  { id: "montserrat", label: "Montserrat", google: "Montserrat", weights: "400;700", stack: `"Montserrat", ${SANS}` },
  { id: "space-grotesk", label: "Space Grotesk", google: "Space Grotesk", weights: "400;700", stack: `"Space Grotesk", ${SANS}` },
  { id: "oswald", label: "Oswald", google: "Oswald", weights: "400;700", stack: `"Oswald", ${SANS}` },
  { id: "bebas", label: "Bebas Neue", google: "Bebas Neue", weights: "400", stack: `"Bebas Neue", ${SANS}` },
  { id: "playfair", label: "Playfair Display", google: "Playfair Display", weights: "400;700", stack: `"Playfair Display", ${SERIF}` },
  { id: "lora", label: "Lora", google: "Lora", weights: "400;700", stack: `"Lora", ${SERIF}` },
  { id: "dm-serif", label: "DM Serif Display", google: "DM Serif Display", weights: "400", stack: `"DM Serif Display", ${SERIF}` },
  { id: "roboto-slab", label: "Roboto Slab", google: "Roboto Slab", weights: "400;700", stack: `"Roboto Slab", ${SERIF}` },
  { id: "jetbrains", label: "JetBrains Mono", google: "JetBrains Mono", weights: "400;700", stack: `"JetBrains Mono", ${MONO}` },
  { id: "pacifico", label: "Pacifico", google: "Pacifico", weights: "400", stack: `"Pacifico", cursive` },
  { id: "caveat", label: "Caveat", google: "Caveat", weights: "400;700", stack: `"Caveat", cursive` },
];

const fontLinks = new Set<string>();

/**
 * Loads a Google font on demand so canvas can draw with it.
 * Resolves true when a web font was loaded (the caller should redraw).
 */
export async function ensureFont(id: TextFont, bold: boolean): Promise<boolean> {
  const def = TEXT_FONT_OPTIONS.find((f) => f.id === id);
  if (!def?.google || typeof document === "undefined") return false;
  if (!fontLinks.has(def.google)) {
    fontLinks.add(def.google);
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${def.google.replace(/ /g, "+")}:wght@${def.weights ?? "400"}&display=swap`;
    document.head.appendChild(link);
    await new Promise<void>((resolve) => {
      link.onload = () => resolve();
      link.onerror = () => resolve();
    });
  }
  try {
    await document.fonts.load(`${bold ? 700 : 400} 32px "${def.google}"`);
  } catch {}
  return true;
}

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
  posX: number; // 0-100, horizontal position of the window inside the free space (50 = centered)
  posY: number; // 0-100, vertical position (50 = centered)
  offsetX: number; // -100..100, extra free shift in % of the canvas width (can push the window off the canvas)
  offsetY: number; // -100..100, extra free shift in % of the canvas height
  tiltX: number; // -45..45 degrees, rotation around the horizontal axis (top/bottom)
  tiltY: number; // -45..45 degrees, rotation around the vertical axis (left/right)
  text: string; // overlay text, "\n" = new line
  textFont: TextFont;
  textBold: boolean;
  textColor: string;
  textSize: number; // 1-20, % of canvas width
  textX: number; // 0-100, % of canvas width (center of the text)
  textY: number; // 0-100, % of canvas height (center of the text)
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
  posX: 50,
  posY: 50,
  offsetX: 0,
  offsetY: 0,
  tiltX: 0,
  tiltY: 0,
  text: "",
  textFont: "system",
  textBold: true,
  textColor: "#FFFFFF",
  textSize: 5,
  textX: 50,
  textY: 50,
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
  { id: "arc", label: "Arc" },
  { id: "shortboard", label: "Shortboard" },
  { id: "ruler", label: "Ruler" },
  { id: "mac-light", label: "macOS light" },
  { id: "mac-dark", label: "macOS dark" },
  { id: "win-light", label: "Windows light" },
  { id: "win-dark", label: "Windows dark" },
];

// Title-bar frames
const FRAMES = {
  "mac-light": { style: "mac", bar: "#F3F4F6", line: "#E5E7EB", pill: "#FFFFFF", text: "#6B7280", ctrl: "#6B7280" },
  "mac-dark": { style: "mac", bar: "#202124", line: "#303134", pill: "#2E2F33", text: "#A1A1AA", ctrl: "#A1A1AA" },
  "win-light": { style: "win", bar: "#F3F3F3", line: "#E0E0E0", pill: "#FFFFFF", text: "#4B5563", ctrl: "#374151" },
  "win-dark": { style: "win", bar: "#1F1F1F", line: "#2E2E2E", pill: "#2B2B2B", text: "#A1A1AA", ctrl: "#D4D4D8" },
} as const;

// Border frames: no title bar, a band around the screenshot.
// k = border thickness as a fraction of the window width.
const BORDERS = {
  arc: { k: 0.025 },
  shortboard: { k: 0.016 },
  ruler: { k: 0.04 },
} as const;
type BorderId = keyof typeof BORDERS;
const isBorder = (f: FrameId): f is BorderId => Object.prototype.hasOwnProperty.call(BORDERS, f);

const CHROME_RATIO = 0.04; // title bar height as a fraction of window width

export interface Layout {
  W: number;
  H: number;
  win: { x: number; y: number; w: number; h: number };
  chrome: number;
  /** thickness of the border band (border frames only, otherwise 0) */
  inset: number;
  /** free space the window can move in (canvas units); 0 when the canvas is Auto */
  slackX: number;
  slackY: number;
}

export function computeLayout(iw: number, ih: number, s: Settings): Layout {
  const border = isBorder(s.frame);
  const hasChrome = s.frame !== "none" && !border;
  const ratio = hasChrome ? CHROME_RATIO : 0;
  const k = isBorder(s.frame) ? BORDERS[s.frame].k : 0;
  const preset = CANVAS_PRESETS.find((p) => p.id === s.canvas) ?? CANVAS_PRESETS[0];

  if (preset.w === 0) {
    const imgW = Math.min(iw, 2000);
    const chrome = imgW * ratio;
    const inset = imgW * k;
    const ww = imgW + 2 * inset;
    const wh = (ih * imgW) / iw + chrome + 2 * inset;
    const pad = (ww * s.padding) / 100;
    const Wc = Math.round(ww + 2 * pad);
    const Hc = Math.round(wh + 2 * pad);
    return {
      W: Wc,
      H: Hc,
      win: { x: pad + (Wc * s.offsetX) / 100, y: pad + (Hc * s.offsetY) / 100, w: ww, h: wh },
      chrome,
      inset,
      slackX: 0,
      slackY: 0,
    };
  }

  const W = preset.w;
  const H = preset.h;
  const pad = (Math.min(W, H) * s.padding) / 100;
  const boxW = Math.max(10, W - 2 * pad);
  const boxH = Math.max(10, H - 2 * pad);
  const aspect = (1 - 2 * k) * (ih / iw) + 2 * k + ratio;
  const ww = Math.min(boxW, boxH / aspect) * (s.size / 100);
  const wh = ww * aspect;
  const slackX = Math.max(0, boxW - ww);
  const slackY = Math.max(0, boxH - wh);
  return {
    W,
    H,
    win: {
      x: pad + (slackX * s.posX) / 100 + (W * s.offsetX) / 100,
      y: pad + (slackY * s.posY) / 100 + (H * s.offsetY) / 100,
      w: ww,
      h: wh,
    },
    chrome: ww * ratio,
    inset: ww * k,
    slackX,
    slackY,
  };
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

// Paints the band around the screenshot for border frames (called inside the window clip).
function paintBorderFrame(
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

function paintText(ctx: CanvasRenderingContext2D, W: number, H: number, s: Settings) {
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

// roundness applies to the screenshot; a border band wraps around it
function windowRadii(s: Settings, w: number, h: number, b: number) {
  const rIn = Math.min(((s.roundness * (w - 2 * b)) / 1000) * 1.2, (w - 2 * b) / 2, (h - 2 * b) / 2);
  const r = b > 0 ? Math.min(rIn + b, w / 2, h / 2) : rIn;
  return { r, rIn };
}

// Frame + screenshot, with its top-left corner at (x, y)
function paintWindow(ctx: CanvasRenderingContext2D, img: HTMLImageElement, s: Settings, L: Layout, x: number, y: number) {
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

type Pt = readonly [number, number];

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

function paintTilted(ctx: CanvasRenderingContext2D, img: HTMLImageElement, s: Settings, L: Layout, scale: number) {
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
    paintWindow(ctx, img, s, L, x, y);
  }
  paintText(ctx, L.W, L.H, s);
  return L;
}

// A small fake UI so people can try the editor without an image
export function makeDemoImage(): HTMLCanvasElement {
  const W = 1440;
  const H = 900;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const sans = 'system-ui, -apple-system, "Segoe UI", sans-serif';
  const mono = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
  const BG = "#0A0A0A";
  const tracking = (v: string) => {
    if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = v;
  };

  // ── background: black, soft glow at the top, dot grid that fades away
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, 110, 0, W / 2, 110, 580);
  glow.addColorStop(0, "rgba(255,255,255,0.16)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  for (let y = 24; y < 660; y += 32) {
    for (let x = 24; x < W; x += 32) {
      const d = Math.hypot(x - W / 2, (y - 170) * 1.4);
      const a = 0.22 * Math.max(0, 1 - d / 650);
      if (a < 0.01) continue;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }

  // ── nav
  ctx.fillStyle = "#FFFFFF";
  rr(ctx, 56, 20, 36, 36, 10);
  ctx.fill();
  ctx.fillStyle = BG;
  ctx.font = `800 20px ${sans}`;
  ctx.textAlign = "center";
  ctx.fillText("P", 74, 45);
  ctx.textAlign = "left";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 22px ${sans}`;
  ctx.fillText("Perkakas", 104, 46);

  ctx.font = `500 16px ${sans}`;
  ctx.fillStyle = "#A1A1AA";
  let nx = 548;
  ["Tools", "Pricing", "Docs", "Changelog"].forEach((label) => {
    ctx.fillText(label, nx, 44);
    nx += ctx.measureText(label).width + 38;
  });

  ctx.fillStyle = "#A1A1AA";
  ctx.font = `500 16px ${sans}`;
  ctx.fillText("Sign in", 1176, 44);
  ctx.fillStyle = "#FFFFFF";
  rr(ctx, 1260, 18, 124, 40, 20);
  ctx.fill();
  ctx.fillStyle = BG;
  ctx.font = `600 15px ${sans}`;
  ctx.textAlign = "center";
  ctx.fillText("Get started", 1322, 43);

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(0, 75, W, 1);

  // ── hero
  // badge
  rr(ctx, 570, 118, 300, 36, 18);
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(592, 136, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#D4D4D8";
  ctx.font = `500 14px ${sans}`;
  ctx.textAlign = "left";
  ctx.fillText("24 new tools just landed", 608, 141);

  // headline
  ctx.textAlign = "center";
  tracking("-3px");
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `800 84px ${sans}`;
  ctx.fillText("Every small tool", W / 2, 262);
  const hg = ctx.createLinearGradient(430, 0, 1010, 0);
  hg.addColorStop(0, "#FFFFFF");
  hg.addColorStop(1, "#6B7280");
  ctx.fillStyle = hg;
  ctx.fillText("you'll ever need.", W / 2, 350);
  tracking("0px");

  // sub
  ctx.fillStyle = "#A1A1AA";
  ctx.font = `400 20px ${sans}`;
  ctx.fillText("Pomodoro, QR codes, word counters and 21 more —", W / 2, 404);
  ctx.fillText("small tools that open fast and stay out of your way.", W / 2, 435);

  // buttons
  ctx.fillStyle = "#FFFFFF";
  rr(ctx, 528, 468, 210, 52, 26);
  ctx.fill();
  ctx.fillStyle = BG;
  ctx.font = `600 16px ${sans}`;
  ctx.fillText("Start for free  →", 633, 500);
  rr(ctx, 752, 468, 160, 52, 26);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.stroke();
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("Browse tools", 832, 500);

  // ── feature cards (cut off by the bottom edge)
  const cards = [
    { title: "Pomodoro", desc: "Focus timer with gentle breaks." },
    { title: "QR Code", desc: "Generate and download in one click." },
    { title: "Word Count", desc: "Live counts while you type." },
  ];
  const cw = 380;
  const gap = 24;
  const x0 = (W - (cw * 3 + gap * 2)) / 2;
  const y0 = 590;

  cards.forEach((card, i) => {
    const x = x0 + i * (cw + gap);

    // card body
    rr(ctx, x, y0, cw, 420, 24);
    ctx.fillStyle = "#0F0F10";
    ctx.fill();
    ctx.strokeStyle = "#262626";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // icon tile
    rr(ctx, x + 28, y0 + 28, 44, 44, 12);
    ctx.fillStyle = "#1A1A1A";
    ctx.fill();
    ctx.strokeStyle = "#2E2E2E";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.strokeStyle = "#FFFFFF";
    ctx.fillStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    const ix = x + 50;
    const iy = y0 + 50;
    if (i === 0) {
      ctx.beginPath();
      ctx.arc(ix, iy, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ix, iy - 5);
      ctx.lineTo(ix, iy);
      ctx.lineTo(ix + 4, iy + 2);
      ctx.stroke();
    } else if (i === 1) {
      [
        [-9, -9],
        [3, -9],
        [-9, 3],
      ].forEach(([dx, dy]) => ctx.strokeRect(ix + dx, iy + dy, 6, 6));
      ctx.fillRect(ix + 3, iy + 3, 6, 6);
    } else {
      ctx.beginPath();
      ctx.moveTo(ix - 10, iy - 7);
      ctx.lineTo(ix + 10, iy - 7);
      ctx.moveTo(ix - 10, iy);
      ctx.lineTo(ix + 10, iy);
      ctx.moveTo(ix - 10, iy + 7);
      ctx.lineTo(ix + 3, iy + 7);
      ctx.stroke();
    }

    // text
    ctx.textAlign = "left";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 24px ${sans}`;
    ctx.fillText(card.title, x + 28, y0 + 112);
    ctx.fillStyle = "#71717A";
    ctx.font = `400 16px ${sans}`;
    ctx.fillText(card.desc, x + 28, y0 + 140);

    // mini UI
    if (i === 0) {
      const cx = x + 92;
      const cy = y0 + 250;
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#262626";
      ctx.beginPath();
      ctx.arc(cx, cy, 54, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(cx, cy, 54, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.7);
      ctx.stroke();
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.font = `700 26px ${mono}`;
      ctx.fillText("17:42", cx, cy + 9);
      ctx.textAlign = "left";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `600 17px ${sans}`;
      ctx.fillText("Focus session", x + 176, y0 + 238);
      ctx.fillStyle = "#71717A";
      ctx.font = `400 15px ${sans}`;
      ctx.fillText("3 of 4 rounds done", x + 176, y0 + 264);
    } else if (i === 1) {
      const m = 10;
      const n = 13;
      const qx = x + 38;
      const qy = y0 + 186;
      ctx.fillStyle = "#FFFFFF";
      rr(ctx, qx - 12, qy - 12, n * m + 24, n * m + 24, 14);
      ctx.fill();
      ctx.fillStyle = BG;
      for (let a = 0; a < n; a++) {
        for (let b = 0; b < n; b++) {
          const inFinder = (a < 7 && b < 7) || (a >= n - 7 && b < 7) || (a < 7 && b >= n - 7);
          if (inFinder) continue;
          if ((a * 7 + b * 11 + a * b) % 5 < 2) ctx.fillRect(qx + a * m, qy + b * m, m - 1.5, m - 1.5);
        }
      }
      [
        [0, 0],
        [n - 7, 0],
        [0, n - 7],
      ].forEach(([fa, fb]) => {
        const fx = qx + fa * m;
        const fy = qy + fb * m;
        ctx.fillStyle = BG;
        ctx.fillRect(fx, fy, 7 * m, 7 * m);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(fx + m, fy + m, 5 * m, 5 * m);
        ctx.fillStyle = BG;
        ctx.fillRect(fx + 2 * m, fy + 2 * m, 3 * m, 3 * m);
      });
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `600 17px ${sans}`;
      ctx.fillText("perkakas.app", x + 214, y0 + 236);
      ctx.fillStyle = "#71717A";
      ctx.font = `400 15px ${sans}`;
      ctx.fillText("PNG · SVG", x + 214, y0 + 262);
    } else {
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `800 56px ${sans}`;
      tracking("-2px");
      ctx.fillText("1,248", x + 28, y0 + 224);
      tracking("0px");
      ctx.fillStyle = "#71717A";
      ctx.font = `400 16px ${sans}`;
      ctx.fillText("words", x + 190, y0 + 224);
      [
        { f: 0.78, col: "#FFFFFF" },
        { f: 0.52, col: "#A1A1AA" },
        { f: 0.3, col: "#52525B" },
      ].forEach((bar, k) => {
        const by = y0 + 252 + k * 22;
        rr(ctx, x + 28, by, 324, 8, 4);
        ctx.fillStyle = "#1F1F1F";
        ctx.fill();
        rr(ctx, x + 28, by, 324 * bar.f, 8, 4);
        ctx.fillStyle = bar.col;
        ctx.fill();
      });
    }
  });

  // fade the cards into the bottom edge
  const fade = ctx.createLinearGradient(0, 740, 0, H);
  fade.addColorStop(0, "rgba(10,10,10,0)");
  fade.addColorStop(1, "rgba(10,10,10,0.92)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, 740, W, H - 740);

  return c;
}
