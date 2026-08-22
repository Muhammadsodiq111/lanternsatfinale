import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { AdminOnly } from "@/components/admin-only";
import { supabase } from "@/integrations/supabase/external";
import { CATEGORIES, type VocabCategory } from "@/lib/vocab";

export const Route = createFileRoute("/_authenticated/vocab/manage")({
  component: () => (
    <AdminOnly>
      <ManagePage />
    </AdminOnly>
  ),
  head: () => ({
    meta: [
      { title: "Manage vocab words — LanternSAT" },
      { name: "description", content: "Add and bulk-import SAT vocabulary words into the shared LanternSAT word bank." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Manage vocab words — LanternSAT" },
      { property: "og:description", content: "Add and bulk-import SAT vocabulary words." },
    ],
  }),
});

type WordRow = {
  word: string;
  definition: string;
  example_sentence: string | null;
  part_of_speech: string;
  difficulty: string;
  category: string;
};

function ManagePage() {
  const queryClient = useQueryClient();

  const [category, setCategory] = useState<VocabCategory>("vocabulary");
  const [bulk, setBulk] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function insertRows(rows: WordRow[]) {
    setBusy(true);
    setStatus(null);
    const { error } = await supabase.from("vocab_words").upsert(rows, { onConflict: "category,word" });
    setBusy(false);
    if (error) {
      setStatus(error.message);
      return false;
    }
    await queryClient.invalidateQueries({ queryKey: ["vocab-words", category] });
    setStatus(`Saved ${rows.length} word${rows.length === 1 ? "" : "s"}.`);
    return true;
  }

  async function onSingle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const ok = await insertRows([
      {
        word: String(f.get("word") ?? "").trim(),
        definition: String(f.get("definition") ?? "").trim(),
        example_sentence: String(f.get("example") ?? "").trim() || null,
        part_of_speech: String(f.get("pos") ?? "n.").trim(),
        difficulty: String(f.get("difficulty") ?? "medium"),
        category,
      },
    ]);
    if (ok) form.reset();
  }

  async function onBulk() {
    const rows = bulk
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [word, definition, example, pos, difficulty] = line.split("|").map((p) => p.trim());
        return {
          word: word ?? "",
          definition: definition ?? "",
          example_sentence: example || null,
          part_of_speech: pos || "n.",
          difficulty: difficulty || "medium",
          category,
        };
      })
      .filter((r) => r.word);
    if (rows.length === 0) {
      setStatus("Nothing to import.");
      return;
    }
    const ok = await insertRows(rows);
    if (ok) setBulk("");
  }

  return (
    <div className="min-h-screen bg-sky px-5 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold text-foreground">Manage vocab words</h1>
          <Link to="/vocab" className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground">
            Back
          </Link>
        </div>

        <div className="flex gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                category === c.value ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {status ? (
          <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground">{status}</p>
        ) : null}

        <form onSubmit={onSingle} className="space-y-3 rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">Add one word</h2>
          <input name="word" required placeholder="Word" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          <input name="definition" required placeholder="Definition" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          <input name="example" placeholder="Example sentence (optional)" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          <div className="flex gap-3">
            <input name="pos" defaultValue="n." placeholder="Part of speech" className="w-32 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            <select name="difficulty" defaultValue="medium" className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary">
              {["easy", "medium", "hard", "challenge"].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <button disabled={busy} className="ml-auto rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
              Add word
            </button>
          </div>
        </form>

        <div className="space-y-3 rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">Bulk import</h2>
          <p className="text-sm text-muted-foreground">
            One word per line: <code>word | definition | example | part of speech | difficulty</code>
          </p>
          <textarea
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            rows={10}
            placeholder={"abate | to become less intense | The storm began to abate. | v. | hard"}
            className="w-full rounded-xl border border-border bg-background p-3 font-mono text-xs outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => void onBulk()}
            disabled={busy}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}
