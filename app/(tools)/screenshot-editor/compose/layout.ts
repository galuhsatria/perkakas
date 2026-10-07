import type { Settings, Layout } from "./types";
import { isBorder, CHROME_RATIO, CANVAS_PRESETS, BORDERS, FRAMES, type BorderId } from "./constants";

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

function windowRadii(s: Settings, w: number, h: number, b: number) {
  const rIn = Math.min(((s.roundness * (w - 2 * b)) / 1000) * 1.2, (w - 2 * b) / 2, (h - 2 * b) / 2);
  const r = b > 0 ? Math.min(rIn + b, w / 2, h / 2) : rIn;
  return { r, rIn };
}

export { windowRadii };