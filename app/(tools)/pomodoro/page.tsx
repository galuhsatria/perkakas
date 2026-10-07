"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTimer } from "@/lib/hooks/useTimer";
import { useKeyboardShortcut } from "@/lib/hooks/useKeyboardShortcut";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { beep, fmt, fmtFocus, todayKey, emptyStats } from "@/lib/utils/timer";
import { TimerCircle } from "./components/TimerCircle";
import { TimerControls } from "./components/TimerControls";
import { KeyboardHints } from "./components/KeyboardHints";
import { StatsPanel } from "./components/StatsPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { card } from "@/lib/ui/classes";

type Mode = "focus" | "short" | "long";
type Settings = { focus: number; short: number; long: number; interval: number; autoStart: boolean; sound: boolean; notify: boolean };

const DEFAULTS: Settings = {
  focus: 25,
  short: 5,
  long: 15,
  interval: 4,
  autoStart: false,
  sound: true,
  notify: false,
};

const LABEL: Record<Mode, string> = { focus: "Focus", short: "Short break", long: "Long break" };

export default function Page() {
  const [settings, setSettings, loaded] = useLocalStorage<Settings>("pomodoro:settings", DEFAULTS);
  const [mode, setMode] = useState<Mode>("focus");
  const [cycle, setCycle] = useState(0);
  const [task, setTask] = useState("");
  const [stats, setStats, statsLoaded] = useLocalStorage("pomodoro:stats", emptyStats());
  const [notifyBlocked, setNotifyBlocked] = useState(false);

  const setRunKeyRef = useRef<(k: number | ((prev: number) => number)) => void>();
  const setRunningRef = useRef<(running: boolean) => void>();

  const onEnd = useCallback(() => {
    if (mode === "focus") {
      setStats((s) => {
        const base = s.date === todayKey() ? s : emptyStats();
        return { ...base, sessions: base.sessions + 1, seconds: base.seconds + settings.focus * 60 };
      });
    }
    if (settings.sound) beep();
    if (settings.notify && typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification(mode === "focus" ? "Focus session done" : "Break is over", {
        body: mode === "focus" ? "Time to take a break." : "Ready for the next focus session.",
      });
    }
    let next: Mode;
    let nextCycle = cycle;
    if (mode === "focus") {
      if (true) nextCycle = cycle + 1;
      next = nextCycle >= settings.interval ? "long" : "short";
    } else {
      next = "focus";
      if (mode === "long") nextCycle = 0;
    }
    setCycle(nextCycle);
    setMode(next);
    setRunKeyRef.current?.((k) => k + 1);
    setRunningRef.current?.(settings.autoStart);
  }, [mode, cycle, settings, setCycle, setMode, setStats]);

  const timer = useTimer(settings[mode] * 60, onEnd);
  const { remaining, running, runKey, setRunKey, toggle, reset, setRemaining, setRunning } = timer;

  // Update refs after timer is initialized
  setRunKeyRef.current = setRunKey;
  setRunningRef.current = setRunning;

  useEffect(() => {
    if (!loaded) return;
    setRemaining(settings[mode] * 60);
  }, [loaded, mode, settings, setRemaining]);

  useEffect(() => {
    if (!statsLoaded) return;
    const st = localStorage.getItem("pomodoro:stats");
    if (st) {
      const p = JSON.parse(st);
      setStats(p.date === todayKey() ? p : emptyStats());
    }
  }, [statsLoaded, setStats]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("pomodoro:settings", JSON.stringify(settings));
    } catch {}
  }, [loaded, settings]);

  useEffect(() => {
    try {
      localStorage.setItem("pomodoro:stats", JSON.stringify(stats));
      localStorage.setItem("pomodoro:task", task);
    } catch {}
  }, [stats, task]);

  const handleReset = useCallback(() => {
    reset();
    setRemaining(settings[mode] * 60);
  }, [reset, settings, mode, setRemaining]);

  const handleSkip = useCallback(() => {
    let next: Mode;
    let nextCycle = cycle;
    if (mode === "focus") {
      next = nextCycle >= settings.interval ? "long" : "short";
    } else {
      next = "focus";
      if (mode === "long") nextCycle = 0;
    }
    setCycle(nextCycle);
    setMode(next);
    setRemaining(settings[next] * 60);
    setRunning(false);
    setRunKey((k) => k + 1);
  }, [cycle, mode, settings, setRemaining, setRunning, setRunKey]);

  const switchMode = useCallback((m: Mode) => {
    setMode(m);
    setRunning(false);
    setRemaining(settings[m] * 60);
  }, [settings, setRemaining, setRunning]);

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    if (!running) setRemaining(next[mode] * 60);
  }, [settings, running, mode, setSettings, setRemaining]);

  const toggleNotify = useCallback(async (on: boolean) => {
    if (!on) return update("notify", false);
    if (typeof Notification === "undefined") return setNotifyBlocked(true);
    const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    setNotifyBlocked(perm !== "granted");
    update("notify", perm === "granted");
  }, [update]);

  const clearStats = useCallback(() => {
    setStats(emptyStats());
    setCycle(0);
  }, [setStats]);

  useEffect(() => {
    document.title = running ? `${fmt(remaining)} ${LABEL[mode]} - Perkakas` : "Perkakas | Pomodoro";
    return () => { document.title = "Perkakas"; };
  }, [running, remaining, mode]);

  useKeyboardShortcut(" ", () => { if (document.activeElement?.tagName !== "BUTTON") toggle(); });
  useKeyboardShortcut("r", () => handleReset());
  useKeyboardShortcut("s", () => handleSkip());

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-10 lg:py-16">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Pomodoro</h1>
      <p className="mt-3 max-w-lg text-muted">
        Work in timed focus sessions with short breaks. Every {settings.interval}th session earns a long break.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className={`${card} flex flex-col items-center h-max`}>
          <TimerCircle mode={mode} remaining={remaining} running={running} settings={settings} onModeChange={switchMode} />
          <TimerControls running={running} onToggle={toggle} onReset={handleReset} onSkip={handleSkip} />
          <KeyboardHints />
        </div>

        <div className="flex flex-col gap-6">
          <StatsPanel stats={stats} cycle={cycle} interval={settings.interval} onClear={clearStats} />
          <SettingsPanel
            settings={settings}
            notifyBlocked={notifyBlocked}
            onSettingsChange={update}
            onNotifyToggle={toggleNotify}
          />
        </div>
      </div>
    </div>
  );
}
