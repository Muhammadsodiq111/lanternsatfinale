/**
 * Turns free-form stored solution text into real Desmos entries.
 *
 * Every stored line becomes either:
 *  - an expression entry (LaTeX the calculator graphs / evaluates), or
 *  - a note entry (Desmos "text" item) for prose steps like "Subtract 9 from both sides:".
 */

export type DesmosEntry =
  | { id: string; kind: "expression"; latex: string; source: string }
  | { id: string; kind: "note"; text: string; source: string };

const GREEK: Record<string, string> = {
  pi: "\\pi",
  theta: "\\theta",
  alpha: "\\alpha",
  beta: "\\beta",
  lambda: "\\lambda",
};

const FUNCS = ["sin", "cos", "tan", "csc", "sec", "cot", "log", "ln", "abs", "min", "max", "mean"];

/** Prose if it has no math operator/relation and no digits doing work. */
function isNote(line: string) {
  const stripped = line.replace(/^note:\s*/i, "");
  if (/^note:/i.test(line)) return true;
  if (stripped.endsWith(":")) return true;
  const hasRelation = /[=~<>≤≥]/.test(stripped);
  const hasOperator = /[+\-*/^]/.test(stripped) && /\d|[a-zA-Z]/.test(stripped);
  if (hasRelation || hasOperator) {
    // Long sentences with a relation buried in words are still prose.
    const words = stripped.split(/\s+/).filter((w) => /^[a-zA-Z]{3,}$/.test(w));
    return words.length >= 4;
  }
  return true;
}

function balancedSlice(src: string, start: number) {
  let depth = 0;
  for (let i = start; i < src.length; i += 1) {
    if (src[i] === "(") depth += 1;
    else if (src[i] === ")") {
      depth -= 1;
      if (depth === 0) return { inner: src.slice(start + 1, i), end: i };
    }
  }
  return null;
}

/** sqrt(...) -> \sqrt{...} (nesting-safe) */
function convertSqrt(input: string): string {
  const idx = input.search(/\bsqrt\s*\(/);
  if (idx === -1) return input;
  const open = input.indexOf("(", idx);
  const slice = balancedSlice(input, open);
  if (!slice) return input;
  return (
    input.slice(0, idx) + `\\sqrt{${convertSqrt(slice.inner)}}` + convertSqrt(input.slice(slice.end + 1))
  );
}

/** a/b -> \frac{a}{b} for simple operands (numbers, variables, parenthesised groups). */
function convertFractions(input: string): string {
  const re = /(\([^()]*\)|[A-Za-z][A-Za-z0-9_]*|\d+(?:\.\d+)?)\s*\/\s*(\([^()]*\)|[A-Za-z][A-Za-z0-9_]*|\d+(?:\.\d+)?)/;
  let out = input;
  for (let i = 0; i < 6 && re.test(out); i += 1) {
    out = out.replace(re, (_m, a: string, b: string) => {
      const strip = (v: string) => (v.startsWith("(") && v.endsWith(")") ? v.slice(1, -1) : v);
      return `\\frac{${strip(a)}}{${strip(b)}}`;
    });
  }
  return out;
}

/** Wrap multi-character exponents: x^12 -> x^{12}, x^(n+1) -> x^{n+1} */
function convertExponents(input: string): string {
  return input
    .replace(/\^\s*\(([^()]*)\)/g, "^{$1}")
    .replace(/\^\s*(-?\d{2,}|-?\d*\.\d+|-\d)/g, "^{$1}")
    .replace(/\^\s*([A-Za-z][A-Za-z0-9]*)/g, "^{$1}");
}

/** Converts one stored line into Desmos LaTeX. Already-LaTeX input is left alone. */
export function toDesmosLatex(raw: string): string {
  let s = raw.trim();
  if (!s) return "";

  // Preserve author-written LaTeX untouched.
  const hasLatex = /\\(frac|sqrt|cdot|le|ge|ne|sim|pi|theta|left|right|sum|int)/.test(s);
  if (hasLatex) return s;

  s = s.replace(/[≤]/g, "<=").replace(/[≥]/g, ">=").replace(/[≠]/g, "!=").replace(/[×·]/g, "*").replace(/[÷]/g, "/");
  s = s.replace(/[−–—]/g, "-");

  s = convertSqrt(s);
  s = convertFractions(s);
  s = convertExponents(s);

  s = s.replace(/<=/g, "\\le ").replace(/>=/g, "\\ge ").replace(/!=/g, "\\ne ");
  // Regression relation: 3x_1 + 7 ~ 22 (also repairs legacy rows stored as "sim")
  s = s.replace(/\s*~\s*/g, "\\sim ").replace(/(?<![\\A-Za-z])sim(?![A-Za-z])\s*/g, "\\sim ");
  s = s.replace(/\*/g, "\\cdot ");

  // Protect function names, then map greek words.
  FUNCS.forEach((f) => {
    s = s.replace(new RegExp(`\\b${f}\\b`, "g"), `\\${f === "abs" ? "operatorname{abs}" : f}`);
  });
  Object.entries(GREEK).forEach(([word, tex]) => {
    s = s.replace(new RegExp(`\\b${word}\\b`, "g"), tex);
  });

  return s.replace(/\s+/g, " ").trim();
}

/** Turns stored solution lines into ordered Desmos entries. */
export function formatDesmosSteps(lines: readonly string[] = []): DesmosEntry[] {
  const entries: DesmosEntry[] = [];
  lines.forEach((raw, i) => {
    const line = (raw ?? "").trim();
    if (!line) return;
    const id = `step-${i}`;
    if (isNote(line)) {
      entries.push({ id, kind: "note", text: line.replace(/^note:\s*/i, ""), source: line });
      return;
    }
    const latex = toDesmosLatex(line);
    if (latex) entries.push({ id, kind: "expression", latex, source: line });
  });
  return entries;
}

/* ------------------------------------------------------------------ *
 * LaTeX -> plain text (what we store when the author types in Desmos)
 * ------------------------------------------------------------------ */

/** Reads a `{...}` group starting at `open` (index of the `{`). */
function readBrace(src: string, open: number): { inner: string; end: number } | null {
  if (src[open] !== "{") return null;
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === "{") depth += 1;
    else if (src[i] === "}") {
      depth -= 1;
      if (depth === 0) return { inner: src.slice(open + 1, i), end: i };
    }
  }
  return null;
}

