import { useState, useEffect, useCallback } from "react";

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) setValue(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, [key]);

  const setValuePersisted = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const newValue = typeof next === "function" ? (next as Function)(prev) : next;
      try {
        localStorage.setItem(key, JSON.stringify(newValue));
      } catch {}
      return newValue;
    });
  }, [key]);

  return [value, setValuePersisted, loaded] as const;
}
