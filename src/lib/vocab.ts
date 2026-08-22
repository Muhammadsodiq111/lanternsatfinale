import { supabase } from "@/integrations/supabase/external";

export type VocabCategory = "vocabulary";

export const CATEGORIES: { value: VocabCategory; label: string }[] = [
  { value: "vocabulary", label: "Vocabulary" },
];

export type Difficulty = "easy" | "medium" | "hard" | "challenge";

export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "challenge"];

export const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  easy: "bg-emerald/10 text-emerald",
  medium: "bg-amber/15 text-amber",
  hard: "bg-flame/10 text-flame",
  challenge: "bg-violet/10 text-violet",
};

export type VocabWord = {
  id: string;
  word: string;
  definition: string;
  example_sentence: string | null;
  part_of_speech: string;
  difficulty: string;
  category: string;
  sort_index: number;
};

export type VocabProgress = {
  word_id: string;
  known: boolean;
  flagged: boolean;
  own_sentence: string | null;
};

// PostgREST caps a single response at 1000 rows, so page through the table.
const PAGE_SIZE = 1000;

export const vocabWordsQuery = (category: VocabCategory) => ({
  queryKey: ["vocab-words", category],
  queryFn: async (): Promise<VocabWord[]> => {
    const all: VocabWord[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await supabase
        .from("vocab_words")
        .select("id, word, definition, example_sentence, part_of_speech, difficulty, category, sort_index")
        .eq("category", category)
        .order("sort_index", { ascending: true })
        .order("word", { ascending: true })
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      const rows = (data ?? []) as VocabWord[];
      all.push(...rows);
      if (rows.length < PAGE_SIZE) break;
    }
    return all;
  },
  staleTime: 5 * 60_000,
});

export const vocabProgressQuery = () => ({
  queryKey: ["vocab-progress"],
  queryFn: async (): Promise<Record<string, VocabProgress>> => {
    const map: Record<string, VocabProgress> = {};
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await supabase
        .from("vocab_progress")
        .select("word_id, known, flagged, own_sentence")
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      const rows = (data ?? []) as VocabProgress[];
      for (const row of rows) map[row.word_id] = row;
      if (rows.length < PAGE_SIZE) break;
    }
    return map;
  },
});

export const vocabGoalQuery = () => ({
  queryKey: ["vocab-goal"],
  queryFn: async (): Promise<number> => {
    const { data, error } = await supabase.from("vocab_goals").select("daily_goal").maybeSingle();
    if (error) throw error;
    return data?.daily_goal ?? 15;
  },
});

export async function saveDailyGoal(userId: string, dailyGoal: number) {
  const { error } = await supabase
    .from("vocab_goals")
    .upsert({ user_id: userId, daily_goal: dailyGoal }, { onConflict: "user_id" });
  if (error) throw error;
}

export async function saveProgress(
  userId: string,
  wordId: string,
  patch: Partial<Pick<VocabProgress, "known" | "flagged" | "own_sentence">>,
) {
  const { error } = await supabase
    .from("vocab_progress")
    .upsert({ user_id: userId, word_id: wordId, ...patch }, { onConflict: "user_id,word_id" });
  if (error) throw error;
}
