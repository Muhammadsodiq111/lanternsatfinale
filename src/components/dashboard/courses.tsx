import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { lessonProgressQuery } from "@/lib/lesson-progress";

import { COURSES, SUBJECT_LABELS, lessonSlug, type Subject } from "@/lib/courses";

const SUBJECT_ACCENT: Record<Subject, { pill: string; badge: string }> = {
  math: { pill: "bg-primary text-primary-foreground", badge: "bg-primary/10 text-primary" },
  english: { pill: "bg-amber text-primary-foreground", badge: "bg-amber/15 text-amber" },
  reading: { pill: "bg-violet text-primary-foreground", badge: "bg-violet/15 text-violet" },
  desmos: { pill: "bg-emerald text-primary-foreground", badge: "bg-emerald/15 text-emerald" },
};

export function CoursesSection() {
  const [subject, setSubject] = useState<Subject>("math");
  const groups = COURSES[subject];
  const { data: progress } = useQuery(lessonProgressQuery());
  const accent = SUBJECT_ACCENT[subject];

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/courses/manage"
          className="order-last ml-auto rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:border-primary"
        >
          Manage lessons
        </Link>
        {(Object.keys(SUBJECT_LABELS) as Subject[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSubject(s)}
            className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-colors ${
              subject === s
                ? SUBJECT_ACCENT[s].pill
                : "border border-border bg-card text-foreground"
            }`}
          >
            {SUBJECT_LABELS[s]}
          </button>
        ))}
      </div>

      {groups.map((group) => {
        const completedInGroup = group.lessons.filter(
          (lesson) => progress?.[lessonSlug(subject, group.title, lesson)],
        ).length;
        return (
        <section key={group.title} className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-lg font-semibold text-foreground">{group.title}</h3>
            <p className="text-xs font-semibold text-muted-foreground">
              {completedInGroup}/{group.lessons.length} completed
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {group.lessons.map((lesson, i) => {
              const slug = lessonSlug(subject, group.title, lesson);
              const isDone = !!progress?.[slug];
              return (
              <Link
                key={lesson}
                to="/lessons/$slug"
                params={{ slug }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4 text-left transition-colors hover:border-primary"
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                    isDone ? "bg-emerald/15 text-emerald" : accent.badge
                  }`}
                >
                  {isDone ? <Check size={14} /> : i + 1}
                </span>
                <span className="min-w-0 text-sm font-semibold text-foreground">{lesson}</span>
                {isDone ? (
                  <span className="ml-auto text-xs font-bold text-emerald">Done</span>
                ) : null}
              </Link>
              );
            })}
          </div>
        </section>
        );
      })}
    </div>
  );
}
