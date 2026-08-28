import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Calculator, ChevronDown, ChevronRight, Eye, EyeOff, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DesmosCalculator } from "@/components/practice/desmos-calculator";
import { MathExplanation, MathLine } from "@/components/practice/math-text";
import { PracticeWidgets, type WidgetId } from "@/components/practice/widgets";


import {
  DIFFICULTY_LEVELS,
  formatTime,
  LEVEL_LABEL_CLASS,
  matchesFreeAnswer,
  practiceQuestionsQuery,
  subtopicsFromRows,
  type Level,
} from "@/lib/practice";

type Search = { module: string; mode: "practice" | "diagnostic" };

export const Route = createFileRoute("/_authenticated/practice/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    module: typeof search["module"] === "string" ? search["module"] : "Linear Equations in One Variable",
    mode: search["mode"] === "diagnostic" ? "diagnostic" : "practice",
  }),
  component: PracticePage,
  head: () => ({
    meta: [
      { title: "Practice questions — LanternSAT" },
      {
        name: "description",
        content: "Solve Digital SAT practice questions with instant explanations, Desmos, notes, and a per-question timer.",
      },
      { property: "og:title", content: "Practice questions — LanternSAT" },
      {
        property: "og:description",
        content: "Solve Digital SAT practice questions with instant explanations, Desmos, notes, and a per-question timer.",
      },
    ],
  }),
});

type Status = "correct" | "wrong";

