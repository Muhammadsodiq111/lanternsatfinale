import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Flame,
  LogOut,
  Quote,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { ModulesSection } from "@/components/dashboard/modules";
import { CoursesSection } from "@/components/dashboard/courses";
import { StatsSection } from "@/components/dashboard/stats";
import { TrackerSection } from "@/components/dashboard/tracker";
import { ReviewSection } from "@/components/dashboard/review";
import { BankBoundary } from "@/components/dashboard/bank-boundary";
import { supabase } from "@/integrations/supabase/external";
import { clearSessionCache } from "@/lib/auth-session";
import { lessonProgressQuery } from "@/lib/lesson-progress";
import { questionBankQuery } from "@/lib/practice";
import { ALL_LESSONS } from "@/lib/courses";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(questionBankQuery);
  },
  errorComponent: DashboardError,
  notFoundComponent: () => (
    <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
      <h2 className="font-display text-2xl font-semibold text-foreground">Nothing here yet</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        We couldn't find that dashboard section.
      </p>
    </div>
  ),
  validateSearch: (search: Record<string, unknown>) => ({
    section: typeof search['section'] === "string" ? (search['section'] as string) : "Home",
  }),
  head: () => ({
    meta: [
      { title: "Your dashboard — LanternSAT" },
      { name: "description", content: "Track your Digital SAT practice, mocks, and study plan on LanternSAT." },
      { property: "og:title", content: "Your dashboard — LanternSAT" },
      { property: "og:description", content: "Track your Digital SAT practice, mocks, and study plan on LanternSAT." },
    ],
  }),
});

