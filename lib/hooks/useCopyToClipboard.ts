import { useState, useCallback } from "react";

export function useCopyToClipboard(duration = 1500) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), duration);
        return true;
      } catch {
        return false;
      }
    },
    [duration]
  );
  return { copied, copy };
}