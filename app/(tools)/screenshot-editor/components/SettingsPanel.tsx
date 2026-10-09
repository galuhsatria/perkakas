import { AppWindow, Box, Check, ChevronDown, ChevronRight, Copy, Download, Layers, Move, Palette, Type } from "lucide-react";
import { CSSProperties, Dispatch, ReactNode, SetStateAction, useEffect, useRef, useState } from "react";
import { Dropdown } from "../../../components/Dropdown";
import { CANVAS_PRESETS, FRAME_OPTIONS, PATTERN_OPTIONS, Settings } from "../compose";
import { BackgroundPicker } from "./BackgroundPicker";
import { FramePicker } from "./FramePicker";
import { PatternPicker } from "./PatternPicker";
import { PositionDots, PositionPicker, positionLabel } from "./PositionPicker";
import { TiltDot, TiltPicker } from "./TiltPicker";
import { TextPicker } from "./TextPicker";
import { Popover } from "./Popover";
import { Badge, RangeField } from "./RangeField";

const checkerSwatch: CSSProperties = {
  backgroundImage: "conic-gradient(#2A2A2E 25%, #1A1A1D 0 50%, #2A2A2E 0 75%, #1A1A1D 0)",
  backgroundSize: "8px 8px",
};

const BG_LABEL = { gradient: "Gradient", solid: "Solid", transparent: "Transparent" } as const;

function RangeRow(props: Omit<React.ComponentProps<typeof RangeField>, "className">) {
  return <RangeField {...props} className="border-b border-edge px-5 py-4" />;
}

