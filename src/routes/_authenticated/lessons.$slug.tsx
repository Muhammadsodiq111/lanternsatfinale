import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { findLesson, SUBJECT_LABELS, type LessonEntry } from "@/lib/courses";
import { LessonBody } from "@/components/lesson-body";
import { lessonContentQuery, toEmbedUrl } from "@/lib/lessons";
import { lessonProgressQuery, setLessonCompleted } from "@/lib/lesson-progress";

export const Route = createFileRoute("/_authenticated/lessons/$slug")({
  loader: ({ params }) => {
    const lesson = findLesson(params.slug);
    if (!lesson) throw notFound();
    return { lesson };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Lesson not found — LanternSAT" }, { name: "robots", content: "noindex" }],
      };
    }
    const { lesson } = loaderData;
    const title = `${lesson.title} — ${SUBJECT_LABELS[lesson.subject]} lesson | LanternSAT`;
    const description = `Free ${SUBJECT_LABELS[lesson.subject]} lesson on ${lesson.title}, part of ${lesson.group} on LanternSAT.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: LessonNotFound,
  component: LessonPage,
});

function LessonPage() {
  const { lesson } = Route.useLoaderData() as { lesson: LessonEntry };
  const { data: content } = useQuery(lessonContentQuery(lesson.slug));
  const queryClient = useQueryClient();
  const { data: progress } = useQuery(lessonProgressQuery());
  const done = !!progress?.[lesson.slug];
  const toggle = useMutation({
    mutationFn: (next: boolean) => setLessonCompleted(lesson.slug, next),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lesson-progress"] }),
  });
  const embed = content?.videoUrl ? toEmbedUrl(content.videoUrl) : null;
  const blocks = content?.blocks ?? [];

  return (
    <div className="min-h-screen bg-sky">
      <div className="mx-auto max-w-4xl px-5 py-10">
        <Link
          to="/dashboard"
          search={{ section: "Courses" }}
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} /> Back to Courses
        </Link>

        <div className="mt-6 rounded-3xl border border-border bg-card p-8 shadow-[0_20px_60px_-45px_rgba(20,40,90,0.45)]">
          <p className="text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
            {SUBJECT_LABELS[lesson.subject]} · {lesson.group}
          </p>
          <h1 className="font-display mt-2 text-3xl font-semibold text-foreground">
            {lesson.title}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Lesson {lesson.index} · Free for everyone
          </p>

          {embed ? (
            <div className="mt-8 overflow-hidden rounded-2xl border border-border">
              <iframe
                src={embed}
                title={`${lesson.title} lesson video`}
                allowFullScreen
                className="aspect-video w-full"
              />
            </div>
          ) : null}

          {blocks.length > 0 ? (
            <div className="mt-8">
              <LessonBody blocks={blocks} />
            </div>
          ) : !embed ? (
            <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center">
              <p className="text-sm text-muted-foreground">
                Lesson content coming soon — this page is ready for your material.
              </p>
            </div>
          ) : null}

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-foreground">
              <input
                type="checkbox"
                checked={done}
                disabled={toggle.isPending}
                onChange={(e) => toggle.mutate(e.target.checked)}
                className="size-5 rounded border-border accent-[var(--color-emerald)]"
              />
              I understand this topic
            </label>
            {done ? (
              <span className="rounded-full bg-emerald/15 px-3 py-1 text-xs font-bold text-emerald">
                Completed
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function LessonNotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-sky px-5 text-center">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Lesson not found</h1>
        <Link
          to="/dashboard"
          search={{ section: "Courses" }}
          className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
        >
          Back to Courses
        </Link>
      </div>
    </div>
  );
}
