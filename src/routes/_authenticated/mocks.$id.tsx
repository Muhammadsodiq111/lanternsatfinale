import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { formatClock, mockExamsQuery, mockQuestionsQuery, timingFor } from "@/lib/mocks";

type Search = { timing: string };

export const Route = createFileRoute("/_authenticated/mocks/$id")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    timing: typeof search["timing"] === "string" ? (search["timing"] as string) : "official",
  }),
  component: ExamPage,
  head: ({ params }) => ({
    meta: [
      { title: `Mock ${params.id} — Reading & Writing — LanternSAT` },
      { name: "description", content: "Timed digital SAT-style Reading and Writing module with question navigation." },
      { property: "og:title", content: `Mock ${params.id} — LanternSAT` },
      { property: "og:description", content: "Timed SAT-style mock exam module." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ExamPage() {
  const { id } = Route.useParams();
  const { timing } = Route.useSearch();
  const navigate = useNavigate();

  const { data: exams = [] } = useQuery(mockExamsQuery());
  const { data: questions = [], isLoading } = useQuery(mockQuestionsQuery(id));
  const exam = exams.find((e) => e.id === id);
  const option = useMemo(() => timingFor(timing), [timing]);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [navOpen, setNavOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [seconds, setSeconds] = useState(option.minutes === null ? 0 : option.minutes * 60);

  useEffect(() => {
    const t = setInterval(() => {
      setSeconds((s) => (option.minutes === null ? s + 1 : Math.max(0, s - 1)));
    }, 1000);
    return () => clearInterval(t);
  }, [option.minutes]);

  if (isLoading) {
    return <div className="p-10 text-sm text-muted-foreground">Loading exam…</div>;
  }

  if (questions.length === 0) {
    return (
      <div className="p-10 text-sm text-muted-foreground">
        This exam isn&apos;t available yet.
      </div>
    );
  }

  const total = questions.length;
  const q = questions[Math.min(index, total - 1)]!;

  return (
    <div className="flex min-h-screen flex-col bg-card">
      <header className="grid shrink-0 grid-cols-3 items-center border-b border-border px-5 py-3">
          <h1 className="truncate text-sm font-bold text-foreground">{exam?.title ?? "Mock exam"}</h1>
        <div className="text-center">
          {hidden ? null : <p className="text-xl font-bold text-foreground">{formatClock(seconds)}</p>}
          <button onClick={() => setHidden((h) => !h)} className="text-xs font-medium text-muted-foreground hover:text-foreground">
            {hidden ? "Show" : "Hide"}
          </button>
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => navigate({ to: "/mocks" })}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Save and Exit
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 md:grid-cols-2">
        <div className="border-border px-8 py-7 md:border-r">
          <p className="text-[17px] leading-8 whitespace-pre-line text-foreground/90">{q.passage}</p>
        </div>

        <div className="px-8 py-7">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-foreground px-2 py-0.5 text-xs font-bold text-card">Q{index + 1}</span>
          </div>

          <p className="mt-5 text-[15px] font-medium text-foreground">{q.prompt}</p>

          <div className="mt-5 space-y-3">
            {q.choices.map((choice, ci) => {
              const selected = answers[q.id] === ci;
              return (
                <button
                  key={ci}
                  type="button"
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: ci }))}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                    selected ? "border-primary bg-primary/5 font-semibold" : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border text-xs font-bold">
                    {String.fromCharCode(65 + ci)}
                  </span>
                  <span className="text-foreground">{choice}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <footer className="flex shrink-0 items-center justify-between border-t border-border px-5 py-3">
        <span className="font-display hidden text-sm font-semibold text-primary sm:block">LanternSAT</span>
        <button
          onClick={() => setNavOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-card"
        >
          Question {index + 1} of {total} <ChevronUp size={14} />
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-40 hover:bg-accent"
          >
            Back
          </button>
          <button
            onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
            disabled={index === total - 1}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40 hover:opacity-90"
          >
            Next
          </button>
        </div>
      </footer>

      {navOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4">
          <div role="dialog" aria-label="Go to question" className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-2xl">
            <h2 className="font-display text-lg font-semibold text-foreground">Go to Question</h2>
            <div className="mt-5 grid grid-cols-5 gap-3">
              {questions.map((item, qi) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setIndex(qi);
                    setNavOpen(false);
                  }}
                  className={`rounded-xl border px-2 py-2 text-sm font-semibold transition-colors ${
                    qi === index
                      ? "border-primary bg-primary text-primary-foreground"
                      : answers[item.id] !== undefined
                        ? "border-emerald text-emerald"
                        : "border-border text-foreground hover:border-primary"
                  }`}
                >
                  Q{qi + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setNavOpen(false)}
              className="mt-6 rounded-xl bg-muted px-5 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