const SIMPLE_TOKEN = /^[A-Za-z0-9.]+$/;

function wrapIfNeeded(v: string) {
  return SIMPLE_TOKEN.test(v) ? v : `(${v})`;
}

/** Expands `\frac{a}{b}` and `\sqrt{x}` (nesting-safe) into plain notation. */
function expandCommands(input: string): string {
  let s = input;

  // \frac{a}{b}
  for (let guard = 0; guard < 40; guard += 1) {
    const idx = s.indexOf("\\frac{");
    if (idx === -1) break;
    const a = readBrace(s, idx + 5);
    if (!a) break;
    const b = readBrace(s, a.end + 1);
    if (!b) break;
    s =
      s.slice(0, idx) +
      `${wrapIfNeeded(expandCommands(a.inner))}/${wrapIfNeeded(expandCommands(b.inner))}` +
      s.slice(b.end + 1);
  }

  // \sqrt{x} and \sqrt[n]{x}
  for (let guard = 0; guard < 40; guard += 1) {
    const idx = s.indexOf("\\sqrt");
    if (idx === -1) break;
    let cursor = idx + 5;
    let root = "";
    if (s[cursor] === "[") {
      const close = s.indexOf("]", cursor);
      if (close === -1) break;
      root = s.slice(cursor + 1, close);
      cursor = close + 1;
    }
    const g = readBrace(s, cursor);
    if (!g) break;
    const inner = expandCommands(g.inner);
    s = s.slice(0, idx) + (root ? `root(${root}, ${inner})` : `sqrt(${inner})`) + s.slice(g.end + 1);
  }

  return s;
}

/** Turns superscript/subscript brace groups into `^2` / `_1` style text. */
function collapseScripts(input: string): string {
  let s = input;
  for (let guard = 0; guard < 60; guard += 1) {
    const m = /[\^_]\{/.exec(s);
    if (!m) break;
    const markerAt = m.index;
    const g = readBrace(s, markerAt + 1);
    if (!g) break;
    const inner = collapseScripts(g.inner);
    const marker = s[markerAt]!;
    const body = SIMPLE_TOKEN.test(inner) || /^-?[0-9.]+$/.test(inner) ? inner : `(${inner})`;
    s = s.slice(0, markerAt) + marker + body + s.slice(g.end + 1);
  }
  return s;
}

/**
 * Converts a Desmos LaTeX expression back into the plain text we store,
 * so authors can type naturally in the calculator (x^2, x_1, fractions,
 * square roots) without ever hand-writing LaTeX.
 */
export function latexToPlain(raw: string): string {
  let s = (raw ?? "").trim();
  if (!s) return "";

  s = s.replace(/\\left\s*/g, "").replace(/\\right\s*/g, "");
  s = expandCommands(s);
  s = collapseScripts(s);

  s = s.replace(/\\operatorname\{([^}]*)\}/g, "$1");
  s = s.replace(/\\cdot\s*/g, "*").replace(/\\times\s*/g, "*").replace(/\\div\s*/g, "/");
  s = s.replace(/\\le\b\s*/g, " <= ").replace(/\\ge\b\s*/g, " >= ").replace(/\\ne\b\s*/g, " != ");
  s = s.replace(/\\sim(?![A-Za-z])\s*/g, " ~ ");
  s = s.replace(/\\pm\b\s*/g, " +/- ");

  Object.entries(GREEK).forEach(([word, tex]) => {
    s = s.split(tex).join(word);
  });
  FUNCS.forEach((f) => {
    s = s.split(`\\${f}`).join(f);
  });

  // Anything left over: drop the backslash but keep the word.
  s = s.replace(/\\([A-Za-z]+)\s?/g, "$1 ").replace(/\\/g, "");

  return s.replace(/\s+/g, " ").trim();
}
