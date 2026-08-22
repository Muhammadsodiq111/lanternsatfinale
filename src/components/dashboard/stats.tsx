import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { DIFFICULTY_LEVELS, questionBankQuery, type Level } from "@/lib/practice";

type Tf = "week" | "month" | "all";

const LEVEL_META: Record<Level, { label: string; color: string; text: string }> = {
  easy: { label: "Easy", color: "bg-emerald", text: "text-emerald" },
  medium: { label: "Medium", color: "bg-amber", text: "text-amber" },
  hard: { label: "Hard", color: "bg-flame", text: "text-flame" },
  challenge: { label: "Challenge", color: "bg-violet", text: "text-violet" },
};

const TIME_BY_AREA = [
  { label: "Practice Problems", hours: 0, color: "var(--color-primary)" },
  { label: "Mock Exams", hours: 0, color: "var(--color-violet)" },
  { label: "Courses", hours: 0, color: "var(--color-emerald)" },
  { label: "Vocab", hours: 0, color: "var(--color-amber)" },
  { label: "Mistake Review", hours: 0, color: "var(--color-flame)" },
  { label: "Lessons", hours: 0, color: "var(--color-primary)" },
];

export function StatsSection() {
  const { data: rows = [] } = useQuery(questionBankQuery);
  const [progressTf, setProgressTf] = useState<Tf>("all");
  const [timeTf, setTimeTf] = useState<Tf>("all");
  const [subtopicTab, setSubtopicTab] = useState<"strongest" | "weakest">("strongest");
  const [subject, setSubject] = useState<"all" | "math" | "rw">("all");

  const DIFFICULTY = useMemo(
    () =>
      DIFFICULTY_LEVELS.map((level) => ({
        ...LEVEL_META[level],
        done: 0,
        acc: 0,
        total: rows.filter((r) => r.level === level).length,
      })),
    [rows],
  );

  const subjectCounts = useMemo(
    () => ({
      all: rows.length,
      math: rows.filter((r) => r.subject === "math").length,
      rw: rows.filter((r) => r.subject === "english").length,
    }),
    [rows],
  );

  const attempted = DIFFICULTY.reduce((s, d) => s + d.done, 0);
  const totalQs = DIFFICULTY.reduce((s, d) => s + d.total, 0);
  const pct = totalQs ? Math.round((attempted / totalQs) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Question Progress">
            <Timeframe value={progressTf} onChange={setProgressTf} />
          </CardHeader>
          <div className="flex flex-col items-center gap-6 p-5 sm:flex-row">
            <Donut
              percent={pct}
              center={`${pct}%`}
              sub={`${attempted} / ${totalQs.toLocaleString()}`}
            />
            <div className="w-full flex-1 space-y-4">
              {DIFFICULTY.map((d) => (
                <div key={d.label}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-display font-semibold text-foreground">{d.label}</span>
                    <span className="text-muted-foreground">
                      {d.done}/{d.total}
                      <span className={`ml-3 font-bold ${d.text}`}>{d.acc}% acc</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${d.color}`}
                      style={{ width: `${d.total ? (d.done / d.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent Activity" />
          <div className="max-h-64 overflow-y-auto px-5">
            <p className="py-16 text-center text-sm text-muted-foreground">
              No activity yet — start practicing to fill this in.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Study Activity">
            <span className="text-sm font-semibold text-muted-foreground">Last 13 weeks</span>
          </CardHeader>
          <div className="p-5">
            <Heatmap />
            <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
              <span>Less</span>
              {["bg-muted", "bg-primary/20", "bg-primary/40", "bg-primary/70", "bg-primary"].map(
                (c) => (
                  <span key={c} className={`size-3 rounded-[3px] ${c}`} />
                ),
              )}
              <span>More</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Time by Area">
            <Timeframe value={timeTf} onChange={setTimeTf} />
          </CardHeader>
          <div className="flex flex-col items-center gap-6 p-5 sm:flex-row">
            <Donut percent={0} center="0h" sub="total" />
            <ul className="w-full flex-1 space-y-2">
              {TIME_BY_AREA.map((a) => (
                <li key={a.label} className="flex items-center gap-2 text-sm">
                  <span
                    className="size-2.5 shrink-0 rounded-[3px]"
                    style={{ backgroundColor: a.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-foreground">{a.label}</span>
                  <span className="font-bold text-muted-foreground">{a.hours}h</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex gap-6 border-b border-border px-5 pt-4">
          {(["strongest", "weakest"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSubtopicTab(t)}
              className={`-mb-px border-b-2 pb-3 text-sm font-bold capitalize transition-colors ${
                subtopicTab === t
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground"
              }`}
            >
              {t} Subtopics
            </button>
          ))}
        </div>
        <div className="p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            {(
              [
                { key: "all", label: "All", color: "text-foreground" },
                { key: "math", label: "Math", color: "text-primary" },
                { key: "rw", label: "Reading & Writing", color: "text-violet" },
              ] as const
            ).map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSubject(s.key)}
                className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                  subject === s.key ? "border-foreground" : "border-border"
                }`}
              >
                <p className={`text-sm font-bold ${s.color}`}>{s.label}</p>
                <p className="text-xs text-muted-foreground">
                  {subjectCounts[s.key].toLocaleString()} questions
                </p>
              </button>
            ))}
          </div>
          <p className="py-14 text-center text-sm text-muted-foreground">
            Not enough data yet — answer some questions to see your {subtopicTab} subtopics.
          </p>
        </div>
      </Card>
    </div>
  );
}

function Timeframe({ value, onChange }: { value: Tf; onChange: (v: Tf) => void }) {
  const opts: { key: Tf; label: string }[] = [
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "all", label: "All Time" },
  ];
  return (
    <div className="flex gap-2">
      {opts.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
            value === o.key
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-card text-muted-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Donut({ percent, center, sub }: { percent: number; center: string; sub: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid size-36 shrink-0 place-items-center">
      <svg viewBox="0 0 130 130" className="size-36 -rotate-90">
        <circle cx="65" cy="65" r={r} fill="none" strokeWidth="16" className="stroke-muted" />
        <circle
          cx="65"
          cy="65"
          r={r}
          fill="none"
          strokeWidth="16"
          strokeLinecap="round"
          className="stroke-primary"
          strokeDasharray={`${(percent / 100) * c} ${c}`}
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-display text-2xl font-semibold text-foreground">{center}</p>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

function Heatmap() {
  return (
    <div className="flex gap-1.5 overflow-x-auto">
      {Array.from({ length: 13 }).map((_, w) => (
        <div key={w} className="flex flex-col gap-1.5">
          {Array.from({ length: 7 }).map((__, d) => (
            <span key={d} className="size-4 rounded-[4px] bg-muted" />
          ))}
        </div>
      ))}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_20px_60px_-45px_rgba(20,40,90,0.45)]">
      {children}
    </section>
  );
}

function CardHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
      <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}
