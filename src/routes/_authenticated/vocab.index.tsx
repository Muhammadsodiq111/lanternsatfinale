import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, LogOut, Pencil, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { supabase } from "@/integrations/supabase/external";
import { clearSessionCache } from "@/lib/auth-session";
import {
  saveDailyGoal,
  vocabGoalQuery,
  vocabProgressQuery,
  vocabWordsQuery,
  type VocabCategory,
} from "@/lib/vocab";

const PAGE_SIZE = 24;

export const Route = createFileRoute("/_authenticated/vocab/")({
  component: VocabPage,
  head: () => ({
    meta: [
      { title: "SAT Vocab — LanternSAT" },
      { name: "description", content: "Study 1,600+ SAT vocabulary words, word parts, and transitions with flashcards and quizzes." },
      { property: "og:title", content: "SAT Vocab — LanternSAT" },
      { property: "og:description", content: "Study SAT vocabulary with flashcards, scroll mode, and daily goals." },
    ],
  }),
});

function VocabPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const category: VocabCategory = "vocabulary";
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const [pos, setPos] = useState("all");
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [onlySentences, setOnlySentences] = useState(false);
  const [page, setPage] = useState(0);
  const [editingGoal, setEditingGoal] = useState(false);

  const { data: words = [], isLoading } = useQuery(vocabWordsQuery(category));
  const { data: progress = {} } = useQuery(vocabProgressQuery());
  const { data: goal = 15 } = useQuery(vocabGoalQuery());

  const posOptions = useMemo(
    () => Array.from(new Set(words.map((w) => w.part_of_speech))).sort(),
    [words],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return words.filter((w) => {
      if (q && !w.word.toLowerCase().includes(q) && !w.definition.toLowerCase().includes(q)) return false;
      if (level !== "all" && w.difficulty !== level) return false;
      if (pos !== "all" && w.part_of_speech !== pos) return false;
      const p = progress[w.id];
      if (onlyFlagged && !p?.flagged) return false;
      if (onlySentences && !p?.own_sentence) return false;
      return true;
    });
  }, [words, search, level, pos, onlyFlagged, onlySentences, progress]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const visible = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);
  const studied = Object.values(progress).filter((p) => p.known).length;

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    clearSessionCache();
    navigate({ to: "/login", replace: true });
  }

  async function handleGoalSave(value: number) {
    if (!user?.id) return;
    await saveDailyGoal(user.id, value);
    queryClient.setQueryData(["vocab-goal"], value);
    setEditingGoal(false);
  }

  function reset<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(0);
    };
  }

  return (
    <div className="flex min-h-screen bg-sky">
      <DashboardSidebar active="Vocab" email={user?.email} />

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-md">
          <div className="flex items-center justify-between px-5 py-4">
            <h1 className="font-display text-lg font-semibold text-foreground">Vocab</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <LogOut size={15} /> Log out
              </button>
            </div>
          </div>
        </header>

        <main className="px-5 py-6">
          <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
            <section className="rounded-3xl border border-border bg-card shadow-[0_20px_60px_-45px_rgba(20,40,90,0.45)]">
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-xl font-semibold text-foreground">Vocab List</h2>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {words.length} words
                  </span>
                </div>
                <div className="relative">
                  <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => reset(setSearch)(e.target.value)}
                    placeholder="Search…"
                    className="w-64 rounded-full border border-border bg-background py-2 pr-4 pl-9 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-y border-border px-6 py-3">
                <Select value={level} onChange={reset(setLevel)} options={[["all", "All Levels"], ["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"], ["challenge", "Challenge"]]} />
                <Select
                  value={pos}
                  onChange={reset(setPos)}
                  options={[["all", "All POS"], ...posOptions.map((p) => [p, p] as [string, string])]}
                />
                <Toggle label="Flagged" checked={onlyFlagged} onChange={reset(setOnlyFlagged)} />
                <Toggle label="With Sentences" checked={onlySentences} onChange={reset(setOnlySentences)} />
              </div>

              <div className="p-6">
                {isLoading ? (
                  <p className="py-16 text-center text-sm text-muted-foreground">Loading words…</p>
                ) : visible.length === 0 ? (
                  <p className="py-16 text-center text-sm text-muted-foreground">No words match these filters.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {visible.map((w) => (
                      <Link
                        key={w.id}
                        to="/vocab/study"
                        search={{ category, start: w.id, mode: "cards" as const }}
                        className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-left text-sm font-medium text-foreground transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary"
                      >
                        <span className="truncate">{w.word}</span>
                        {progress[w.id]?.known ? <Check size={15} className="shrink-0 text-emerald" /> : null}
                      </Link>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
                  <button
                    type="button"
                    disabled={current === 0}
                    onClick={() => setPage(current - 1)}
                    className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-muted-foreground">
                    Page {current + 1} of {pageCount}
                  </span>
                  <button
                    type="button"
                    disabled={current >= pageCount - 1}
                    onClick={() => setPage(current + 1)}
                    className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>

            <aside className="space-y-5">
              <Panel>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold text-foreground">Daily Vocab Goal</h3>
                  <button
                    type="button"
                    onClick={() => setEditingGoal((v) => !v)}
                    aria-label="Edit daily goal"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Pencil size={16} />
                  </button>
                </div>

                {editingGoal ? (
                  <form
                    className="mt-4 flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const value = Number(new FormData(e.currentTarget).get("goal"));
                      if (value > 0) void handleGoalSave(value);
                    }}
                  >
                    <input
                      name="goal"
                      type="number"
                      min={1}
                      max={200}
                      defaultValue={goal}
                      className="w-24 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                      Save
                    </button>
                  </form>
                ) : (
                  <div className="mt-4 flex items-center gap-5">
                    <GoalRing value={studied} goal={goal} />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Vocab Studied</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.max(0, 100 - Math.round((studied / goal) * 100))}% remaining
                      </p>
                    </div>
                  </div>
                )}
              </Panel>

              <Panel>
                <h3 className="font-display text-lg font-semibold text-foreground">Practice Set</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Random flashcards, skipping words you already know
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[5, 10, 15, 20, 25].map((n) => (
                    <Link
                      key={n}
                      to="/vocab/study"
                      search={{ category, mode: "cards" as const, limit: n }}
                      className="rounded-xl bg-emerald px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
                    >
                      {n}
                    </Link>
                  ))}
                </div>
              </Panel>

              <Panel>
                <h3 className="font-display text-lg font-semibold text-foreground">Scroll Review</h3>
                <p className="mt-1 text-sm text-muted-foreground">Read straight through the list with definitions</p>
                <div className="mt-4 flex gap-2">
                  {[20, 50, 100].map((n) => (
                    <Link
                      key={n}
                      to="/vocab/study"
                      search={{ category, mode: "scroll" as const, limit: n }}
                      className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
                    >
                      {n}
                    </Link>
                  ))}
                </div>
              </Panel>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_20px_60px_-45px_rgba(20,40,90,0.45)]">
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground outline-none focus:border-primary"
    >
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 accent-[var(--primary)]"
      />
      {label}
    </label>
  );
}

function GoalRing({ value, goal }: { value: number; goal: number }) {
  const pct = Math.min(1, goal > 0 ? value / goal : 0);
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center leading-none">
        <div className="text-center">
          <p className="font-display text-xl font-semibold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">/{goal}</p>
        </div>
      </div>
    </div>
  );
}
