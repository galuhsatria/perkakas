"use client";

import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Shows an "Install app" button when the browser allows it (Chrome, Edge, Android).
// On iOS Safari there is no install prompt, so it shows a short hint instead.
export default function InstallButton({ className = "" }: { className?: string }) {
  const [promptEvent, setPromptEvent] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as InstallEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const base =
    "flex items-center gap-2 rounded-full border border-edge px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-primary hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";

  if (promptEvent) {
    return (
      <button
        onClick={async () => {
          await promptEvent.prompt();
          await promptEvent.userChoice;
          setPromptEvent(null);
        }}
        className={`${base} ${className}`}
      >
        <Download className="h-4 w-4" aria-hidden />
        Install app
      </button>
    );
  }

  if (ios) {
    return (
      <div className={className}>
        <button onClick={() => setShowHint((s) => !s)} className={base} aria-expanded={showHint}>
          <Share className="h-4 w-4" aria-hidden />
          Install app
        </button>
        {showHint && (
          <p className="mt-2 max-w-xs text-xs text-muted">
            Tap the Share button in Safari, then choose &quot;Add to Home Screen&quot;.
          </p>
        )}
      </div>
    );
  }

  return null;
}
