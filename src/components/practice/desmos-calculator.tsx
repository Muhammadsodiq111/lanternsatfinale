import { useEffect, useRef } from "react";

import { formatDesmosSteps, latexToPlain } from "@/lib/desmos-format";

const SRC =
  "https://www.desmos.com/api/v1.10/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6";

let loader: Promise<void> | null = null;

function loadDesmos() {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).Desmos) return Promise.resolve();
  if (!loader) {
    loader = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Desmos"));
      document.head.appendChild(script);
    });
  }
  return loader;
}

export function DesmosCalculator({
  expressions,
  state,
}: { expressions?: string[]; state?: unknown } = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const key = (expressions ?? []).join("|");
  const stateRef = useRef(state);
  stateRef.current = state;
  const stateKey = state ? "state" : "expr";

  useEffect(() => {
    let calc: any;
    let cancelled = false;

    loadDesmos()
      .then(() => {
        if (cancelled || !ref.current) return;
        calc = (window as any).Desmos.GraphingCalculator(ref.current, {
          expressions: true,
          expressionsCollapsed: false,
          keypad: true,
          settingsMenu: true,
          zoomButtons: true,
          border: false,
        });
        const saved = stateRef.current as any;
        if (saved && typeof saved === "object") {
          try {
            calc.setState(saved);
            return;
          } catch {
            /* fall back to plain expressions */
          }
        }
        const entries = formatDesmosSteps(key ? key.split("|") : []);
        entries.forEach((entry) => {
          try {
            if (entry.kind === "note") calc.setExpression({ id: entry.id, type: "text", text: entry.text });
            else calc.setExpression({ id: entry.id, latex: entry.latex });
          } catch {
            /* ignore invalid entries */
          }
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      calc?.destroy?.();
    };
  }, [key, stateKey]);

  return <div ref={ref} className="h-full w-full" />;
}


/**
 * Always-on, editable Desmos surface. Authors type straight into the
 * calculator (real powers, subscripts, fractions, tables, regressions) and
 * every change is saved: plain text lines plus the full graph state, so
 * tables and regressions survive a reload.
 */
export function DesmosEditor({
  value,
  onChange,
  seedKey = "",
  initialState,
  onStateChange,
}: {
  value: string[];
  onChange: (lines: string[]) => void;
  seedKey?: string;
  initialState?: unknown;
  onStateChange?: (state: unknown) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const lastRef = useRef(value.join("\n"));
  const initialStateRef = useRef(initialState);
  const onStateChangeRef = useRef(onStateChange);

  valueRef.current = value;
  onChangeRef.current = onChange;
  initialStateRef.current = initialState;
  onStateChangeRef.current = onStateChange;

  useEffect(() => {
    let calc: any;
    let cancelled = false;

    loadDesmos()
      .then(() => {
        if (cancelled || !ref.current) return;
        calc = (window as any).Desmos.GraphingCalculator(ref.current, {
          expressions: true,
          expressionsCollapsed: false,
          keypad: true,
          settingsMenu: true,
          zoomButtons: true,
          border: false,
        });

        const saved = initialStateRef.current as any;
        let restored = false;
        if (saved && typeof saved === "object") {
          try {
            calc.setState(saved);
            restored = true;
          } catch {
            /* fall back to plain expressions */
          }
        }

        if (!restored) {
          const entries = formatDesmosSteps(valueRef.current);
          entries.forEach((entry) => {
            try {
              if (entry.kind === "note")
                calc.setExpression({ id: entry.id, type: "text", text: entry.text });
              else calc.setExpression({ id: entry.id, latex: entry.latex });
            } catch {
              /* ignore invalid entries */
            }
          });
        }

        calc.observeEvent("change", () => {
          const items = calc.getExpressions() as any[];
          const lines = items
            .map((item) => {
              if (item.type === "text") {
                const text = String(item.text ?? "").trim();
                return text ? `note: ${text}` : "";
              }
              if (item.type === "table") return "";
              return latexToPlain(String(item.latex ?? ""));
            })
            .filter(Boolean);
          const joined = lines.join("\n");
          if (joined !== lastRef.current) {
            lastRef.current = joined;
            onChangeRef.current(lines);
          }
          try {
            onStateChangeRef.current?.(calc.getState());
          } catch {
            /* ignore */
          }
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      calc?.destroy?.();
    };
    // Re-mount only when the edited question changes.
  }, [seedKey]);


  return <div ref={ref} className="h-full w-full" />;
}
