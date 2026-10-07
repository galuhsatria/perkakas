import type { TextFont, TextFontDef } from "./types";
import { TEXT_FONT_OPTIONS } from "./constants";

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