import { supabase } from "@/integrations/supabase/external";

export const DIFFICULTY_LEVELS = ["easy", "medium", "hard", "challenge"] as const;
export type Level = (typeof DIFFICULTY_LEVELS)[number];

export const LEVEL_LABEL_CLASS: Record<Level, string> = {
  easy: "text-emerald",
  medium: "text-amber",
  hard: "text-flame",
  challenge: "text-violet",
};

export type QuestionType = "mcq" | "free";

export type Question = {
  id: string;
  level: Level;
  index: number;
  prompt: string;
  type: QuestionType;
  answerText: string;
  choices: string[];
  answer: number;
  explanation: string[];
  desmos: string[];
  desmosState: unknown;
  desmosNote: string;
};

export type Subtopic = { id: string; title: string; questions: Question[] };

export type PracticeQuestionRow = {
  id: string;
  subject: string;
  module: string;
  subtopic: string;
  level: string;
  prompt: string;
  question_type: string;
  answer_text: string;
  choices: string[];
  answer: number;
  explanation: string[];
  desmos: string[];
  desmos_state: unknown;
  desmos_note: string;
  sort_index: number;
};

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v)) : [];
}

/** True when a typed answer matches any accepted answer ("2/3, 0.667"). */
export function matchesFreeAnswer(input: string, accepted: string) {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "").replace(/^\+/, "");
  const value = norm(input);
  if (!value) return false;
  return accepted
    .split(/[,|]/)
    .map(norm)
    .filter(Boolean)
    .some((a) => a === value);
}

export const practiceQuestionsQuery = (moduleTitle: string) => ({
  queryKey: ["practice-questions", moduleTitle],
  queryFn: async (): Promise<PracticeQuestionRow[]> => {
    let query = supabase
      .from("practice_questions")
      .select(
        "id, subject, module, subtopic, level, prompt, question_type, answer_text, choices, answer, explanation, desmos, desmos_state, desmos_note, sort_index",
      )
      .order("sort_index", { ascending: true })
      .order("created_at", { ascending: true });
    if (moduleTitle) query = query.eq("module", moduleTitle);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((row) => ({
      ...row,
      question_type: row.question_type === "free" ? "free" : "mcq",
      answer_text: row.answer_text ?? "",
      choices: toStringArray(row.choices),
      explanation: toStringArray(row.explanation),
      desmos: toStringArray(row.desmos),
    })) as PracticeQuestionRow[];
  },
  staleTime: 30_000,
});

export type BankRow = {
  id: string;
  subject: string;
  module: string;
  subtopic: string;
  level: Level;
};

/** Lightweight index of the whole question bank — powers live counts in the dashboard. */
export const questionBankQuery = {
  queryKey: ["practice-question-bank"],
  queryFn: async (): Promise<BankRow[]> => {
    const { data, error } = await supabase
      .from("practice_questions")
      .select("id, subject, module, subtopic, level")
      .order("sort_index", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      subject: row.subject === "english" ? "english" : "math",
      module: row.module ?? "",
      subtopic: row.subtopic ?? "",
      level: (DIFFICULTY_LEVELS as readonly string[]).includes(row.level)
        ? (row.level as Level)
        : "medium",
    }));
  },
  staleTime: 30_000,
};



export function subtopicsFromRows(rows: PracticeQuestionRow[]): Subtopic[] {
  const groups = new Map<string, PracticeQuestionRow[]>();
  for (const row of rows) {
    const key = row.subtopic || "Questions";
    const list = groups.get(key);
    if (list) list.push(row);
    else groups.set(key, [row]);
  }
  return Array.from(groups.entries()).map(([title, list], si) => {
    const counters: Record<string, number> = {};
    return {
      id: `db${si + 1}`,
      title,
      questions: list.map((row) => {
        const level = (DIFFICULTY_LEVELS as readonly string[]).includes(row.level)
          ? (row.level as Level)
          : "medium";
        counters[level] = (counters[level] ?? 0) + 1;
        const type: QuestionType = row.question_type === "free" ? "free" : "mcq";
        return {
          id: row.id,
          level,
          index: counters[level]!,
          prompt: row.prompt,
          type,
          answerText: row.answer_text ?? "",
          choices: row.choices.length ? row.choices : type === "free" ? [] : ["—"],
          answer: row.answer,
          explanation: row.explanation,
          desmos: row.desmos,
          desmosState: row.desmos_state ?? null,
          desmosNote: row.desmos_note,
        };

      }),
    };
  });
}

export const FORMULA_GROUPS: { title: string; items: string[] }[] = [
  {
    title: "Area & Circumference",
    items: ["A = πr²", "C = 2πr", "A = ℓw", "A = ½bh", "c² = a² + b²"],
  },
  {
    title: "Volume",
    items: ["V = ℓwh", "V = πr²h", "V = 4/3 πr³", "V = 1/3 πr²h", "V = 1/3 ℓwh"],
  },
  {
    title: "Special Right Triangles",
    items: ["30°–60°–90° → x, x√3, 2x", "45°–45°–90° → s, s, s√2"],
  },
  {
    title: "Facts",
    items: [
      "The number of degrees of arc in a circle is 360.",
      "The number of radians of arc in a circle is 2π.",
      "The sum of the measures in degrees of the angles of a triangle is 180.",
    ],
  },
];

export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}