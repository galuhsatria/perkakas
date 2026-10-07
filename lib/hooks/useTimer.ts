import { useState, useEffect, useRef, useCallback } from "react";

export function useTimer(initialSeconds: number, onEnd: () => void) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const endAt = useRef(0);
  const remainingRef = useRef(remaining);
  remainingRef.current = remaining;

  useEffect(() => {
    if (!running) return;
    endAt.current = Date.now() + remainingRef.current * 1000;
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        clearInterval(id);
        onEnd();
      }
    }, 250);
    return () => clearInterval(id);
  }, [running, runKey, onEnd]);

  const toggle = useCallback(() => setRunning((r) => !r), []);
  const reset = useCallback(() => {
    setRunning(false);
    setRemaining(initialSeconds);
  }, [initialSeconds]);

  return { remaining, running, runKey, setRunKey, toggle, reset, setRemaining, setRunning };
}