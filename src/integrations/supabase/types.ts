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
      ai_generation_jobs: {
        Row: {
          completed_at: string | null
          count_created: number
          count_requested: number
          created_at: string
          created_by: string | null
          difficulty: string | null
          error: string | null
          id: string
          model: string | null
          status: string
          subject_id: string | null
          target_exam: string
          topic_id: string | null
        }
        Insert: {
          completed_at?: string | null
          count_created?: number
          count_requested: number
          created_at?: string
          created_by?: string | null
          difficulty?: string | null
          error?: string | null
          id?: string
          model?: string | null
          status?: string
          subject_id?: string | null
          target_exam: string
          topic_id?: string | null
        }
        Update: {
          completed_at?: string | null
          count_created?: number
          count_requested?: number
          created_at?: string
          created_by?: string | null
          difficulty?: string | null
          error?: string | null
          id?: string
          model?: string | null
          status?: string
          subject_id?: string | null
          target_exam?: string
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_jobs_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generation_jobs_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_teacher_usage: {
        Row: {
          count: number
          day: string
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          day?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          day?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      attempt_questions: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          marks: number
          negative_marks: number
          options_order: number[]
          position: number
          question_id: string
          section_label: string | null
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          marks?: number
          negative_marks?: number
          options_order: number[]
          position: number
          question_id: string
          section_label?: string | null
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          marks?: number
          negative_marks?: number
          options_order?: number[]
          position?: number
          question_id?: string
          section_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attempt_questions_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_syllabi: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          pattern: Json
          syllabus: string
          target_exam: Database["public"]["Enums"]["target_exam"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          pattern: Json
          syllabus: string
          target_exam: Database["public"]["Enums"]["target_exam"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          pattern?: Json
          syllabus?: string
          target_exam?: Database["public"]["Enums"]["target_exam"]
          updated_at?: string
        }
        Relationships: []
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
          is_dynamic: boolean
          is_free: boolean
          is_published: boolean
          negative_marks: number
          pass_marks: number | null
          section_config: Json | null
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
          is_dynamic?: boolean
          is_free?: boolean
          is_published?: boolean
          negative_marks?: number
          pass_marks?: number | null
          section_config?: Json | null
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
          is_dynamic?: boolean
          is_free?: boolean
          is_published?: boolean
          negative_marks?: number
          pass_marks?: number | null
          section_config?: Json | null
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
          ai_generated: boolean
          correct_index: number
          created_at: string
          created_by: string | null
          difficulty: Database["public"]["Enums"]["question_difficulty"]
          explanation: Json | null
          id: string
          is_published: boolean
          options: Json
          question: Json
          reviewed_at: string | null
          reviewed_by: string | null
          source: string | null
          status: Database["public"]["Enums"]["question_status"]
          subject_id: string | null
          target_exam: Database["public"]["Enums"]["target_exam"] | null
          topic_id: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          ai_generated?: boolean
          correct_index: number
          created_at?: string
          created_by?: string | null
          difficulty?: Database["public"]["Enums"]["question_difficulty"]
          explanation?: Json | null
          id?: string
          is_published?: boolean
          options: Json
          question: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["question_status"]
          subject_id?: string | null
          target_exam?: Database["public"]["Enums"]["target_exam"] | null
          topic_id?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          ai_generated?: boolean
          correct_index?: number
          created_at?: string
          created_by?: string | null
          difficulty?: Database["public"]["Enums"]["question_difficulty"]
          explanation?: Json | null
          id?: string
          is_published?: boolean
          options?: Json
          question?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["question_status"]
          subject_id?: string | null
          target_exam?: Database["public"]["Enums"]["target_exam"] | null
          topic_id?: string | null
          updated_at?: string
          year?: number | null
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
      razorpay_plans: {
        Row: {
          amount: number
          created_at: string
          currency: string
          environment: string
          id: string
          interval: number
          lookup_key: string
          name: string
          period: string
          razorpay_plan_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          environment?: string
          id?: string
          interval?: number
          lookup_key: string
          name: string
          period: string
          razorpay_plan_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          environment?: string
          id?: string
          interval?: number
          lookup_key?: string
          name?: string
          period?: string
          razorpay_plan_id?: string
          updated_at?: string
        }
        Relationships: []
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
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string | null
          provider: string
          razorpay_customer_id: string | null
          razorpay_plan_id: string | null
          razorpay_subscription_id: string | null
          short_url: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id?: string | null
          provider?: string
          razorpay_customer_id?: string | null
          razorpay_plan_id?: string | null
          razorpay_subscription_id?: string | null
          short_url?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string | null
          provider?: string
          razorpay_customer_id?: string | null
          razorpay_plan_id?: string | null
          razorpay_subscription_id?: string | null
          short_url?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
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
      user_question_history: {
        Row: {
          last_seen_at: string
          question_id: string
          times_seen: number
          user_id: string
        }
        Insert: {
          last_seen_at?: string
          question_id: string
          times_seen?: number
          user_id: string
        }
        Update: {
          last_seen_at?: string
          question_id?: string
          times_seen?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_question_history_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
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
      downgrade_expired_plans: { Args: never; Returns: undefined }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
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
      question_status: "approved" | "pending_review" | "rejected" | "archived"
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
      question_status: ["approved", "pending_review", "rejected", "archived"],
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
