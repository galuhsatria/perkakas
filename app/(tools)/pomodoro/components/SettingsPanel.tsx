"use client";
import { card } from "@/lib/ui/classes";
import { NumberField } from "./NumberField";
import { Toggle } from "./Toggle";

interface SettingsPanelProps {
  settings: {
    focus: number;
    short: number;
    long: number;
    interval: number;
    autoStart: boolean;
    sound: boolean;
    notify: boolean;
  };
  notifyBlocked: boolean;
  onSettingsChange: <K extends keyof SettingsPanelProps["settings"]>(key: K, value: SettingsPanelProps["settings"][K]) => void;
  onNotifyToggle: (on: boolean) => void;
}

export function SettingsPanel({ settings, notifyBlocked, onSettingsChange, onNotifyToggle }: SettingsPanelProps) {
  return (
    <section className={`${card} flex flex-col gap-4`}>
      <h2 className="font-bold">Settings</h2>
      <div className="grid grid-cols-3 gap-3">
        <NumberField label="Focus (min)" value={settings.focus} min={1} max={180} onChange={(v) => onSettingsChange("focus", v)} />
        <NumberField label="Short (min)" value={settings.short} min={1} max={60} onChange={(v) => onSettingsChange("short", v)} />
        <NumberField label="Long (min)" value={settings.long} min={1} max={90} onChange={(v) => onSettingsChange("long", v)} />
      </div>
      <NumberField
        label="Long break after how many sessions"
        value={settings.interval}
        min={2}
        max={8}
        onChange={(v) => onSettingsChange("interval", v)}
      />
      <Toggle
        label="Auto-start next session"
        hint="Keeps going without pressing Start"
        checked={settings.autoStart}
        onChange={(v) => onSettingsChange("autoStart", v)}
      />
      <Toggle
        label="Sound when finished"
        checked={settings.sound}
        onChange={(v) => onSettingsChange("sound", v)}
      />
      <Toggle
        label="Browser notification"
        hint={notifyBlocked ? "Blocked. Allow notifications for this site in your browser." : "Alerts you when the tab is in the background"}
        checked={settings.notify}
        onChange={onNotifyToggle}
      />
    </section>
  );
}