function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  console.error(error);

  return (
    <div className="flex min-h-screen items-center justify-center bg-sky px-5">
      <div className="max-w-md rounded-3xl border border-border bg-card p-10 text-center shadow-[0_20px_60px_-45px_rgba(20,40,90,0.45)]">
        <h2 className="font-display text-xl font-semibold text-foreground">
          Your dashboard didn't load
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong while loading your study data.
        </p>
        <button
          type="button"
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
        >
          <RotateCcw size={15} /> Try again
        </button>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { section: active } = Route.useSearch();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    clearSessionCache();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-sky">
      <DashboardSidebar active={active} email={user?.email} />

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-md">
          <div className="flex items-center justify-between px-5 py-4">
            <h1 className="font-display text-lg font-semibold text-foreground">{active}</h1>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <LogOut size={15} /> Log out
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-5 py-8">
          {active === "Home" ? (
            <HomeSections name={user?.email ? user.email.split("@")[0] : undefined} />
          ) : active === "Modules" ? (
            <ModulesSection />
          ) : active === "Courses" ? (
            <CoursesSection />
          ) : active === "Stats" ? (
            <BankBoundary rows={3}>
              <StatsSection />
            </BankBoundary>
          ) : active === "Tracker" ? (
            <BankBoundary rows={4}>
              <TrackerSection />
            </BankBoundary>
          ) : active === "Review" ? (
            <BankBoundary rows={2}>
              <ReviewSection />
            </BankBoundary>
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
              <h2 className="font-display text-2xl font-semibold text-foreground">{active}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This section is coming next — we'll build it out soon.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function HomeSections({ name }: { name?: string | undefined }) {
  const today = new Date();
  const todayLabel = today.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const todayIndex = (today.getDay() + 6) % 7;

  const { data: progress } = useQuery(lessonProgressQuery());
  const total = ALL_LESSONS.length;
  const done = ALL_LESSONS.filter((l) => progress?.[l.slug]).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Welcome back{name ? `, ${name}` : ""} 👋
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Let's keep that momentum going!</p>
        </div>
        <div className="flex max-w-sm items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3">
          <Quote size={16} className="mt-0.5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            Small daily progress leads to big results.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_20px_60px_-45px_rgba(20,40,90,0.45)]">
          <div className="flex items-center justify-between bg-primary px-5 py-3.5 text-primary-foreground">
            <h3 className="font-display text-base font-semibold">Today's Plan</h3>
            <span className="flex items-center gap-2 text-sm opacity-90">
              <CalendarDays size={15} /> {todayLabel}
            </span>
          </div>
          <div className="space-y-4 p-5">
            {[
              { label: "Math", section: "Modules" as const },
              { label: "Reading & Writing", section: "Modules" as const },
            ].map((q) => (
              <Link
                key={q.label}
                to="/dashboard"
                search={{ section: q.section }}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border p-5 transition-colors hover:border-primary"
              >
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                    Daily question set
                  </span>
                  <span className="font-display mt-1 block text-xl font-semibold text-foreground">
                    {q.label}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    10 questions · ~15 min
                  </span>
                </span>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <ArrowRight size={16} />
                </span>
              </Link>
            ))}

            <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-xs font-semibold text-muted-foreground">
              <Sparkles size={14} className="text-primary" />
              Complete both sets to keep your streak alive!
            </div>
          </div>
        </section>

        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-3">
            <Card className="flex flex-col items-center justify-center gap-1 py-6 text-center">
              <span className="flex items-center gap-2">
                <Flame size={24} className="text-flame" />
                <span className="font-display text-2xl font-semibold text-foreground">0</span>
              </span>
              <p className="text-sm text-muted-foreground">day streak</p>
              <p className="text-xs font-semibold text-primary">Start today! 🔥</p>
            </Card>

            <Card className="py-6 text-center">
              <p className="text-sm font-semibold text-foreground">Next SAT</p>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-sm font-bold text-muted-foreground">
                <CalendarDays size={14} /> No SAT set
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Add a date in Schedule</p>
            </Card>

            <Card className="py-6 text-center">
              <p className="flex items-center justify-center gap-2 text-sm font-semibold text-foreground">
                <Target size={15} className="text-primary" /> Today's Goal
              </p>
              <p className="mt-2 text-sm font-bold text-foreground">0 / 500 XP</p>
              <p className="mt-2 text-xs font-semibold text-primary">Set your daily goal</p>
            </Card>
          </div>

          <Card className="space-y-6">
            <div>
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-base font-semibold text-foreground">
                  Lessons completed
                </h3>
                <Link
                  to="/dashboard"
                  search={{ section: "Courses" }}
                  className="text-sm font-semibold text-primary"
                >
                  Browse all →
                </Link>
              </div>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-2 flex items-baseline justify-between text-xs font-semibold text-muted-foreground">
                <span>
                  {done} / {total} lessons completed
                </span>
                <span>{pct}%</span>
              </div>
            </div>

            <div className="border-t border-border pt-5">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-base font-semibold text-foreground">
                    Daily XP Progress
                  </h3>
                  <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-0 rounded-full bg-emerald" />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-muted-foreground">0 / 500 XP</p>
                </div>
                <Trophy size={38} className="shrink-0 text-primary" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-base font-semibold text-foreground">Your Progress</h3>
            <span className="text-sm font-semibold text-primary">This week</span>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:items-center">
            <div>
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <TrendingUp size={18} />
              </span>
              <p className="font-display mt-4 text-base font-semibold text-foreground">
                Keep practicing to see your progress here!
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Complete questions and lessons to build your streak and stats.
              </p>
            </div>

            <div className="flex h-40 flex-col">
              <div className="flex flex-1 items-stretch gap-2">
                <div className="flex flex-col justify-between text-[10px] font-semibold text-muted-foreground">
                  {[100, 75, 50, 25, 0].map((v) => (
                    <span key={v}>{v}</span>
                  ))}
                </div>
                <div className="relative flex flex-1 items-end justify-between border-l border-border">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="absolute inset-x-0 border-t border-border/60"
                      style={{ top: `${i * 25}%` }}
                    />
                  ))}
                  {WEEKDAYS.map((d, i) => (
                    <span key={d} className="relative flex flex-1 justify-center pb-1">
                      {i === todayIndex ? (
                        <span className="size-2 rounded-full bg-primary" />
                      ) : null}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-1 flex pl-6">
                {WEEKDAYS.map((d) => (
                  <span
                    key={d}
                    className="flex-1 text-center text-[10px] font-semibold text-muted-foreground"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-base font-semibold text-foreground">Your Activity</h3>
            <Link
              to="/dashboard"
              search={{ section: "Stats" }}
              className="text-sm font-semibold text-primary"
            >
              View all →
            </Link>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <ClipboardList size={20} />
            </span>
            <p className="font-display text-base font-semibold text-foreground">No recent activity</p>
            <p className="max-w-[16rem] text-xs text-muted-foreground">
              Start practicing to see your activity feed here.
            </p>
          </div>
        </Card>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4 py-6">
        <div className="flex items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Target size={22} />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-foreground">
              Ready to crush your goals?
            </p>
            <p className="text-sm text-muted-foreground">
              Consistency is key. Let's make today count.
            </p>
          </div>
        </div>
        <Link
          to="/dashboard"
          search={{ section: "Modules" }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"
        >
          Start Practicing <ArrowRight size={15} />
        </Link>
      </Card>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-3xl border border-border bg-card p-5 shadow-[0_20px_60px_-45px_rgba(20,40,90,0.45)] ${className}`}
    >
      {children}
    </div>
  );
}
