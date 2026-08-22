import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/external";

export type MockQuestion = {
  id: string;
  exam_id: string;
  passage: string;
  prompt: string;
  choices: string[];
  answer: number;
  sort_index: number;
};

export type MockExam = {
  id: string;
  title: string;
  description: string;
  sort_index: number;
  created_at: string;
};

export type TimingOption = {
  value: string;
  label: string;
  detail: string;
  /** minutes for the module; null = stopwatch */
  minutes: number | null;
};

export const TIMING_OPTIONS: TimingOption[] = [
  { value: "official", label: "Official SAT Timing", detail: "32 min R&W, 35 min Math", minutes: 32 },
  { value: "extended50", label: "50% Extended Time", detail: "48 min R&W, 52 min Math", minutes: 48 },
  { value: "extended100", label: "100% Extended Time", detail: "64 min R&W, 70 min Math", minutes: 64 },
  { value: "none", label: "No Time Limit", detail: "Stopwatch mode", minutes: null },
];

export function timingFor(value: string): TimingOption {
  return TIMING_OPTIONS.find((t) => t.value === value) ?? TIMING_OPTIONS[0]!;
}

function toChoices(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((c) => String(c));
  return [];
}

export async function fetchMockExams(): Promise<MockExam[]> {
  const { data, error } = await supabase
    .from("mock_exams")
    .select("id, title, description, sort_index, created_at")
    .order("sort_index", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MockExam[];
}

export async function fetchMockQuestions(examId: string): Promise<MockQuestion[]> {
  const { data, error } = await supabase
    .from("mock_questions")
    .select("id, exam_id, passage, prompt, choices, answer, sort_index")
    .eq("exam_id", examId)
    .order("sort_index", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    exam_id: row.exam_id,
    passage: row.passage ?? "",
    prompt: row.prompt,
    choices: toChoices(row.choices),
    answer: row.answer ?? 0,
    sort_index: row.sort_index ?? 0,
  }));
}

export async function fetchMockCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from("mock_questions").select("exam_id");
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) counts[row.exam_id] = (counts[row.exam_id] ?? 0) + 1;
  return counts;
}

export const mockExamsQuery = () =>
  queryOptions({ queryKey: ["mock-exams"], queryFn: fetchMockExams });

export const mockCountsQuery = () =>
  queryOptions({ queryKey: ["mock-question-counts"], queryFn: fetchMockCounts });

export const mockQuestionsQuery = (examId: string) =>
  queryOptions({
    queryKey: ["mock-questions", examId],
    queryFn: () => fetchMockQuestions(examId),
    enabled: Boolean(examId),
  });

export function formatClock(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
