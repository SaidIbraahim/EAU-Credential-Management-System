export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: number
          registration_id: string
          certificate_id: string | null
          full_name: string
          gender: 'male' | 'female'
          phone_number: string | null
          department: string
          faculty: string | null
          academic_year: string
          gpa: number
          grade: string
          graduation_date: string | null
          status: 'cleared' | 'un-cleared'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['students']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['students']['Insert']>
      }
      departments: {
        Row: {
          id: number
          name: string
          code: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['departments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['departments']['Insert']>
      }
      academic_years: {
        Row: {
          id: number
          academic_year: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['academic_years']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['academic_years']['Insert']>
      }
      documents: {
        Row: {
          id: number
          registration_id: number
          document_type: 'photo' | 'transcript' | 'certificate' | 'supporting'
          file_name: string
          file_size: number
          file_type: string | null
          file_url: string
          upload_date: string
        }
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['documents']['Insert']>
      }
      audit_logs: {
        Row: {
          id: number
          user_id: number
          action: string
          details: string | null
          timestamp: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'timestamp'>
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          username: string
          role: 'admin' | 'super_admin'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      faculties: {
        Row: {
          id: number
          name: string
          code: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['faculties']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['faculties']['Insert']>
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
  }
} 