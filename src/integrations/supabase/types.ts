export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      mock_exams: {
        Row: {
          created_at: string
          description: string
          id: string
          sort_index: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          sort_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          sort_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      mock_questions: {
        Row: {
          answer: number
          choices: Json
          created_at: string
          exam_id: string
          id: string
          passage: string
          prompt: string
          sort_index: number
          updated_at: string
        }
        Insert: {
          answer?: number
          choices?: Json
          created_at?: string
          exam_id: string
          id?: string
          passage?: string
          prompt: string
          sort_index?: number
          updated_at?: string
        }
        Update: {
          answer?: number
          choices?: Json
          created_at?: string
          exam_id?: string
          id?: string
          passage?: string
          prompt?: string
          sort_index?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mock_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "mock_exams"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_questions: {
        Row: {
          answer: number
          choices: Json
          created_at: string
          desmos: Json
          desmos_note: string
          explanation: Json
          id: string
          level: string
          module: string
          prompt: string
          sort_index: number
          subject: string
          subtopic: string
          updated_at: string
        }
        Insert: {
          answer?: number
          choices?: Json
          created_at?: string
          desmos?: Json
          desmos_note?: string
          explanation?: Json
          id?: string
          level?: string
          module: string
          prompt: string
          sort_index?: number
          subject?: string
          subtopic?: string
          updated_at?: string
        }
        Update: {
          answer?: number
          choices?: Json
          created_at?: string
          desmos?: Json
          desmos_note?: string
          explanation?: Json
          id?: string
          level?: string
          module?: string
          prompt?: string
          sort_index?: number
          subject?: string
          subtopic?: string
          updated_at?: string
        }
        Relationships: []
      }
      reading_passages: {
        Row: {
          body: string
          category: string
          created_at: string
          difficulty: string
          id: string
          is_daily_pick: boolean
          read_minutes: number
          slug: string
          sort_index: number
          source: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          category?: string
          created_at?: string
          difficulty?: string
          id?: string
          is_daily_pick?: boolean
          read_minutes?: number
          slug: string
          sort_index?: number
          source?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          difficulty?: string
          id?: string
          is_daily_pick?: boolean
          read_minutes?: number
          slug?: string
          sort_index?: number
          source?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      reading_progress: {
        Row: {
          created_at: string
          highlights: Json
          id: string
          is_read: boolean
          notes: string | null
          passage_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          highlights?: Json
          id?: string
          is_read?: boolean
          notes?: string | null
          passage_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          highlights?: Json
          id?: string
          is_read?: boolean
          notes?: string | null
          passage_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_progress_passage_id_fkey"
            columns: ["passage_id"]
            isOneToOne: false
            referencedRelation: "reading_passages"
            referencedColumns: ["id"]
          },
        ]
      }
      vocab_goals: {
        Row: {
          created_at: string
          daily_goal: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_goal?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_goal?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vocab_progress: {
        Row: {
          created_at: string
          flagged: boolean
          id: string
          known: boolean
          own_sentence: string | null
          updated_at: string
          user_id: string
          word_id: string
        }
        Insert: {
          created_at?: string
          flagged?: boolean
          id?: string
          known?: boolean
          own_sentence?: string | null
          updated_at?: string
          user_id: string
          word_id: string
        }
        Update: {
          created_at?: string
          flagged?: boolean
          id?: string
          known?: boolean
          own_sentence?: string | null
          updated_at?: string
          user_id?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocab_progress_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "vocab_words"
            referencedColumns: ["id"]
          },
        ]
      }
      vocab_words: {
        Row: {
          category: string
          created_at: string
          definition: string
          difficulty: string
          example_sentence: string | null
          id: string
          part_of_speech: string
          sort_index: number
          updated_at: string
          word: string
        }
        Insert: {
          category?: string
          created_at?: string
          definition: string
          difficulty?: string
          example_sentence?: string | null
          id?: string
          part_of_speech?: string
          sort_index?: number
          updated_at?: string
          word: string
        }
        Update: {
          category?: string
          created_at?: string
          definition?: string
          difficulty?: string
          example_sentence?: string | null
          id?: string
          part_of_speech?: string
          sort_index?: number
          updated_at?: string
          word?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
