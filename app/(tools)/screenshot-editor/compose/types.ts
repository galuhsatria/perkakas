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

export interface TextFontDef {
  id: TextFont;
  label: string;
  stack: string;
  google?: string;
  weights?: string;
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
  patternIntensity: number;
  patternRotation: number;
  patternOpacity: number;
  canvas: string;
  customW: number;
  customH: number;
  size: number;
  padding: number;
  roundness: number;
  shadow: number;
  posX: number;
  posY: number;
  offsetX: number;
  offsetY: number;
  tiltX: number;
  tiltY: number;
  text: string;
  textFont: TextFont;
  textBold: boolean;
  textColor: string;
  textSize: number;
  textX: number;
  textY: number;
}

export interface Layout {
  W: number;
  H: number;
  win: { x: number; y: number; w: number; h: number };
  chrome: number;
  inset: number;
  slackX: number;
  slackY: number;
}

export type Pt = readonly [number, number];