import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useState } from "react";

import { AdminOnly } from "@/components/admin-only";
import { supabase } from "@/integrations/supabase/external";
import {
  READING_CATEGORIES,
  READING_DIFFICULTIES,
  estimateMinutes,
  passagesQuery,
  slugify,
} from "@/lib/reading";

export const Route = createFileRoute("/_authenticated/reading/manage")({
  component: () => (
    <AdminOnly>
      <ManageReading />
    </AdminOnly>
  ),
  head: () => ({
    meta: [
      { title: "Add reading passages — LanternSAT" },
      { name: "description", content: "Add your own SAT reading passages to the free LanternSAT reading library." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Add reading passages — LanternSAT" },
      { property: "og:description", content: "Add your own SAT reading passages." },
    ],
  }),
});

function ManageReading() {
  const queryClient = useQueryClient();
  const { data: passages = [] } = useQuery(passagesQuery());

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("literature");
  const [difficulty, setDifficulty] = useState("medium");
  const [daily, setDaily] = useState(false);
  const [source, setSource] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["reading-passages"] });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setStatus("Title and passage text are required.");
      return;
    }
    setBusy(true);
    setStatus(null);
    const { error } = await supabase.from("reading_passages").upsert(
      {
        slug: slugify(title),
        title: title.trim(),
        category,
        difficulty,
        read_minutes: estimateMinutes(body),
        body: body.trim(),
        source: source.trim() || null,
        is_daily_pick: daily,
        sort_index: passages.length + 1,
      },
      { onConflict: "slug" },
    );
    setBusy(false);
    if (error) {
      setStatus(error.message);
      return;
    }
    setStatus(`Saved "${title.trim()}".`);
    setTitle("");
    setBody("");
    setSource("");
    setDaily(false);
    await refresh();
  }

  async function onDelete(id: string) {
    const { error } = await supabase.from("reading_passages").delete().eq("id", id);
    if (error) {
      setStatus(error.message);
      return;
    }
    await refresh();
  }

  const input =
    "w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary";

  return (
    <div className="min-h-screen bg-sky px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Link to="/reading" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
          <ArrowLeft size={15} /> Back to library
        </Link>

        <h1 className="font-display text-2xl font-semibold text-foreground">Add a reading passage</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste any passage. Separate paragraphs with a blank line — read time is calculated automatically.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase">Title</label>
              <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The Erie Canal" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase">Source (optional)</label>
              <input className={input} value={source} onChange={(e) => setSource(e.target.value)} placeholder="Public domain" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase">Category</label>
              <select className={input} value={category} onChange={(e) => setCategory(e.target.value)}>
                {READING_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase">Difficulty</label>
              <select className={input} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                {READING_DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase">Passage text</label>
            <textarea
              className={`${input} min-h-64 leading-7`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={"First paragraph...\n\nSecond paragraph..."}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Estimated read time: {body.trim() ? estimateMinutes(body) : 0} min
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <input type="checkbox" checked={daily} onChange={(e) => setDaily(e.target.checked)} className="h-4 w-4 accent-[oklch(0.632_0.194_259.3)]" />
            Feature in Today's Picks
          </label>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save passage"}
            </button>
            {status ? <span className="text-sm text-muted-foreground">{status}</span> : null}
          </div>
        </form>

        <h2 className="font-display mt-8 mb-3 text-lg font-semibold text-foreground">
          Existing passages <span className="text-sm text-muted-foreground">({passages.length})</span>
        </h2>
        <ul className="space-y-2">
          {passages.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <Link to="/reading/$slug" params={{ slug: p.slug }} className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground hover:text-primary">
                {p.title}
              </Link>
              <span className="text-xs text-muted-foreground capitalize">{p.category} · {p.difficulty} · {p.read_minutes} min</span>
              <button
                onClick={() => void onDelete(p.id)}
                aria-label={`Delete ${p.title}`}
                className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
