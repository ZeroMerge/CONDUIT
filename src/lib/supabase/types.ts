// src/lib/supabase/types.ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_seed: string
          bio: string | null
          created_at: string
          current_streak: number
          longest_streak: number
          last_completed_date: string | null
          total_time_saved_minutes: number
          total_xp: number
          is_admin: boolean
        }
        Insert: {
          id: string
          username: string
          avatar_seed: string
          bio?: string | null
          created_at?: string
          current_streak?: number
          longest_streak?: number
          last_completed_date?: string | null
          total_time_saved_minutes?: number
          total_xp?: number
          is_admin?: boolean
        }
        Update: {
          id?: string
          username?: string
          avatar_seed?: string
          bio?: string | null
          created_at?: string
          current_streak?: number
          longest_streak?: number
          last_completed_date?: string | null
          total_time_saved_minutes?: number
          total_xp?: number
          is_admin?: boolean
        }
        Relationships: []
      }
      flows: {
        Row: {
          id: string
          title: string
          description: string
          category: string
          estimated_minutes: number
          creator_id: string | null
          readme_markdown: string | null
          status: 'verified' | 'unverified' | 'pending'
          safety_status: 'safe' | 'caution' | 'risky'
          completion_count: number
          run_count: number
          like_count: number
          created_at: string
          xp_reward: number
          parent_flow_id: string | null
          fork_count: number
        }
        Insert: {
          id?: string
          title: string
          description: string
          category: string
          estimated_minutes?: number
          creator_id?: string | null
          readme_markdown?: string | null
          status?: 'verified' | 'unverified' | 'pending'
          safety_status?: 'safe' | 'caution' | 'risky'
          completion_count?: number
          run_count?: number
          like_count?: number
          created_at?: string
          xp_reward?: number
          parent_flow_id?: string | null
          fork_count?: number
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category?: string
          estimated_minutes?: number
          creator_id?: string | null
          readme_markdown?: string | null
          status?: 'verified' | 'unverified' | 'pending'
          safety_status?: 'safe' | 'caution' | 'risky'
          completion_count?: number
          run_count?: number
          like_count?: number
          created_at?: string
          xp_reward?: number
          parent_flow_id?: string | null
          fork_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "flows_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flows_parent_flow_id_fkey"
            columns: ["parent_flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          }
        ]
      }
      steps: {
        Row: {
          id: string
          flow_id: string
          order_index: number
          title: string
          instruction: string
          prompt_text: string
          expected_outcome: string
          example_output: string | null
          start_count: number
          complete_count: number
        }
        Insert: {
          id?: string
          flow_id: string
          order_index: number
          title: string
          instruction: string
          prompt_text: string
          expected_outcome: string
          example_output?: string | null
          start_count?: number
          complete_count?: number
        }
        Update: {
          id?: string
          flow_id?: string
          order_index?: number
          title?: string
          instruction?: string
          prompt_text?: string
          expected_outcome?: string
          example_output?: string | null
          start_count?: number
          complete_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "steps_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          }
        ]
      }
      completions: {
        Row: {
          id: string
          flow_id: string
          user_id: string
          success: boolean
          difficulty: 'easy' | 'medium' | 'hard' | null
          feedback: string | null
          proof_url: string | null
          completed_at: string
          time_saved_minutes: number
        }
        Insert: {
          id?: string
          flow_id: string
          user_id: string
          success: boolean
          difficulty?: 'easy' | 'medium' | 'hard' | null
          feedback?: string | null
          proof_url?: string | null
          completed_at?: string
          time_saved_minutes?: number
        }
        Update: {
          id?: string
          flow_id?: string
          user_id?: string
          success?: boolean
          difficulty?: 'easy' | 'medium' | 'hard' | null
          feedback?: string | null
          proof_url?: string | null
          completed_at?: string
          time_saved_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "completions_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      likes: {
        Row: { flow_id: string; user_id: string }
        Insert: { flow_id: string; user_id: string }
        Update: { flow_id?: string; user_id?: string }
        Relationships: [
          {
            foreignKeyName: "likes_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_skills: {
        Row: { user_id: string; category: string; xp_amount: number }
        Insert: { user_id: string; category: string; xp_amount?: number }
        Update: { user_id?: string; category?: string; xp_amount?: number }
        Relationships: [
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: {
          id: string
          flow_id: string
          user_id: string
          content: string
          created_at: string
          step_id: string | null
          status: 'open' | 'closed'
          title: string | null
          type: 'comment' | 'issue'
        }
        Insert: {
          id?: string
          flow_id: string
          user_id: string
          content: string
          created_at?: string
          step_id?: string | null
          status?: 'open' | 'closed'
          title?: string | null
          type?: 'comment' | 'issue'
        }
        Update: {
          id?: string
          flow_id?: string
          user_id?: string
          content?: string
          created_at?: string
          step_id?: string | null
          status?: 'open' | 'closed'
          title?: string | null
          type?: 'comment' | 'issue'
        }
        Relationships: [
          {
            foreignKeyName: "comments_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          }
        ]
      }
      merge_requests: {
        Row: {
          id: string
          parent_flow_id: string
          fork_flow_id: string
          creator_id: string
          title: string
          description: string | null
          status: 'open' | 'merged' | 'closed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          parent_flow_id: string
          fork_flow_id: string
          creator_id: string
          title: string
          description?: string | null
          status?: 'open' | 'merged' | 'closed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          parent_flow_id?: string
          fork_flow_id?: string
          creator_id?: string
          title?: string
          description?: string | null
          status?: 'open' | 'merged' | 'closed'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merge_requests_parent_flow_id_fkey"
            columns: ["parent_flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merge_requests_fork_flow_id_fkey"
            columns: ["fork_flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merge_requests_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_run_count: {
        Args: { flow_id: string }
        Returns: undefined
      }
      increment_completion_count: {
        Args: { flow_id: string }
        Returns: undefined
      }
      increment_fork_count: {
        Args: { target_flow_id: string }
        Returns: undefined
      }
      increment_step_start: {
        Args: { target_step_id: string }
        Returns: undefined
      }
      increment_step_complete: {
        Args: { target_step_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}