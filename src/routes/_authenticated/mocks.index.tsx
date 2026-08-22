import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { mockCountsQuery, mockExamsQuery, TIMING_OPTIONS } from "@/lib/mocks";

export const Route = createFileRoute("/_authenticated/mocks/")({
  component: MocksPage,
  head: () => ({
    meta: [
      { title: "Mock Exams — LanternSAT" },
      { name: "description", content: "Take full-length, digital SAT-style mock exams with official or extended timing." },
      { property: "og:title", content: "Mock Exams — LanternSAT" },
      { property: "og:description", content: "Practice with timed digital SAT-style mock exams." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function MocksPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [pending, setPending] = useState<string | null>(null);
  const [timing, setTiming] = useState("official");

  const { data: exams = [], isLoading } = useQuery(mockExamsQuery());
  const { data: counts = {} } = useQuery(mockCountsQuery());

  return (
    <div className="flex min-h-screen bg-sky">
      <DashboardSidebar active="Mocks" email={user?.email} />

      <main className="min-w-0 flex-1 px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold text-foreground">Mock Exams</h1>
        </div>

        {isLoading ? (
          <p className="mt-8 text-sm text-muted-foreground">Loading mocks…</p>
        ) : exams.length === 0 ? (
          <div className="mt-8 flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <p className="font-display text-xl font-semibold text-muted-foreground">Coming soon</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {exams.map((m) => {
              const count = counts[m.id] ?? 0;
              return (
                <div
                  key={m.id}
                  className="flex min-h-[230px] flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-[0_20px_60px_-45px_rgba(20,40,90,0.45)]"
                >
                  <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                    <h2 className="font-display text-2xl font-semibold text-foreground">{m.title}</h2>
                    {m.description ? (
                      <p className="text-sm text-muted-foreground">{m.description}</p>
                    ) : null}
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {count} question{count === 1 ? "" : "s"}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={count === 0}
                    onClick={() => setPending(m.id)}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-opacity ${
                      count === 0
                        ? "cursor-not-allowed bg-primary/30 text-primary-foreground/60"
                        : "bg-primary text-primary-foreground hover:opacity-90"
                    }`}
                  >
                    {count === 0 ? "No questions yet" : "Start Exam"} <ArrowRight size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {pending ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4 backdrop-blur-[2px]">
          <div role="dialog" aria-label="Timing options" className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="font-display text-xl font-semibold text-foreground">Timing Options</h3>
            <p className="mt-1 text-sm text-muted-foreground">Choose your timing accommodation for this exam</p>

            <div className="mt-5 space-y-2.5">
              {TIMING_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTiming(t.value)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                    timing === t.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      timing === t.value ? "border-primary" : "border-border"
                    }`}
                  >
                    {timing === t.value ? <span className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-foreground">{t.label}</span>
                    <span className="block text-xs text-muted-foreground">{t.detail}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => navigate({ to: "/mocks/$id", params: { id: pending }, search: { timing } })}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Start Exam
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
