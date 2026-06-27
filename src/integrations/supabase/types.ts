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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attempt_answers: {
        Row: {
          attempt_id: string
          awarded_marks: number
          created_at: string
          id: string
          is_correct: boolean | null
          is_marked: boolean
          question_id: string
          selected_index: number | null
          time_spent_seconds: number
          updated_at: string
        }
        Insert: {
          attempt_id: string
          awarded_marks?: number
          created_at?: string
          id?: string
          is_correct?: boolean | null
          is_marked?: boolean
          question_id: string
          selected_index?: number | null
          time_spent_seconds?: number
          updated_at?: string
        }
        Update: {
          attempt_id?: string
          awarded_marks?: number
          created_at?: string
          id?: string
          is_correct?: boolean | null
          is_marked?: boolean
          question_id?: string
          selected_index?: number | null
          time_spent_seconds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_test_questions: {
        Row: {
          id: string
          marks: number
          negative_marks: number
          position: number
          question_id: string
          test_id: string
        }
        Insert: {
          id?: string
          marks?: number
          negative_marks?: number
          position: number
          question_id: string
          test_id: string
        }
        Update: {
          id?: string
          marks?: number
          negative_marks?: number
          position?: number
          question_id?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mock_test_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_test_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "mock_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_tests: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number
          id: string
          is_free: boolean
          is_published: boolean
          negative_marks: number
          pass_marks: number | null
          slug: string
          target_exam: Database["public"]["Enums"]["target_exam"]
          test_type: Database["public"]["Enums"]["test_type"]
          title: string
          total_marks: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          is_free?: boolean
          is_published?: boolean
          negative_marks?: number
          pass_marks?: number | null
          slug: string
          target_exam: Database["public"]["Enums"]["target_exam"]
          test_type?: Database["public"]["Enums"]["test_type"]
          title: string
          total_marks?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          is_free?: boolean
          is_published?: boolean
          negative_marks?: number
          pass_marks?: number | null
          slug?: string
          target_exam?: Database["public"]["Enums"]["target_exam"]
          test_type?: Database["public"]["Enums"]["test_type"]
          title?: string
          total_marks?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          coins: number
          created_at: string
          current_streak: number
          daily_goal_minutes: number
          email: string
          full_name: string | null
          id: string
          last_active_at: string | null
          longest_streak: number
          plan: Database["public"]["Enums"]["subscription_plan"]
          preferred_language:
            | Database["public"]["Enums"]["preferred_language"]
            | null
          subscription_expires_at: string | null
          subscription_status: string | null
          target_exam: Database["public"]["Enums"]["target_exam"] | null
          timezone: string | null
          updated_at: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          coins?: number
          created_at?: string
          current_streak?: number
          daily_goal_minutes?: number
          email: string
          full_name?: string | null
          id: string
          last_active_at?: string | null
          longest_streak?: number
          plan?: Database["public"]["Enums"]["subscription_plan"]
          preferred_language?:
            | Database["public"]["Enums"]["preferred_language"]
            | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          target_exam?: Database["public"]["Enums"]["target_exam"] | null
          timezone?: string | null
          updated_at?: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          coins?: number
          created_at?: string
          current_streak?: number
          daily_goal_minutes?: number
          email?: string
          full_name?: string | null
          id?: string
          last_active_at?: string | null
          longest_streak?: number
          plan?: Database["public"]["Enums"]["subscription_plan"]
          preferred_language?:
            | Database["public"]["Enums"]["preferred_language"]
            | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          target_exam?: Database["public"]["Enums"]["target_exam"] | null
          timezone?: string | null
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_index: number
          created_at: string
          created_by: string | null
          difficulty: Database["public"]["Enums"]["question_difficulty"]
          explanation: Json | null
          id: string
          is_published: boolean
          options: Json
          question: Json
          source: string | null
          subject_id: string | null
          target_exam: Database["public"]["Enums"]["target_exam"] | null
          topic_id: string | null
          updated_at: string
        }
        Insert: {
          correct_index: number
          created_at?: string
          created_by?: string | null
          difficulty?: Database["public"]["Enums"]["question_difficulty"]
          explanation?: Json | null
          id?: string
          is_published?: boolean
          options: Json
          question: Json
          source?: string | null
          subject_id?: string | null
          target_exam?: Database["public"]["Enums"]["target_exam"] | null
          topic_id?: string | null
          updated_at?: string
        }
        Update: {
          correct_index?: number
          created_at?: string
          created_by?: string | null
          difficulty?: Database["public"]["Enums"]["question_difficulty"]
          explanation?: Json | null
          id?: string
          is_published?: boolean
          options?: Json
          question?: Json
          source?: string | null
          subject_id?: string | null
          target_exam?: Database["public"]["Enums"]["target_exam"] | null
          topic_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          name_bn: string | null
          name_hi: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          name_bn?: string | null
          name_hi?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          name_bn?: string | null
          name_hi?: string | null
          slug?: string
        }
        Relationships: []
      }
      test_attempts: {
        Row: {
          accuracy: number
          correct_count: number
          created_at: string
          id: string
          incorrect_count: number
          score: number
          skipped_count: number
          started_at: string
          status: Database["public"]["Enums"]["attempt_status"]
          submitted_at: string | null
          test_id: string
          time_taken_seconds: number | null
          total_marks: number
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy?: number
          correct_count?: number
          created_at?: string
          id?: string
          incorrect_count?: number
          score?: number
          skipped_count?: number
          started_at?: string
          status?: Database["public"]["Enums"]["attempt_status"]
          submitted_at?: string | null
          test_id: string
          time_taken_seconds?: number | null
          total_marks?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy?: number
          correct_count?: number
          created_at?: string
          id?: string
          incorrect_count?: number
          score?: number
          skipped_count?: number
          started_at?: string
          status?: Database["public"]["Enums"]["attempt_status"]
          submitted_at?: string | null
          test_id?: string
          time_taken_seconds?: number | null
          total_marks?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "mock_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string
          id: string
          name: string
          name_bn: string | null
          name_hi: string | null
          slug: string
          subject_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          name_bn?: string | null
          name_hi?: string | null
          slug: string
          subject_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          name_bn?: string | null
          name_hi?: string | null
          slug?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      attempt_status: "in_progress" | "submitted" | "abandoned"
      preferred_language: "english" | "bengali" | "hindi"
      question_difficulty: "easy" | "medium" | "hard"
      subscription_plan: "free" | "pro_monthly" | "pro_yearly"
      target_exam:
        | "ssc_cgl"
        | "ssc_chsl"
        | "wbcs"
        | "wbpsc"
        | "railway"
        | "banking"
        | "police"
        | "other"
      test_type: "full_mock" | "sectional" | "topic" | "previous_year" | "daily"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      attempt_status: ["in_progress", "submitted", "abandoned"],
      preferred_language: ["english", "bengali", "hindi"],
      question_difficulty: ["easy", "medium", "hard"],
      subscription_plan: ["free", "pro_monthly", "pro_yearly"],
      target_exam: [
        "ssc_cgl",
        "ssc_chsl",
        "wbcs",
        "wbpsc",
        "railway",
        "banking",
        "police",
        "other",
      ],
      test_type: ["full_mock", "sectional", "topic", "previous_year", "daily"],
    },
  },
} as const
