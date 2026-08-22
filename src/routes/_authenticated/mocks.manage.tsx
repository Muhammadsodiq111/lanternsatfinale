import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { AdminOnly } from "@/components/admin-only";
import { supabase } from "@/integrations/supabase/external";
import { mockCountsQuery, mockExamsQuery, mockQuestionsQuery } from "@/lib/mocks";

export const Route = createFileRoute("/_authenticated/mocks/manage")({
  component: () => (
    <AdminOnly>
      <ManageMocks />
    </AdminOnly>
  ),
  head: () => ({
    meta: [
      { title: "Manage mock exams — LanternSAT" },
      { name: "description", content: "Create mock exams, add or delete questions, and remove old mocks." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Manage mock exams — LanternSAT" },
      { property: "og:description", content: "Create mock exams and manage their questions." },
    ],
  }),
});

const EMPTY = { passage: "", prompt: "", choices: ["", "", "", ""], answer: 0 };

function ManageMocks() {
  const queryClient = useQueryClient();
  const { data: exams = [] } = useQuery(mockExamsQuery());
  const { data: counts = {} } = useQuery(mockCountsQuery());

  const [selected, setSelected] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [q, setQ] = useState(EMPTY);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!selected && exams.length > 0) setSelected(exams[0]!.id);
    if (selected && !exams.some((e) => e.id === selected)) setSelected(exams[0]?.id ?? null);
  }, [exams, selected]);

  const { data: questions = [] } = useQuery({
    ...mockQuestionsQuery(selected ?? ""),
    enabled: Boolean(selected),
  });

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["mock-exams"] }),
      queryClient.invalidateQueries({ queryKey: ["mock-question-counts"] }),
      queryClient.invalidateQueries({ queryKey: ["mock-questions"] }),
    ]);
  }

  async function createExam(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setStatus("Give the mock a title.");
      return;
    }
    setBusy(true);
    setStatus(null);
    const { data, error } = await supabase
      .from("mock_exams")
      .insert({
        title: title.trim(),
        description: description.trim(),
        sort_index: exams.length,
      })
      .select("id")
      .single();
    setBusy(false);
    if (error) {
      setStatus(error.message);
      return;
    }
    setTitle("");
    setDescription("");
    await refresh();
    if (data?.id) setSelected(data.id);
    setStatus("Mock created.");
  }

  async function deleteExam(id: string, name: string) {
    if (!confirm(`Delete "${name}" and all of its questions?`)) return;
    const { error } = await supabase.from("mock_exams").delete().eq("id", id);
    if (error) {
      setStatus(error.message);
      return;
    }
    await refresh();
    setStatus("Mock deleted.");
  }

  async function addQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const choices = q.choices.map((c) => c.trim()).filter(Boolean);
    if (!q.prompt.trim() || choices.length < 2) {
      setStatus("A question needs a prompt and at least two choices.");
      return;
    }
    setBusy(true);
    setStatus(null);
    const { error } = await supabase.from("mock_questions").insert({
      exam_id: selected,
      passage: q.passage.trim(),
      prompt: q.prompt.trim(),
      choices,
      answer: Math.min(q.answer, choices.length - 1),
      sort_index: questions.length,
    });
    setBusy(false);
    if (error) {
      setStatus(error.message);
      return;
    }
    setQ(EMPTY);
    await refresh();
    setStatus("Question added.");
  }

  async function deleteQuestion(id: string) {
    const { error } = await supabase.from("mock_questions").delete().eq("id", id);
    if (error) {
      setStatus(error.message);
      return;
    }
    await refresh();
  }

  const current = exams.find((e) => e.id === selected);

  return (
    <div className="min-h-screen bg-sky px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <Link to="/mocks" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft size={15} /> Back to mocks
        </Link>
        <h1 className="font-display mt-3 text-2xl font-semibold text-foreground">Manage mock exams</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create mocks, add questions, and delete anything you no longer need. A mock only appears to students once it exists here.
        </p>

        {status ? (
          <p className="mt-4 rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground">{status}</p>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-5">
            <form onSubmit={createExam} className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-display text-lg font-semibold text-foreground">New mock</h2>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Lantern Mock 1"
                className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description (optional)"
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
              <button
                type="submit"
                disabled={busy}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                <Plus size={15} /> Create mock
              </button>
            </form>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-display text-lg font-semibold text-foreground">All mocks</h2>
              {exams.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No mocks yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {exams.map((m) => (
                    <li key={m.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelected(m.id)}
                        className={`min-w-0 flex-1 rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                          selected === m.id ? "border-primary bg-primary/5 font-semibold" : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="block truncate text-foreground">{m.title}</span>
                        <span className="block text-xs text-muted-foreground">
                          {counts[m.id] ?? 0} question{(counts[m.id] ?? 0) === 1 ? "" : "s"}
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${m.title}`}
                        onClick={() => deleteExam(m.id, m.title)}
                        className="rounded-xl border border-border p-2 text-muted-foreground hover:border-flame/50 hover:text-flame"
                      >
                        <Trash2 size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-5">
            {!current ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                Create a mock to start adding questions.
              </div>
            ) : (
              <>
                <form onSubmit={addQuestion} className="rounded-2xl border border-border bg-card p-5">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Add question to {current.title}
                  </h2>
                  <textarea
                    value={q.passage}
                    onChange={(e) => setQ({ ...q, passage: e.target.value })}
                    rows={5}
                    placeholder="Passage / stimulus (optional)"
                    className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                  <textarea
                    value={q.prompt}
                    onChange={(e) => setQ({ ...q, prompt: e.target.value })}
                    rows={2}
                    placeholder="Question prompt"
                    className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                  <div className="mt-3 space-y-2">
                    {q.choices.map((choice, ci) => (
                      <div key={ci} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQ({ ...q, answer: ci })}
                          aria-label={`Mark choice ${String.fromCharCode(65 + ci)} correct`}
                          className={`h-8 w-8 shrink-0 rounded-lg border text-xs font-bold ${
                            q.answer === ci
                              ? "border-emerald bg-emerald text-primary-foreground"
                              : "border-border text-muted-foreground"
                          }`}
                        >
                          {String.fromCharCode(65 + ci)}
                        </button>
                        <input
                          value={choice}
                          onChange={(e) => {
                            const next = [...q.choices];
                            next[ci] = e.target.value;
                            setQ({ ...q, choices: next });
                          }}
                          placeholder={`Choice ${String.fromCharCode(65 + ci)}`}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Click a letter to mark the correct answer. Leave a choice blank to skip it.
                  </p>
                  <button
                    type="submit"
                    disabled={busy}
                    className="mt-3 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    Add question
                  </button>
                </form>

                <div className="rounded-2xl border border-border bg-card p-5">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Questions ({questions.length})
                  </h2>
                  {questions.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">No questions in this mock yet.</p>
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {questions.map((item, qi) => (
                        <li key={item.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
                          <span className="rounded-md bg-foreground px-2 py-0.5 text-xs font-bold text-card">Q{qi + 1}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">{item.prompt}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Answer: {String.fromCharCode(65 + item.answer)} — {item.choices[item.answer] ?? "—"}
                            </p>
                          </div>
                          <button
                            type="button"
                            aria-label={`Delete question ${qi + 1}`}
                            onClick={() => deleteQuestion(item.id)}
                            className="rounded-xl border border-border p-2 text-muted-foreground hover:border-flame/50 hover:text-flame"
                          >
                            <Trash2 size={15} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
