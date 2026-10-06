import { Settings } from "../compose";
import { RangeField } from "./RangeField";

export const POSITIONS = [
  { x: 0, y: 0, label: "Top left" },
  { x: 50, y: 0, label: "Top center" },
  { x: 100, y: 0, label: "Top right" },
  { x: 0, y: 50, label: "Middle left" },
  { x: 50, y: 50, label: "Center" },
  { x: 100, y: 50, label: "Middle right" },
  { x: 0, y: 100, label: "Bottom left" },
  { x: 50, y: 100, label: "Bottom center" },
  { x: 100, y: 100, label: "Bottom right" },
];

type PosKeys = Pick<Settings, "posX" | "posY" | "offsetX" | "offsetY">;

export function positionLabel(s: PosKeys) {
  if (s.offsetX !== 0 || s.offsetY !== 0) return "Custom";
  return POSITIONS.find((p) => p.x === s.posX && p.y === s.posY)?.label ?? "Custom";
}

/** 3x3 dots with the active spot highlighted */
export function PositionDots({ x, y, active = true }: { x: number; y: number; active?: boolean }) {
  const col = Math.round(x / 50);
  const row = Math.round(y / 50);
  return (
    <span aria-hidden className="grid h-8 w-8 shrink-0 grid-cols-3 place-items-center gap-0.5 rounded-lg border border-edge bg-base p-1">
      {Array.from({ length: 9 }).map((_, i) => {
        const on = i % 3 === col && Math.floor(i / 3) === row;
        return (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${on ? (active ? "bg-primary" : "bg-fg") : "bg-muted/40"}`}
          />
        );
      })}
    </span>
  );
}

type Props = {
  s: Settings;
  patch: (p: Partial<Settings>) => void;
};

export function PositionPicker({ s, patch }: Props) {
  const moved = s.offsetX !== 0 || s.offsetY !== 0;
  return (
    <div className="flex flex-col gap-4 p-4">
      <div role="radiogroup" aria-label="Position" className="grid grid-cols-3 gap-2">
        {POSITIONS.map((p) => {
          const on = !moved && s.posX === p.x && s.posY === p.y;
          return (
            <button
              key={p.label}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => patch({ posX: p.x, posY: p.y, offsetX: 0, offsetY: 0 })}
              className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                on ? "border-primary bg-primary/10 text-primary" : "border-edge bg-base text-muted hover:border-primary/60 hover:text-fg"
              }`}
            >
              <PositionDots x={p.x} y={p.y} active={on} />
              <span className="truncate">{p.label}</span>
            </button>
          );
        })}
      </div>

      {s.canvas === "auto" && (
        <p className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary">
          On the Auto canvas the image already fills the space, so the grid has no effect. Use the sliders below or drag
          the image in the preview.
        </p>
      )}

      <RangeField
        stack
        label="Move horizontally"
        value={s.offsetX}
        min={-100}
        max={100}
        unit="%"
        onChange={(v) => patch({ offsetX: v })}
      />
      <RangeField
        stack
        label="Move vertically"
        value={s.offsetY}
        min={-100}
        max={100}
        unit="%"
        onChange={(v) => patch({ offsetY: v })}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">Drag the image in the preview to place it anywhere, even outside the canvas.</p>
        <button
          type="button"
          className="btn shrink-0 px-3 py-1.5 text-xs"
          onClick={() => patch({ posX: 50, posY: 50, offsetX: 0, offsetY: 0 })}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
