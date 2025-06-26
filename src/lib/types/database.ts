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
      user_usage: {
        Row: {
          id: string
          user_id: string
          character_images: number
          decor_images: number
          scene_generation: number
          project_pages: number
          total_projects: number
          project_exports: number
          monthly_generations: number
          storage_space: number
          last_reset_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          character_images?: number
          decor_images?: number
          scene_generation?: number
          project_pages?: number
          total_projects?: number
          project_exports?: number
          monthly_generations?: number
          storage_space?: number
          last_reset_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          character_images?: number
          decor_images?: number
          scene_generation?: number
          project_pages?: number
          total_projects?: number
          project_exports?: number
          monthly_generations?: number
          storage_space?: number
          last_reset_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          cover_image: string | null
          pages_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          cover_image?: string | null
          pages_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          cover_image?: string | null
          pages_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
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
