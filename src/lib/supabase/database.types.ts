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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          permissions: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          permissions?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          permissions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "app_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          address: string | null
          capacity: number | null
          class_template_id: string | null
          date: string | null
          day_of_week: string | null
          end_datetime: string | null
          end_time: string | null
          event_type: string | null
          id: string
          instructor_id: string | null
          instructor_name: string | null
          organization_id: string | null
          room_id: string | null
          start_datetime: string
          start_time: string | null
          status: string | null
          student_id: string | null
          title: string
          type: string | null
          unit_id: string | null
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          class_template_id?: string | null
          date?: string | null
          day_of_week?: string | null
          end_datetime?: string | null
          end_time?: string | null
          event_type?: string | null
          id?: string
          instructor_id?: string | null
          instructor_name?: string | null
          organization_id?: string | null
          room_id?: string | null
          start_datetime: string
          start_time?: string | null
          status?: string | null
          student_id?: string | null
          title: string
          type?: string | null
          unit_id?: string | null
        }
        Update: {
          address?: string | null
          capacity?: number | null
          class_template_id?: string | null
          date?: string | null
          day_of_week?: string | null
          end_datetime?: string | null
          end_time?: string | null
          event_type?: string | null
          id?: string
          instructor_id?: string | null
          instructor_name?: string | null
          organization_id?: string | null
          room_id?: string | null
          start_datetime?: string
          start_time?: string | null
          status?: string | null
          student_id?: string | null
          title?: string
          type?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_class_template_id_fkey"
            columns: ["class_template_id"]
            isOneToOne: false
            referencedRelation: "class_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          chat_id: string | null
          content: string | null
          created_at: string | null
          file_name: string | null
          id: string
          is_read: boolean | null
          media_url: string | null
          message_type: string | null
          reactions: Json | null
          reply_to_id: string | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          chat_id?: string | null
          content?: string | null
          created_at?: string | null
          file_name?: string | null
          id?: string
          is_read?: boolean | null
          media_url?: string | null
          message_type?: string | null
          reactions?: Json | null
          reply_to_id?: string | null
          sender_id: string
          sender_type: string
        }
        Update: {
          chat_id?: string | null
          content?: string | null
          created_at?: string | null
          file_name?: string | null
          id?: string
          is_read?: boolean | null
          media_url?: string | null
          message_type?: string | null
          reactions?: Json | null
          reply_to_id?: string | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "vw_chat_details"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          chat_id: string
          is_archived: boolean | null
          joined_at: string | null
          participant_id: string
          participant_type: string
          unread_count: number | null
        }
        Insert: {
          chat_id: string
          is_archived?: boolean | null
          joined_at?: string | null
          participant_id: string
          participant_type: string
          unread_count?: number | null
        }
        Update: {
          chat_id?: string
          is_archived?: boolean | null
          joined_at?: string | null
          participant_id?: string
          participant_type?: string
          unread_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "vw_chat_details"
            referencedColumns: ["chat_id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string | null
          id: string
          integration_type: string | null
          last_message_content: string | null
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          integration_type?: string | null
          last_message_content?: string | null
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          integration_type?: string | null
          last_message_content?: string | null
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      class_attendees: {
        Row: {
          class_id: string | null
          created_at: string | null
          id: string
          organization_id: string | null
          status: string | null
          student_id: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          status?: string | null
          student_id?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          status?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_attendees_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_attendees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      class_templates: {
        Row: {
          color: string | null
          description: string | null
          duration_minutes: number | null
          icon: string | null
          id: string
          organization_id: string | null
          title: string
        }
        Insert: {
          color?: string | null
          description?: string | null
          duration_minutes?: number | null
          icon?: string | null
          id?: string
          organization_id?: string | null
          title: string
        }
        Update: {
          color?: string | null
          description?: string | null
          duration_minutes?: number | null
          icon?: string | null
          id?: string
          organization_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          attendees_count: number | null
          capacity: number | null
          end_time: string
          id: string
          instructor_name: string | null
          organization_id: string
          recurrence_id: string | null
          start_time: string
          status: string | null
          title: string
        }
        Insert: {
          attendees_count?: number | null
          capacity?: number | null
          end_time: string
          id?: string
          instructor_name?: string | null
          organization_id: string
          recurrence_id?: string | null
          start_time: string
          status?: string | null
          title: string
        }
        Update: {
          attendees_count?: number | null
          capacity?: number | null
          end_time?: string
          id?: string
          instructor_name?: string | null
          organization_id?: string
          recurrence_id?: string | null
          start_time?: string
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      event_enrollments: {
        Row: {
          created_at: string
          event_id: string
          id: string
          organization_id: string
          status: string | null
          student_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          organization_id: string
          status?: string | null
          student_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          organization_id?: string
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_enrollments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category: string | null
          created_at: string | null
          difficulty: string | null
          id: string
          muscle_group: string | null
          name: string
          organization_id: string | null
          tags: string[] | null
          target_muscle: string | null
          video_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          difficulty?: string | null
          id?: string
          muscle_group?: string | null
          name: string
          organization_id?: string | null
          tags?: string[] | null
          target_muscle?: string | null
          video_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          difficulty?: string | null
          id?: string
          muscle_group?: string | null
          name?: string
          organization_id?: string | null
          tags?: string[] | null
          target_muscle?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      financial_summary: {
        Row: {
          expenses: number | null
          id: string
          month: string | null
          organization_id: string | null
          revenue: number | null
        }
        Insert: {
          expenses?: number | null
          id?: string
          month?: string | null
          organization_id?: string | null
          revenue?: number | null
        }
        Update: {
          expenses?: number | null
          id?: string
          month?: string | null
          organization_id?: string | null
          revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_summary_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      instructors: {
        Row: {
          allowed_unit_ids: string[] | null
          bio: string | null
          created_at: string | null
          id: string
          name: string | null
          organization_id: string | null
          user_id: string | null
        }
        Insert: {
          allowed_unit_ids?: string[] | null
          bio?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          allowed_unit_ids?: string[] | null
          bio?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          organization_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          interest_amount: number | null
          organization_id: string | null
          paid_at: string | null
          payment_method: string | null
          penalty_amount: number | null
          plan_id: string | null
          recurrence_group_id: string | null
          status: string | null
          student_id: string | null
          total_paid: number | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          interest_amount?: number | null
          organization_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          penalty_amount?: number | null
          plan_id?: string | null
          recurrence_group_id?: string | null
          status?: string | null
          student_id?: string | null
          total_paid?: number | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          interest_amount?: number | null
          organization_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          penalty_amount?: number | null
          plan_id?: string | null
          recurrence_group_id?: string | null
          status?: string | null
          student_id?: string | null
          total_paid?: number | null
        }
        Relationships: []
      }
      membership_plans: {
        Row: {
          active: boolean | null
          created_at: string | null
          credits: number | null
          days_per_week: number | null
          description: string | null
          duration_months: number | null
          id: string
          name: string
          organization_id: string
          plan_type: string | null
          price: number
          recurrence: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          credits?: number | null
          days_per_week?: number | null
          description?: string | null
          duration_months?: number | null
          id?: string
          name: string
          organization_id: string
          plan_type?: string | null
          price?: number
          recurrence?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          credits?: number | null
          days_per_week?: number | null
          description?: string | null
          duration_months?: number | null
          id?: string
          name?: string
          organization_id?: string
          plan_type?: string | null
          price?: number
          recurrence?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          organization_id: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          organization_id?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          organization_id?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          address: string | null
          address_city: string | null
          address_complement: string | null
          address_line1: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_zip: string | null
          business_type: string
          cnpj_cpf: string | null
          config_absence_penalty_action: string | null
          config_cancellation_window_minutes: number | null
          config_churn_days: number | null
          config_currency: string | null
          config_fine_percent: number | null
          config_interest_monthly_percent: number | null
          config_invoice_days_before: number | null
          config_late_checkin_policy: string | null
          config_max_absences_month: number | null
          config_min_presence_pct: number | null
          config_notify_churn: boolean | null
          config_notify_due_date: boolean | null
          config_notify_overdue: boolean | null
          contact_email: string | null
          contact_phone: string | null
          cpf_cnpj: string | null
          created_at: string | null
          description: string | null
          email: string | null
          has_physical_location: boolean | null
          id: string
          instagram: string | null
          limit_students: number | null
          logo_url: string | null
          name: string
          onboarding_completed: boolean | null
          opening_hours: Json | null
          phone: string | null
          plan_id: string | null
          plan_type: string | null
          primary_color: string | null
          schedule: Json | null
          secondary_color: string | null
          student_range: string | null
          subscription_status: string | null
          trial_end: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_line1?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_zip?: string | null
          business_type: string
          cnpj_cpf?: string | null
          config_absence_penalty_action?: string | null
          config_cancellation_window_minutes?: number | null
          config_churn_days?: number | null
          config_currency?: string | null
          config_fine_percent?: number | null
          config_interest_monthly_percent?: number | null
          config_invoice_days_before?: number | null
          config_late_checkin_policy?: string | null
          config_max_absences_month?: number | null
          config_min_presence_pct?: number | null
          config_notify_churn?: boolean | null
          config_notify_due_date?: boolean | null
          config_notify_overdue?: boolean | null
          contact_email?: string | null
          contact_phone?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          has_physical_location?: boolean | null
          id?: string
          instagram?: string | null
          limit_students?: number | null
          logo_url?: string | null
          name: string
          onboarding_completed?: boolean | null
          opening_hours?: Json | null
          phone?: string | null
          plan_id?: string | null
          plan_type?: string | null
          primary_color?: string | null
          schedule?: Json | null
          secondary_color?: string | null
          student_range?: string | null
          subscription_status?: string | null
          trial_end?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_line1?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_zip?: string | null
          business_type?: string
          cnpj_cpf?: string | null
          config_absence_penalty_action?: string | null
          config_cancellation_window_minutes?: number | null
          config_churn_days?: number | null
          config_currency?: string | null
          config_fine_percent?: number | null
          config_interest_monthly_percent?: number | null
          config_invoice_days_before?: number | null
          config_late_checkin_policy?: string | null
          config_max_absences_month?: number | null
          config_min_presence_pct?: number | null
          config_notify_churn?: boolean | null
          config_notify_due_date?: boolean | null
          config_notify_overdue?: boolean | null
          contact_email?: string | null
          contact_phone?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          has_physical_location?: boolean | null
          id?: string
          instagram?: string | null
          limit_students?: number | null
          logo_url?: string | null
          name?: string
          onboarding_completed?: boolean | null
          opening_hours?: Json | null
          phone?: string | null
          plan_id?: string | null
          plan_type?: string | null
          primary_color?: string | null
          schedule?: Json | null
          secondary_color?: string | null
          student_range?: string | null
          subscription_status?: string | null
          trial_end?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean | null
          check_in_limit: number | null
          checkin_cycle: string | null
          checkin_limit: number | null
          color: string | null
          description: string | null
          duration_days: number | null
          features: Json | null
          frequency: string | null
          id: string
          max_students: number | null
          name: string
          organization_id: string | null
          price: number | null
          promo_duration_months: number | null
          promo_price: number | null
          type: string | null
          validity_days: number | null
        }
        Insert: {
          active?: boolean | null
          check_in_limit?: number | null
          checkin_cycle?: string | null
          checkin_limit?: number | null
          color?: string | null
          description?: string | null
          duration_days?: number | null
          features?: Json | null
          frequency?: string | null
          id?: string
          max_students?: number | null
          name: string
          organization_id?: string | null
          price?: number | null
          promo_duration_months?: number | null
          promo_price?: number | null
          type?: string | null
          validity_days?: number | null
        }
        Update: {
          active?: boolean | null
          check_in_limit?: number | null
          checkin_cycle?: string | null
          checkin_limit?: number | null
          color?: string | null
          description?: string | null
          duration_days?: number | null
          features?: Json | null
          frequency?: string | null
          id?: string
          max_students?: number | null
          name?: string
          organization_id?: string | null
          price?: number | null
          promo_duration_months?: number | null
          promo_price?: number | null
          type?: string | null
          validity_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          has_system_access: boolean | null
          id: string
          is_instructor: boolean | null
          job_title: string | null
          must_change_password: boolean | null
          organization_id: string | null
          phone: string | null
          role: string | null
          role_id: string | null
          show_public_profile: boolean | null
          status: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          has_system_access?: boolean | null
          id: string
          is_instructor?: boolean | null
          job_title?: string | null
          must_change_password?: boolean | null
          organization_id?: string | null
          phone?: string | null
          role?: string | null
          role_id?: string | null
          show_public_profile?: boolean | null
          status?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          has_system_access?: boolean | null
          id?: string
          is_instructor?: boolean | null
          job_title?: string | null
          must_change_password?: boolean | null
          organization_id?: string | null
          phone?: string | null
          role?: string | null
          role_id?: string | null
          show_public_profile?: boolean | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "app_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          capacity: number | null
          description: string | null
          id: string
          name: string
          organization_id: string | null
          unit_id: string | null
        }
        Insert: {
          capacity?: number | null
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          unit_id?: string | null
        }
        Update: {
          capacity?: number | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_charges: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          kiwify_order_id: string | null
          kiwify_subscription_id: string | null
          organization_id: string
          paid_at: string | null
          payment_method: string
          plan_tier: string | null
          saas_subscription_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          kiwify_order_id?: string | null
          kiwify_subscription_id?: string | null
          organization_id: string
          paid_at?: string | null
          payment_method: string
          plan_tier?: string | null
          saas_subscription_id: string
          status: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          kiwify_order_id?: string | null
          kiwify_subscription_id?: string | null
          organization_id?: string
          paid_at?: string | null
          payment_method?: string
          plan_tier?: string | null
          saas_subscription_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "saas_charges_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_charges_saas_subscription_id_fkey"
            columns: ["saas_subscription_id"]
            isOneToOne: false
            referencedRelation: "saas_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_coupons: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          duration_months: number | null
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          duration_months?: number | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          duration_months?: number | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      saas_plans: {
        Row: {
          active: boolean | null
          allowed_features: Json | null
          created_at: string | null
          description: string | null
          id: string
          interval: string | null
          marketing_highlights: Json | null
          marketing_subtitle: string | null
          max_students: number | null
          name: string
          price: number
          promo_months: number | null
          promo_price: number | null
          tier: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          allowed_features?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          interval?: string | null
          marketing_highlights?: Json | null
          marketing_subtitle?: string | null
          max_students?: number | null
          name: string
          price: number
          promo_months?: number | null
          promo_price?: number | null
          tier: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          allowed_features?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          interval?: string | null
          marketing_highlights?: Json | null
          marketing_subtitle?: string | null
          max_students?: number | null
          name?: string
          price?: number
          promo_months?: number | null
          promo_price?: number | null
          tier?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      saas_subscription_events: {
        Row: {
          applied_at: string | null
          created_at: string
          effective_at: string
          event_type: string
          id: string
          kiwify_order_id: string | null
          kiwify_subscription_id: string | null
          metadata: Json | null
          new_plan_tier: string
          new_price: number | null
          organization_id: string
          previous_plan_tier: string | null
          previous_price: number | null
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          effective_at?: string
          event_type: string
          id?: string
          kiwify_order_id?: string | null
          kiwify_subscription_id?: string | null
          metadata?: Json | null
          new_plan_tier: string
          new_price?: number | null
          organization_id: string
          previous_plan_tier?: string | null
          previous_price?: number | null
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          effective_at?: string
          event_type?: string
          id?: string
          kiwify_order_id?: string | null
          kiwify_subscription_id?: string | null
          metadata?: Json | null
          new_plan_tier?: string
          new_price?: number | null
          organization_id?: string
          previous_plan_tier?: string | null
          previous_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "saas_subscription_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_subscriptions: {
        Row: {
          cobrancas_pagas: number | null
          coupon_id: string | null
          created_at: string | null
          dia_vencimento: number
          id: string
          inicio_carencia: string | null
          kiwify_order_id: string | null
          kiwify_subscription_id: string | null
          manual_discount_amount: number | null
          manual_discount_percentage: number | null
          manual_price_override: number | null
          metodo: string
          organization_id: string | null
          payment_token: string | null
          pending_effective_at: string | null
          pending_limit_students: number | null
          pending_plan_id: string | null
          pending_plan_tier: string | null
          plan_paid_id: string | null
          plan_tier: string | null
          promo_months_remaining: number | null
          promo_price: number | null
          proximo_vencimento: string | null
          saas_plan_id: string | null
          status: string
          updated_at: string | null
          valor_mensal: number
        }
        Insert: {
          cobrancas_pagas?: number | null
          coupon_id?: string | null
          created_at?: string | null
          dia_vencimento: number
          id?: string
          inicio_carencia?: string | null
          kiwify_order_id?: string | null
          kiwify_subscription_id?: string | null
          manual_discount_amount?: number | null
          manual_discount_percentage?: number | null
          manual_price_override?: number | null
          metodo: string
          organization_id?: string | null
          payment_token?: string | null
          pending_effective_at?: string | null
          pending_limit_students?: number | null
          pending_plan_id?: string | null
          pending_plan_tier?: string | null
          plan_paid_id?: string | null
          plan_tier?: string | null
          promo_months_remaining?: number | null
          promo_price?: number | null
          proximo_vencimento?: string | null
          saas_plan_id?: string | null
          status?: string
          updated_at?: string | null
          valor_mensal: number
        }
        Update: {
          cobrancas_pagas?: number | null
          coupon_id?: string | null
          created_at?: string | null
          dia_vencimento?: number
          id?: string
          inicio_carencia?: string | null
          kiwify_order_id?: string | null
          kiwify_subscription_id?: string | null
          manual_discount_amount?: number | null
          manual_discount_percentage?: number | null
          manual_price_override?: number | null
          metodo?: string
          organization_id?: string | null
          payment_token?: string | null
          pending_effective_at?: string | null
          pending_limit_students?: number | null
          pending_plan_id?: string | null
          pending_plan_tier?: string | null
          plan_paid_id?: string | null
          plan_tier?: string | null
          promo_months_remaining?: number | null
          promo_price?: number | null
          proximo_vencimento?: string | null
          saas_plan_id?: string | null
          status?: string
          updated_at?: string | null
          valor_mensal?: number
        }
        Relationships: [
          {
            foreignKeyName: "saas_subscriptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "saas_coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_subscriptions_pending_plan_id_fkey"
            columns: ["pending_plan_id"]
            isOneToOne: false
            referencedRelation: "saas_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_subscriptions_plan_paid_id_fkey"
            columns: ["plan_paid_id"]
            isOneToOne: false
            referencedRelation: "saas_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_subscriptions_saas_plan_id_fkey"
            columns: ["saas_plan_id"]
            isOneToOne: false
            referencedRelation: "saas_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      student_credits_log: {
        Row: {
          change_amount: number
          created_at: string | null
          id: string
          organization_id: string
          reason: string | null
          reference_id: string | null
          student_id: string | null
        }
        Insert: {
          change_amount: number
          created_at?: string | null
          id?: string
          organization_id: string
          reason?: string | null
          reference_id?: string | null
          student_id?: string | null
        }
        Update: {
          change_amount?: number
          created_at?: string | null
          id?: string
          organization_id?: string
          reason?: string | null
          reference_id?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_credits_log_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_measurements: {
        Row: {
          arms: number | null
          bmi: number | null
          body_fat: number | null
          chest: number | null
          created_at: string
          height: number | null
          hips: number | null
          id: string
          organization_id: string
          recorded_at: string | null
          skinfold: number | null
          student_id: string
          thighs: number | null
          waist: number | null
          weight: number | null
        }
        Insert: {
          arms?: number | null
          bmi?: number | null
          body_fat?: number | null
          chest?: number | null
          created_at?: string
          height?: number | null
          hips?: number | null
          id?: string
          organization_id: string
          recorded_at?: string | null
          skinfold?: number | null
          student_id: string
          thighs?: number | null
          waist?: number | null
          weight?: number | null
        }
        Update: {
          arms?: number | null
          bmi?: number | null
          body_fat?: number | null
          chest?: number | null
          created_at?: string
          height?: number | null
          hips?: number | null
          id?: string
          organization_id?: string
          recorded_at?: string | null
          skinfold?: number | null
          student_id?: string
          thighs?: number | null
          waist?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_measurements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_medical_records: {
        Row: {
          characteristics: string | null
          difficulties: string | null
          disabilities: string | null
          id: string
          other_notes: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          characteristics?: string | null
          difficulties?: string | null
          disabilities?: string | null
          id?: string
          other_notes?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          characteristics?: string | null
          difficulties?: string | null
          disabilities?: string | null
          id?: string
          other_notes?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_medical_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_plan_history: {
        Row: {
          created_at: string | null
          discount_end_date: string | null
          discount_type: string | null
          discount_value: number | null
          ended_at: string | null
          expiration_date: string | null
          final_price: number | null
          id: string
          plan_id: string | null
          plan_name: string | null
          plan_price: number | null
          started_at: string | null
          student_id: string
        }
        Insert: {
          created_at?: string | null
          discount_end_date?: string | null
          discount_type?: string | null
          discount_value?: number | null
          ended_at?: string | null
          expiration_date?: string | null
          final_price?: number | null
          id?: string
          plan_id?: string | null
          plan_name?: string | null
          plan_price?: number | null
          started_at?: string | null
          student_id: string
        }
        Update: {
          created_at?: string | null
          discount_end_date?: string | null
          discount_type?: string | null
          discount_value?: number | null
          ended_at?: string | null
          expiration_date?: string | null
          final_price?: number | null
          id?: string
          plan_id?: string | null
          plan_name?: string | null
          plan_price?: number | null
          started_at?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_plan_history_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_plan_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string | null
          credits_balance: number | null
          discount_end_date: string | null
          discount_type: string | null
          discount_value: number | null
          email: string | null
          full_name: string
          gender: string | null
          id: string
          objective: string | null
          organization_id: string | null
          phone: string | null
          plan: string | null
          plan_id: string | null
          status: string | null
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          credits_balance?: number | null
          discount_end_date?: string | null
          discount_type?: string | null
          discount_value?: number | null
          email?: string | null
          full_name: string
          gender?: string | null
          id?: string
          objective?: string | null
          organization_id?: string | null
          phone?: string | null
          plan?: string | null
          plan_id?: string | null
          status?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          credits_balance?: number | null
          discount_end_date?: string | null
          discount_type?: string | null
          discount_value?: number | null
          email?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          objective?: string | null
          organization_id?: string | null
          phone?: string | null
          plan?: string | null
          plan_id?: string | null
          status?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          attachment_url: string | null
          created_at: string
          id: string
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          attachment_url: string | null
          created_at: string
          description: string
          id: string
          organization_id: string | null
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          description: string
          id?: string
          organization_id?: string | null
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          description?: string
          id?: string
          organization_id?: string | null
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          action: string
          created_at: string | null
          details: string | null
          id: string
          metadata: Json | null
          organization_id: string
          resource: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          resource: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          resource?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          active: boolean | null
          address_city: string | null
          address_json: Json | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          business_type: string | null
          created_at: string | null
          email: string | null
          id: string
          is_main: boolean | null
          manager_name: string | null
          name: string
          organization_id: string
          other_service: string | null
          phone: string | null
          services: string[] | null
        }
        Insert: {
          active?: boolean | null
          address_city?: string | null
          address_json?: Json | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          business_type?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_main?: boolean | null
          manager_name?: string | null
          name: string
          organization_id: string
          other_service?: string | null
          phone?: string | null
          services?: string[] | null
        }
        Update: {
          active?: boolean | null
          address_city?: string | null
          address_json?: Json | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          business_type?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_main?: boolean | null
          manager_name?: string | null
          name?: string
          organization_id?: string
          other_service?: string | null
          phone?: string | null
          services?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          email: string | null
          event_type: string | null
          id: string
          payload: Json | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          exercise_id: string | null
          exercise_name: string | null
          id: string
          intensity: string | null
          notes: string | null
          reps: string | null
          sets: number | null
          weight: string | null
          workout_id: string
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          exercise_id?: string | null
          exercise_name?: string | null
          id?: string
          intensity?: string | null
          notes?: string | null
          reps?: string | null
          sets?: number | null
          weight?: string | null
          workout_id: string
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          exercise_id?: string | null
          exercise_name?: string | null
          id?: string
          intensity?: string | null
          notes?: string | null
          reps?: string | null
          sets?: number | null
          weight?: string | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "pending_workouts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          address: string | null
          created_at: string | null
          created_by_user_id: string | null
          credit_cost: number | null
          description: string | null
          end_time: string | null
          goal: string | null
          id: string
          instructor_id: string | null
          is_makeup: boolean | null
          location_details: string | null
          location_type: string | null
          notes: string | null
          organization_id: string
          recurrence_id: string | null
          recurrence_type: string | null
          room_id: string | null
          scheduled_at: string | null
          status: string | null
          student_id: string
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          credit_cost?: number | null
          description?: string | null
          end_time?: string | null
          goal?: string | null
          id?: string
          instructor_id?: string | null
          is_makeup?: boolean | null
          location_details?: string | null
          location_type?: string | null
          notes?: string | null
          organization_id: string
          recurrence_id?: string | null
          recurrence_type?: string | null
          room_id?: string | null
          scheduled_at?: string | null
          status?: string | null
          student_id: string
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          credit_cost?: number | null
          description?: string | null
          end_time?: string | null
          goal?: string | null
          id?: string
          instructor_id?: string | null
          is_makeup?: boolean | null
          location_details?: string | null
          location_type?: string | null
          notes?: string | null
          organization_id?: string
          recurrence_id?: string | null
          recurrence_type?: string | null
          room_id?: string | null
          scheduled_at?: string | null
          status?: string | null
          student_id?: string
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      mv_financial_summary: {
        Row: {
          month: string | null
          organization_id: string | null
          total_overdue_amount: number | null
          total_overdue_count: number | null
          total_paid_count: number | null
          total_pending_amount: number | null
          total_pending_count: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      mv_workout_stats: {
        Row: {
          last_workout_at: string | null
          organization_id: string | null
          student_id: string | null
          total_workouts: number | null
          workouts_last_30_days: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_workouts_view: {
        Row: {
          avatar_url: string | null
          id: string | null
          scheduled_at: string | null
          student_id: string | null
          student_name: string | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_chat_contacts: {
        Row: {
          avatar_url: string | null
          contact_id: string | null
          contact_type: string | null
          display_name: string | null
          organization_id: string | null
        }
        Relationships: []
      }
      vw_chat_details: {
        Row: {
          chat_id: string | null
          is_archived: boolean | null
          last_message_content: string | null
          me_id: string | null
          other_avatar: string | null
          other_id: string | null
          other_name: string | null
          other_type: string | null
          unread_count: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      vw_chat_list: {
        Row: {
          chat_id: string | null
          contact_avatar: string | null
          contact_id: string | null
          contact_name: string | null
          contact_type: string | null
          is_archived: boolean | null
          last_message_content: string | null
          last_message_sender_id: string | null
          last_message_time: string | null
          last_message_type: string | null
          owner_id: string | null
          unread_count: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "vw_chat_details"
            referencedColumns: ["chat_id"]
          },
        ]
      }
      vw_payments: {
        Row: {
          amount: number | null
          created_at: string | null
          description: string | null
          due_date: string | null
          dynamic_status: string | null
          id: string | null
          interest_amount: number | null
          organization_id: string | null
          original_status: string | null
          payment_date: string | null
          payment_method: string | null
          penalty_amount: number | null
          recurrence_group_id: string | null
          student_avatar: string | null
          student_id: string | null
          student_name: string | null
          total_paid: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_participant_to_event: {
        Args: { p_event_id: string; p_student_id: string }
        Returns: Json
      }
      auth_user_org_id: { Args: never; Returns: string }
      auth_user_role: { Args: never; Returns: string }
      auto_update_session_statuses: { Args: never; Returns: undefined }
      check_booking_eligibility:
        | { Args: { p_date: string; p_student_id: string }; Returns: Json }
        | { Args: { p_date: string; p_student_id: string }; Returns: Json }
      check_overbooking: {
        Args: { p_end_time: string; p_org_id: string; p_start_time: string }
        Returns: boolean
      }
      decrement_student_credits: {
        Args: { p_amount?: number; p_student_id: string }
        Returns: number
      }
      deduct_credit: {
        Args: {
          p_amount: number
          p_reason: string
          p_ref_id: string
          p_student_id: string
        }
        Returns: undefined
      }
      drop_policy_if_exists: {
        Args: { p_name: string; t_name: string }
        Returns: undefined
      }
      get_auth_org_id: { Args: never; Returns: string }
      last_activity: {
        Args: { student_row: Database["public"]["Tables"]["students"]["Row"] }
        Returns: string
      }
      remove_participant_from_event: {
        Args: { p_event_id: string; p_student_id: string }
        Returns: undefined
      }
      update_class_statuses: { Args: never; Returns: undefined }
      update_finished_classes_status: { Args: never; Returns: undefined }
    }
    Enums: {
      BusinessType: "STARTER" | "PLUS" | "STUDIO" | "PRO" | "ENTERPRISE"
      EventStatus:
        | "PREVISTA"
        | "EM_EXECUCAO"
        | "PENDENTE"
        | "REALIZADA"
        | "FALTA"
      EventType: "CLASS" | "TRAINING"
      MessageType: "TEXT" | "IMAGE" | "AUDIO" | "FILE"
      ParticipantStatus: "CONFIRMED" | "CANCELED" | "ATTENDED" | "MISSED"
      PenaltyType: "NONE" | "LOSE_CREDIT" | "FEE"
      PlanScheduleType: "FIXED" | "FLEXIBLE" | "OPEN"
      PlanStatus: "ACTIVE" | "PAUSED" | "ENDED"
      StudentStatus: "ACTIVE" | "INACTIVE" | "CANCELED"
      UserRole: "SUPER_ADMIN" | "OWNER" | "ADMIN" | "INSTRUCTOR" | "STAFF"
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
      BusinessType: ["STARTER", "PLUS", "STUDIO", "PRO", "ENTERPRISE"],
      EventStatus: [
        "PREVISTA",
        "EM_EXECUCAO",
        "PENDENTE",
        "REALIZADA",
        "FALTA",
      ],
      EventType: ["CLASS", "TRAINING"],
      MessageType: ["TEXT", "IMAGE", "AUDIO", "FILE"],
      ParticipantStatus: ["CONFIRMED", "CANCELED", "ATTENDED", "MISSED"],
      PenaltyType: ["NONE", "LOSE_CREDIT", "FEE"],
      PlanScheduleType: ["FIXED", "FLEXIBLE", "OPEN"],
      PlanStatus: ["ACTIVE", "PAUSED", "ENDED"],
      StudentStatus: ["ACTIVE", "INACTIVE", "CANCELED"],
      UserRole: ["SUPER_ADMIN", "OWNER", "ADMIN", "INSTRUCTOR", "STAFF"],
    },
  },
} as const
