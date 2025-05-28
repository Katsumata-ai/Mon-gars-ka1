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
      generated_images: {
        Row: {
          id: string
          user_id: string
          original_prompt: string
          optimized_prompt: string
          image_url: string
          image_type: 'character' | 'background' | 'scene'
          credits_used: number
          generation_time_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          original_prompt: string
          optimized_prompt: string
          image_url: string
          image_type: 'character' | 'background' | 'scene'
          credits_used?: number
          generation_time_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          original_prompt?: string
          optimized_prompt?: string
          image_url?: string
          image_type?: 'character' | 'background' | 'scene'
          credits_used?: number
          generation_time_ms?: number | null
          created_at?: string
        }
      }
      user_credits: {
        Row: {
          user_id: string
          credits_remaining: number
          credits_total: number
          last_reset: string
          subscription_tier: 'free' | 'pro'
        }
        Insert: {
          user_id: string
          credits_remaining?: number
          credits_total?: number
          last_reset?: string
          subscription_tier?: 'free' | 'pro'
        }
        Update: {
          user_id?: string
          credits_remaining?: number
          credits_total?: number
          last_reset?: string
          subscription_tier?: 'free' | 'pro'
        }
      }
      manga_projects: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          pages: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          pages?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          pages?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      image_type: 'character' | 'background' | 'scene'
      subscription_tier: 'free' | 'pro'
    }
  }
}
