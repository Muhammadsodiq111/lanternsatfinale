import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Settings2 } from "lucide-react";

import { practiceQuestionsQuery } from "@/lib/practice";

type Module = { title: string; questions: number; subtopics: number; minutes: number };
type ModuleStats = { questions: number; subtopics: string[] };
type Group = { title: string; modules: Module[] };

const MATH_GROUPS: Group[] = [
  {
    title: "Algebra",
    modules: [
      { title: "Linear Equations in 1 Variable", questions: 80, subtopics: 4, minutes: 57 },
      { title: "Linear Equations in 2 Variables", questions: 114, subtopics: 5, minutes: 96 },
      { title: "Linear Functions", questions: 96, subtopics: 4, minutes: 84 },
      { title: "Linear Inequalities in 1 or 2 Variables", questions: 72, subtopics: 3, minutes: 65 },
      { title: "Systems of 2 Linear Equations in 2 Variables", questions: 102, subtopics: 5, minutes: 92 },
    ],
  },
  {
    title: "Advanced Math",
    modules: [
      { title: "Equivalent Expressions", questions: 114, subtopics: 4, minutes: 108 },
      { title: "Nonlinear Equations in 1/2 Variables", questions: 170, subtopics: 6, minutes: 155 },
      { title: "Nonlinear Functions", questions: 150, subtopics: 5, minutes: 128 },
    ],
  },
  {
    title: "Problem-Solving and Data Analysis",
    modules: [
      { title: "Evaluating Statistical Claims", questions: 72, subtopics: 3, minutes: 66 },
      { title: "Inferences from Sample Statistics", questions: 66, subtopics: 3, minutes: 60 },
      { title: "1-Variable Data: Distributions & Measures", questions: 90, subtopics: 3, minutes: 80 },
      { title: "Percentages", questions: 78, subtopics: 4, minutes: 67 },
      { title: "Probability & Conditional Probability", questions: 66, subtopics: 3, minutes: 59 },
      { title: "Ratios, Rates, Proportional Relationships, and Units", questions: 96, subtopics: 5, minutes: 88 },
      { title: "2-Variable Data: Models & Scatterplots", questions: 100, subtopics: 4, minutes: 90 },
    ],
  },
  {
    title: "Geometry and Trigonometry",
    modules: [
      { title: "Area & Volume", questions: 87, subtopics: 3, minutes: 80 },
      { title: "Circles", questions: 124, subtopics: 4, minutes: 108 },
      { title: "Lines, Angles, and Triangles", questions: 93, subtopics: 4, minutes: 85 },
      { title: "Right Triangles & Trigonometry", questions: 71, subtopics: 3, minutes: 67 },
    ],
  },
];

const RW_GROUPS: Group[] = [
  {
    title: "Standard English Conventions",
    modules: [
      { title: "Boundaries", questions: 120, subtopics: 5, minutes: 180 },
      { title: "Form, Structure, and Sense", questions: 143, subtopics: 6, minutes: 195 },
    ],
  },
  {
    title: "Information and Ideas",
    modules: [
      { title: "Central Ideas & Details", questions: 97, subtopics: 3, minutes: 176 },
      { title: "Command of Evidence", questions: 134, subtopics: 5, minutes: 185 },
      { title: "Inferences", questions: 104, subtopics: 3, minutes: 155 },
    ],
  },
  {
    title: "Craft and Structure",
    modules: [
      { title: "Cross-Text Connections", questions: 80, subtopics: 4, minutes: 120 },
      { title: "Text Structure & Purpose", questions: 90, subtopics: 3, minutes: 130 },
      { title: "Words in Context", questions: 101, subtopics: 2, minutes: 140 },
    ],
  },
  {
    title: "Expression of Ideas",
    modules: [
      { title: "Rhetorical Synthesis", questions: 130, subtopics: 4, minutes: 165 },
      { title: "Transitions", questions: 135, subtopics: 4, minutes: 202 },
    ],
  },
];

type Subject = "math" | "rw";

