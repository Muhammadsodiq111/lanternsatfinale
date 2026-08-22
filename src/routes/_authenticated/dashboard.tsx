import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Flame, LogOut } from "lucide-react";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { ModulesSection } from "@/components/dashboard/modules";
import { CoursesSection } from "@/components/dashboard/courses";
import { StatsSection } from "@/components/dashboard/stats";
import { TrackerSection } from "@/components/dashboard/tracker";
import { ReviewSection } from "@/components/dashboard/review";
import { supabase } from "@/integrations/supabase/external";
import { clearSessionCache } from "@/lib/auth-session";
import { lessonProgressQuery } from "@/lib/lesson-progress";
import { ALL_LESSONS } from "@/lib/courses";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
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
            <StatsSection />
          ) : active === "Tracker" ? (
            <TrackerSection />
          ) : active === "Review" ? (
            <ReviewSection />
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

function HomeSections({ name }: { name?: string | undefined }) {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl font-semibold text-foreground">
        Welcome back{name ? `, ${name}` : ""} 👋
      </h2>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_20px_60px_-45px_rgba(20,40,90,0.45)]">
          <div className="flex items-center gap-3 bg-primary px-5 py-3.5 text-primary-foreground">
            <h3 className="font-display text-base font-semibold">Daily Questions</h3>
            <span className="rounded-md bg-primary-foreground/20 px-2 py-0.5 text-xs font-bold">#1</span>
            <span className="text-sm opacity-90">{today}</span>
          </div>
          <div className="space-y-4 p-5">
            {[
              { label: "Math", tint: "from-primary/15 to-primary/5" },
              { label: "Reading & Writing", tint: "from-violet/15 to-violet/5" },
            ].map((q) => (
              <div
                key={q.label}
                className={`flex min-h-40 flex-col justify-between rounded-2xl border border-border bg-gradient-to-br ${q.tint} p-5`}
              >
                <div>
                  <p className="text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                    Daily #1
                  </p>
                  <p className="font-display mt-1 text-2xl font-semibold text-foreground">{q.label}</p>
                </div>
                <p className="text-sm font-semibold text-foreground/70">Click for more</p>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-3">
            <Card className="flex flex-col items-center justify-center gap-1 py-7">
              <span className="flex items-center gap-2">
                <Flame size={26} className="text-flame" />
                <span className="font-display text-2xl font-semibold text-foreground">0</span>
              </span>
              <p className="text-sm text-muted-foreground">day streak</p>
            </Card>

            <Card className="py-6 text-center">
              <p className="text-sm font-semibold text-foreground">Next SAT</p>
              <p className="mt-2 inline-block rounded-lg bg-muted px-3 py-1.5 text-sm font-bold text-muted-foreground">
                No SAT set
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Add a date in Schedule</p>
            </Card>

            <Card className="py-6 text-center">
              <div className="flex items-center justify-between text-muted-foreground">
                <ChevronLeft size={16} />
                <span className="text-sm font-semibold text-primary">Today</span>
                <ChevronRight size={16} />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">No goals planned yet</p>
            </Card>
          </div>

          <LessonsCompletedCard />

          <Card>
            <h3 className="font-display text-lg font-semibold text-foreground">Daily XP Goal</h3>
            <div className="mt-4 h-9 w-full overflow-hidden rounded-lg bg-muted">
              <div className="h-full w-0 bg-emerald" />
            </div>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">0/500 XP</p>
          </Card>

          <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_20px_60px_-45px_rgba(20,40,90,0.45)]">
            <div className="flex items-center justify-between bg-primary px-5 py-3.5 text-primary-foreground">
              <h3 className="font-display text-base font-semibold">Your Progress</h3>
              <Link to="/vocab" className="text-sm font-semibold opacity-90 hover:opacity-100">
                Study vocab →
              </Link>
            </div>
            <p className="px-5 py-16 text-center text-sm text-muted-foreground">
              No activity yet — start practicing!
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function LessonsCompletedCard() {
  const { data: progress } = useQuery(lessonProgressQuery());
  const total = ALL_LESSONS.length;
  const done = ALL_LESSONS.filter((l) => progress?.[l.slug]).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <Card>
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-lg font-semibold text-foreground">Lessons completed</h3>
        <Link
          to="/dashboard"
          search={{ section: "Courses" }}
          className="text-sm font-semibold text-primary"
        >
          Browse →
        </Link>
      </div>
      <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-emerald" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-sm font-semibold text-muted-foreground">
        {done}/{total} lessons · {pct}%
      </p>
    </Card>
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
