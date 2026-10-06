import { ColorField } from "@/app/components/ColorField";
import { BgMode, GRADIENTS, Settings } from "../compose";
import { RangeField } from "./RangeField";

const MODES: { id: BgMode; label: string }[] = [
  { id: "gradient", label: "Gradient" },
  { id: "solid", label: "Solid" },
  { id: "transparent", label: "Transparent" },
];

const SOLID_PRESETS = ["#0A0A0A", "#27272A", "#EDEDED", "#FFFFFF", "#C7E6BA", "#F3DE86", "#8CBBF1", "#EE9484"];

type Props = {
  s: Settings;
  patch: (p: Partial<Settings>) => void;
};

export function BackgroundPicker({ s, patch }: Props) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div role="tablist" aria-label="Background type" className="flex rounded-full border border-edge bg-base p-1">
        {MODES.map((m) => {
          const on = s.bgMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => patch({ bgMode: m.id })}
              className={`flex-1 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                on ? "bg-white/10 text-fg" : "text-muted hover:text-fg"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {s.bgMode === "gradient" && (
        <>
          <div className="grid grid-cols-6 gap-2">
            {GRADIENTS.map((g) => {
              const on = s.c1 === g.c1 && s.c2 === g.c2;
              return (
                <button
                  key={g.name}
                  type="button"
                  aria-label={`${g.name} gradient`}
                  aria-pressed={on}
                  onClick={() => patch({ c1: g.c1, c2: g.c2 })}
                  className={`aspect-square rounded-lg border-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    on ? "border-white" : "border-transparent hover:border-edge"
                  }`}
                  style={{ backgroundImage: `linear-gradient(135deg, ${g.c1}, ${g.c2})` }}
                />
              );
            })}
          </div>
          <ColorField label="Start color" value={s.c1} onChange={(v) => patch({ c1: v })} />
          <ColorField label="End color" value={s.c2} onChange={(v) => patch({ c2: v })} />
          <RangeField
            stack
            label="Angle"
            value={s.angle}
            min={0}
            max={360}
            step={15}
            unit="°"
            onChange={(v) => patch({ angle: v })}
          />
        </>
      )}

      {s.bgMode === "solid" && (
        <>
          <div className="flex h-11 overflow-hidden rounded-xl border border-edge">
            {SOLID_PRESETS.map((c) => {
              const on = s.solid.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  aria-pressed={on}
                  onClick={() => patch({ solid: c })}
                  className="relative flex-1 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                  style={{ backgroundColor: c }}
                >
                  {on && (
                    <span className="absolute inset-0 m-auto h-2.5 w-2.5 rounded-full border border-black/40 bg-white" />
                  )}
                </button>
              );
            })}
          </div>
          <ColorField label="Custom solid color" value={s.solid} onChange={(v) => patch({ solid: v })} />
        </>
      )}

      {s.bgMode === "transparent" && (
        <p className="text-xs text-muted">The exported image will have no background.</p>
      )}
    </div>
  );
}
