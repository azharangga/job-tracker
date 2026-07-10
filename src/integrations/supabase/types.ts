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
      application_activities: {
        Row: {
          application_id: string
          created_at: string
          id: string
          payload: Json
          type: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          payload?: Json
          type: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          payload?: Json
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_activities_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_checklist: {
        Row: {
          application_id: string
          created_at: string
          done: boolean
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          application_id: string
          created_at?: string
          done?: boolean
          id?: string
          label: string
          sort_order?: number
        }
        Update: {
          application_id?: string
          created_at?: string
          done?: boolean
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "application_checklist_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_timeline: {
        Row: {
          application_id: string
          created_at: string
          id: string
          notes: string | null
          occurred_at: string
          stage: Database["public"]["Enums"]["app_status"]
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          notes?: string | null
          occurred_at?: string
          stage: Database["public"]["Enums"]["app_status"]
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          occurred_at?: string
          stage?: Database["public"]["Enums"]["app_status"]
        }
        Relationships: [
          {
            foreignKeyName: "application_timeline_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applied_at: string | null
          career_url: string | null
          company_id: string | null
          cover_letter_document_id: string | null
          created_at: string
          currency: string | null
          cv_document_id: string | null
          deadline: string | null
          employment_type: Database["public"]["Enums"]["employment_type"] | null
          id: string
          job_url: string | null
          location: string | null
          notes: string | null
          platform: string | null
          portfolio_document_id: string | null
          position: string
          priority: Database["public"]["Enums"]["priority"] | null
          recruiter_id: string | null
          salary_max: number | null
          salary_min: number | null
          status: Database["public"]["Enums"]["app_status"]
          tags: string[]
          updated_at: string
          work_mode: Database["public"]["Enums"]["work_mode"] | null
        }
        Insert: {
          applied_at?: string | null
          career_url?: string | null
          company_id?: string | null
          cover_letter_document_id?: string | null
          created_at?: string
          currency?: string | null
          cv_document_id?: string | null
          deadline?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          id?: string
          job_url?: string | null
          location?: string | null
          notes?: string | null
          platform?: string | null
          portfolio_document_id?: string | null
          position: string
          priority?: Database["public"]["Enums"]["priority"] | null
          recruiter_id?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: Database["public"]["Enums"]["app_status"]
          tags?: string[]
          updated_at?: string
          work_mode?: Database["public"]["Enums"]["work_mode"] | null
        }
        Update: {
          applied_at?: string | null
          career_url?: string | null
          company_id?: string | null
          cover_letter_document_id?: string | null
          created_at?: string
          currency?: string | null
          cv_document_id?: string | null
          deadline?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          id?: string
          job_url?: string | null
          location?: string | null
          notes?: string | null
          platform?: string | null
          portfolio_document_id?: string | null
          position?: string
          priority?: Database["public"]["Enums"]["priority"] | null
          recruiter_id?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: Database["public"]["Enums"]["app_status"]
          tags?: string[]
          updated_at?: string
          work_mode?: Database["public"]["Enums"]["work_mode"] | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_cover_letter_document_id_fkey"
            columns: ["cover_letter_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_cv_document_id_fkey"
            columns: ["cv_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_portfolio_document_id_fkey"
            columns: ["portfolio_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          application_id: string | null
          created_at: string
          ends_at: string | null
          id: string
          kind: Database["public"]["Enums"]["event_kind"]
          location: string | null
          notes: string | null
          starts_at: string
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["event_kind"]
          location?: string | null
          notes?: string | null
          starts_at: string
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          application_id?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["event_kind"]
          location?: string | null
          notes?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          industry: string | null
          location: string | null
          logo_url: string | null
          name: string
          notes: string | null
          size: string | null
          slug: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          logo_url?: string | null
          name: string
          notes?: string | null
          size?: string | null
          slug?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          logo_url?: string | null
          name?: string
          notes?: string | null
          size?: string | null
          slug?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company_id: string | null
          created_at: string
          email: string | null
          id: string
          linkedin: string | null
          name: string
          notes: string | null
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          linkedin?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          linkedin?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          description: string | null
          id: string
          kind: Database["public"]["Enums"]["document_kind"]
          mime: string | null
          name: string
          size: number | null
          storage_path: string | null
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["document_kind"]
          mime?: string | null
          name: string
          size?: number | null
          storage_path?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["document_kind"]
          mime?: string | null
          name?: string
          size?: number | null
          storage_path?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      notes: {
        Row: {
          application_id: string | null
          body_markdown: string
          company_id: string | null
          created_at: string
          id: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          body_markdown?: string
          company_id?: string | null
          created_at?: string
          id?: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          body_markdown?: string
          company_id?: string | null
          created_at?: string
          id?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          remember_me: boolean
          token_hash: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          remember_me?: boolean
          token_hash: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          remember_me?: boolean
          token_hash?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          application_id: string | null
          created_at: string
          description: string | null
          due_at: string | null
          id: string
          priority: Database["public"]["Enums"]["priority"] | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["priority"] | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["priority"] | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          last_login_at: string | null
          name: string
          password_hash: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          last_login_at?: string | null
          name: string
          password_hash: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          last_login_at?: string | null
          name?: string
          password_hash?: string
          updated_at?: string
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
      app_status:
        | "wishlist"
        | "applied"
        | "hr_screening"
        | "technical_test"
        | "user_interview"
        | "hr_interview"
        | "final_interview"
        | "offer"
        | "accepted"
        | "rejected"
        | "withdrawn"
      document_kind:
        | "cv"
        | "cover_letter"
        | "portfolio"
        | "certificate"
        | "transcript"
        | "photo"
        | "other"
      employment_type:
        | "full_time"
        | "part_time"
        | "internship"
        | "freelance"
        | "contract"
      event_kind:
        | "interview"
        | "technical_test"
        | "deadline"
        | "follow_up"
        | "offer_call"
        | "other"
      priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "in_progress" | "done" | "cancelled"
      work_mode: "remote" | "hybrid" | "onsite"
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
      app_status: [
        "wishlist",
        "applied",
        "hr_screening",
        "technical_test",
        "user_interview",
        "hr_interview",
        "final_interview",
        "offer",
        "accepted",
        "rejected",
        "withdrawn",
      ],
      document_kind: [
        "cv",
        "cover_letter",
        "portfolio",
        "certificate",
        "transcript",
        "photo",
        "other",
      ],
      employment_type: [
        "full_time",
        "part_time",
        "internship",
        "freelance",
        "contract",
      ],
      event_kind: [
        "interview",
        "technical_test",
        "deadline",
        "follow_up",
        "offer_call",
        "other",
      ],
      priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "in_progress", "done", "cancelled"],
      work_mode: ["remote", "hybrid", "onsite"],
    },
  },
} as const
