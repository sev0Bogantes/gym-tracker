export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      exercises: {
        Row: {
          created_at: string
          id: string
          initial_weight: number | null
          name: string
          notes: string | null
          order_index: number
          reps: string
          routine_day_id: string
          routine_id: string
          sets: number
          target_weight: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          initial_weight?: number | null
          name: string
          notes?: string | null
          order_index?: number
          reps?: string
          routine_day_id: string
          routine_id: string
          sets?: number
          target_weight?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          initial_weight?: number | null
          name?: string
          notes?: string | null
          order_index?: number
          reps?: string
          routine_day_id?: string
          routine_id?: string
          sets?: number
          target_weight?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      routine_days: {
        Row: {
          created_at: string
          day_number: number
          id: string
          name: string
          routine_id: string
        }
        Insert: {
          created_at?: string
          day_number: number
          id?: string
          name: string
          routine_id: string
        }
        Update: {
          created_at?: string
          day_number?: number
          id?: string
          name?: string
          routine_id?: string
        }
        Relationships: []
      }
      routines: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          start_date: string
          total_weeks: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          start_date?: string
          total_weeks?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          start_date?: string
          total_weeks?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          logged_date: string
          notes: string | null
          reps_done: string | null
          routine_id: string
          sets_done: number | null
          user_id: string
          week_number: number
          weight_used: number | null
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          logged_date?: string
          notes?: string | null
          reps_done?: string | null
          routine_id: string
          sets_done?: number | null
          user_id: string
          week_number: number
          weight_used?: number | null
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          logged_date?: string
          notes?: string | null
          reps_done?: string | null
          routine_id?: string
          sets_done?: number | null
          user_id?: string
          week_number?: number
          weight_used?: number | null
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_complete: boolean | null
          routine_day_id: string
          routine_id: string
          started_at: string
          user_id: string
          week_number: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_complete?: boolean | null
          routine_day_id: string
          routine_id: string
          started_at?: string
          user_id: string
          week_number: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_complete?: boolean | null
          routine_day_id?: string
          routine_id?: string
          started_at?: string
          user_id?: string
          week_number?: number
        }
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
