import { useState, useEffect, useCallback } from "react";

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        // Only use parsed value if it's the same type as initial (basic type guard)
        if (typeof parsed === typeof initial) {
          setValue(parsed);
        }
      }
    } catch {
      // ignore parse errors, keep initial value
    }
    setLoaded(true);
  }, [key, initial]);

  const setValuePersisted = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const newValue = typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify(newValue));
        } catch {
          // ignore quota errors
        }
        return newValue;
      });
    },
    [key]
  );

  return [value, setValuePersisted, loaded] as const;
}