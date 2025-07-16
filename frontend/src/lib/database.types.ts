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
      users: {
        Row: {
          id: string
          email: string
          role: 'client' | 'accountant' | 'admin'
          created_at: string
          updated_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          email: string
          role?: 'client' | 'accountant' | 'admin'
          created_at?: string
          updated_at?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          email?: string
          role?: 'client' | 'accountant' | 'admin'
          created_at?: string
          updated_at?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      businesses: {
        Row: {
          id: string
          name: string
          owner_id: string
          created_at: string
          updated_at: string
          settings: Json | null
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          created_at?: string
          updated_at?: string
          settings?: Json | null
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          created_at?: string
          updated_at?: string
          settings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_businesses: {
        Row: {
          id: string
          user_id: string
          business_id: string
          role: string
          permissions: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_id: string
          role?: string
          permissions?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_id?: string
          role?: string
          permissions?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_businesses_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_businesses_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          business_id: string
          amount: number
          description: string | null
          category: string | null
          date: string
          type: 'income' | 'expense' | 'transfer'
          status: 'pending' | 'approved' | 'rejected'
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          amount: number
          description?: string | null
          category?: string | null
          date: string
          type: 'income' | 'expense' | 'transfer'
          status?: 'pending' | 'approved' | 'rejected'
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          amount?: number
          description?: string | null
          category?: string | null
          date?: string
          type?: 'income' | 'expense' | 'transfer'
          status?: 'pending' | 'approved' | 'rejected'
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      reports: {
        Row: {
          id: string
          business_id: string
          type: 'profit_loss' | 'balance_sheet' | 'cash_flow' | 'tax_summary'
          title: string
          data: Json
          status: 'draft' | 'pending_review' | 'approved' | 'published'
          period_start: string | null
          period_end: string | null
          generated_by: string
          approved_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          type: 'profit_loss' | 'balance_sheet' | 'cash_flow' | 'tax_summary'
          title: string
          data: Json
          status?: 'draft' | 'pending_review' | 'approved' | 'published'
          period_start?: string | null
          period_end?: string | null
          generated_by: string
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          type?: 'profit_loss' | 'balance_sheet' | 'cash_flow' | 'tax_summary'
          title?: string
          data?: Json
          status?: 'draft' | 'pending_review' | 'approved' | 'published'
          period_start?: string | null
          period_end?: string | null
          generated_by?: string
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_generated_by_fkey"
            columns: ["generated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_approved_by_fkey"
            columns: ["approved_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      subscriptions: {
        Row: {
          id: string
          business_id: string
          plan_id: string
          status: 'active' | 'canceled' | 'past_due' | 'unpaid'
          current_period_start: string | null
          current_period_end: string | null
          stripe_subscription_id: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          plan_id: string
          status?: 'active' | 'canceled' | 'past_due' | 'unpaid'
          current_period_start?: string | null
          current_period_end?: string | null
          stripe_subscription_id?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          plan_id?: string
          status?: 'active' | 'canceled' | 'past_due' | 'unpaid'
          current_period_start?: string | null
          current_period_end?: string | null
          stripe_subscription_id?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      documents: {
        Row: {
          id: string
          business_id: string
          uploaded_by: string
          filename: string
          file_path: string
          file_size: number
          mime_type: string
          category: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          uploaded_by: string
          filename: string
          file_path: string
          file_size: number
          mime_type: string
          category?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          uploaded_by?: string
          filename?: string
          file_path?: string
          file_size?: number
          mime_type?: string
          category?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      meetings: {
        Row: {
          id: string
          business_id: string
          client_id: string
          accountant_id: string
          title: string
          description: string | null
          scheduled_for: string
          duration: number
          status: 'scheduled' | 'completed' | 'canceled'
          meeting_link: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          client_id: string
          accountant_id: string
          title: string
          description?: string | null
          scheduled_for: string
          duration?: number
          status?: 'scheduled' | 'completed' | 'canceled'
          meeting_link?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          client_id?: string
          accountant_id?: string
          title?: string
          description?: string | null
          scheduled_for?: string
          duration?: number
          status?: 'scheduled' | 'completed' | 'canceled'
          meeting_link?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_accountant_id_fkey"
            columns: ["accountant_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_businesses: {
        Args: {
          user_uuid: string
        }
        Returns: {
          business_id: string
          business_name: string
          user_role: string
          created_at: string
        }[]
      }
      get_business_metrics: {
        Args: {
          business_uuid: string
        }
        Returns: {
          total_revenue: number
          total_expenses: number
          net_income: number
          transaction_count: number
          pending_transactions: number
        }[]
      }
    }
    Enums: {
      user_role: 'client' | 'accountant' | 'admin'
      transaction_type: 'income' | 'expense' | 'transfer'
      transaction_status: 'pending' | 'approved' | 'rejected'
      report_type: 'profit_loss' | 'balance_sheet' | 'cash_flow' | 'tax_summary'
      report_status: 'draft' | 'pending_review' | 'approved' | 'published'
      subscription_status: 'active' | 'canceled' | 'past_due' | 'unpaid'
      meeting_status: 'scheduled' | 'completed' | 'canceled'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 