import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Trash2, Upload, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { DesmosEditor } from "@/components/practice/desmos-calculator";
import { MathKeyboard } from "@/components/practice/math-keyboard";
import { MathExplanation } from "@/components/practice/math-text";
import { AdminOnly } from "@/components/admin-only";
import { supabase } from "@/integrations/supabase/external";
import { formatDesmosSteps } from "@/lib/desmos-format";
import { DESMOS_STARTERS, desmosStarterState } from "@/lib/desmos-starters";
import { DIFFICULTY_LEVELS, practiceQuestionsQuery } from "@/lib/practice";
import { topicsForSubject } from "@/lib/module-catalog";
import { CSV_TEMPLATE, parseQuestionImport } from "@/lib/question-import";

export const Route = createFileRoute("/_authenticated/practice/manage")({
  component: () => (
    <AdminOnly>
      <ManageQuestions />
    </AdminOnly>
  ),
  head: () => ({
    meta: [
      { title: "Manage practice questions — LanternSAT" },
      {
        name: "description",
        content:
          "Add, edit, and bulk import SAT module questions with answer choices, traditional solutions, and Desmos solutions.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Manage practice questions — LanternSAT" },
      { property: "og:description", content: "Add, edit, and bulk import SAT questions, answers, and solutions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary";

const CUSTOM = "__custom__";

function ManageQuestions() {
  const queryClient = useQueryClient();
  const { data: questions = [] } = useQuery(practiceQuestionsQuery(""));

  const [subject, setSubject] = useState("math");
  const [topic, setTopic] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");
  const [subtopic, setSubtopic] = useState("");
  const [customModule, setCustomModule] = useState(false);
  const [customSubtopic, setCustomSubtopic] = useState(false);
  const [level, setLevel] = useState<string>("medium");
  const [prompt, setPrompt] = useState("");
  const [questionType, setQuestionType] = useState<"mcq" | "free">("mcq");
  const [answerText, setAnswerText] = useState("");
  const [choices, setChoices] = useState(["", "", "", ""]);
  const [answer, setAnswer] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [desmos, setDesmos] = useState("");
  const [desmosState, setDesmosState] = useState<unknown>(null);
  const [desmosNote, setDesmosNote] = useState("");
  const [sortIndex, setSortIndex] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [desmosSeed, setDesmosSeed] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const explanationRef = useRef<HTMLTextAreaElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const answerTextRef = useRef<HTMLInputElement>(null);
  const choiceRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [active, setActive] = useState("prompt");

  const activeField = useMemo(() => {
    const choiceIndex = active.startsWith("choice") ? Number(active.slice(6)) : -1;
    if (choiceIndex >= 0) {
      return {
        label: `Choice ${"ABCD"[choiceIndex]}`,
        get: () => choiceRefs.current[choiceIndex] ?? null,
        value: choices[choiceIndex] ?? "",
        onChange: (next: string) =>
          setChoices((c) => c.map((v, j) => (j === choiceIndex ? next : v))),
      };
    }
    if (active === "answerText")
      return {
        label: "Accepted answer",
        get: () => answerTextRef.current,
        value: answerText,
        onChange: setAnswerText,
      };
    if (active === "prompt")
      return { label: "Question", get: () => promptRef.current, value: prompt, onChange: setPrompt };
    return {
      label: "Traditional solution",
      get: () => explanationRef.current,
      value: explanation,
      onChange: setExplanation,
    };
  }, [active, choices, answerText, prompt, explanation]);


  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const topics = useMemo(() => topicsForSubject(subject), [subject]);
  const currentTopic = topics.find((t) => t.title === topic);
  const modules = currentTopic?.modules ?? [];
  const subtopics = modules.find((m) => m.title === moduleTitle)?.subtopics ?? [];

  const desmosPreviewLines = useMemo(
    () =>
      desmos
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    [desmos],
  );
  const desmosEntries = useMemo(() => formatDesmosSteps(desmosPreviewLines), [desmosPreviewLines]);



  function lines(value: string) {
    return value
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  }

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["practice-questions"] });
  }

  function resetForm() {
    setEditingId(null);
    setPrompt("");
    setQuestionType("mcq");
    setAnswerText("");
    setChoices(["", "", "", ""]);
    setAnswer(0);
    setExplanation("");
    setDesmos("");
    setDesmosState(null);
    setDesmosNote("");
    setSortIndex(0);
    setDesmosSeed((n) => n + 1);
  }


  function onSubjectChange(value: string) {
    setSubject(value);
    setTopic("");
    setModuleTitle("");
    setSubtopic("");
    setCustomModule(false);
    setCustomSubtopic(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanChoices = choices.map((c) => c.trim()).filter(Boolean);
    if (!moduleTitle.trim() || !prompt.trim()) {
      setStatus("Module and question text are required.");
      return;
    }
    if (questionType === "mcq") {
      if (cleanChoices.length < 2) {
        setStatus("Multiple-choice questions need at least two answer choices.");
        return;
      }
      if (answer >= cleanChoices.length) {
        setStatus("The correct answer must be one of the filled-in choices.");
        return;
      }
    } else if (!answerText.trim()) {
      setStatus("Enter at least one accepted answer for a student-produced response.");
      return;
    }
    setBusy(true);
    setStatus(null);
    const payload = {
      subject,
      module: moduleTitle.trim(),
      subtopic: subtopic.trim(),
      level,
      prompt: prompt.trim(),
      question_type: questionType,
      answer_text: questionType === "free" ? answerText.trim() : "",
      choices: questionType === "mcq" ? cleanChoices : [],
      answer: questionType === "mcq" ? answer : 0,
      explanation: lines(explanation),
      desmos: lines(desmos),
      desmos_state: (desmosState ?? null) as never,
      desmos_note: desmosNote.trim(),
      sort_index: sortIndex,
    };
    const { error } = editingId
      ? await supabase.from("practice_questions").update(payload).eq("id", editingId)
      : await supabase.from("practice_questions").insert(payload);
    setBusy(false);
    if (error) {
      setStatus(error.message);
      return;
    }
    setStatus(editingId ? "Question updated." : "Question saved.");
    resetForm();
    await refresh();
  }

  function onEdit(q: (typeof questions)[number]) {
    setEditingId(q.id);
    setSubject(q.subject);
    const found = topicsForSubject(q.subject).find((t) => t.modules.some((m) => m.title === q.module));
    setTopic(found?.title ?? "");
    setModuleTitle(q.module);
    setCustomModule(!found);
    const known = found?.modules.find((m) => m.title === q.module)?.subtopics ?? [];
    setCustomSubtopic(!!q.subtopic && !known.includes(q.subtopic));
    setSubtopic(q.subtopic);
    setLevel(q.level);
    setPrompt(q.prompt);
    setQuestionType(q.question_type === "free" ? "free" : "mcq");
    setAnswerText(q.answer_text ?? "");
    setChoices([0, 1, 2, 3].map((i) => q.choices[i] ?? ""));
    setAnswer(q.answer);
    setExplanation(q.explanation.join("\n"));
    setDesmos(q.desmos.join("\n"));
    setDesmosState(q.desmos_state ?? null);
    setDesmosSeed((n) => n + 1);
    setDesmosNote(q.desmos_note);
    setSortIndex(q.sort_index);
    setStatus(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }


  async function onDelete(id: string) {
    const { error } = await supabase.from("practice_questions").delete().eq("id", id);
    if (error) {
      setStatus(error.message);
      return;
    }
    if (editingId === id) resetForm();
    await refresh();
  }

  async function onImport() {
    const { questions: parsed, errors } = parseQuestionImport(importText, subject);
    setImportErrors(errors);
    if (parsed.length === 0) {
      setStatus("No valid questions found in the import.");
      return;
    }
    const missingModule = parsed.filter((q) => !q.module);
    if (missingModule.length > 0) {
      setStatus(`${missingModule.length} row(s) are missing a module title.`);
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("practice_questions").insert(parsed);
    setBusy(false);
    if (error) {
      setStatus(error.message);
      return;
    }
    setStatus(`Imported ${parsed.length} question${parsed.length === 1 ? "" : "s"}.`);
    setImportText("");
    setImportOpen(false);
    await refresh();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportText(await file.text());
    e.target.value = "";
  }

  return (
    <div className="bg-sky min-h-screen px-5 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/dashboard"
            search={{ section: "Modules" }}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-semibold"
          >
            <ArrowLeft size={16} /> Back to Modules
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setImportOpen((v) => !v)}
              className="border-border bg-card text-foreground inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold"
            >
              <Upload size={14} /> Bulk import
            </button>
            <span className="border-border bg-card text-muted-foreground rounded-xl border px-4 py-2 text-xs font-bold tracking-[0.12em] uppercase">
              {questions.length} questions
            </span>
          </div>
        </div>

        <h1 className="font-display text-foreground text-2xl font-semibold">Question manager</h1>

        {status ? (
          <p className="border-border bg-card text-foreground rounded-xl border px-4 py-3 text-sm">{status}</p>
        ) : null}

        {importOpen ? (
          <section className="border-border bg-card space-y-3 rounded-3xl border p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-foreground text-lg font-semibold">Bulk import (CSV or JSON)</h2>
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                aria-label="Close import"
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-muted-foreground text-xs">
              CSV header: subject, module, subtopic, level, prompt, choiceA–D, answer (letter or 1–4), explanation,
              desmos, desmos_note, sort_index. Use <code>|</code> to separate multiple solution steps or Desmos lines.
              JSON accepts an array of objects with the same keys (choices/explanation/desmos may be arrays).
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <input type="file" accept=".csv,.json,text/csv,application/json" onChange={onFile} className="text-xs" />
              <button
                type="button"
                onClick={() => setImportText(CSV_TEMPLATE)}
                className="border-border text-foreground rounded-lg border px-3 py-1.5 text-xs font-semibold"
              >
                Load CSV template
              </button>
            </div>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={10}
              placeholder="Paste CSV or JSON here…"
              className={`${inputClass} font-mono text-xs`}
            />
            {importErrors.length > 0 ? (
              <ul className="text-flame space-y-1 text-xs">
                {importErrors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={() => void onImport()}
              className="bg-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60"
            >
              Import questions
            </button>
          </section>
        ) : null}

        <form onSubmit={onSubmit} className="border-border bg-card space-y-5 rounded-3xl border p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-foreground text-lg font-semibold">
              {editingId ? "Edit question" : "Add question"}
            </h2>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="text-muted-foreground hover:text-foreground text-xs font-bold"
              >
                Cancel edit
              </button>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-foreground space-y-1.5 text-sm font-semibold">
              Subject
              <select value={subject} onChange={(e) => onSubjectChange(e.target.value)} className={inputClass}>
                <option value="math">Math</option>
                <option value="english">English (Reading &amp; Writing)</option>
              </select>
            </label>
            <label className="text-foreground space-y-1.5 text-sm font-semibold">
              Difficulty
              <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputClass}>
                {DIFFICULTY_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-foreground space-y-1.5 text-sm font-semibold">
              Topic
              <select
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  setModuleTitle("");
                  setSubtopic("");
                  setCustomModule(false);
                  setCustomSubtopic(false);
                }}
                className={inputClass}
              >
                <option value="">Select a topic…</option>
                {topics.map((t) => (
                  <option key={t.title} value={t.title}>
                    {t.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-foreground space-y-1.5 text-sm font-semibold">
              Module
              <select
                value={customModule ? CUSTOM : moduleTitle}
                onChange={(e) => {
                  if (e.target.value === CUSTOM) {
                    setCustomModule(true);
                    setModuleTitle("");
                  } else {
                    setCustomModule(false);
                    setModuleTitle(e.target.value);
                  }
                  setSubtopic("");
                  setCustomSubtopic(false);
                }}
                disabled={!topic && !customModule}
                className={inputClass}
              >
                <option value="">{topic ? "Select a module…" : "Pick a topic first"}</option>
                {modules.map((m) => (
                  <option key={m.title} value={m.title}>
                    {m.title}
                  </option>
                ))}
                <option value={CUSTOM}>Other (type my own)…</option>
              </select>
              {customModule ? (
                <input
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  placeholder="Module title (must match the card title)"
                  className={`${inputClass} mt-2`}
                />
              ) : null}
            </label>
            <label className="text-foreground space-y-1.5 text-sm font-semibold sm:col-span-2">
              Subtopic
              <select
                value={customSubtopic ? CUSTOM : subtopic}
                onChange={(e) => {
                  if (e.target.value === CUSTOM) {
                    setCustomSubtopic(true);
                    setSubtopic("");
                  } else {
                    setCustomSubtopic(false);
                    setSubtopic(e.target.value);
                  }
                }}
                disabled={!moduleTitle && !customSubtopic}
                className={inputClass}
              >
                <option value="">{moduleTitle ? "Select a subtopic…" : "Pick a module first"}</option>
                {subtopics.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                <option value={CUSTOM}>Other (type my own)…</option>
              </select>
              {customSubtopic ? (
                <input
                  value={subtopic}
                  onChange={(e) => setSubtopic(e.target.value)}
                  placeholder="Subtopic name"
                  className={`${inputClass} mt-2`}
                />
              ) : null}
            </label>
          </div>

          <div className="border-border bg-background/60 flex flex-wrap items-center gap-2 rounded-2xl border p-3">
            <span className="text-muted-foreground text-[11px] font-bold tracking-[0.12em] uppercase">
              Answer format
            </span>
            {(
              [
                { id: "mcq" as const, label: "Multiple choice" },
                { id: "free" as const, label: "Student-produced response" },
              ]
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setQuestionType(t.id)}
                className={`rounded-xl border px-4 py-2 text-xs font-bold transition-colors ${
                  questionType === t.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <label className="text-foreground block space-y-1.5 text-sm font-semibold">
            Question
            <textarea
              ref={promptRef}
              value={prompt}
              onFocus={() => setActive("prompt")}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="If 4x + 9 = 33, what is the value of x + 2?"
              className={inputClass}
            />
          </label>

          {questionType === "mcq" ? (
            <fieldset className="space-y-2">
              <legend className="text-foreground text-sm font-semibold">Answer choices (pick the correct one)</legend>
              {choices.map((choice, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="answer"
                    checked={answer === i}
                    onChange={() => setAnswer(i)}
                    aria-label={`Choice ${"ABCD"[i]} is correct`}
                    className="accent-emerald h-4 w-4"
                  />
                  <span className="text-muted-foreground w-5 text-xs font-bold">{"ABCD"[i]}</span>
                  <input
                    ref={(el) => {
                      choiceRefs.current[i] = el;
                    }}
                    value={choice}
                    onFocus={() => setActive(`choice${i}`)}
                    onChange={(e) => setChoices((c) => c.map((v, j) => (j === i ? e.target.value : v)))}
                    placeholder={`Choice ${"ABCD"[i]}`}
                    className={inputClass}
                  />
                </div>
              ))}
            </fieldset>
          ) : (
            <label className="text-foreground block space-y-1.5 text-sm font-semibold">
              Accepted answer(s) — separate alternatives with a comma
              <input
                ref={answerTextRef}
                value={answerText}
                onFocus={() => setActive("answerText")}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="6, 6.0"
                className={inputClass}
              />
              <span className="text-muted-foreground block text-xs font-normal">
                Students type their answer like on the real SAT; spaces and capitalisation are ignored.
              </span>
            </label>
          )}

          <div className="space-y-2">
            <label className="text-foreground block space-y-1.5 text-sm font-semibold">
              Traditional solution (one step per line)
              <textarea
                ref={explanationRef}
                value={explanation}
                onFocus={() => setActive("explanation")}
                onChange={(e) => setExplanation(e.target.value)}
                rows={5}
                placeholder={"Subtract 9 from both sides:\n4x = 24\nDivide by 4:\nx = 6"}
                className={`${inputClass} font-mono text-xs`}
              />
            </label>
            <MathKeyboard
              getTarget={activeField.get}
              value={activeField.value}
              onChange={activeField.onChange}
              label={activeField.label}
            />
            <div className="border-border bg-card rounded-2xl border p-4">
              <p className="text-muted-foreground mb-2 text-[11px] font-bold tracking-[0.12em] uppercase">
                Live preview
              </p>
              <MathExplanation lines={explanation.split("\n").filter((l) => l.trim())} />
            </div>
          </div>



          <div className="border-border bg-background/60 space-y-3 rounded-2xl border p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-foreground text-sm font-semibold">Desmos solution — type it right here</h3>
              <span className="text-muted-foreground text-xs">
                {desmosEntries.length} entr{desmosEntries.length === 1 ? "y" : "ies"}
              </span>
            </div>
            <p className="text-muted-foreground text-xs">
              Use the calculator exactly like a student would — powers, subscripts, fractions and square roots all
              work. Tables and regressions are saved too, so a curve fit survives a reload.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-[11px] font-bold tracking-[0.12em] uppercase">
                Starter
              </span>
              {DESMOS_STARTERS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  title={s.note}
                  onClick={() => {
                    setDesmosState(desmosStarterState(s.id));
                    setDesmos("");
                    setDesmosSeed((n) => n + 1);
                  }}
                  className="border-border bg-card text-muted-foreground hover:text-foreground rounded-xl border px-3 py-1.5 text-xs font-bold"
                >
                  {s.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setDesmosState(null);
                  setDesmos("");
                  setDesmosSeed((n) => n + 1);
                }}
                className="text-muted-foreground hover:text-flame text-xs font-bold"
              >
                Clear graph
              </button>
            </div>
            <div className="border-border h-[420px] overflow-hidden rounded-xl border">
              <DesmosEditor
                seedKey={`${editingId ?? "new"}-${desmosSeed}`}
                value={desmosPreviewLines}
                onChange={(next) => setDesmos(next.join("\n"))}
                initialState={desmosState}
                onStateChange={setDesmosState}
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-[11px] font-bold tracking-[0.12em] uppercase">Stored as</p>
              {desmosPreviewLines.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  {desmosState ? "Graph state saved (table / regression)." : "Nothing entered yet."}
                </p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {desmosPreviewLines.map((line, i) => (
                    <li
                      key={`${line}-${i}`}
                      className="border-emerald text-emerald rounded-lg border px-2.5 py-1 font-mono text-[11px]"
                    >
                      {line}
                    </li>
                  ))}

                </ul>
              )}
            </div>
          </div>


          <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
            <label className="text-foreground space-y-1.5 text-sm font-semibold">
              Desmos note
              <input
                value={desmosNote}
                onChange={(e) => setDesmosNote(e.target.value)}
                placeholder="Desmos regression solves for x_1 instantly here."
                className={inputClass}
              />
            </label>
            <label className="text-foreground space-y-1.5 text-sm font-semibold">
              Order
              <input
                type="number"
                value={sortIndex}
                onChange={(e) => setSortIndex(Number(e.target.value) || 0)}
                className={inputClass}
              />
            </label>
          </div>

          <button
            disabled={busy}
            className="bg-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60"
          >
            {editingId ? "Update question" : "Save question"}
          </button>
        </form>

        <section className="border-border bg-card space-y-3 rounded-3xl border p-6">
          <h2 className="font-display text-foreground text-lg font-semibold">Existing questions</h2>
          {questions.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No questions yet — modules stay blank until you add real questions here.
            </p>
          ) : (
            <ul className="divide-border divide-y">
              {questions.map((q) => (
                <li key={q.id} className="flex items-start gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-sm">{q.prompt}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {q.module}
                      {q.subtopic ? ` · ${q.subtopic}` : ""} · {q.level} · {q.choices.length} choices
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Edit question"
                    onClick={() => onEdit(q)}
                    className="border-border text-muted-foreground hover:text-primary rounded-lg border p-2"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete question"
                    onClick={() => void onDelete(q.id)}
                    className="border-border text-muted-foreground hover:text-flame rounded-lg border p-2"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
