import { ColorField } from "@/app/components/ColorField";
import { Settings, TEXT_FONT_OPTIONS } from "../compose";
import { RangeField } from "./RangeField";

type Props = {
  s: Settings;
  patch: (p: Partial<Settings>) => void;
};

export function TextPicker({ s, patch }: Props) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <textarea
        value={s.text}
        onChange={(e) => patch({ text: e.target.value })}
        placeholder="Type text to show on the image"
        aria-label="Text"
        rows={3}
        className="input resize-none"
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">Font</span>
          <button
            type="button"
            aria-pressed={s.textBold}
            onClick={() => patch({ textBold: !s.textBold })}
            className={`btn px-3 py-1 font-bold ${s.textBold ? "border-primary text-primary" : ""}`}
          >
            Bold
          </button>
        </div>
        <div
          role="radiogroup"
          aria-label="Font"
          className="grid max-h-48 auto-rows-min grid-cols-2 content-start gap-1.5 overflow-y-auto rounded-xl border border-edge bg-base p-1.5"
        >
          {TEXT_FONT_OPTIONS.map((f) => {
            const on = s.textFont === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => patch({ textFont: f.id })}
                className={`h-9 shrink-0 truncate rounded-lg px-3 text-left text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                  on ? "bg-primary/15 text-primary" : "text-muted hover:bg-white/5 hover:text-fg"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <ColorField label="Text color" value={s.textColor} onChange={(v) => patch({ textColor: v })} />

      <RangeField stack label="Size" value={s.textSize} min={1} max={20} unit="%" onChange={(v) => patch({ textSize: v })} />
      <RangeField stack label="Horizontal" value={s.textX} min={0} max={100} unit="%" onChange={(v) => patch({ textX: v })} />
      <RangeField stack label="Vertical" value={s.textY} min={0} max={100} unit="%" onChange={(v) => patch({ textY: v })} />

      {s.text && (
        <button type="button" className="btn self-start" onClick={() => patch({ text: "" })}>
          Clear text
        </button>
      )}
    </div>
  );
}
