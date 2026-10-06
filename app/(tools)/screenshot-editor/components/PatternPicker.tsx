import { PATTERN_OPTIONS, Settings } from "../compose";
import { RangeField } from "./RangeField";

type Props = {
  s: Settings;
  patch: (p: Partial<Settings>) => void;
};

export function PatternPicker({ s, patch }: Props) {
  return (
    <div className="flex min-h-[260px]">
      <div
        role="radiogroup"
        aria-label="Pattern"
        className="max-h-[340px] w-32 shrink-0 overflow-y-auto border-r border-edge bg-base/40 p-2 sm:w-40"
      >
        {PATTERN_OPTIONS.map((o) => {
          const on = s.pattern === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => patch({ pattern: o.id })}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                on ? "bg-primary/15 text-primary" : "text-muted hover:bg-white/5 hover:text-fg"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-1 flex-col justify-center gap-5 p-5">
        {s.pattern === "none" ? (
          <p className="text-sm text-muted">Pick a pattern to customize it.</p>
        ) : (
          <>
            <RangeField
              stack
              label="Intensity"
              value={s.patternIntensity}
              min={10}
              max={100}
              unit="%"
              onChange={(v) => patch({ patternIntensity: v })}
            />
            <RangeField
              stack
              label="Rotation"
              value={s.patternRotation}
              min={0}
              max={360}
              step={5}
              unit="°"
              onChange={(v) => patch({ patternRotation: v })}
            />
            <RangeField
              stack
              label="Opacity"
              value={s.patternOpacity}
              min={5}
              max={100}
              unit="%"
              onChange={(v) => patch({ patternOpacity: v })}
            />
          </>
        )}
      </div>
    </div>
  );
}
