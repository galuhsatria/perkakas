"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Crown, Minus, Plus, Shuffle, Users } from "lucide-react";

type Mode = "teams" | "size";

const card = "rounded-xl border border-edge bg-panel p-5";
const input =
  "w-full rounded-lg border border-edge bg-base px-3 py-2 text-fg outline-none placeholder:text-muted focus:border-primary";
const btn =
  "flex items-center justify-center gap-2 rounded-lg border border-edge px-4 py-2 text-sm font-semibold transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-edge";
const stepBtn =
  "flex h-10 w-10 items-center justify-center rounded-lg border border-edge text-fg transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-40 disabled:hover:border-edge";

// Fisher-Yates: every ordering is equally likely (sort(() => Math.random() - 0.5) is biased)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

function dedupe(list: string[]) {
  const seen = new Set<string>();
  return list.filter((n) => {
    const key = n.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function Switch({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
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
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : ""}`}
        />
      </button>
    </div>
  );
}

export default function Page() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("teams");
  const [teamCount, setTeamCount] = useState(2);
  const [perTeam, setPerTeam] = useState(3);
  const [skipDupes, setSkipDupes] = useState(true);
  const [captains, setCaptains] = useState(false);
  const [teams, setTeams] = useState<string[][]>([]);
  const [teamNames, setTeamNames] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("random-team:names");
      if (saved) setText(saved);
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("random-team:names", text);
    } catch {}
  }, [loaded, text]);

  const raw = useMemo(
    () =>
      text
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    [text]
  );
  const unique = useMemo(() => dedupe(raw), [raw]);
  const names = skipDupes ? unique : raw;
  const dupCount = raw.length - unique.length;
  const n = names.length;

  const k =
    n < 2
      ? 0
      : mode === "teams"
      ? Math.min(Math.max(teamCount, 2), n)
      : Math.min(Math.max(Math.ceil(n / Math.max(perTeam, 1)), 2), n);

  const summary = (() => {
    if (k < 2) return "Add at least 2 names to start.";
    const base = Math.floor(n / k);
    const extra = n % k;
    const sizes = extra === 0 ? `${base}` : `${base} or ${base + 1}`;
    return `${k} teams of ${sizes} ${extra === 0 && base === 1 ? "person" : "people"}`;
  })();

  const generate = () => {
    if (k < 2) return;
    const s = shuffle(names);
    setTeams(Array.from({ length: k }, (_, i) => s.filter((_, idx) => idx % k === i)));
    setTeamNames((prev) => Array.from({ length: k }, (_, i) => prev[i] || `Team ${i + 1}`));
  };

  const reset = () => {
    setText("");
    setTeams([]);
    setTeamNames([]);
    setTeamCount(2);
    setPerTeam(3);
  };

  const copyAll = async () => {
    const out = teams
      .map((team, i) => {
        const lines = team.map((m, j) => `- ${m}${captains && j === 0 ? " (captain)" : ""}`);
        return `${teamNames[i]}\n${lines.join("\n")}`;
      })
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(out);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const stepper = (value: number, set: (v: number) => void, min: number, max: number, label: string) => (
    <div className="flex items-center gap-3">
      <button type="button" aria-label={`Decrease ${label}`} className={stepBtn} disabled={value <= min} onClick={() => set(value - 1)}>
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        aria-label={label}
        min={min}
        max={max}
        value={value}
        onChange={(e) => set(Math.min(max, Math.max(min, Number(e.target.value) || min)))}
        className={`${input} w-20 text-center text-lg font-bold tabular-nums`}
      />
      <button type="button" aria-label={`Increase ${label}`} className={stepBtn} disabled={value >= max} onClick={() => set(value + 1)}>
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-10 lg:py-16">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Random Team</h1>
      <p className="mt-3 max-w-xl text-muted">
        Paste a list of names, one per line, and split them into fair, evenly sized teams.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Input */}
        <section className={`${card} flex h-max flex-col gap-5 lg:sticky lg:top-6`}>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="names" className="font-bold">
                Names
              </label>
              <span className="text-sm text-muted">
                {n} {n === 1 ? "name" : "names"}
              </span>
            </div>
            <textarea
              id="names"
              rows={9}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => (e.ctrlKey || e.metaKey) && e.key === "Enter" && generate()}
              placeholder={"Andi\nBudi\nCitra\nDewi"}
              className={`${input} resize-y`}
            />
            {dupCount > 0 && (
              <p className="mt-2 text-xs text-primary">
                {skipDupes
                  ? `${dupCount} duplicate ${dupCount === 1 ? "name is" : "names are"} ignored.`
                  : `${dupCount} duplicate ${dupCount === 1 ? "name" : "names"} found. Turn on "Ignore duplicates" to skip them.`}
              </p>
            )}
          </div>

          <div>
            <div role="radiogroup" aria-label="Split by" className="flex rounded-full border border-edge p-1">
              {([
                ["teams", "Number of teams"],
                ["size", "People per team"],
              ] as [Mode, string][]).map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                    mode === m ? "bg-white/10 text-fg" : "text-muted hover:text-fg"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-4">
              {mode === "teams"
                ? stepper(teamCount, setTeamCount, 2, 50, "number of teams")
                : stepper(perTeam, setPerTeam, 1, 50, "people per team")}
            </div>
            <p className="mt-3 text-sm text-muted">{summary}</p>
          </div>

          <div className="flex flex-col gap-4">
            <Switch label="Ignore duplicates" hint="Same name twice counts once" checked={skipDupes} onChange={setSkipDupes} />
            <Switch label="Pick a captain" hint="Marks one random member per team" checked={captains} onChange={setCaptains} />
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={generate}
              disabled={k < 2}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Users className="h-5 w-5" /> Generate teams
            </button>
            <button onClick={reset} className={btn}>
              Reset
            </button>
            <p className="text-center text-xs text-muted">
              <kbd className="rounded border border-edge bg-base px-1.5 py-0.5 font-semibold text-fg">Ctrl</kbd>{" "}
              <kbd className="rounded border border-edge bg-base px-1.5 py-0.5 font-semibold text-fg">Enter</kbd> to generate
            </p>
          </div>
        </section>

        {/* Results */}
        <section aria-live="polite">
          {teams.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-edge p-10 text-center">
              <Users className="h-10 w-10 text-muted" />
              <p className="mt-4 font-semibold">Your teams will show up here</p>
              <p className="mt-1 max-w-xs text-sm text-muted">Add names on the left, then press Generate teams.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-lg font-bold">
                  {teams.length} teams from {teams.reduce((s, t) => s + t.length, 0)} names
                </p>
                <div className="flex gap-2">
                  <button onClick={generate} className={btn}>
                    <Shuffle className="h-4 w-4" /> Shuffle again
                  </button>
                  <button onClick={copyAll} className={btn}>
                    {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy all"}
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {teams.map((team, i) => (
                  <div key={i} className="rounded-xl border border-edge bg-panel p-5">
                    <div className="flex items-center gap-2">
                      <input
                        value={teamNames[i] ?? ""}
                        onChange={(e) => setTeamNames((prev) => prev.map((t, idx) => (idx === i ? e.target.value : t)))}
                        aria-label={`Name of team ${i + 1}`}
                        maxLength={30}
                        className="w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 text-lg font-bold outline-none hover:border-edge focus:border-primary"
                      />
                      <span className="shrink-0 rounded-full border border-edge px-2.5 py-0.5 text-xs text-muted">{team.length}</span>
                    </div>
                    <ul className="mt-4 flex flex-col gap-2">
                      {team.map((member, j) => (
                        <li key={j} className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                            {initials(member)}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{member}</span>
                          {captains && j === 0 && (
                            <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                              <Crown className="h-3 w-3" /> Captain
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
