export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          niche: string | null
          brand_voice_profile: string | null
          subscription_tier: string
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          niche?: string | null
          brand_voice_profile?: string | null
          subscription_tier?: string
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          niche?: string | null
          brand_voice_profile?: string | null
          subscription_tier?: string
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string
          role: 'owner' | 'admin' | 'staff'
          company_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'owner' | 'admin' | 'staff'
          company_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'owner' | 'admin' | 'staff'
          company_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      locations: {
        Row: {
          id: string
          company_id: string
          google_location_id: string
          name: string
          address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          google_location_id: string
          name: string
          address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          google_location_id?: string
          name?: string
          address?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      reviews: {
        Row: {
          id: string
          location_id: string
          google_review_id: string
          rating: number
          reviewer_name: string | null
          review_text: string | null
          created_at: string
          synced_at: string
          replied: boolean
          reply_text: string | null
          reply_posted_at: string | null
          sentiment_tag: string | null
          risk_flag: boolean
        }
        Insert: {
          id?: string
          location_id: string
          google_review_id: string
          rating: number
          reviewer_name?: string | null
          review_text?: string | null
          created_at: string
          synced_at?: string
          replied?: boolean
          reply_text?: string | null
          reply_posted_at?: string | null
          sentiment_tag?: string | null
          risk_flag?: boolean
        }
        Update: {
          id?: string
          location_id?: string
          google_review_id?: string
          rating?: number
          reviewer_name?: string | null
          review_text?: string | null
          created_at?: string
          synced_at?: string
          replied?: boolean
          reply_text?: string | null
          reply_posted_at?: string | null
          sentiment_tag?: string | null
          risk_flag?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reviews_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          }
        ]
      }
      ai_logs: {
        Row: {
          id: string
          review_id: string
          draft_text: string | null
          tokens_used: number | null
          cost_estimate: number | null
          model: string
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          draft_text?: string | null
          tokens_used?: number | null
          cost_estimate?: number | null
          model?: string
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          draft_text?: string | null
          tokens_used?: number | null
          cost_estimate?: number | null
          model?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_logs_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          }
        ]
      }
      subscriptions: {
        Row: {
          id: string
          company_id: string
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          status: string
          plan: string
          renewal_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          status?: string
          plan?: string
          renewal_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          status?: string
          plan?: string
          renewal_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      google_oauth_tokens: {
        Row: {
          id: string
          company_id: string
          access_token: string | null
          refresh_token: string | null
          token_expiry: string | null
          account_email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          access_token?: string | null
          refresh_token?: string | null
          token_expiry?: string | null
          account_email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          access_token?: string | null
          refresh_token?: string | null
          token_expiry?: string | null
          account_email?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_oauth_tokens_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}

export type Company = Database['public']['Tables']['companies']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Location = Database['public']['Tables']['locations']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type AiLog = Database['public']['Tables']['ai_logs']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type GoogleOAuthToken = Database['public']['Tables']['google_oauth_tokens']['Row']
