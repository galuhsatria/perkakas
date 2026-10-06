import { ChevronDown } from "lucide-react";
import { Dropdown } from "@/app/components/Dropdown";
import { useEffect, useRef, useState } from "react";
import { Switch } from "@/app/components/Switch";
import { Slider } from "@/app/components/Slider";

type Device = "desktop" | "tablet" | "mobile";

export function CaptureOptions({
  device,
  onDevice,
  fullPage,
  onFullPage,
  delay,
  onDelay,
}: {
  device: Device;
  onDevice: (d: Device) => void;
  fullPage: boolean;
  onFullPage: (v: boolean) => void;
  delay: number;
  onDelay: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0" onKeyDown={(e) => e.key === "Escape" && !e.defaultPrevented && setOpen(false)}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
          open ? "border-primary text-primary" : "border-edge text-muted"
        }`}
      >
        Options
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Capture options"
          className="absolute right-0 top-full z-40 mt-2 flex w-72 flex-col gap-4 rounded-xl border border-edge bg-panel p-4 text-left shadow-2xl shadow-black/60 ring-1 ring-white/5"
        >
          <Dropdown<Device>
            label="Device"
            caption="Device"
            value={device}
            onChange={onDevice}
            options={[
              { id: "desktop", label: "Desktop" },
              { id: "tablet", label: "Tablet" },
              { id: "mobile", label: "Mobile" },
            ]}
          />
          <Switch label="Full page" checked={fullPage} onChange={onFullPage} />
          <Slider label="Wait before capture" value={delay} min={0} max={3000} step={250} unit=" ms" onChange={onDelay} />
        </div>
      )}
    </div>
  );
}
