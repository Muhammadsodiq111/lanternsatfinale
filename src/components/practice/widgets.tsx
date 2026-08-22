import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import referenceSheet from "@/assets/sat-reference-formulas.png.asset.json";
import { DesmosCalculator } from "@/components/practice/desmos-calculator";

export type WidgetId = "calculator" | "formula";

const HEADER: Record<WidgetId, { title: string; className: string }> = {
  calculator: { title: "Desmos Calculator", className: "bg-primary text-primary-foreground" },
  formula: { title: "f(x)  Formula Reference", className: "bg-emerald text-primary-foreground" },
};

type Rect = { x: number; y: number; w: number; h: number };

const MIN_W = 320;
const MIN_H = 220;

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function Panel({
  id,
  onClose,
  initial,
  children,
}: {
  id: WidgetId;
  onClose: () => void;
  initial: Rect;
  children: ReactNode;
}) {
  const h = HEADER[id];
  const [rect, setRect] = useState<Rect>(initial);
  const [interacting, setInteracting] = useState(false);
  const drag = useRef<{ mode: "move" | "resize"; sx: number; sy: number; start: Rect } | null>(null);

  const onPointerDown = useCallback(
    (mode: "move" | "resize") => (e: React.PointerEvent) => {
      e.preventDefault();
      drag.current = { mode, sx: e.clientX, sy: e.clientY, start: rect };
      setInteracting(true);
    },
    [rect],
  );

  useEffect(() => {
    if (!interacting) return;
    function onMove(e: PointerEvent) {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.sx;
      const dy = e.clientY - d.sy;
      if (d.mode === "move") {
        setRect({
          ...d.start,
          x: clamp(d.start.x + dx, 120 - d.start.w, window.innerWidth - 120),
          y: clamp(d.start.y + dy, 8, window.innerHeight - 60),
        });
      } else {
        setRect({
          ...d.start,
          w: clamp(d.start.w + dx, MIN_W, window.innerWidth - 16),
          h: clamp(d.start.h + dy, MIN_H, window.innerHeight - 16),
        });
      }
    }
    function onUp() {
      drag.current = null;
      setInteracting(false);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [interacting]);

  return (
    <div
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
      className="fixed z-40 flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_30px_80px_-30px_rgba(20,40,90,0.5)]"
    >
      <div
        onPointerDown={onPointerDown("move")}
        className={`flex shrink-0 cursor-move touch-none items-center justify-between px-4 py-2.5 select-none ${h.className}`}
      >
        <span className="text-sm font-bold">{h.title}</span>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClose}
          aria-label={`Close ${h.title}`}
          className="rounded-md p-1 hover:bg-white/20"
        >
          <X size={15} />
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        {children}
        {interacting ? <div className="absolute inset-0 z-10" /> : null}
      </div>

      <div
        onPointerDown={onPointerDown("resize")}
        role="separator"
        aria-label="Resize panel"
        className="absolute right-0 bottom-0 h-5 w-5 cursor-se-resize touch-none bg-[linear-gradient(135deg,transparent_50%,var(--border)_50%)]"
      />
    </div>
  );
}

export function PracticeWidgets({
  open,
  onClose,
}: {
  open: WidgetId[];
  onClose: (id: WidgetId) => void;
}) {
  return (
    <>
      {open.includes("calculator") ? (
        <Panel id="calculator" onClose={() => onClose("calculator")} initial={{ x: 24, y: 120, w: 720, h: 560 }}>
          <DesmosCalculator />
        </Panel>
      ) : null}

      {open.includes("formula") ? (
        <Panel id="formula" onClose={() => onClose("formula")} initial={{ x: 340, y: 96, w: 720, h: 520 }}>
          <div className="h-full overflow-auto bg-card p-4">
            <img
              src={referenceSheet.url}
              alt="SAT reference sheet: area, volume, circle and special right triangle formulas"
              className="w-full min-w-[520px]"
            />
          </div>
        </Panel>
      ) : null}
    </>
  );
}
