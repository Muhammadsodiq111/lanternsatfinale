import { useMemo, useState } from "react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Check, ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";

import {
  DIFFICULTY_LEVELS,
  questionBankQuery,
  reviewQuestionsQuery,
  type Level,
} from "@/lib/practice";
import { useTrackerProgress } from "@/lib/tracker-progress";

type Problem = {
  id: string;
  prompt: string;
  module: string;
  difficulty: Level;
  source: string;
  choices: string[];
  answer: number;
  explanation: string;
};

const LEVEL_META: Record<Level, { label: string; bar: string; text: string }> = {
  easy: { label: "Easy", bar: "bg-emerald", text: "text-emerald" },
  medium: { label: "Medium", bar: "bg-amber", text: "text-amber" },
  hard: { label: "Hard", bar: "bg-flame", text: "text-flame" },
  challenge: { label: "Challenge", bar: "bg-violet", text: "text-violet" },
};

export function ReviewSection() {
  const { data: rows } = useSuspenseQuery(questionBankQuery);
  const [tab, setTab] = useState<"todo" | "done">("todo");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { entries, entry, setNote, toggleReviewed } = useTrackerProgress();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [subject, setSubject] = useState<"all" | "math" | "english">("all");
  const [module, setModule] = useState("all");
  const [levels, setLevels] = useState<Level[]>([]);

  const modules = useMemo(() => {
    const set = new Set<string>();
    for (const row of rows) {
      if (subject !== "all" && row.subject !== subject) continue;
      if (row.module) set.add(row.module);
    }
    return Array.from(set).sort();
  }, [rows, subject]);

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        if (subject !== "all" && row.subject !== subject) return false;
        if (module !== "all" && row.module !== module) return false;
        if (levels.length && !levels.includes(row.level)) return false;
        return true;
      }),
    [rows, subject, module, levels],
  );

  const activeFilterCount =
    (subject === "all" ? 0 : 1) + (module === "all" ? 0 : 1) + (levels.length ? 1 : 0);

  const breakdown = useMemo(() => {
    const counts = Object.fromEntries(DIFFICULTY_LEVELS.map((l) => [l, 0])) as Record<
      Level,
      number
    >;
    for (const row of filtered) counts[row.level] = (counts[row.level] ?? 0) + 1;
    return DIFFICULTY_LEVELS.map((level) => ({
      level,
      count: counts[level],
      pct: filtered.length ? Math.round((counts[level] / filtered.length) * 100) : 0,
    }));
  }, [filtered]);

  const flaggedIds = useMemo(
    () =>
      Object.entries(entries)
        .filter(([, e]) => e.status === "incorrect" || e.starred)
        .map(([id]) => id),
    [entries],
  );

  const { data: reviewRows = [] } = useQuery(reviewQuestionsQuery(flaggedIds));

  const problems = useMemo<Problem[]>(
    () =>
      reviewRows
        .filter((row) => {
          if (subject !== "all" && row.subject !== subject) return false;
          if (module !== "all" && row.module !== module) return false;
          if (levels.length && !levels.includes(row.level)) return false;
          return true;
        })
        .map((row) => ({
          id: row.id,
          prompt: row.prompt,
          module: row.module,
          difficulty: row.level,
          source: row.subject === "english" ? "Reading & Writing" : "Math",
          choices: row.choices,
          answer: row.answer,
          explanation: row.explanation.join("\n\n"),
        })),
    [reviewRows, subject, module, levels],
  );

  const list = problems.filter((p) => (tab === "todo" ? !entry(p.id).reviewed : entry(p.id).reviewed));
  const active = openIndex !== null ? list[openIndex] : undefined;

  if (active) {
    return (
      <ProblemView
        problem={active}
        position={`${openIndex! + 1} / ${list.length}`}
        note={entry(active.id).note}
        understood={entry(active.id).reviewed}
        onNote={(v) => setNote(active.id, v)}
        onUnderstood={() => toggleReviewed(active.id)}
        onExit={() => setOpenIndex(null)}
        onPrev={() => setOpenIndex((i) => Math.max(0, (i ?? 0) - 1))}
        onNext={() => setOpenIndex((i) => Math.min(list.length - 1, (i ?? 0) + 1))}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3">
          {(
            [
              { key: "todo", label: "To Review" },
              { key: "done", label: "Reviewed" },
            ] as const
          ).map((t) => {
            const count = problems.filter((p) =>
              t.key === "todo" ? !entry(p.id).reviewed : entry(p.id).reviewed,
            ).length;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-colors ${
                  tab === t.key
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-foreground"
                }`}
              >
                {t.label}
                <span
                  className={`rounded-md px-1.5 py-0.5 text-xs ${
                    tab === t.key ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((v) => !v)}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors ${
            filtersOpen || activeFilterCount
              ? "border-primary bg-primary/5 text-primary"
              : "border-border bg-card text-foreground"
          }`}
        >
          <SlidersHorizontal size={15} /> Filters
          {activeFilterCount ? (
            <span className="rounded-md bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>

      {filtersOpen ? (
        <section className="rounded-3xl border border-border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                Subject
              </p>
              <div className="mt-2 flex gap-2">
                {(["all", "math", "english"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSubject(s);
                      setModule("all");
                    }}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
                      subject === s
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-foreground"
                    }`}
                  >
                    {s === "english" ? "Reading & Writing" : s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                Module
              </p>
              <select
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="all">All modules</option>
                {modules.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <p className="text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                Difficulty
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {DIFFICULTY_LEVELS.map((level) => {
                  const on = levels.includes(level);
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() =>
                        setLevels((prev) =>
                          prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level],
                        )
                      }
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                        on
                          ? "bg-primary text-primary-foreground"
                          : `border border-border ${LEVEL_META[level].text}`
                      }`}
                    >
                      {LEVEL_META[level].label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length} of {rows.length} questions
            </p>
            <button
              type="button"
              onClick={() => {
                setSubject("all");
                setModule("all");
                setLevels([]);
              }}
              className="rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              Clear filters
            </button>
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-border bg-card p-5 shadow-[0_20px_60px_-45px_rgba(20,40,90,0.45)]">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-lg font-semibold text-foreground">Question bank</h3>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-primary">{filtered.length}</span> questions available
            to review from
          </p>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {breakdown.map(({ level, count, pct }) => (
            <div key={level} className="rounded-2xl border border-border p-4">
              <div className="flex items-baseline justify-between">
                <p className={`text-xs font-bold tracking-[0.12em] uppercase ${LEVEL_META[level].text}`}>
                  {LEVEL_META[level].label}
                </p>
                <p className="font-display text-lg font-semibold text-foreground">{count}</p>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${LEVEL_META[level].bar}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{pct}% of the bank</p>
            </div>
          ))}
        </div>
      </section>



      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_20px_60px_-45px_rgba(20,40,90,0.45)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                <th className="px-5 py-3 text-left font-bold">Problem</th>
                <th className="px-4 py-3 text-left font-bold">Module</th>
                <th className="px-4 py-3 text-left font-bold">Difficulty</th>
                <th className="px-4 py-3 text-left font-bold">Source</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p, i) => (
                <tr
                  key={p.id}
                  onClick={() => setOpenIndex(i)}
                  className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-accent"
                >
                  <td className="px-5 py-3.5 text-foreground">{p.prompt}</td>
                  <td className="px-4 py-3.5 text-muted-foreground">{p.module}</td>
                  <td className="px-4 py-3.5">
                    <DifficultyTag value={p.difficulty} />
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">{p.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {list.length === 0 ? (
          <p className="px-5 py-20 text-center text-sm text-muted-foreground">
            {tab === "todo"
              ? "Nothing to review yet — star a question or mark it incorrect in the tracker and it lands here."
              : "No reviewed problems yet."}
          </p>
        ) : null}
      </section>
    </div>
  );
}

function DifficultyTag({ value }: { value: Problem["difficulty"] }) {
  const meta = LEVEL_META[value];
  return <span className={`text-xs font-bold ${meta.text}`}>{meta.label}</span>;
}

function ProblemView({
  problem,
  position,
  note,
  understood,
  onNote,
  onUnderstood,
  onExit,
  onPrev,
  onNext,
}: {
  problem: Problem;
  position: string;
  note: string;
  understood: boolean;
  onNote: (v: string) => void;
  onUnderstood: () => void;
  onExit: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
        >
          <X size={15} /> Exit
        </button>
        <div className="flex items-center gap-3 text-sm">
          <button type="button" onClick={onPrev} aria-label="Previous problem">
            <ChevronLeft size={18} className="text-muted-foreground" />
          </button>
          <span className="font-display font-semibold text-foreground">{problem.module}</span>
          <DifficultyTag value={problem.difficulty} />
          <span className="text-muted-foreground">{position}</span>
          <button type="button" onClick={onNext} aria-label="Next problem">
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="grid gap-5 rounded-3xl border border-border bg-card p-6 lg:grid-cols-2">
        <div className="space-y-4">
          <p className="text-base text-foreground">{problem.prompt}</p>
          <ul className="space-y-3">
            {problem.choices.map((choice, i) => {
              const isAnswer = i === problem.answer;
              const isPicked = false;
              return (
                <li
                  key={choice}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
                    isAnswer
                      ? "border-emerald bg-emerald/10"
                      : isPicked
                        ? "border-flame bg-flame/10"
                        : "border-border"
                  }`}
                >
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                      isAnswer
                        ? "bg-emerald text-primary-foreground"
                        : isPicked
                          ? "bg-flame text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-foreground">{choice}</span>
                </li>
              );
            })}
          </ul>

          <div>
            <p className="font-display text-sm font-semibold text-foreground">
              Notes about this problem
            </p>
            <textarea
              value={note}
              onChange={(e) => onNote(e.target.value)}
              placeholder="Why did you miss this? What will you remember next time?"
              className="mt-2 h-24 w-full resize-y rounded-2xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex flex-col justify-between gap-6 lg:border-l lg:border-border lg:pl-6">
          <div>
            <h3 className="font-display text-base font-semibold text-foreground">Explanation</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {problem.explanation}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onUnderstood}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors ${
                understood ? "border-emerald bg-emerald/10 text-emerald" : "border-border text-foreground"
              }`}
            >
              <span
                className={`grid size-5 place-items-center rounded-md border ${
                  understood ? "border-emerald bg-emerald text-primary-foreground" : "border-border"
                }`}
              >
                {understood ? <Check size={12} /> : null}
              </span>
              I understand this problem
            </button>
            <button
              type="button"
              onClick={onNext}
              className="flex items-center gap-1 rounded-xl bg-emerald px-5 py-2.5 text-sm font-bold text-primary-foreground"
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