function PracticePage() {
  const { module: moduleTitle, mode } = Route.useSearch();
  const navigate = useNavigate();
  const { entry, setStatus, toggleReviewed } = useTrackerProgress();

  const { data: rows = [] } = useQuery(practiceQuestionsQuery(moduleTitle));
  const allSubtopics = useMemo(
    () => subtopicsFromRows(rows).filter((s) => s.questions.length > 0),
    [rows],
  );

  // Diagnostic mode: a short mixed set (up to 2 per difficulty) drawn from the module.
  const subtopics = useMemo(() => {
    if (mode !== "diagnostic") return allSubtopics;
    const pool = allSubtopics.flatMap((s) => s.questions);
    const picked = DIFFICULTY_LEVELS.flatMap((level) =>
      pool.filter((q) => q.level === level).slice(0, 2),
    );
    if (picked.length === 0) return [];
    return [{ id: "diagnostic", title: "Diagnostic set", questions: picked }];
  }, [allSubtopics, mode]);

  const [openSubtopic, setOpenSubtopic] = useState("");
  const [current, setCurrent] = useState({ subtopic: "", questionId: "" });
  const [results, setResults] = useState<Record<string, Status>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const [checked, setChecked] = useState(false);
  const [showDesmos, setShowDesmos] = useState(false);
  const [hideTimer, setHideTimer] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [widgets, setWidgets] = useState<WidgetId[]>([]);
  const [showSummary, setShowSummary] = useState(false);


  useEffect(() => {
    const exists = subtopics.some(
      (s) => s.id === current.subtopic && s.questions.some((q) => q.id === current.questionId),
    );
    if (exists) return;
    const first = subtopics[0];
    setOpenSubtopic(first?.id ?? "");
    setCurrent({ subtopic: first?.id ?? "", questionId: first?.questions[0]?.id ?? "" });
    setSelected(null);
    setChecked(false);
    setUnderstood(false);
    setShowDesmos(false);
  }, [subtopics, current.subtopic, current.questionId]);

  const subtopic = subtopics.find((s) => s.id === current.subtopic) ?? subtopics[0];
  const question = subtopic?.questions.find((q) => q.id === current.questionId) ?? subtopic?.questions[0];

  useEffect(() => {
    setSeconds(0);
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [current.questionId]);

  function goTo(subtopicId: string, questionId: string) {
    setCurrent({ subtopic: subtopicId, questionId });
    setSelected(null);
    setTyped("");
    setChecked(false);
    setUnderstood(false);
    setShowDesmos(false);
  }

  function check() {
    if (!question) return;
    if (question.type === "free") {
      if (!typed.trim()) return;
      setChecked(true);
      setResults((r) => ({
        ...r,
        [question.id]: matchesFreeAnswer(typed, question.answerText) ? "correct" : "wrong",
      }));
      return;
    }
    if (selected === null) return;
    setChecked(true);
    setResults((r) => ({ ...r, [question.id]: selected === question.answer ? "correct" : "wrong" }));
  }


  function next() {
    const all = subtopics.flatMap((s) => s.questions.map((q) => ({ s: s.id, q: q.id })));
    if (all.length === 0 || !question) return;
    const i = all.findIndex((x) => x.q === question.id);
    const nxt = all[(i + 1) % all.length]!;
    setOpenSubtopic(nxt.s);
    goTo(nxt.s, nxt.q);
  }

  function toggleWidget(id: WidgetId) {
    setWidgets((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
  }

  const completedPts = Object.values(results).filter((r) => r === "correct").length * 8;
  const answeredInSubtopic = (subtopic?.questions ?? []).filter((q) => results[q.id]).length;

  return (
    <div className="flex min-h-screen flex-col bg-sky">
      <header className="flex items-center gap-4 border-b border-border bg-card px-4 py-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/dashboard", search: { section: "Modules" } })}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
        >
          <X size={15} /> Exit
        </button>
        <button
          type="button"
          onClick={() => setHideTimer((h) => !h)}
          aria-label={hideTimer ? "Show timer" : "Hide timer"}
          className="text-muted-foreground"
        >
          {hideTimer ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        <span className="font-display text-xl font-semibold tabular-nums text-foreground">
          {hideTimer ? "--:--" : formatTime(seconds)}
        </span>

        <div className="mx-auto flex min-w-0 items-center gap-3">
          <h1 className="font-display truncate text-base font-semibold text-foreground">{moduleTitle}</h1>
          <span className="hidden truncate rounded-lg bg-accent px-3 py-1 text-xs font-semibold text-primary sm:block">
            {subtopic?.title ?? ""}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {(
            [
              { id: "calculator" as const, icon: Calculator, label: "Desmos calculator" },
              { id: "formula" as const, icon: null, label: "Formula reference" },
            ]
          ).map((b) => {
            const Icon = b.icon;
            const active = widgets.includes(b.id);
            return (
              <button
                key={b.id}
                type="button"
                aria-label={b.label}
                onClick={() => toggleWidget(b.id)}
                className={`grid h-9 w-10 place-items-center rounded-xl border text-sm font-bold transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {Icon ? <Icon size={16} /> : "fx"}
              </button>
            );
          })}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-border bg-card p-4 lg:block">
          <p className="font-display mb-4 text-base font-semibold text-foreground">{moduleTitle}</p>

          {subtopics.map((s) => {
            const open = openSubtopic === s.id;
            return (
              <div key={s.id} className="mb-2">
                <button
                  type="button"
                  onClick={() => setOpenSubtopic(open ? "" : s.id)}
                  className="flex w-full items-center gap-2 py-2 text-left text-sm font-semibold text-primary"
                >
                  {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  <span className="truncate">{s.title}</span>
                </button>

                {open ? (
                  <div className="space-y-4 pb-3">
                    <button
                      type="button"
                      className="w-full rounded-xl border border-primary/40 px-3 py-2 text-sm font-semibold text-primary"
                    >
                      View Lesson
                    </button>

                    <div>
                      <p className="text-xs font-bold text-emerald">
                        {answeredInSubtopic ? `Completed · ${completedPts} pts` : "Not started"}
                      </p>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-emerald transition-all"
                          style={{ width: `${(answeredInSubtopic / s.questions.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    {DIFFICULTY_LEVELS.map((level) => (
                      <div key={level}>
                        <p className={`text-[11px] font-bold tracking-[0.12em] uppercase ${LEVEL_LABEL_CLASS[level]}`}>
                          {level}
                        </p>
                        <div className="mt-1.5 grid grid-cols-5 gap-1.5">
                          {s.questions
                            .filter((q) => q.level === level)
                            .map((q) => (
                              <QuestionChip
                                key={q.id}
                                label={q.index}
                                active={q.id === question?.id}
                                status={results[q.id]}
                                onClick={() => goTo(s.id, q.id)}
                              />
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </aside>

        <main className="min-w-0 flex-1 p-4">
          {!question ? (
            <div className="min-h-[calc(100vh-7rem)] rounded-3xl border border-border bg-card" />
          ) : (
          <div className="flex min-h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-3xl border border-border bg-card">
            <div className="grid flex-1 md:grid-cols-2">
              <div className="space-y-4 border-border p-6 md:border-r">
                <div className="text-base"><MathLine line={question.prompt} /></div>
                {question.type === "free" ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">
                      Your answer
                    </label>
                    <input
                      value={typed}
                      disabled={checked}
                      onChange={(e) => setTyped(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") check();
                      }}
                      placeholder="Type your answer"
                      className={`w-full rounded-2xl border-2 bg-background px-4 py-3 text-sm text-foreground outline-none ${
                        checked
                          ? results[question.id] === "correct"
                            ? "border-emerald"
                            : "border-flame"
                          : "border-border focus:border-primary"
                      }`}
                    />
                    {checked && results[question.id] !== "correct" ? (
                      <p className="text-xs font-semibold text-flame">
                        Correct answer: <span className="font-mono">{question.answerText}</span>
                      </p>
                    ) : null}
                  </div>
                ) : (
                <div className="space-y-3">
                  {question.choices.map((choice, i) => {
                    const letter = "ABCD"[i];
                    const isPicked = selected === i;
                    const isAnswer = i === question.answer;
                    const state =
                      checked && isAnswer
                        ? "border-emerald bg-emerald/5"
                        : checked && isPicked
                          ? "border-flame bg-flame/5"
                          : isPicked
                            ? "border-primary"
                            : "border-border";
                    const badge =
                      checked && isAnswer
                        ? "bg-emerald text-primary-foreground"
                        : checked && isPicked
                          ? "bg-flame text-primary-foreground"
                          : "bg-muted text-muted-foreground";
                    return (
                      <button
                        key={choice}
                        type="button"
                        disabled={checked}
                        onClick={() => setSelected(i)}
                        className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors ${state}`}
                      >
                        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md text-xs font-bold ${badge}`}>
                          {letter}
                        </span>
                        <span className="text-sm text-foreground">{choice}</span>
                      </button>
                    );
                  })}
                </div>
                )}

              </div>

              {checked ? (
                <div className="flex flex-col p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-base font-semibold text-foreground">Explanation</h2>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowDesmos((d) => !d)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                          showDesmos
                            ? "border-emerald bg-emerald text-primary-foreground"
                            : "border-emerald text-emerald"
                        }`}
                      >
                        Desmos
                      </button>
                    </div>
                  </div>

                  {showDesmos ? (
                    <div className="mt-4 space-y-3">
                      <p className="rounded-xl bg-accent px-4 py-3 text-sm text-foreground">{question.desmosNote}</p>
                      <div className="h-[420px] overflow-hidden rounded-2xl border border-border">
                        <DesmosCalculator expressions={question.desmos} state={question.desmosState} />
                      </div>
                    </div>
                  ) : (

                    <div className="mt-4">
                      <MathExplanation lines={question.explanation} />
                    </div>
                  )}


                  <label className="mt-auto flex items-center gap-2 border-t border-border pt-4 text-sm font-semibold text-foreground">
                    <input
                      type="checkbox"
                      checked={understood}
                      onChange={(e) => setUnderstood(e.target.checked)}
                      className="h-4 w-4 accent-emerald"
                    />
                    I understand this problem
                  </label>
                </div>
              ) : (
                <div className="hidden md:block" />
              )}
            </div>

            <div className="flex justify-end border-t border-border p-4">
              {checked ? (
                <button
                  type="button"
                  onClick={next}
                  className="rounded-xl bg-emerald px-6 py-2.5 text-sm font-bold text-primary-foreground"
                >
                  Next ›
                </button>
              ) : (
                <button
                  type="button"
                  onClick={check}
                  disabled={question.type === "free" ? !typed.trim() : selected === null}
                  className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
                >
                  Check ›
                </button>
              )}
            </div>
          </div>
          )}
        </main>
      </div>

      <PracticeWidgets open={widgets} onClose={(id) => setWidgets((w) => w.filter((x) => x !== id))} />
    </div>
  );
}

function QuestionChip({
  label,
  active,
  status,
  onClick,
}: {
  label: number;
  active: boolean;
  status?: Status | undefined;
  onClick: () => void;
}) {
  const cls = active
    ? "border-primary bg-primary text-primary-foreground"
    : status === "correct"
      ? "border-emerald bg-emerald/10 text-emerald"
      : status === "wrong"
        ? "border-flame bg-flame/10 text-flame"
        : "border-emerald/40 bg-card text-emerald";
  return (
    <button type="button" onClick={onClick} className={`rounded-lg border-2 py-1.5 text-sm font-bold ${cls}`}>
      {label}
    </button>
  );
}