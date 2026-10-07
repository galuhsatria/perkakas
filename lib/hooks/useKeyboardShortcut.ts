import { useEffect, useRef, useCallback } from "react";

export function useKeyboardShortcut(
  keys: string | string[],
  callback: () => void,
  deps: React.DependencyList = []
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const cb = useCallback(() => callbackRef.current(), [...deps]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (typing) return;

      const keyList = Array.isArray(keys) ? keys : [keys];
      if (keyList.some((k) => e.key.toLowerCase() === k.toLowerCase())) {
        e.preventDefault();
        cb();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cb, keys]);
}