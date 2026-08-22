import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronDown, ChevronRight, Clock, Eraser, X } from "lucide-react";
import { useMemo, useState } from "react";

import {
  CATEGORY_META,
  DIFFICULTY_BADGE,
  HIGHLIGHT_COLORS,
  READING_CATEGORIES,
  READING_DIFFICULTIES,
  passagesQuery,
  readingProgressQuery,
  saveReadingProgress,
  splitParagraphs,
  splitSentences,
  type Highlight,
  type Passage,
} from "@/lib/reading";

export const Route = createFileRoute("/_authenticated/reading/$slug")({
  component: ReaderPage,
  head: ({ params }) => {
    const title = params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      meta: [
        { title: `${title} — Reading — LanternSAT` },
        { name: "description", content: `Read "${title}" and highlight key ideas while you practice SAT-style reading.` },
        { property: "og:title", content: `${title} — Reading — LanternSAT` },
        { property: "og:description", content: `Read "${title}" with highlights and progress tracking.` },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: ({ error }) => (
    <div role="alert" className="p-10 text-sm text-muted-foreground">{error.message}</div>
  ),
  notFoundComponent: () => <div className="p-10 text-sm text-muted-foreground">Passage not found.</div>,
});

function ReaderPage() {
  const { slug } = Route.useParams();
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: passages = [], isLoading } = useQuery(passagesQuery());
  const { data: progress = {} } = useQuery(readingProgressQuery());

  const [difficulty, setDifficulty] = useState("any");
  const [open, setOpen] = useState<Record<string, boolean>>({ picks: true });
  const [color, setColor] = useState<string | null>(null);

  const passage = passages.find((p) => p.slug === slug);
  const current = passage ? progress[passage.id] : undefined;
  const highlights = current?.highlights ?? [];

  const list = useMemo(
    () => passages.filter((p) => difficulty === "any" || p.difficulty === difficulty),
    [passages, difficulty],
  );
  const picks = list.filter((p) => p.is_daily_pick);

  async function patch(patchData: { is_read?: boolean; highlights?: Highlight[] }) {
    if (!user?.id || !passage) return;
    const next = {
      passage_id: passage.id,
      is_read: patchData.is_read ?? current?.is_read ?? false,
      highlights: patchData.highlights ?? highlights,
      notes: current?.notes ?? null,
    };
    queryClient.setQueryData(["reading-progress"], { ...progress, [passage.id]: next });
    await saveReadingProgress(user.id, passage.id, patchData);
  }

  function toggleSentence(pi: number, si: number) {
    if (!color) return;
    const existing = highlights.find((h) => h.p === pi && h.s === si);
    let next: Highlight[];
    if (existing && existing.color === color) next = highlights.filter((h) => !(h.p === pi && h.s === si));
    else next = [...highlights.filter((h) => !(h.p === pi && h.s === si)), { p: pi, s: si, color }];
    void patch({ highlights: next });
  }

  if (isLoading) return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;
  if (!passage) {
    return (
      <div className="p-10 text-sm text-muted-foreground">
        Passage not found. <Link to="/reading" className="font-semibold text-primary">Back to library</Link>
      </div>
    );
  }

  const meta = CATEGORY_META[passage.category] ?? {
    label: passage.category,
    short: passage.category.slice(0, 3).toUpperCase(),
    className: "bg-muted text-muted-foreground",
  };
  const paragraphs = splitParagraphs(passage.body);

  return (
    <div className="min-h-screen bg-sky">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/reading" })}
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <X size={15} /> Exit
          </button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.key}
                aria-label={`Highlight ${c.key}`}
                onClick={() => setColor(color === c.key ? null : c.key)}
                className={`h-6 w-6 rounded-md ${c.swatch} ring-offset-2 transition-all ${
                  color === c.key ? "ring-2 ring-primary" : "hover:scale-110"
                }`}
              />
            ))}
            <button
              aria-label="Clear highlights"
              onClick={() => void patch({ highlights: [] })}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Eraser size={13} />
            </button>
          </div>
        </div>

        <h1 className="font-display hidden truncate text-base font-semibold text-foreground md:block">
          {passage.title}
        </h1>

        <button
          onClick={() => void patch({ is_read: !current?.is_read })}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
            current?.is_read
              ? "border-emerald bg-emerald/10 text-emerald"
              : "border-border bg-card text-foreground hover:border-primary hover:text-primary"
          }`}
        >
          <Check size={15} /> {current?.is_read ? "Read" : "Mark read"}
        </button>
      </header>

      <div className="flex">
        <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-72 shrink-0 overflow-y-auto border-r border-border bg-card px-3 py-4 lg:block">
          <div className="mb-3 flex items-center rounded-xl bg-muted p-1">
            {["any", ...READING_DIFFICULTIES].map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  difficulty === d ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <Group
            label="Today's Picks"
            count={picks.length}
            open={open["picks"] ?? true}
            onToggle={() => setOpen((o) => ({ ...o, picks: !(o["picks"] ?? true) }))}
          >
            {picks.map((p) => (
              <Row key={p.id} p={p} active={p.slug === slug} />
            ))}
          </Group>

          {READING_CATEGORIES.map((c) => {
            const items = list.filter((p) => p.category === c.value);
            if (!items.length) return null;
            return (
              <Group
                key={c.value}
                label={c.label}
                count={items.length}
                open={open[c.value] ?? false}
                onToggle={() => setOpen((o) => ({ ...o, [c.value]: !(o[c.value] ?? false) }))}
              >
                {items.map((p) => (
                  <Row key={p.id} p={p} active={p.slug === slug} />
                ))}
              </Group>
            );
          })}
        </aside>

        <main className="min-w-0 flex-1 px-4 py-8">
          <article className="mx-auto max-w-3xl rounded-2xl border border-border bg-card px-6 py-8 shadow-[0_20px_60px_-45px_rgba(20,40,90,0.45)] sm:px-10">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-[0.1em] uppercase ${meta.className}`}>
                {meta.label}
              </span>
              <span className={`rounded-md border px-2 py-0.5 font-semibold capitalize ${DIFFICULTY_BADGE[passage.difficulty] ?? "border-border text-muted-foreground"}`}>
                {passage.difficulty}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock size={12} /> {passage.read_minutes} min
              </span>
              <span className="ml-auto text-muted-foreground">
                {new Date(passage.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>

            <h2 className="font-display mt-5 text-3xl font-semibold text-foreground">{passage.title}</h2>

            <div className="mt-6 space-y-5 text-[17px] leading-8 text-foreground/90">
              {paragraphs.map((para, pi) => (
                <p key={pi}>
                  {splitSentences(para).map((sentence, si) => {
                    const h = highlights.find((x) => x.p === pi && x.s === si);
                    const mark = h ? HIGHLIGHT_COLORS.find((c) => c.key === h.color)?.mark : undefined;
                    return (
                      <span
                        key={si}
                        onClick={() => toggleSentence(pi, si)}
                        className={`rounded transition-colors ${mark ?? ""} ${color ? "cursor-pointer hover:bg-muted" : ""}`}
                      >
                        {sentence}
                      </span>
                    );
                  })}
                </p>
              ))}
            </div>

            {passage.source ? (
              <p className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">{passage.source}</p>
            ) : null}
          </article>

          <p className="mx-auto mt-4 max-w-3xl text-center text-xs text-muted-foreground">
            {color ? "Click any sentence to highlight it." : "Pick a highlighter color above to mark up the passage."}
          </p>
        </main>
      </div>
    </div>
  );
}

function Group({
  label,
  count,
  open,
  onToggle,
  children,
}: {
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-1.5 px-2 py-2 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase"
      >
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        <span className="truncate">{label}</span>
        <span className="ml-auto">{count}</span>
      </button>
      {open ? <ul className="space-y-0.5">{children}</ul> : null}
    </div>
  );
}

function Row({ p, active }: { p: Passage; active: boolean }) {
  const meta = CATEGORY_META[p.category];
  return (
    <li>
      <Link
        to="/reading/$slug"
        params={{ slug: p.slug }}
        className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-sm transition-colors ${
          active
            ? "border-amber bg-amber/10 font-semibold text-amber"
            : "border-transparent text-foreground/80 hover:bg-accent hover:text-foreground"
        }`}
      >
        <span className={`shrink-0 rounded px-1 text-[9px] font-bold tracking-wider uppercase ${meta?.className ?? "bg-muted text-muted-foreground"}`}>
          {meta?.short ?? "GEN"}
        </span>
        <span className="truncate">{p.title}</span>
      </Link>
    </li>
  );
}
