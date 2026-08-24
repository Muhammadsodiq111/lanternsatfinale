// Database types for the LanternSAT Supabase project
// (https://pgossdmcczrmabdjbupa.supabase.co).
// Keep in sync with supabase/new-project/schema.sql.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamps = {
  created_at: string;
  updated_at: string;
};

type TimestampsInsert = {
  created_at?: string;
  updated_at?: string;
};

export type AppRole = "admin" | "student";

type MockExamRow = Timestamps & {
  id: string;
  title: string;
  description: string;
  sort_index: number;
};

type MockQuestionRow = Timestamps & {
  id: string;
  exam_id: string;
  passage: string;
  prompt: string;
  choices: Json;
  answer: number;
  sort_index: number;
};

type PracticeQuestionRow = Timestamps & {
  id: string;
  subject: string;
  module: string;
  subtopic: string;
  level: string;
  prompt: string;
  question_type: string;
  answer_text: string;
  choices: Json;
  answer: number;
  explanation: Json;
  desmos: Json;
  desmos_state: Json;
  desmos_note: string;
  sort_index: number;
};


type ReadingPassageRow = Timestamps & {
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
};

type ReadingProgressRow = Timestamps & {
  id: string;
  user_id: string;
  passage_id: string;
  is_read: boolean;
  highlights: Json;
  notes: string | null;
};

type VocabWordRow = Timestamps & {
  id: string;
  word: string;
  definition: string;
  example_sentence: string | null;
  part_of_speech: string;
  difficulty: string;
  category: string;
  sort_index: number;
};

type VocabProgressRow = Timestamps & {
  id: string;
  user_id: string;
  word_id: string;
  known: boolean;
  flagged: boolean;
  own_sentence: string | null;
};

type VocabGoalRow = Timestamps & {
  id: string;
  user_id: string;
  daily_goal: number;
};

type ProfileRow = Timestamps & {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

type LessonContentRow = Timestamps & {
  id: string;
  slug: string;
  video_url: string | null;
  blocks: Json;
};

type LessonProgressRow = Timestamps & {
  id: string;
  user_id: string;
  slug: string;
  completed: boolean;
};

type TrackerProgressRow = Timestamps & {
  id: string;
  user_id: string;
  question_id: string;
  status: string;
  starred: boolean;
  note: string;
  reviewed: boolean;
};

type UserRoleRow = {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
};

// Insert/Update shapes: everything with a default is optional on insert, and
// every column is optional on update.
type TableDef<Row, Required extends keyof Row> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Omit<Row, Required>> & TimestampsInsert;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      mock_exams: TableDef<MockExamRow, "title">;
      mock_questions: TableDef<MockQuestionRow, "exam_id" | "prompt">;
      practice_questions: TableDef<PracticeQuestionRow, "module" | "prompt">;
      reading_passages: TableDef<ReadingPassageRow, "slug" | "title">;
      reading_progress: TableDef<ReadingProgressRow, "passage_id">;
      vocab_words: TableDef<VocabWordRow, "word" | "definition">;
      vocab_progress: TableDef<VocabProgressRow, "word_id">;
      vocab_goals: TableDef<VocabGoalRow, never>;
      profiles: TableDef<ProfileRow, "id">;
      user_roles: TableDef<UserRoleRow, "user_id" | "role">;
      lesson_content: TableDef<LessonContentRow, "slug">;
      lesson_progress: TableDef<LessonProgressRow, "slug">;
      tracker_progress: TableDef<TrackerProgressRow, "question_id">;
    };
    Views: Record<never, never>;
    Functions: {
      has_role: {
        Args: { _user_id: string; _role: AppRole };
        Returns: boolean;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      app_role: AppRole;
    };
    CompositeTypes: Record<never, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
