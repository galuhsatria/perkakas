export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-3 text-sm text-muted">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-11 shrink-0 cursor-pointer rounded-md border border-edge bg-base p-1"
      />
      <span className="flex-1">{label}</span>
      <span className="font-mono text-xs text-fg">{value.toUpperCase()}</span>
    </label>
  );
}
