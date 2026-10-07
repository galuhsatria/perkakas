export type JsonError = { message: string; pos: number | null };

function lineCol(src: string, pos: number) {
  const before = src.slice(0, pos).split("\n");
  return { line: before.length, col: before[before.length - 1].length + 1 };
}

export function describeError(err: unknown, src: string): JsonError {
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

export function sortKeys(v: unknown): unknown {
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

export function repair(src: string): string {
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
      if (!top) continue;
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