import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import {
  CATEGORY_META,
  DIFFICULTY_BADGE,
  READING_CATEGORIES,
  READING_DIFFICULTIES,
  passagesQuery,
  readingProgressQuery,
  splitParagraphs,
  type Passage,
} from "@/lib/reading";

export const Route = createFileRoute("/_authenticated/reading/")({
  component: ReadingLibrary,
  head: () => ({
    meta: [
      { title: "Reading Library — LanternSAT" },
      { name: "description", content: "Read SAT-style passages across literature, science, history, and humanities — all free, with highlights and progress tracking." },
      { property: "og:title", content: "Reading Library — LanternSAT" },
      { property: "og:description", content: "Free SAT reading passages with highlights and progress tracking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Badges({ p }: { p: Passage }) {
  const meta = CATEGORY_META[p.category] ?? { label: p.category, short: p.category.slice(0, 3).toUpperCase(), className: "bg-muted text-muted-foreground" };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-[0.1em] uppercase ${meta.className}`}>
        {meta.label}
      </span>
      <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold capitalize ${DIFFICULTY_BADGE[p.difficulty] ?? "border-border text-muted-foreground"}`}>
        {p.difficulty}
      </span>
    </div>
  );
}

function ReadingLibrary() {
  const { user } = Route.useRouteContext();
  const { data: passages = [], isLoading } = useQuery(passagesQuery());
  const { data: progress = {} } = useQuery(readingProgressQuery());

  const [category, setCategory] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("any");

  const filtered = useMemo(
    () =>
      passages.filter(
        (p) =>
          (category === "all" || p.category === category) &&
          (difficulty === "any" || p.difficulty === difficulty),
      ),
    [passages, category, difficulty],
  );

  const picks = filtered.filter((p) => p.is_daily_pick);
  const [feature, ...restPicks] = picks;
  const readCount = filtered.filter((p) => progress[p.id]?.is_read).length;

  return (
    <div className="flex min-h-screen bg-sky">
      <DashboardSidebar active="Reading" email={user?.email} />

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 border-b border-border bg-card/80 px-5 py-4 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl bg-muted p-1">
              {["any", ...READING_DIFFICULTIES].map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold capitalize transition-colors ${
                    difficulty === d ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-border" />

            <div className="flex flex-wrap items-center gap-2">
              {[{ value: "all", label: "All" }, ...READING_CATEGORIES].map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                    category === c.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="px-5 py-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading passages…</p>
          ) : (
            <>
              {feature ? (
                <section className="mb-8">
                  <div className="mb-3 flex items-center gap-2">
                    <h2 className="font-display text-xl font-semibold text-foreground">Today's Picks</h2>
                    <span className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold tracking-[0.12em] text-primary-foreground uppercase">
                      <Sparkles size={11} /> Daily
                    </span>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr_1fr]">
                    <Link
                      to="/reading/$slug"
                      params={{ slug: feature.slug }}
                      className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-[0_20px_60px_-45px_rgba(20,40,90,0.45)] transition-all hover:-translate-y-0.5 hover:border-primary"
                    >
                      <div>
                        <Badges p={feature} />
                        <h3 className="font-display mt-4 text-2xl font-semibold text-foreground group-hover:text-primary">
                          {feature.title}
                        </h3>
                        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                          {splitParagraphs(feature.body)[0]}
                        </p>
                      </div>
                      <p className="mt-6 flex items-center gap-1.5 border-t border-border pt-4 text-xs font-medium text-muted-foreground">
                        <Clock size={13} /> {feature.read_minutes} min read
                      </p>
                    </Link>

                    <div className="grid content-start gap-4">
                      {restPicks.slice(0, 2).map((p) => (
                        <PickCard key={p.id} p={p} />
                      ))}
                    </div>
                    <div className="grid content-start gap-4">
                      {restPicks.slice(2, 4).map((p) => (
                        <PickCard key={p.id} p={p} />
                      ))}
                    </div>
                  </div>
                </section>
              ) : null}

              <section>
                <div className="mb-3 flex items-baseline gap-3">
                  <h2 className="font-display text-xl font-semibold text-foreground">Library</h2>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {readCount}/{filtered.length} read
                  </span>
                </div>

                {filtered.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                    <p className="text-sm text-muted-foreground">No passages match these filters yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((p) => (
                      <PickCard key={p.id} p={p} read={progress[p.id]?.is_read} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function PickCard({ p, read }: { p: Passage; read?: boolean | undefined }) {
  return (
    <Link
      to="/reading/$slug"
      params={{ slug: p.slug }}
      className="group rounded-2xl border border-border bg-card p-4 shadow-[0_16px_44px_-40px_rgba(20,40,90,0.5)] transition-all hover:-translate-y-0.5 hover:border-primary"
    >
      <Badges p={p} />
      <h3 className="font-display mt-2.5 text-base font-semibold text-foreground group-hover:text-primary">
        {p.title}
      </h3>
      <p className="mt-2 flex items-center gap-3 text-xs font-medium text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock size={12} /> {p.read_minutes} min
        </span>
        {read ? <span className="font-semibold text-emerald">Read</span> : null}
      </p>
    </Link>
  );
}