/** A settings row that opens a popover when clicked. */
function RowButton({
  label,
  badge,
  right,
  open,
  onClick,
  setRef,
}: {
  label: string;
  badge?: ReactNode;
  right: ReactNode;
  open: boolean;
  onClick: () => void;
  setRef: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      ref={setRef}
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-4 border-b border-edge px-5 py-4 text-left transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${
        open ? "bg-white/5" : ""
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="text-sm font-bold">{label}</span>
        {badge !== undefined && <Badge>{badge}</Badge>}
      </span>
      {right}
    </button>
  );
}

type Props = {
  s: Settings;
  setS: Dispatch<SetStateAction<Settings>>;
  hasImage: boolean;
  exportScale: 1 | 2;
  onExportScale: (n: 1 | 2) => void;
  copied: boolean;
  onSave: (type: "image/png" | "image/jpeg") => void;
  onCopy: () => void;
};

export function SettingsPanel({ s, setS, hasImage, exportScale, onExportScale, copied, onSave, onCopy }: Props) {
  const [saveMenu, setSaveMenu] = useState(false);
  const saveMenuRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setS((prev) => ({ ...prev, [key]: value }));
  const patch = (p: Partial<Settings>) => setS((prev) => ({ ...prev, ...p }));

  useEffect(() => {
    if (!saveMenu) return;
    const onDown = (e: MouseEvent) => {
      if (!saveMenuRef.current?.contains(e.target as Node)) setSaveMenu(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [saveMenu]);

  const transparent = s.bgMode === "transparent";
  const canvasIsAuto = s.canvas === "auto";
  const frameLabel = FRAME_OPTIONS.find((f) => f.id === s.frame)?.label ?? s.frame;
  const patternLabel = PATTERN_OPTIONS.find((p) => p.id === s.pattern)?.label ?? s.pattern;

  const bgSwatch: CSSProperties =
    s.bgMode === "gradient"
      ? { backgroundImage: `linear-gradient(${s.angle}deg, ${s.c1}, ${s.c2})` }
      : s.bgMode === "solid"
      ? { backgroundColor: s.solid }
      : checkerSwatch;

  return (
    <aside className="flex h-max flex-col self-start overflow-hidden rounded-xl border border-edge bg-panel lg:sticky lg:top-6 lg:order-2 lg:max-h-[calc(100vh-3rem)]">
      <h2 className="border-b border-edge bg-base/40 px-5 py-2.5 text-center text-sm font-semibold text-muted">
        Screenshot options
      </h2>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Frame */}
        <Popover
          label="Select screenshot frame"
          width={540}
          header={
            <>
              <AppWindow className="h-4 w-4" />
              <span className="font-semibold text-fg">Select screenshot frame</span>
              <span>(Preview of each frame)</span>
            </>
          }
          trigger={({ setRef, open, toggle }) => (
            <RowButton
              setRef={setRef}
              open={open}
              onClick={toggle}
              label="Frame"
              badge={frameLabel}
              right={<ChevronRight className="h-4 w-4 shrink-0 text-muted" />}
            />
          )}
        >
          <FramePicker s={s} patch={patch} />
        </Popover>

        {/* Style sliders */}
        {!canvasIsAuto && <RangeRow label="Size" value={s.size} min={40} max={100} onChange={(v) => set("size", v)} />}
        <RangeRow label="Padding" value={s.padding} min={0} max={25} onChange={(v) => set("padding", v)} />
        <RangeRow label="Roundness" value={s.roundness} min={0} max={40} onChange={(v) => set("roundness", v)} />
        <RangeRow label="Shadow" value={s.shadow} min={0} max={5} onChange={(v) => set("shadow", v)} />

        {/* Position */}
        <Popover
          label="Image position"
          width={380}
          header={
            <>
              <Move className="h-4 w-4" />
              <span className="font-semibold text-fg">Image position</span>
            </>
          }
          trigger={({ setRef, open, toggle }) => (
            <RowButton
              setRef={setRef}
              open={open}
              onClick={toggle}
              label="Position"
              badge={positionLabel(s)}
              right={<PositionDots x={s.posX} y={s.posY} />}
            />
          )}
        >
          <PositionPicker s={s} patch={patch} />
        </Popover>

        {/* Tilt */}
        <Popover
          label="Tilt"
          width={360}
          header={
            <>
              <Box className="h-4 w-4" />
              <span className="font-semibold text-fg">Tilt</span>
            </>
          }
          trigger={({ setRef, open, toggle }) => (
            <RowButton
              setRef={setRef}
              open={open}
              onClick={toggle}
              label="Tilt"
              badge={s.tiltX === 0 && s.tiltY === 0 ? "Off" : `${s.tiltX}°, ${s.tiltY}°`}
              right={<TiltDot tiltX={s.tiltX} tiltY={s.tiltY} />}
            />
          )}
        >
          <TiltPicker s={s} patch={patch} />
        </Popover>

        {/* Background */}
        <Popover
          label="Background"
          width={420}
          header={
            <>
              <Palette className="h-4 w-4" />
              <span className="font-semibold text-fg">Background</span>
            </>
          }
          trigger={({ setRef, open, toggle }) => (
            <RowButton
              setRef={setRef}
              open={open}
              onClick={toggle}
              label="Background"
              badge={BG_LABEL[s.bgMode]}
              right={
                <span
                  aria-hidden
                  className="h-7 w-12 shrink-0 rounded-md border border-edge"
                  style={bgSwatch}
                />
              }
            />
          )}
        >
          <BackgroundPicker s={s} patch={patch} />
        </Popover>

        {/* Pattern */}
        {!transparent && (
          <Popover
            label="Customize background pattern"
            width={480}
            header={
              <>
                <Layers className="h-4 w-4" />
                <span className="font-semibold text-fg">Customize background pattern</span>
              </>
            }
            trigger={({ setRef, open, toggle }) => (
              <RowButton
                setRef={setRef}
                open={open}
                onClick={toggle}
                label="Pattern"
                badge={patternLabel}
                right={<ChevronRight className="h-4 w-4 shrink-0 text-muted" />}
              />
            )}
          >
            <PatternPicker s={s} patch={patch} />
          </Popover>
        )}

        {/* Text */}
        <Popover
          label="Add text"
          width={420}
          header={
            <>
              <Type className="h-4 w-4" />
              <span className="font-semibold text-fg">Add text</span>
            </>
          }
          trigger={({ setRef, open, toggle }) => (
            <RowButton
              setRef={setRef}
              open={open}
              onClick={toggle}
              label="Text"
              badge={s.text.trim() ? (s.text.trim().length > 12 ? `${s.text.trim().slice(0, 12)}…` : s.text.trim()) : "Off"}
              right={<ChevronRight className="h-4 w-4 shrink-0 text-muted" />}
            />
          )}
        >
          <TextPicker s={s} patch={patch} />
        </Popover>

        {/* Canvas size */}
        <div className="px-5 py-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-sm font-bold">Canvas size</span>
          </div>
          <Dropdown<string>
            label="Canvas size"
            value={s.canvas}
            onChange={(v) => set("canvas", v)}
            options={CANVAS_PRESETS.map((p) => ({ id: p.id, label: p.label }))}
          />
          {s.canvas === "custom" && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted" htmlFor="custom-w">Width</label>
                <input
                  id="custom-w"
                  type="number"
                  min="100"
                  max="4096"
                  step="1"
                  value={s.customW}
                  onChange={(e) => set("customW", parseInt(e.target.value) || 0)}
                  onBlur={(e) => {
                    const v = parseInt(e.target.value) || 100;
                    set("customW", Math.max(100, Math.min(4096, v)));
                  }}
                  className="input w-full"
                  aria-label="Custom canvas width"
                  placeholder="100–4096"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted" htmlFor="custom-h">Height</label>
                <input
                  id="custom-h"
                  type="number"
                  min="100"
                  max="4096"
                  step="1"
                  value={s.customH}
                  onChange={(e) => set("customH", parseInt(e.target.value) || 0)}
                  onBlur={(e) => {
                    const v = parseInt(e.target.value) || 100;
                    set("customH", Math.max(100, Math.min(4096, v)));
                  }}
                  className="input w-full"
                  aria-label="Custom canvas height"
                  placeholder="100–4096"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer: resolution, copy, save */}
      <div className="flex items-center gap-2 border-t border-edge bg-panel px-4 py-3">
        <button
          type="button"
          aria-label="Export resolution"
          onClick={() => onExportScale(exportScale === 1 ? 2 : 1)}
          className="btn shrink-0 px-3 text-xs"
        >
          {exportScale === 1 ? "1x (HD)" : "2x (4K)"}
        </button>

        <button className="btn flex-1" disabled={!hasImage} onClick={onCopy}>
          {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          Copy
        </button>

        <div ref={saveMenuRef} className="relative flex flex-1">
          <button
            className="btn flex-1 rounded-r-none border-r-0"
            disabled={!hasImage}
            onClick={() => onSave("image/png")}
          >
            <Download className="h-4 w-4" /> Save
          </button>
          <button
            type="button"
            aria-label="More save options"
            aria-expanded={saveMenu}
            disabled={!hasImage}
            onClick={() => setSaveMenu((o) => !o)}
            className="btn rounded-l-none px-2"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          {saveMenu && (
            <div className="absolute bottom-full right-0 z-20 mb-2 w-36 overflow-hidden rounded-xl border border-edge bg-base shadow-xl shadow-black/50">
              <button
                type="button"
                className="tool w-full"
                onClick={() => {
                  setSaveMenu(false);
                  onSave("image/png");
                }}
              >
                <Download className="h-4 w-4" /> PNG
              </button>
              <button
                type="button"
                className="tool w-full border-t border-edge"
                onClick={() => {
                  setSaveMenu(false);
                  onSave("image/jpeg");
                }}
              >
                <Download className="h-4 w-4" /> JPG
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