export function ModulesSection() {
  const [subject, setSubject] = useState<Subject>("math");
  const groups = subject === "math" ? MATH_GROUPS : RW_GROUPS;
  const accent = subject === "math" ? "bg-primary text-primary-foreground" : "bg-violet text-primary-foreground";

  const { data: rows = [] } = useQuery(practiceQuestionsQuery(""));
  const stats = useMemo(() => {
    const map = new Map<string, ModuleStats>();
    for (const row of rows) {
      const entry = map.get(row.module) ?? { questions: 0, subtopics: [] };
      entry.questions += 1;
      const name = row.subtopic || "Questions";
      if (!entry.subtopics.includes(name)) entry.subtopics.push(name);
      map.set(row.module, entry);
    }
    return map;
  }, [rows]);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setSubject("math")}
            className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-colors ${
              subject === "math" ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground"
            }`}
          >
            Math
          </button>
          <button
            type="button"
            onClick={() => setSubject("rw")}
            className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-colors ${
              subject === "rw" ? "bg-violet text-primary-foreground" : "border border-border bg-card text-foreground"
            }`}
          >
            Reading &amp; Writing
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/practice/manage"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground"
          >
            <Settings2 size={14} /> Manage Questions
          </Link>
          <span className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">
            All modules unlocked · free
          </span>
        </div>
      </div>


      {groups.map((group) => {
        const total = group.modules.reduce((sum, m) => sum + (stats.get(m.title)?.questions ?? 0), 0);
        return (
          <section key={group.title} className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-lg font-semibold text-foreground">{group.title}</h3>
              <p className="text-xs font-semibold text-muted-foreground">
                <span className="text-foreground">0</span>/{total} attempted
                <span className="ml-4 text-foreground">0</span>/{total} correct
              </p>
            </div>

            <div className="grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {group.modules.map((m) => (
                <ModuleCard
                  key={m.title}
                  module={m}
                  accent={accent}
                  stats={stats.get(m.title) ?? { questions: 0, subtopics: [] }}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ModuleCard({
  module: m,
  accent,
  stats,
}: {
  module: Module;
  accent: string;
  stats: ModuleStats;
}) {
  const [open, setOpen] = useState(false);
  const subtopics = stats.subtopics;
  const count = stats.questions;

  return (
    <article className="flex flex-col rounded-3xl border border-border bg-card p-5 shadow-[0_20px_60px_-45px_rgba(20,40,90,0.45)]">
      <div>
        <h4 className="font-display text-base font-semibold text-foreground">{m.title}</h4>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>
            {count} qs · {subtopics.length} subtopics
          </span>
        </div>

        <div className="mt-5 flex items-center justify-between text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
          <span>
            Accuracy <span className="ml-1 text-sm text-muted-foreground">—</span>
          </span>
          <span>
            Completed <span className="ml-1 text-sm text-foreground">0</span>/{count}
          </span>
        </div>
        <div className="mt-2 flex gap-1.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="h-1.5 flex-1 rounded-full bg-muted" />
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 pt-0">
        <Link
          to="/practice"
          search={{ module: m.title, mode: "diagnostic" }}
          className={`shrink-0 rounded-xl px-3 py-2 text-sm font-bold whitespace-nowrap ${accent}`}
        >
          Diagnostic
        </Link>
        <Link
          to="/practice"
          search={{ module: m.title, mode: "practice" }}
          className="min-w-0 flex-1 rounded-xl bg-emerald px-3 py-2 text-center text-sm font-bold whitespace-nowrap text-primary-foreground"
        >
          Practice ›
        </Link>
        <button
          type="button"
          aria-label={open ? "Hide subtopics" : "Show subtopics"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground"
        >
          <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <ul className="mt-4 space-y-3 border-t border-border pt-4">
            {subtopics.length === 0 ? (
              <li className="text-muted-foreground text-sm">No questions added yet.</li>
            ) : null}
            {subtopics.map((name, i) => (
              <li key={name} className="flex items-start gap-2.5 text-sm">
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${i === 0 ? "bg-emerald" : "bg-amber"}`}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 text-foreground">{name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}