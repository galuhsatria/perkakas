import type { Settings, FrameId, Pattern, TextFont, TextFontDef } from "./types";

const SANS = '-apple-system, "Segoe UI", system-ui, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

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

export const PATTERN_OPTIONS: { id: Pattern; label: string }[] = [
  { id: "none", label: "None" },
  { id: "dots", label: "Dots" },
  { id: "grid", label: "Grid" },
  { id: "lines", label: "Lines" },
  { id: "waves", label: "Waves" },
];

export const CANVAS_PRESETS = [
  { id: "auto", label: "Auto", w: 0, h: 0 },
  { id: "custom", label: "Custom…", w: -1, h: -1 },
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

export const FRAMES = {
  "mac-light": { style: "mac", bar: "#F3F4F6", line: "#E5E7EB", pill: "#FFFFFF", text: "#6B7280", ctrl: "#6B7280" },
  "mac-dark": { style: "mac", bar: "#202124", line: "#303134", pill: "#2E2F33", text: "#A1A1AA", ctrl: "#A1A1AA" },
  "win-light": { style: "win", bar: "#F3F3F3", line: "#E0E0E0", pill: "#FFFFFF", text: "#4B5563", ctrl: "#374151" },
  "win-dark": { style: "win", bar: "#1F1F1F", line: "#2E2E2E", pill: "#2B2B2B", text: "#A1A1AA", ctrl: "#D4D4D8" },
} as const;

export const BORDERS = {
  arc: { k: 0.025 },
  shortboard: { k: 0.016 },
  ruler: { k: 0.04 },
} as const;

export type BorderId = keyof typeof BORDERS;
export const isBorder = (f: FrameId): f is BorderId => Object.prototype.hasOwnProperty.call(BORDERS, f);

export const CHROME_RATIO = 0.04;

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
  customW: 1080,
  customH: 1080,
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