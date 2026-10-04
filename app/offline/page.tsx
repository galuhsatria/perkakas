"use client";

import { RotateCcw, WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-5 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-edge bg-panel text-muted">
        <WifiOff className="h-7 w-7" aria-hidden />
      </div>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight">You are offline</h1>
      <p className="mt-3 text-muted">
        This page is not saved on your device yet. Pages you have already opened still work. Reconnect to the
        internet to open the rest.
      </p>
      <button
        onClick={() => location.reload()}
        className="mt-8 flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      >
        <RotateCcw className="h-5 w-5" />
        Try again
      </button>
    </div>
  );
}
