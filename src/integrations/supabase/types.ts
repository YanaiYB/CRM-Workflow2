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
      brand_team_members: {
        Row: {
          brand: Database["public"]["Enums"]["brand"]
          color: string | null
          created_at: string
          id: string
          name: string
          role: string | null
          updated_at: string
        }
        Insert: {
          brand: Database["public"]["Enums"]["brand"]
          color?: string | null
          created_at?: string
          id?: string
          name: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          brand?: Database["public"]["Enums"]["brand"]
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      client_documents: {
        Row: {
          amount: number
          brand: Database["public"]["Enums"]["brand"]
          client_email: string | null
          client_id: string
          created_at: string
          currency: string
          discount: number
          doc_number: string | null
          doc_type: Database["public"]["Enums"]["morning_doc_type"]
          due_date: string | null
          email_body: string | null
          email_subject: string | null
          event_id: string | null
          id: string
          issue_date: string
          language: string
          last_synced_at: string | null
          morning_doc_id: string
          notes: string | null
          paid_amount: number
          payment_details: Json | null
          payment_method: string | null
          pdf_url: string | null
          status: string | null
        }
        Insert: {
          amount?: number
          brand: Database["public"]["Enums"]["brand"]
          client_email?: string | null
          client_id: string
          created_at?: string
          currency?: string
          discount?: number
          doc_number?: string | null
          doc_type: Database["public"]["Enums"]["morning_doc_type"]
          due_date?: string | null
          email_body?: string | null
          email_subject?: string | null
          event_id?: string | null
          id?: string
          issue_date?: string
          language?: string
          last_synced_at?: string | null
          morning_doc_id: string
          notes?: string | null
          paid_amount?: number
          payment_details?: Json | null
          payment_method?: string | null
          pdf_url?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          brand?: Database["public"]["Enums"]["brand"]
          client_email?: string | null
          client_id?: string
          created_at?: string
          currency?: string
          discount?: number
          doc_number?: string | null
          doc_type?: Database["public"]["Enums"]["morning_doc_type"]
          due_date?: string | null
          email_body?: string | null
          email_subject?: string | null
          event_id?: string | null
          id?: string
          issue_date?: string
          language?: string
          last_synced_at?: string | null
          morning_doc_id?: string
          notes?: string | null
          paid_amount?: number
          payment_details?: Json | null
          payment_method?: string | null
          pdf_url?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_documents_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          brand: Database["public"]["Enums"]["brand"]
          city: string | null
          created_at: string
          email: string | null
          id: string
          instagram: string | null
          is_recurring: boolean
          lead_source: string | null
          name: string
          notes: string | null
          phone: string | null
          referred_by: string | null
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          brand: Database["public"]["Enums"]["brand"]
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          instagram?: string | null
          is_recurring?: boolean
          lead_source?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          referred_by?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          brand?: Database["public"]["Enums"]["brand"]
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          instagram?: string | null
          is_recurring?: boolean
          lead_source?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          referred_by?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      event_checklist: {
        Row: {
          created_at: string
          event_id: string
          id: string
          is_done: boolean
          position: number
          text: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          is_done?: boolean
          position?: number
          text: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          is_done?: boolean
          position?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_checklist_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_files: {
        Row: {
          created_at: string
          event_id: string
          file_name: string
          file_path: string
          id: string
          size_bytes: number | null
          tag: Database["public"]["Enums"]["file_tag"]
        }
        Insert: {
          created_at?: string
          event_id: string
          file_name: string
          file_path: string
          id?: string
          size_bytes?: number | null
          tag?: Database["public"]["Enums"]["file_tag"]
        }
        Update: {
          created_at?: string
          event_id?: string
          file_name?: string
          file_path?: string
          id?: string
          size_bytes?: number | null
          tag?: Database["public"]["Enums"]["file_tag"]
        }
        Relationships: [
          {
            foreignKeyName: "event_files_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          event_id: string
          id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          event_id: string
          id?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          event_id?: string
          id?: string
        }
        Relationships: []
      }
      event_team: {
        Row: {
          created_at: string
          event_id: string
          id: string
          is_paid: boolean
          member_id: string | null
          name: string
          payment: number
          role: Database["public"]["Enums"]["team_role"]
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          is_paid?: boolean
          member_id?: string | null
          name: string
          payment?: number
          role: Database["public"]["Enums"]["team_role"]
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          is_paid?: boolean
          member_id?: string | null
          name?: string
          payment?: number
          role?: Database["public"]["Enums"]["team_role"]
        }
        Relationships: [
          {
            foreignKeyName: "event_team_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_team_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "brand_team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          album_delivered: boolean
          album_photos_selected: boolean
          album_photos_sent: boolean
          brand: Database["public"]["Enums"]["brand"]
          client_id: string | null
          created_at: string
          deposit: number
          event_date: string
          event_name: string
          event_type: Database["public"]["Enums"]["wedding_event_type"] | null
          id: string
          location: string | null
          package_details: string | null
          paid_amount: number
          parents_albums_count: number
          payment_receipt_path: string | null
          pipeline_stage: Database["public"]["Enums"]["pipeline_stage"]
          quick_note: string | null
          status: Database["public"]["Enums"]["event_status"]
          total_price: number
          updated_at: string
        }
        Insert: {
          album_delivered?: boolean
          album_photos_selected?: boolean
          album_photos_sent?: boolean
          brand: Database["public"]["Enums"]["brand"]
          client_id?: string | null
          created_at?: string
          deposit?: number
          event_date: string
          event_name: string
          event_type?: Database["public"]["Enums"]["wedding_event_type"] | null
          id?: string
          location?: string | null
          package_details?: string | null
          paid_amount?: number
          parents_albums_count?: number
          payment_receipt_path?: string | null
          pipeline_stage?: Database["public"]["Enums"]["pipeline_stage"]
          quick_note?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          total_price?: number
          updated_at?: string
        }
        Update: {
          album_delivered?: boolean
          album_photos_selected?: boolean
          album_photos_sent?: boolean
          brand?: Database["public"]["Enums"]["brand"]
          client_id?: string | null
          created_at?: string
          deposit?: number
          event_date?: string
          event_name?: string
          event_type?: Database["public"]["Enums"]["wedding_event_type"] | null
          id?: string
          location?: string | null
          package_details?: string | null
          paid_amount?: number
          parents_albums_count?: number
          payment_receipt_path?: string | null
          pipeline_stage?: Database["public"]["Enums"]["pipeline_stage"]
          quick_note?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      task_assignees: {
        Row: {
          created_at: string
          id: string
          member_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "brand_team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_checklist: {
        Row: {
          created_at: string
          id: string
          is_done: boolean
          position: number
          task_id: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_done?: boolean
          position?: number
          task_id: string
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          is_done?: boolean
          position?: number
          task_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_checklist_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          brand: Database["public"]["Enums"]["brand"]
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          event_id: string | null
          id: string
          position: number
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          brand: Database["public"]["Enums"]["brand"]
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          event_id?: string | null
          id?: string
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          brand?: Database["public"]["Enums"]["brand"]
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          event_id?: string | null
          id?: string
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      brand: "lore_weddings" | "depth_studios"
      event_status: "working" | "delivered" | "finished"
      file_tag: "contract" | "invoice" | "other"
      morning_doc_type:
        | "invoice"
        | "receipt"
        | "invoice_receipt"
        | "tax_invoice_receipt"
        | "proforma"
        | "credit_invoice"
      pipeline_stage:
        | "new_lead"
        | "contacted"
        | "negotiation"
        | "booked"
        | "delivered"
        | "finished"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "in_progress" | "done"
      team_role: "photographer" | "videographer" | "editor" | "assistant"
      wedding_event_type: "wedding" | "henna"
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
      brand: ["lore_weddings", "depth_studios"],
      event_status: ["working", "delivered", "finished"],
      file_tag: ["contract", "invoice", "other"],
      morning_doc_type: [
        "invoice",
        "receipt",
        "invoice_receipt",
        "tax_invoice_receipt",
        "proforma",
        "credit_invoice",
      ],
      pipeline_stage: [
        "new_lead",
        "contacted",
        "negotiation",
        "booked",
        "delivered",
        "finished",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "in_progress", "done"],
      team_role: ["photographer", "videographer", "editor", "assistant"],
      wedding_event_type: ["wedding", "henna"],
    },
  },
} as const
