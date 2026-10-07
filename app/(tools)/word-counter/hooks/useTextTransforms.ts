import { useCallback } from "react";

export function useTextTransforms() {
  const clean = useCallback((s: string) =>
    s
      .replace(/[ \t]+/g, " ")
      .replace(/ *\n */g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(), []);

  const titleCase = useCallback((s: string) =>
    s.toLowerCase().replace(/(^|\s)(\p{L})/gu, (_, p, c) => p + c.toUpperCase()), []);

  const sentenceCase = useCallback((s: string) =>
    s.toLowerCase().replace(/(^\s*|[.!?]\s+)(\p{L})/gu, (_, p, c) => p + c.toUpperCase()), []);

  const upperCase = useCallback((s: string) => s.toUpperCase(), []);
  const lowerCase = useCallback((s: string) => s.toLowerCase(), []);

  return { clean, titleCase, sentenceCase, upperCase, lowerCase };
}