"use client";
import { useCallback, useEffect, useState } from "react";
import { Menu, Search } from "lucide-react";
import { useKeyboardShortcut } from "@/lib/hooks/useKeyboardShortcut";
import Sidebar from "./Sidebar";
import CommandPalette from "./CommandPalette";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  useKeyboardShortcut(["Meta+k", "Control+k"], () => setPaletteOpen((v) => !v));
  useKeyboardShortcut("/", () => setPaletteOpen(true));

  useEffect(() => {
    const onOpen = () => setPaletteOpen(true);
    window.addEventListener("open-palette", onOpen);
    return () => window.removeEventListener("open-palette", onOpen);
  }, []);

  return (
    <div className="min-h-screen bg-base text-fg">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-edge bg-base/90 px-4 py-3 backdrop-blur lg:hidden">
        <button aria-label="Open menu" onClick={() => setOpen(true)} className="rounded-md p-1 hover:bg-panel">
          <Menu className="h-5 w-5" />
        </button>
        <span className="flex flex-1 items-center gap-2 font-bold">
          <img src="/logo.png" alt="" className="h-6 w-6" />
          Perkakas
        </span>
        <button aria-label="Search tools" onClick={() => setPaletteOpen(true)} className="rounded-md p-1 hover:bg-panel">
          <Search className="h-5 w-5" />
        </button>
      </header>

      {open && <div className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-edge bg-base transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onNavigate={() => setOpen(false)} />
      </aside>

      <main className="lg:pl-72">{children}</main>
      <CommandPalette open={paletteOpen} onClose={closePalette} />
    </div>
  );
}