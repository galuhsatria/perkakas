"use client";

import { useEffect } from "react";

// Registers the service worker once. Render it once in app/layout.tsx.
export default function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Skip in dev so hot reload never fights a cached worker
    if (process.env.NODE_ENV !== "production") return;

    const register = () =>
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
