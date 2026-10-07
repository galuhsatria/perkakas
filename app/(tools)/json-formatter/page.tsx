"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { AlignLeft, AlertTriangle, Check, Copy, Eraser, Eye, Minimize2, Wrench } from "lucide-react";
import { repair, describeError, sortKeys } from "@/lib/utils/json/repair";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { useCopyToClipboard } from "@/lib/hooks/useCopyToClipboard";
import { card, textarea, iconBtn, pill, errBtn } from "@/lib/ui/classes";

type Indent = "2" | "4" | "tab";
type Notice = { kind: "ok" | "warn"; text: string } | null;
type JsonError = { message: string; pos: number | null };

const INDENT_LABEL: Record<Indent, string> = { "2": "2 spaces", "4": "4 spaces", tab: "Tab" };

function bytes(s: string) {
  return new Blob([s]).size;
}

export default function Page() {
  const [source, setSource, loaded] = useLocalStorage("json-formatter:source", "");
  const [indent, setIndent] = useState<Indent>("2");
  const [sorted, setSorted] = useState(false);
  const [minified, setMinified] = useState(false);
  const { copied, copy } = useCopyToClipboard();
  const [notice, setNotice] = useState<Notice>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!loaded) return;
    try {
      const i = localStorage.getItem("json-formatter:indent") as Indent | null;
      if (i === "2" || i === "4" || i === "tab") setIndent(i);
    } catch {}
  }, [loaded]);

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

  const handleCopy = useCallback(() => {
    if (!result.output) return;
    copy(result.output);
  }, [result.output, copy]);

  const handlePaste = useCallback(async () => {
    try {
      setSource(await navigator.clipboard.readText());
      setNotice(null);
    } catch {}
  }, [setSource]);

  const autoRepair = useCallback(() => {
    const fixed = repair(source);
    try {
      setSource(JSON.stringify(JSON.parse(fixed), null, 2));
      setNotice({ kind: "ok", text: "JSON repaired and formatted." });
    } catch {
      setSource(fixed);
      setNotice({ kind: "warn", text: "Some issues were fixed, but the JSON is still invalid." });
    }
  }, [source, setSource]);

  const showMe = useCallback(() => {
    const ta = inputRef.current;
    if (!ta || !result.error || result.error.pos === null) return;
    const pos = result.error.pos;
    const start = Math.min(pos, Math.max(0, source.length - 1));
    ta.focus();
    ta.setSelectionRange(start, Math.min(start + 1, source.length));
    const lh = parseFloat(getComputedStyle(ta).lineHeight) || 20;
    const before = source.slice(0, pos).split("\n");
    const line = before.length;
    ta.scrollTop = Math.max(0, (line - 1) * lh - ta.clientHeight / 2);
  }, [result.error, source]);

  const handleClear = useCallback(() => {
    setSource("");
    setNotice(null);
  }, [setSource]);

  const handleReplace = useCallback(() => {
    if (!result.output) return;
    setSource(result.output);
  }, [result.output, setSource]);

  const status = !source.trim() ? null : result.error ? "invalid" : "valid";

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-10 lg:py-16">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">JSON Formatter</h1>
      <p className="mt-3 max-w-lg text-muted">
        Paste JSON to format, minify and validate it. Everything runs in your browser, nothing is uploaded.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className={card}>
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Input</h2>
            <button onClick={handlePaste} className="text-xs text-muted underline underline-offset-4 hover:text-fg">
              Paste from clipboard
            </button>
          </div>
          <textarea
            ref={inputRef}
            value={source}
            onChange={(e) => { setSource(e.target.value); setNotice(null); }}
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
                  onClick={() => { setIndent(i); setMinified(false); }}
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
            <button onClick={handleClear} aria-label="Clear" className={iconBtn}>
              <Eraser className="h-5 w-5" />
            </button>
            <button onClick={handleCopy} disabled={!result.output} className="flex min-w-[6rem] items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-lg font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40">
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button onClick={handleReplace} disabled={!result.output} aria-label="Replace input with output" title="Replace input with output" className={`${iconBtn} disabled:cursor-not-allowed disabled:opacity-40`}>
              {minified ? <Minimize2 className="h-5 w-5" /> : <AlignLeft className="h-5 w-5" />}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}