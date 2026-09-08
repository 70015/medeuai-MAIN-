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
      about_content: {
        Row: {
          address: string | null
          business_email: string | null
          cofounder_image_url: string | null
          cofounder_name: string | null
          cofounder_position: string | null
          cofounder_quote: string | null
          cofounder_social_facebook: string | null
          cofounder_social_instagram: string | null
          cofounder_social_linkedin: string | null
          cofounder_social_telegram: string | null
          cofounder_social_website: string | null
          cofounder_social_x: string | null
          cofounder_social_youtube: string | null
          company_description: string
          cover_image_url: string | null
          created_at: string
          founded_year: string
          founder_image_url: string | null
          founder_name: string
          founder_position: string
          founder_quote: string
          founder_social_facebook: string | null
          founder_social_instagram: string | null
          founder_social_linkedin: string | null
          founder_social_telegram: string | null
          founder_social_website: string | null
          founder_social_x: string | null
          founder_social_youtube: string | null
          gallery_images: string[]
          hero_subtitle: string
          hero_title: string
          id: string
          is_published: boolean
          location: string
          logo_url: string | null
          maps_link: string | null
          mission_badge: string
          mission_description: string
          mission_image_url: string | null
          mission_title: string
          phone: string | null
          problem_list: string[]
          problem_title: string
          seo_canonical: string | null
          seo_description: string
          seo_keywords: string
          seo_og_image: string | null
          seo_title: string
          seo_twitter_card: string
          short_intro: string
          singleton: boolean
          social_facebook: string | null
          social_github: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_telegram: string | null
          social_website: string | null
          social_x: string | null
          social_youtube: string | null
          solution_list: string[]
          story_paragraphs: string[]
          story_title: string
          support_email: string | null
          tagline: string
          updated_at: string
          vision_badge: string
          vision_description: string
          vision_image_url: string | null
          vision_title: string
          website_name: string
          whatsapp: string | null
          working_hours: string | null
        }
        Insert: {
          address?: string | null
          business_email?: string | null
          cofounder_image_url?: string | null
          cofounder_name?: string | null
          cofounder_position?: string | null
          cofounder_quote?: string | null
          cofounder_social_facebook?: string | null
          cofounder_social_instagram?: string | null
          cofounder_social_linkedin?: string | null
          cofounder_social_telegram?: string | null
          cofounder_social_website?: string | null
          cofounder_social_x?: string | null
          cofounder_social_youtube?: string | null
          company_description?: string
          cover_image_url?: string | null
          created_at?: string
          founded_year?: string
          founder_image_url?: string | null
          founder_name?: string
          founder_position?: string
          founder_quote?: string
          founder_social_facebook?: string | null
          founder_social_instagram?: string | null
          founder_social_linkedin?: string | null
          founder_social_telegram?: string | null
          founder_social_website?: string | null
          founder_social_x?: string | null
          founder_social_youtube?: string | null
          gallery_images?: string[]
          hero_subtitle?: string
          hero_title?: string
          id?: string
          is_published?: boolean
          location?: string
          logo_url?: string | null
          maps_link?: string | null
          mission_badge?: string
          mission_description?: string
          mission_image_url?: string | null
          mission_title?: string
          phone?: string | null
          problem_list?: string[]
          problem_title?: string
          seo_canonical?: string | null
          seo_description?: string
          seo_keywords?: string
          seo_og_image?: string | null
          seo_title?: string
          seo_twitter_card?: string
          short_intro?: string
          singleton?: boolean
          social_facebook?: string | null
          social_github?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_telegram?: string | null
          social_website?: string | null
          social_x?: string | null
          social_youtube?: string | null
          solution_list?: string[]
          story_paragraphs?: string[]
          story_title?: string
          support_email?: string | null
          tagline?: string
          updated_at?: string
          vision_badge?: string
          vision_description?: string
          vision_image_url?: string | null
          vision_title?: string
          website_name?: string
          whatsapp?: string | null
          working_hours?: string | null
        }
        Update: {
          address?: string | null
          business_email?: string | null
          cofounder_image_url?: string | null
          cofounder_name?: string | null
          cofounder_position?: string | null
          cofounder_quote?: string | null
          cofounder_social_facebook?: string | null
          cofounder_social_instagram?: string | null
          cofounder_social_linkedin?: string | null
          cofounder_social_telegram?: string | null
          cofounder_social_website?: string | null
          cofounder_social_x?: string | null
          cofounder_social_youtube?: string | null
          company_description?: string
          cover_image_url?: string | null
          created_at?: string
          founded_year?: string
          founder_image_url?: string | null
          founder_name?: string
          founder_position?: string
          founder_quote?: string
          founder_social_facebook?: string | null
          founder_social_instagram?: string | null
          founder_social_linkedin?: string | null
          founder_social_telegram?: string | null
          founder_social_website?: string | null
          founder_social_x?: string | null
          founder_social_youtube?: string | null
          gallery_images?: string[]
          hero_subtitle?: string
          hero_title?: string
          id?: string
          is_published?: boolean
          location?: string
          logo_url?: string | null
          maps_link?: string | null
          mission_badge?: string
          mission_description?: string
          mission_image_url?: string | null
          mission_title?: string
          phone?: string | null
          problem_list?: string[]
          problem_title?: string
          seo_canonical?: string | null
          seo_description?: string
          seo_keywords?: string
          seo_og_image?: string | null
          seo_title?: string
          seo_twitter_card?: string
          short_intro?: string
          singleton?: boolean
          social_facebook?: string | null
          social_github?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_telegram?: string | null
          social_website?: string | null
          social_x?: string | null
          social_youtube?: string | null
          solution_list?: string[]
          story_paragraphs?: string[]
          story_title?: string
          support_email?: string | null
          tagline?: string
          updated_at?: string
          vision_badge?: string
          vision_description?: string
          vision_image_url?: string | null
          vision_title?: string
          website_name?: string
          whatsapp?: string | null
          working_hours?: string | null
        }
        Relationships: []
      }
      about_faqs: {
        Row: {
          answer: string
          created_at: string
          display_order: number
          enabled: boolean
          id: string
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          display_order?: number
          enabled?: boolean
          id?: string
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          display_order?: number
          enabled?: boolean
          id?: string
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      about_features: {
        Row: {
          created_at: string
          description: string
          display_order: number
          enabled: boolean
          icon: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number
          enabled?: boolean
          icon?: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          enabled?: boolean
          icon?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      about_roadmap: {
        Row: {
          created_at: string
          date_label: string
          description: string
          display_order: number
          enabled: boolean
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_label: string
          description: string
          display_order?: number
          enabled?: boolean
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_label?: string
          description?: string
          display_order?: number
          enabled?: boolean
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      about_values: {
        Row: {
          created_at: string
          description: string
          display_order: number
          enabled: boolean
          icon: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number
          enabled?: boolean
          icon?: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          enabled?: boolean
          icon?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      articles: {
        Row: {
          category: string
          content: string
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          noindex: boolean
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          noindex?: boolean
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          noindex?: boolean
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
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
      paper_pool: {
        Row: {
          created_at: string
          first_served_at: string | null
          id: string
          last_served_at: string | null
          questions: Json
          status: string
          test_id: string
          times_served: number
        }
        Insert: {
          created_at?: string
          first_served_at?: string | null
          id?: string
          last_served_at?: string | null
          questions: Json
          status?: string
          test_id: string
          times_served?: number
        }
        Update: {
          created_at?: string
          first_served_at?: string | null
          id?: string
          last_served_at?: string | null
          questions?: Json
          status?: string
          test_id?: string
          times_served?: number
        }
        Relationships: [
          {
            foreignKeyName: "paper_pool_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "mock_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          admin_note: string | null
          amount_inr: number
          created_at: string
          id: string
          paid_on: string
          plan: string
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_path: string | null
          status: string
          updated_at: string
          upi_id: string | null
          user_id: string
          utr: string
        }
        Insert: {
          admin_note?: string | null
          amount_inr: number
          created_at?: string
          id?: string
          paid_on: string
          plan: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_path?: string | null
          status?: string
          updated_at?: string
          upi_id?: string | null
          user_id: string
          utr: string
        }
        Update: {
          admin_note?: string | null
          amount_inr?: number
          created_at?: string
          id?: string
          paid_on?: string
          plan?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_path?: string | null
          status?: string
          updated_at?: string
          upi_id?: string | null
          user_id?: string
          utr?: string
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          created_at: string
          free_ai_daily_limit: number
          free_attempts_allowed: number
          free_window_days: number
          id: string
          instructions: string
          merchant_name: string
          monthly_price_inr: number
          monthly_qr_path: string | null
          qr_enabled: boolean
          singleton: boolean
          updated_at: string
          upi_id: string
          upi_intent_enabled: boolean
          yearly_price_inr: number
          yearly_qr_path: string | null
        }
        Insert: {
          created_at?: string
          free_ai_daily_limit?: number
          free_attempts_allowed?: number
          free_window_days?: number
          id?: string
          instructions?: string
          merchant_name?: string
          monthly_price_inr?: number
          monthly_qr_path?: string | null
          qr_enabled?: boolean
          singleton?: boolean
          updated_at?: string
          upi_id?: string
          upi_intent_enabled?: boolean
          yearly_price_inr?: number
          yearly_qr_path?: string | null
        }
        Update: {
          created_at?: string
          free_ai_daily_limit?: number
          free_attempts_allowed?: number
          free_window_days?: number
          id?: string
          instructions?: string
          merchant_name?: string
          monthly_price_inr?: number
          monthly_qr_path?: string | null
          qr_enabled?: boolean
          singleton?: boolean
          updated_at?: string
          upi_id?: string
          upi_intent_enabled?: boolean
          yearly_price_inr?: number
          yearly_qr_path?: string | null
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
      promo_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string | null
          discount_percent: number | null
          duration_days: number | null
          expires_at: string | null
          grant_type: Database["public"]["Enums"]["promo_grant_type"]
          id: string
          notes: string | null
          plan_tier: string | null
          redemption_count: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by?: string | null
          discount_percent?: number | null
          duration_days?: number | null
          expires_at?: string | null
          grant_type: Database["public"]["Enums"]["promo_grant_type"]
          id?: string
          notes?: string | null
          plan_tier?: string | null
          redemption_count?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string | null
          discount_percent?: number | null
          duration_days?: number | null
          expires_at?: string | null
          grant_type?: Database["public"]["Enums"]["promo_grant_type"]
          id?: string
          notes?: string | null
          plan_tier?: string | null
          redemption_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      promo_redemptions: {
        Row: {
          applied_plan: string
          expires_at: string | null
          id: string
          promo_code_id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          applied_plan: string
          expires_at?: string | null
          id?: string
          promo_code_id: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          applied_plan?: string
          expires_at?: string | null
          id?: string
          promo_code_id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_redemptions_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
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
      super_admin: {
        Row: {
          created_at: string
          singleton: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          singleton?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          singleton?: boolean
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      admin_pending_questions: {
        Args: { p_limit?: number }
        Returns: {
          ai_generated: boolean
          correct_index: number
          created_at: string
          difficulty: string
          explanation: Json
          id: string
          q_options: Json
          q_question: Json
          subject_name: string
          target_exam: string
        }[]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      downgrade_expired_plans: { Args: never; Returns: undefined }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_attempt_review: {
        Args: { p_attempt_id: string }
        Returns: {
          awarded_marks: number
          correct_index: number
          explanation: Json
          is_correct: boolean
          marks: number
          options_order: Json
          q_options: Json
          q_position: number
          q_question: Json
          question_id: string
          section_label: string
          selected_index: number
        }[]
      }
      get_leaderboard: {
        Args: { p_limit?: number; p_test_id: string }
        Returns: {
          avatar_url: string
          full_name: string
          score: number
          time_taken_seconds: number
          user_id: string
        }[]
      }
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
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      reject_payment_request: {
        Args: { p_note?: string; p_request_id: string }
        Returns: undefined
      }
      submit_attempt: {
        Args: { p_attempt_id: string }
        Returns: {
          out_accuracy: number
          out_correct_count: number
          out_incorrect_count: number
          out_score: number
          out_skipped_count: number
          out_time_taken_seconds: number
          out_total_marks: number
        }[]
      }
      verify_payment_request: {
        Args: { p_note?: string; p_request_id: string }
        Returns: {
          out_expires_at: string
          out_plan: string
          out_user_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      attempt_status: "in_progress" | "submitted" | "abandoned"
      preferred_language: "english" | "bengali" | "hindi"
      promo_grant_type: "pro_monthly" | "pro_yearly" | "custom" | "discount"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      promo_grant_type: ["pro_monthly", "pro_yearly", "custom", "discount"],
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
