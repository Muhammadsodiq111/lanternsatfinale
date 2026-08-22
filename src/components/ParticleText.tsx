import { useEffect, useRef } from "react";

type Props = {
  text: string;
  particleSize?: number;
  density?: number;
  color?: string;
  highlightColor?: string;
  scatter?: number;
  gatherDuration?: number;
  stagger?: number;
  pointerRepel?: number;
  repelRadius?: number;
  idleDrift?: number;
  trigger?: "hover" | "load" | "view";
  fontSize?: string;
  fontWeight?: number;
  fontFamily?: string;
  glow?: boolean;
  className?: string;
};

type Particle = {
  tx: number;
  ty: number;
  x: number;
  y: number;
  sx: number;
  sy: number;
  delay: number;
  ph: number;
  hi: boolean;
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export default function ParticleText({
  text,
  particleSize = 2,
  density = 4,
  color = "#ffffff",
  highlightColor = "#EAB308",
  scatter = 180,
  gatherDuration = 1600,
  stagger = 420,
  pointerRepel = 40,
  repelRadius = 120,
  idleDrift = 0.7,
  trigger = "hover",
  fontSize = "clamp(3rem, 12vw, 8rem)",
  fontWeight = 800,
  fontFamily = "inherit",
  glow = true,
  className,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const measure = measureRef.current;
    if (!wrap || !canvas || !measure) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let particles: Particle[] = [];
    let raf = 0;
    let startAt = trigger === "hover" ? Infinity : performance.now();
    let pointer = { x: -9999, y: -9999 };
    let dpr = 1;

    const build = () => {
      const rect = wrap.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const cs = getComputedStyle(measure);
      const px = parseFloat(cs.fontSize) || 64;
      const family = fontFamily === "inherit" ? cs.fontFamily : fontFamily;

      const off = document.createElement("canvas");
      off.width = canvas.width;
      off.height = canvas.height;
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return;
      octx.scale(dpr, dpr);
      octx.font = `${fontWeight} ${px}px ${family}`;
      octx.textAlign = "center";
      octx.textBaseline = "middle";
      octx.fillStyle = "#fff";
      octx.fillText(text, rect.width / 2, rect.height / 2);

      const data = octx.getImageData(0, 0, off.width, off.height).data;
      const step = Math.max(1, Math.round(density));
      const next: Particle[] = [];
      for (let y = 0; y < rect.height; y += step) {
        for (let x = 0; x < rect.width; x += step) {
          const idx = ((Math.floor(y * dpr) * off.width) + Math.floor(x * dpr)) * 4 + 3;
          if ((data[idx] ?? 0) > 128) {
            const a = Math.random() * Math.PI * 2;
            const r = scatter * (0.3 + Math.random() * 0.7);
            next.push({
              tx: x,
              ty: y,
              x: x + Math.cos(a) * r,
              y: y + Math.sin(a) * r,
              sx: x + Math.cos(a) * r,
              sy: y + Math.sin(a) * r,
              delay: Math.random() * stagger,
              ph: Math.random() * Math.PI * 2,
              hi: Math.random() < 0.12,
            });
          }
        }
      }
      particles = next;
    };

    const draw = (now: number) => {
      const rect = wrap.getBoundingClientRect();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.shadowBlur = glow ? 8 : 0;

      for (const p of particles) {
        const t = reduced ? 1 : Math.min(1, Math.max(0, (now - startAt - p.delay) / gatherDuration));
        const e = easeOutCubic(t);
        let x = p.sx + (p.tx - p.sx) * e;
        let y = p.sy + (p.ty - p.sy) * e;

        if (t >= 1 && idleDrift > 0 && !reduced) {
          x += Math.sin(now / 900 + p.ph) * idleDrift;
          y += Math.cos(now / 1100 + p.ph) * idleDrift;
        }

        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < repelRadius && dist > 0.001) {
          const f = (1 - dist / repelRadius) * pointerRepel;
          x += (dx / dist) * f;
          y += (dy / dist) * f;
        }

        p.x = x;
        p.y = y;
        const c = p.hi ? highlightColor : color;
        ctx.fillStyle = c;
        if (glow) ctx.shadowColor = c;
        ctx.globalAlpha = t === 0 ? 0 : 0.35 + 0.65 * e;
        ctx.beginPath();
        ctx.arc(x, y, particleSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    const onEnter = () => {
      if (trigger !== "hover") return;
      startAt = performance.now();
      for (const p of particles) {
        p.sx = p.x;
        p.sy = p.y;
      }
    };
    const onLeave = () => {
      pointer = { x: -9999, y: -9999 };
    };
    const onMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    build();
    if (trigger === "view") {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((en) => en.isIntersecting)) {
            startAt = performance.now();
            io.disconnect();
          }
        },
        { threshold: 0.2 },
      );
      io.observe(wrap);
    }

    const ro = new ResizeObserver(() => build());
    ro.observe(wrap);
    wrap.addEventListener("pointerenter", onEnter);
    wrap.addEventListener("pointerleave", onLeave);
    wrap.addEventListener("pointermove", onMove);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      wrap.removeEventListener("pointerenter", onEnter);
      wrap.removeEventListener("pointerleave", onLeave);
      wrap.removeEventListener("pointermove", onMove);
    };
  }, [
    text,
    particleSize,
    density,
    color,
    highlightColor,
    scatter,
    gatherDuration,
    stagger,
    pointerRepel,
    repelRadius,
    idleDrift,
    trigger,
    fontSize,
    fontWeight,
    fontFamily,
    glow,
  ]);

  return (
    <div ref={wrapRef} className={className} style={{ position: "relative", width: "100%", height: "100%" }}>
      <span
        ref={measureRef}
        aria-hidden
        style={{
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
          fontSize,
          fontWeight,
          fontFamily,
        }}
      />
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} role="img" aria-label={text} />
    </div>
  );
}
