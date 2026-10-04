"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";

type Mode = "focus" | "short" | "long";

const LABEL: Record<Mode, string> = { focus: "Focus", short: "Short break", long: "Long break" };

const DEFAULTS = {
  focus: 25,
  short: 5,
  long: 15,
  interval: 4,
  autoStart: false,
  sound: true,
  notify: false,
};
type Settings = typeof DEFAULTS;

const todayKey = () => new Date().toLocaleDateString("en-CA");
const emptyStats = () => ({ date: todayKey(), sessions: 0, seconds: 0 });

function fmt(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtFocus(seconds: number) {
  const m = Math.round(seconds / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

function beep() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.25, 0.5].forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.value = 0.15;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.15);
    });
  } catch {}
}

const card = "rounded-xl border border-edge bg-panel p-5";
const input =
  "w-full rounded-lg border border-edge bg-base px-3 py-2 text-fg outline-none focus:border-primary";
const iconBtn =
  "flex h-12 w-12 items-center justify-center rounded-full border border-edge text-muted transition-colors hover:border-primary hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
          checked ? "bg-primary" : "bg-edge"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))}
        className={input}
      />
    </label>
  );
}

export default function Page() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [mode, setMode] = useState<Mode>("focus");
  const [remaining, setRemaining] = useState(DEFAULTS.focus * 60);
  const [running, setRunning] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [task, setTask] = useState("");
  const [stats, setStats] = useState(emptyStats());
  const [loaded, setLoaded] = useState(false);
  const [notifyBlocked, setNotifyBlocked] = useState(false);

  const endAt = useRef(0);
  const remainingRef = useRef(remaining);
  remainingRef.current = remaining;

  // Load saved settings, task and today's stats
  useEffect(() => {
    try {
      const s = localStorage.getItem("pomodoro:settings");
      if (s) {
        const parsed = { ...DEFAULTS, ...JSON.parse(s) };
        setSettings(parsed);
        setRemaining(parsed.focus * 60);
      }
      const st = localStorage.getItem("pomodoro:stats");
      if (st) {
        const p = JSON.parse(st);
        setStats(p.date === todayKey() ? p : emptyStats());
      }
      const t = localStorage.getItem("pomodoro:task");
      if (t) setTask(t);
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("pomodoro:settings", JSON.stringify(settings));
      localStorage.setItem("pomodoro:stats", JSON.stringify(stats));
      localStorage.setItem("pomodoro:task", task);
    } catch {}
  }, [loaded, settings, stats, task]);

  const advance = useCallback(
    (completed: boolean, auto: boolean) => {
      let next: Mode;
      let nextCycle = cycle;
      if (mode === "focus") {
        if (completed) nextCycle = cycle + 1;
        next = nextCycle >= settings.interval ? "long" : "short";
      } else {
        next = "focus";
        if (mode === "long") nextCycle = 0;
      }
      setCycle(nextCycle);
      setMode(next);
      setRemaining(settings[next] * 60);
      setRunning(auto);
      setRunKey((k) => k + 1);
    },
    [cycle, mode, settings]
  );

  const finish = () => {
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
    advance(mode === "focus", settings.autoStart);
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  // Timer based on an end timestamp, so it stays accurate in background tabs
  useEffect(() => {
    if (!running) return;
    endAt.current = Date.now() + remainingRef.current * 1000;
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        clearInterval(id);
        finishRef.current();
      }
    }, 250);
    return () => clearInterval(id);
  }, [running, runKey]);

  useEffect(() => {
    document.title = running ? `${fmt(remaining)} ${LABEL[mode]} - Perkakas` : "Perkakas | Pomodoro";
    return () => {
      document.title = "Perkakas";
    };
  }, [running, remaining, mode]);

  const toggle = () => setRunning((r) => !r);
  const reset = () => {
    setRunning(false);
    setRemaining(settings[mode] * 60);
  };
  const skip = () => advance(false, false);
  const switchMode = (m: Mode) => {
    setMode(m);
    setRunning(false);
    setRemaining(settings[m] * 60);
  };

  const actions = useRef({ toggle, reset, skip });
  actions.current = { toggle, reset, skip };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === "Space") {
        if (t.tagName === "BUTTON") return;
        e.preventDefault();
        actions.current.toggle();
      } else if (e.key.toLowerCase() === "r") actions.current.reset();
      else if (e.key.toLowerCase() === "s") actions.current.skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    if (!running) setRemaining(next[mode] * 60);
  };

  const toggleNotify = async (on: boolean) => {
    if (!on) return update("notify", false);
    if (typeof Notification === "undefined") return setNotifyBlocked(true);
    const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    setNotifyBlocked(perm !== "granted");
    update("notify", perm === "granted");
  };

  const total = settings[mode] * 60;
  const progress = 1 - remaining / total;
  const R = 124;
  const C = 2 * Math.PI * R;
  const ring = mode === "focus" ? "#FF8A1F" : "#FAFAFA";

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-10 lg:py-16">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Pomodoro</h1>
      <p className="mt-3 max-w-lg text-muted">
        Work in timed focus sessions with short breaks. Every {settings.interval}th session earns a long break.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Timer */}
        <section className={`${card} flex flex-col items-center py-8`}>
          <div role="tablist" aria-label="Timer mode" className="flex rounded-full border border-edge p-1">
            {(Object.keys(LABEL) as Mode[]).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                  mode === m ? "bg-white/10 text-fg" : "text-muted hover:text-fg"
                }`}
              >
                {LABEL[m]}
              </button>
            ))}
          </div>

          <div className="relative mt-8 h-72 w-72">
            <svg viewBox="0 0 280 280" className="h-full w-full -rotate-90" aria-hidden>
              <circle cx="140" cy="140" r={R} fill="none" stroke="#26262A" strokeWidth="10" />
              <circle
                cx="140"
                cy="140"
                r={R}
                fill="none"
                stroke={ring}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * progress}
                style={{ transition: "stroke-dashoffset 0.25s linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-6xl font-extrabold tabular-nums" aria-live="off">
                {fmt(remaining)}
              </p>
              <p className="mt-1 text-sm text-muted">{running ? `${LABEL[mode]} in progress` : LABEL[mode]}</p>
            </div>
          </div>

          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            maxLength={80}
            placeholder="What are you working on?"
            aria-label="Current task"
            className={`${input} mt-8 max-w-xs text-center`}
          />

          <div className="mt-6 flex items-center gap-4">
            <button onClick={reset} aria-label="Reset timer" className={iconBtn}>
              <RotateCcw className="h-5 w-5" />
            </button>
            <button
              onClick={toggle}
              className="flex min-w-[6rem] items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-lg font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              {running ? "Pause" : "Start"}
            </button>
            <button onClick={skip} aria-label="Skip to next session" className={iconBtn}>
              <SkipForward className="h-5 w-5" />
            </button>
          </div>

          <p className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-muted">
            {[
              ["Space", "start or pause"],
              ["R", "reset"],
              ["S", "skip"],
            ].map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5">
                <kbd className="rounded border border-edge bg-base px-1.5 py-0.5 font-semibold text-fg">{k}</kbd>
                {v}
              </span>
            ))}
          </p>
        </section>

        {/* Side panel */}
        <div className="flex flex-col gap-6">
          <section className={card}>
            <h2 className="font-bold">Today</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-edge bg-base p-3">
                <p className="text-2xl font-extrabold tabular-nums">{stats.sessions}</p>
                <p className="text-xs text-muted">Sessions done</p>
              </div>
              <div className="rounded-lg border border-edge bg-base p-3">
                <p className="text-2xl font-extrabold tabular-nums">{fmtFocus(stats.seconds)}</p>
                <p className="text-xs text-muted">Focus time</p>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2" aria-label={`${cycle} of ${settings.interval} sessions done`}>
              {Array.from({ length: settings.interval }).map((_, i) => (
                <span
                  key={i}
                  className={`h-2.5 flex-1 rounded-full ${i < cycle ? "bg-primary" : "bg-edge"}`}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              {cycle >= settings.interval
                ? "Long break is up next."
                : `${settings.interval - cycle} more ${settings.interval - cycle === 1 ? "session" : "sessions"} until a long break.`}
            </p>
            <button
              onClick={() => {
                setStats(emptyStats());
                setCycle(0);
              }}
              className="mt-4 text-xs text-muted underline underline-offset-4 hover:text-fg"
            >
              Clear today&apos;s progress
            </button>
          </section>

          <section className={`${card} flex flex-col gap-4`}>
            <h2 className="font-bold">Settings</h2>
            <div className="grid grid-cols-3 gap-3">
              <NumberField label="Focus (min)" value={settings.focus} min={1} max={180} onChange={(v) => update("focus", v)} />
              <NumberField label="Short (min)" value={settings.short} min={1} max={60} onChange={(v) => update("short", v)} />
              <NumberField label="Long (min)" value={settings.long} min={1} max={90} onChange={(v) => update("long", v)} />
            </div>
            <NumberField
              label="Long break after how many sessions"
              value={settings.interval}
              min={2}
              max={8}
              onChange={(v) => update("interval", v)}
            />
            <Toggle
              label="Auto-start next session"
              hint="Keeps going without pressing Start"
              checked={settings.autoStart}
              onChange={(v) => update("autoStart", v)}
            />
            <Toggle
              label="Sound when finished"
              checked={settings.sound}
              onChange={(v) => update("sound", v)}
            />
            <Toggle
              label="Browser notification"
              hint={notifyBlocked ? "Blocked. Allow notifications for this site in your browser." : "Alerts you when the tab is in the background"}
              checked={settings.notify}
              onChange={toggleNotify}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
