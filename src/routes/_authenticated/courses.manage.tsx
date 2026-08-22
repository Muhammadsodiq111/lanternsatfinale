import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AdminOnly } from "@/components/admin-only";
import { MathKeyboard } from "@/components/practice/math-keyboard";
import { supabase } from "@/integrations/supabase/external";
import { COURSES, SUBJECT_LABELS, lessonSlug, type Subject } from "@/lib/courses";
import { LessonBody } from "@/components/lesson-body";
import {
  lessonContentQuery,
  toEmbedUrl,
  type LessonBlock,
  type LessonBlockType,
} from "@/lib/lessons";

export const Route = createFileRoute("/_authenticated/courses/manage")({
  component: () => (
    <AdminOnly>
      <ManageCoursesPage />
    </AdminOnly>
  ),
  head: () => ({
    meta: [
      { title: "Manage courses — LanternSAT" },
      {
        name: "description",
        content: "Add lesson videos and written content to the LanternSAT course library.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Manage courses — LanternSAT" },
      { property: "og:description", content: "Add lesson videos and written lesson content." },
    ],
  }),
});

const BLOCK_LABELS: Record<LessonBlockType, string> = {
  heading: "Section heading",
  text: "Paragraph",
  list: "Bullet list (one per line)",
  math: "Centered equation(s)",
};

function ManageCoursesPage() {
  const queryClient = useQueryClient();

  const [subject, setSubject] = useState<Subject>("math");
  const [slug, setSlug] = useState(() =>
    lessonSlug("math", COURSES.math[0]!.title, COURSES.math[0]!.lessons[0]!),
  );
  const [videoUrl, setVideoUrl] = useState("");
  const [blocks, setBlocks] = useState<LessonBlock[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const activeField = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const { data, isFetching } = useQuery(lessonContentQuery(slug));

  useEffect(() => {
    setVideoUrl(data?.videoUrl ?? "");
    setBlocks(data?.blocks ?? []);
  }, [data, slug]);

  function updateBlock(i: number, value: string) {
    setBlocks((prev) => prev.map((b, bi) => (bi === i ? { ...b, value } : b)));
  }

  function move(i: number, dir: -1 | 1) {
    setBlocks((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });
  }

  async function save() {
    setBusy(true);
    setStatus(null);
    const { error } = await supabase.from("lesson_content").upsert(
      {
        slug,
        video_url: videoUrl.trim(),
        blocks: blocks.filter((b) => b.value.trim()) as unknown as never,
      },
      { onConflict: "slug" },
    );
    setBusy(false);
    if (error) {
      setStatus(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["lesson-content", slug] });
    setStatus("Lesson saved.");
  }

  const embed = toEmbedUrl(videoUrl);

  return (
    <div className="min-h-screen bg-sky px-5 py-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[300px_1fr]">
        {/* Lesson picker */}
        <aside className="h-fit space-y-4 rounded-3xl border border-border bg-card p-5">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SUBJECT_LABELS) as Subject[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSubject(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  subject === s
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-foreground"
                }`}
              >
                {SUBJECT_LABELS[s]}
              </button>
            ))}
          </div>

          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            {COURSES[subject].map((group) => (
              <div key={group.title} className="space-y-1">
                <p className="text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                  {group.title}
                </p>
                {group.lessons.map((lesson, i) => {
                  const s = lessonSlug(subject, group.title, lesson);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSlug(s)}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold ${
                        slug === s
                          ? "border border-primary bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted/60"
                      }`}
                    >
                      <span className="text-xs text-muted-foreground">{i + 1}</span>
                      <span className="min-w-0 truncate">{lesson}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>

        {/* Editor */}
        <main className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-2xl font-semibold text-foreground">Manage courses</h1>
            <div className="flex gap-2">
              <Link
                to="/lessons/$slug"
                params={{ slug }}
                className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground"
              >
                View lesson
              </Link>
              <button
                type="button"
                onClick={() => void save()}
                disabled={busy}
                className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save lesson"}
              </button>
            </div>
          </div>

          {status ? (
            <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground">
              {status}
            </p>
          ) : null}

          <section className="space-y-3 rounded-3xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold text-foreground">Lesson video</h2>
            <p className="text-xs text-muted-foreground">
              Paste a YouTube or Vimeo link {isFetching ? "· loading…" : ""}
            </p>
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://vimeo.com/123456789"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            {embed ? (
              <div className="overflow-hidden rounded-2xl border border-border">
                <iframe
                  src={embed}
                  title="Lesson video preview"
                  allowFullScreen
                  className="aspect-video w-full"
                />
              </div>
            ) : null}
          </section>

          <section className="space-y-4 rounded-3xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold text-foreground">Lesson content</h2>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(BLOCK_LABELS) as LessonBlockType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setBlocks((prev) => [...prev, { type: t, value: "" }])}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:border-primary"
                  >
                    + {BLOCK_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {blocks.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No content yet — add a heading or paragraph above.
              </p>
            ) : null}

            {blocks.map((block, i) => (
              <div key={i} className="space-y-2 rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                    {BLOCK_LABELS[block.type]}
                  </span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => move(i, -1)} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground">
                      <ArrowUp size={15} />
                    </button>
                    <button type="button" onClick={() => move(i, 1)} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground">
                      <ArrowDown size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setBlocks((prev) => prev.filter((_, bi) => bi !== i))}
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <textarea
                  value={block.value}
                  onChange={(e) => updateBlock(i, e.target.value)}
                  onFocus={(e) => {
                    activeField.current = e.currentTarget;
                    setActiveIdx(i);
                  }}
                  rows={block.type === "heading" ? 1 : 4}
                  placeholder={
                    block.type === "math"
                      ? "x^2 + 5x + 6 = 0"
                      : block.type === "list"
                        ? "One bullet per line"
                        : "Use **bold**, *italic* and $x^2$ for math"
                  }
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
                />
              </div>
            ))}

            <MathKeyboard
              getTarget={() => activeField.current}
              value={activeIdx === null ? "" : (blocks[activeIdx]?.value ?? "")}
              onChange={(next) => {
                if (activeIdx !== null) updateBlock(activeIdx, next);
              }}
              label={
                activeIdx === null
                  ? "click a field first"
                  : BLOCK_LABELS[blocks[activeIdx]?.type ?? "text"]
              }
            />
          </section>

          <section className="space-y-3 rounded-3xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold text-foreground">Live preview</h2>
            <LessonBody blocks={blocks} />
          </section>
        </main>
      </div>
    </div>
  );
}
