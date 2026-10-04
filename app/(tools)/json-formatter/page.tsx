"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlignLeft, AlertTriangle, Check, Copy, Eraser, Eye, Minimize2, Wrench } from "lucide-react";

type Indent = "2" | "4" | "tab";
type Notice = { kind: "ok" | "warn"; text: string } | null;
type JsonError = { message: string; pos: number | null };

const card = "rounded-xl border border-edge bg-panel p-5";
const textarea =
  "w-full resize-y rounded-lg border border-edge bg-base px-3 py-2 font-mono text-sm text-fg outline-none focus:border-primary";
const iconBtn =
  "flex h-12 w-12 items-center justify-center rounded-full border border-edge text-muted transition-colors hover:border-primary hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";
const pill =
  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";
const errBtn =
  "flex items-center gap-2 rounded-md bg-white/20 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50";

const INDENT_LABEL: Record<Indent, string> = { "2": "2 spaces", "4": "4 spaces", tab: "Tab" };

function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    return Object.keys(v as object)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortKeys((v as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return v;
}

function lineCol(src: string, pos: number) {
  const before = src.slice(0, pos).split("\n");
  return { line: before.length, col: before[before.length - 1].length + 1 };
}

// Works with the different error formats of Chrome, Firefox and Safari
function describeError(err: unknown, src: string): JsonError {
  const raw = err instanceof Error ? err.message : "Invalid JSON";
  let pos: number | null = null;

  const p = raw.match(/position (\d+)/);
  const lc = raw.match(/line (\d+) column (\d+)/);
  if (p) {
    pos = Math.min(Number(p[1]), src.length);
  } else if (lc) {
    const lines = src.split("\n");
    const line = Math.min(Number(lc[1]), lines.length);
    let idx = 0;
    for (let i = 0; i < line - 1; i++) idx += lines[i].length + 1;
    pos = Math.min(idx + Number(lc[2]) - 1, src.length);
  } else if (/end of (JSON )?input|unexpected end/i.test(raw)) {
    pos = src.length;
  }

  let msg = raw
    .replace(/^JSON\.parse: /, "")
    .replace(/ of the JSON data$/, "")
    .replace(/ in JSON at position \d+( \(line \d+ column \d+\))?/, "")
    .replace(/ at line \d+ column \d+/, "");
  msg = msg.charAt(0).toUpperCase() + msg.slice(1);

  if (pos !== null) {
    const { line, col } = lineCol(src, pos);
    msg += ` at line ${line} column ${col}`;
  }
  return { message: msg, pos };
}

type Tok = { t: "str" | "p" | "w"; v: string };

// Best-effort repair: comments, single quotes, unquoted keys, trailing or
// missing commas, Python-style literals and unclosed brackets.
function repair(src: string): string {
  const toks: Tok[] = [];
  const n = src.length;
  let i = 0;

  while (i < n) {
    const c = src[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === "/" && src[i + 1] === "/") {
      while (i < n && src[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      i = end === -1 ? n : end + 2;
      continue;
    }
    if (c === '"' || c === "'") {
      let out = "";
      i++;
      while (i < n && src[i] !== c) {
        if (src[i] === "\\" && i + 1 < n) {
          out += src[i + 1] === "'" ? "'" : src[i] + src[i + 1];
          i += 2;
        } else if (src[i] === '"') {
          out += '\\"';
          i++;
        } else if (src[i] === "\n") {
          out += "\\n";
          i++;
        } else {
          out += src[i++];
        }
      }
      i++;
      toks.push({ t: "str", v: `"${out}"` });
      continue;
    }
    if ("{}[]:,".includes(c)) {
      toks.push({ t: "p", v: c });
      i++;
      continue;
    }
    let j = i;
    while (j < n && !/[\s{}[\]:,"']/.test(src[j])) j++;
    toks.push({ t: "w", v: src.slice(i, j) });
    i = j;
  }

  const literals: Record<string, string> = {
    True: "true",
    False: "false",
    None: "null",
    undefined: "null",
    NaN: "null",
  };
  const isEnd = (k: Tok) => k.t !== "p" || k.v === "}" || k.v === "]";
  const isStart = (k: Tok) => k.t !== "p" || k.v === "{" || k.v === "[";

  const out: Tok[] = [];
  const stack: string[] = [];

  for (let idx = 0; idx < toks.length; idx++) {
    let k = toks[idx];

    if (k.t === "w") {
      const next = toks[idx + 1];
      if (next && next.t === "p" && next.v === ":") k = { t: "str", v: JSON.stringify(k.v) };
      else if (literals[k.v]) k = { t: "w", v: literals[k.v] };
    }

    const prev = out[out.length - 1];

    if (k.t === "p" && (k.v === "}" || k.v === "]")) {
      if (prev && prev.t === "p" && prev.v === ",") out.pop();
      const top = stack[stack.length - 1];
      if (!top) continue; // stray closing bracket
      stack.pop();
      out.push({ t: "p", v: top === "{" ? "}" : "]" });
      continue;
    }

    if (prev && isEnd(prev) && isStart(k)) out.push({ t: "p", v: "," });
    if (k.t === "p" && (k.v === "{" || k.v === "[")) stack.push(k.v);
    out.push(k);
  }

  let last = out[out.length - 1];
  if (last && last.t === "p" && last.v === ",") out.pop();
  last = out[out.length - 1];
  if (last && last.t === "p" && last.v === ":") out.push({ t: "w", v: "null" });
  while (stack.length) out.push({ t: "p", v: stack.pop() === "{" ? "}" : "]" });

  return out.map((k) => k.v).join("");
}

function bytes(s: string) {
  return new Blob([s]).size;
}

export default function Page() {
  const [source, setSource] = useState("");
  const [indent, setIndent] = useState<Indent>("2");
  const [sorted, setSorted] = useState(false);
  const [minified, setMinified] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem("json-formatter:source");
      if (s) setSource(s);
      const i = localStorage.getItem("json-formatter:indent") as Indent | null;
      if (i === "2" || i === "4" || i === "tab") setIndent(i);
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("json-formatter:source", source.length < 200_000 ? source : "");
      localStorage.setItem("json-formatter:indent", indent);
    } catch {}
  }, [loaded, source, indent]);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(id);
  }, [copied]);

  const result = useMemo<{ output: string; error: JsonError | null }>(() => {
    if (!source.trim()) return { output: "", error: null };
    try {
      let parsed = JSON.parse(source);
      if (sorted) parsed = sortKeys(parsed);
      const space = minified ? undefined : indent === "tab" ? "\t" : Number(indent);
      return { output: JSON.stringify(parsed, null, space), error: null };
    } catch (e) {
      return { output: "", error: describeError(e, source) };
    }
  }, [source, indent, sorted, minified]);

  const copy = async () => {
    if (!result.output) return;
    try {
      await navigator.clipboard.writeText(result.output);
      setCopied(true);
    } catch {}
  };

  const paste = async () => {
    try {
      setSource(await navigator.clipboard.readText());
      setNotice(null);
    } catch {}
  };

  const autoRepair = () => {
    const fixed = repair(source);
    try {
      setSource(JSON.stringify(JSON.parse(fixed), null, 2));
      setNotice({ kind: "ok", text: "JSON repaired and formatted." });
    } catch {
      setSource(fixed);
      setNotice({ kind: "warn", text: "Some issues were fixed, but the JSON is still invalid." });
    }
  };

  const showMe = () => {
    const ta = inputRef.current;
    if (!ta || !result.error || result.error.pos === null) return;
    const pos = result.error.pos;
    const start = Math.min(pos, Math.max(0, source.length - 1));
    ta.focus();
    ta.setSelectionRange(start, Math.min(start + 1, source.length));
    const lh = parseFloat(getComputedStyle(ta).lineHeight) || 20;
    const { line } = lineCol(source, pos);
    ta.scrollTop = Math.max(0, (line - 1) * lh - ta.clientHeight / 2);
  };

  const status = !source.trim() ? null : result.error ? "invalid" : "valid";

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-10 lg:py-16">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">JSON Formatter</h1>
      <p className="mt-3 max-w-lg text-muted">
        Paste JSON to format, minify and validate it. Everything runs in your browser, nothing is uploaded.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Input */}
        <section className={card}>
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Input</h2>
            <button onClick={paste} className="text-xs text-muted underline underline-offset-4 hover:text-fg">
              Paste from clipboard
            </button>
          </div>
          <textarea
            ref={inputRef}
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setNotice(null);
            }}
            rows={20}
            spellCheck={false}
            placeholder='{"name":"Perkakas","tools":["QR Code","Pomodoro"]}'
            aria-label="JSON input"
            aria-invalid={status === "invalid"}
            className={`${textarea} mt-4 ${status === "invalid" ? "border-red-500 focus:border-red-500" : ""}`}
          />
          <div className="mt-3 flex items-center justify-between text-xs text-muted">
            <span>{source ? `${bytes(source).toLocaleString()} bytes` : "Empty"}</span>
            {status === "valid" && <span className="font-semibold text-green-400">Valid JSON</span>}
            {status === "invalid" && <span className="font-semibold text-red-400">Invalid JSON</span>}
          </div>

          {result.error && (
            <div role="alert" className="mt-4 rounded-lg bg-[#F0543C] p-4 text-white">
              <p className="flex items-start gap-2 text-sm font-medium">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span className="break-words">{result.error.message}</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={autoRepair} className={errBtn}>
                  <Wrench className="h-4 w-4" />
                  Auto repair
                </button>
                <button onClick={showMe} disabled={result.error.pos === null} className={errBtn}>
                  <Eye className="h-4 w-4" />
                  Show me
                </button>
              </div>
            </div>
          )}

          {!result.error && notice && (
            <p
              role="status"
              className={`mt-4 rounded-lg border p-3 text-xs ${
                notice.kind === "ok"
                  ? "border-green-500/40 bg-green-500/10 text-green-300"
                  : "border-yellow-500/40 bg-yellow-500/10 text-yellow-300"
              }`}
            >
              {notice.text}
            </p>
          )}
        </section>

        {/* Output */}
        <section className={card}>
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Output</h2>
            {result.output && (
              <span className="text-xs tabular-nums text-muted">{bytes(result.output).toLocaleString()} bytes</span>
            )}
          </div>
          <textarea
            value={result.output}
            readOnly
            rows={20}
            spellCheck={false}
            placeholder="Formatted JSON will appear here"
            aria-label="Formatted JSON"
            className={`${textarea} mt-4`}
          />

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div role="tablist" aria-label="Indentation" className="flex rounded-full border border-edge p-1">
              {(Object.keys(INDENT_LABEL) as Indent[]).map((i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={!minified && indent === i}
                  onClick={() => {
                    setIndent(i);
                    setMinified(false);
                  }}
                  className={`${pill} ${!minified && indent === i ? "bg-white/10 text-fg" : "text-muted hover:text-fg"}`}
                >
                  {INDENT_LABEL[i]}
                </button>
              ))}
              <button
                role="tab"
                aria-selected={minified}
                onClick={() => setMinified(true)}
                className={`${pill} ${minified ? "bg-white/10 text-fg" : "text-muted hover:text-fg"}`}
              >
                Minify
              </button>
            </div>
          </div>

          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sorted}
              onChange={(e) => setSorted(e.target.checked)}
              className="h-4 w-4 accent-[#FF8A1F]"
            />
            <span>Sort keys alphabetically</span>
          </label>

          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={() => {
                setSource("");
                setNotice(null);
                setCopied(false);
              }}
              aria-label="Clear"
              className={iconBtn}
            >
              <Eraser className="h-5 w-5" />
            </button>
            <button
              onClick={copy}
              disabled={!result.output}
              className="flex min-w-[6rem] items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-lg font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={() => setSource(result.output)}
              disabled={!result.output}
              aria-label="Replace input with output"
              title="Replace input with output"
              className={`${iconBtn} disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {minified ? <Minimize2 className="h-5 w-5" /> : <AlignLeft className="h-5 w-5" />}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
