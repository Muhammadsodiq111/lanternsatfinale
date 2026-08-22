import { supabase } from "@/integrations/supabase/external";

export type ReadingCategory = "literature" | "science" | "history" | "humanities";

export const READING_CATEGORIES: { value: ReadingCategory; label: string; short: string; className: string }[] = [
  { value: "literature", label: "Literature", short: "LIT", className: "bg-violet/10 text-violet" },
  { value: "science", label: "Science", short: "SCI", className: "bg-primary/10 text-primary" },
  { value: "history", label: "History", short: "HIS", className: "bg-amber/15 text-amber" },
  { value: "humanities", label: "Humanities", short: "HUM", className: "bg-emerald/10 text-emerald" },
];

export const CATEGORY_META: Record<string, { label: string; short: string; className: string }> = Object.fromEntries(
  READING_CATEGORIES.map((c) => [c.value, { label: c.label, short: c.short, className: c.className }]),
);

export type ReadingDifficulty = "easy" | "medium" | "hard";

export const READING_DIFFICULTIES: ReadingDifficulty[] = ["easy", "medium", "hard"];

export const DIFFICULTY_BADGE: Record<string, string> = {
  easy: "border-emerald/40 text-emerald",
  medium: "border-amber/50 text-amber",
  hard: "border-flame/40 text-flame",
};

export type Passage = {
  id: string;
  slug: string;
  title: string;
  category: string;
  difficulty: string;
  read_minutes: number;
  body: string;
  source: string | null;
  is_daily_pick: boolean;
  sort_index: number;
  created_at: string;
};

export type Highlight = { p: number; s: number; color: string };

export type ReadingProgress = {
  passage_id: string;
  is_read: boolean;
  highlights: Highlight[];
  notes: string | null;
};

export const HIGHLIGHT_COLORS: { key: string; swatch: string; mark: string }[] = [
  { key: "yellow", swatch: "bg-amber/60", mark: "bg-amber/35" },
  { key: "green", swatch: "bg-emerald/60", mark: "bg-emerald/30" },
  { key: "pink", swatch: "bg-violet/50", mark: "bg-violet/25" },
];

export const passagesQuery = () => ({
  queryKey: ["reading-passages"],
  queryFn: async (): Promise<Passage[]> => {
    const { data, error } = await supabase
      .from("reading_passages")
      .select("id, slug, title, category, difficulty, read_minutes, body, source, is_daily_pick, sort_index, created_at")
      .order("sort_index", { ascending: true })
      .order("title", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Passage[];
  },
  staleTime: 60_000,
});

export const readingProgressQuery = () => ({
  queryKey: ["reading-progress"],
  queryFn: async (): Promise<Record<string, ReadingProgress>> => {
    const { data, error } = await supabase
      .from("reading_progress")
      .select("passage_id, is_read, highlights, notes");
    if (error) throw error;
    const map: Record<string, ReadingProgress> = {};
    for (const row of data ?? []) {
      map[row.passage_id] = {
        passage_id: row.passage_id,
        is_read: row.is_read,
        highlights: Array.isArray(row.highlights) ? (row.highlights as unknown as Highlight[]) : [],
        notes: row.notes,
      };
    }
    return map;
  },
  staleTime: 30_000,
});

export async function saveReadingProgress(
  userId: string,
  passageId: string,
  patch: { is_read?: boolean; highlights?: Highlight[]; notes?: string | null },
) {
  const { error } = await supabase
    .from("reading_progress")
    .upsert({ user_id: userId, passage_id: passageId, ...patch }, { onConflict: "user_id,passage_id" });
  if (error) throw error;
}

export function splitParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function splitSentences(paragraph: string): string[] {
  const parts = paragraph.match(/[^.!?]+[.!?]*\s*/g);
  return parts && parts.length ? parts : [paragraph];
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function estimateMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
