import { useRef } from "react";
import { Settings } from "../compose";
import { RangeField } from "./RangeField";

export const TILT_MAX = 45;

export function TiltDot({ tiltX, tiltY }: { tiltX: number; tiltY: number }) {
  return (
    <span aria-hidden className="relative h-8 w-8 shrink-0 rounded-full border border-edge bg-base">
      <span
        className="absolute h-3 w-3 rounded-full bg-fg"
        style={{
          left: `${50 + (tiltY / TILT_MAX) * 28}%`,
          top: `${50 + (-tiltX / TILT_MAX) * 28}%`,
          transform: "translate(-50%, -50%)",
        }}
      />
    </span>
  );
}

type Props = {
  s: Settings;
  patch: (p: Partial<Settings>) => void;
};

export function TiltPicker({ s, patch }: Props) {
  const dial = useRef<HTMLDivElement>(null);

  // knob position -> angles: right = right side goes away, up = top goes away
  const move = (e: React.PointerEvent) => {
    const el = dial.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const travel = (r.width / 2) * 0.72;
    let nx = (e.clientX - (r.left + r.width / 2)) / travel;
    let ny = (e.clientY - (r.top + r.height / 2)) / travel;
    const len = Math.hypot(nx, ny);
    if (len > 1) {
      nx /= len;
      ny /= len;
    }
    patch({ tiltY: Math.round(nx * TILT_MAX), tiltX: Math.round(-ny * TILT_MAX) });
  };

  const nx = s.tiltY / TILT_MAX;
  const ny = -s.tiltX / TILT_MAX;
  const tilted = s.tiltX !== 0 || s.tiltY !== 0;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-center">
        <div
          ref={dial}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            move(e);
          }}
          onPointerMove={(e) => {
            if (e.buttons) move(e);
          }}
          className="relative h-32 w-32 cursor-pointer touch-none select-none rounded-full border border-edge bg-base"
        >
          <span aria-hidden className="absolute inset-3 rounded-full border border-dashed border-edge" />
          <span aria-hidden className="absolute left-1/2 top-3 bottom-3 w-px -translate-x-1/2 bg-edge" />
          <span aria-hidden className="absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-edge" />
          <span
            aria-hidden
            className="absolute h-7 w-7 rounded-full bg-fg shadow-lg shadow-black/50"
            style={{
              left: `${50 + nx * 36}%`,
              top: `${50 + ny * 36}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
      </div>

      <RangeField
        stack
        label="Up / down"
        value={s.tiltX}
        min={-TILT_MAX}
        max={TILT_MAX}
        unit="°"
        onChange={(v) => patch({ tiltX: v })}
      />
      <RangeField
        stack
        label="Left / right"
        value={s.tiltY}
        min={-TILT_MAX}
        max={TILT_MAX}
        unit="°"
        onChange={(v) => patch({ tiltY: v })}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">Drag the dial, or use the sliders for exact angles.</p>
        <button
          type="button"
          className="btn shrink-0 px-3 py-1.5 text-xs"
          disabled={!tilted}
          onClick={() => patch({ tiltX: 0, tiltY: 0 })}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
