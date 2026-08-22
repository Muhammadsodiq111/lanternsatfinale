import katex from "katex";
import "katex/dist/katex.min.css";
import type { ReactNode } from "react";

import { toDesmosLatex } from "@/lib/desmos-format";

function renderTex(tex: string, display: boolean) {
  try {
    return katex.renderToString(tex, {
      displayMode: display,
      throwOnError: false,
      strict: false,
      output: "html",
    });
  } catch {
    return null;
  }
}

function Tex({ tex, display = false }: { tex: string; display?: boolean }) {
  const html = renderTex(tex, display);
  if (!html) return <span>{tex}</span>;
  return (
    <span
      className={display ? "block text-center" : "inline-block align-baseline"}
      // KaTeX output is generated locally from author content, not remote HTML.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** A token that clearly reads as math inside a sentence: 2y, x_1, 3x^2, -12, 42. */
const AUTO_MATH = /^-?(?:\d+(?:\.\d+)?)?[A-Za-z]?(?:\^-?\w+|_\w+)?$/;

function isAutoMath(token: string) {
  const t = token.replace(/[.,;:!?]+$/, "");
  if (!t) return false;
  if (/^[A-Za-z]+$/.test(t) && t.length > 1) return false; // plain words
  if (!/[0-9]/.test(t) && t.length === 1 && !/[a-zA-Z]/.test(t)) return false;
  return AUTO_MATH.test(t) && /[0-9A-Za-z]/.test(t);
}

/** Inline segments: **bold**, *italic*, $math$, plus auto-detected math tokens. */
function renderInline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\$[^$]+\$)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  const pushPlain = (chunk: string, k: string) => {
    if (!chunk) return;
    chunk.split(/(\s+)/).forEach((piece, pi) => {
      if (!piece) return;
      if (/^\s+$/.test(piece)) {
        out.push(piece);
        return;
      }
      if (isAutoMath(piece)) {
        const trail = piece.match(/[.,;:!?]+$/)?.[0] ?? "";
        const core = trail ? piece.slice(0, -trail.length) : piece;
        out.push(<Tex key={`${k}-m${pi}`} tex={toDesmosLatex(core)} />);
        if (trail) out.push(trail);
        return;
      }
      out.push(piece);
    });
  };

  while ((m = re.exec(text))) {
    pushPlain(text.slice(last, m.index), `${keyBase}-p${i}`);
    const tok = m[0];
    if (tok.startsWith("$")) {
      out.push(<Tex key={`${keyBase}-t${i}`} tex={toDesmosLatex(tok.slice(1, -1))} />);
    } else if (tok.startsWith("**")) {
      out.push(
        <strong key={`${keyBase}-b${i}`} className="font-semibold">
          {tok.slice(2, -2)}
        </strong>,
      );
    } else {
      out.push(
        <em key={`${keyBase}-i${i}`} className="italic">
          {tok.slice(1, -1)}
        </em>,
      );
    }
    last = m.index + tok.length;
    i += 1;
  }
  pushPlain(text.slice(last), `${keyBase}-p${i}`);
  return out;
}

/** Prose if the line reads like a sentence rather than a standalone equation. */
function isProse(line: string) {
  const s = line.trim();
  if (/^note:/i.test(s)) return true;
  if (s.endsWith(":")) return true;
  const words = s.split(/\s+/).filter((w) => /^[A-Za-z]{3,}$/.test(w));
  return words.length >= 2;
}

/**
 * Renders one stored explanation line: sentences stay left-aligned prose with
 * inline math, standalone equations become centered display math.
 */
export function MathLine({ line, index = 0 }: { line: string; index?: number }) {
  const text = line.replace(/^note:\s*/i, "").trim();
  if (!text) return null;

  if (isProse(text)) {
    return <p className="text-foreground text-[15px] leading-relaxed">{renderInline(text, `l${index}`)}</p>;
  }

  return (
    <div className="py-1">
      <Tex tex={toDesmosLatex(text)} display />
    </div>
  );
}

export function MathExplanation({ lines }: { lines: readonly string[] }) {
  return (
    <div className="space-y-3">
      {lines.map((line, i) => (
        <MathLine key={`${line}-${i}`} line={line} index={i} />
      ))}
    </div>
  );
}
