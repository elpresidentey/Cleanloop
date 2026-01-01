// Database type definitions for Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          phone: string
          name: string
          role: 'resident' | 'collector' | 'admin'
          area: string
          street: string
          house_number: string
          coordinates: unknown | null // PostGIS POINT type
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          phone: string
          name: string
          role: 'resident' | 'collector' | 'admin'
          area: string
          street: string
          house_number: string
          coordinates?: unknown | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          phone?: string
          name?: string
          role?: 'resident' | 'collector' | 'admin'
          area?: string
          street?: string
          house_number?: string
          coordinates?: unknown | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_type: 'weekly' | 'bi-weekly' | 'on-demand'
          status: 'active' | 'paused' | 'cancelled'
          start_date: string
          end_date: string | null
          amount: number
          currency: string
          billing_cycle: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_type: 'weekly' | 'bi-weekly' | 'on-demand'
          status?: 'active' | 'paused' | 'cancelled'
          start_date?: string
          end_date?: string | null
          amount: number
          currency?: string
          billing_cycle: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_type?: 'weekly' | 'bi-weekly' | 'on-demand'
          status?: 'active' | 'paused' | 'cancelled'
          start_date?: string
          end_date?: string | null
          amount?: number
          currency?: string
          billing_cycle?: string
          created_at?: string
          updated_at?: string
        }
      }
      pickup_requests: {
        Row: {
          id: string
          user_id: string
          collector_id: string | null
          scheduled_date: string
          status: 'requested' | 'scheduled' | 'picked_up' | 'missed'
          notes: string | null
          completed_at: string | null
          area: string
          street: string
          house_number: string
          pickup_address: string
          coordinates: unknown | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          collector_id?: string | null
          scheduled_date: string
          status?: 'requested' | 'scheduled' | 'picked_up' | 'missed'
          notes?: string | null
          completed_at?: string | null
          area: string
          street: string
          house_number: string
          pickup_address: string
          coordinates?: unknown | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          collector_id?: string | null
          scheduled_date?: string
          status?: 'requested' | 'scheduled' | 'picked_up' | 'missed'
          notes?: string | null
          completed_at?: string | null
          area?: string
          street?: string
          house_number?: string
          pickup_address?: string
          coordinates?: unknown | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          amount: number
          currency: string
          payment_method: 'cash' | 'transfer' | 'card'
          reference: string
          status: 'pending' | 'completed' | 'failed'
          metadata: Record<string, any> | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          currency?: string
          payment_method: 'cash' | 'transfer' | 'card'
          reference: string
          status?: 'pending' | 'completed' | 'failed'
          metadata?: Record<string, any> | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          currency?: string
          payment_method?: 'cash' | 'transfer' | 'card'
          reference?: string
          status?: 'pending' | 'completed' | 'failed'
          metadata?: Record<string, any> | null
          created_at?: string
        }
      }
      complaints: {
        Row: {
          id: string
          user_id: string
          pickup_id: string
          description: string
          photo_url: string | null
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority: 'low' | 'medium' | 'high'
          admin_notes: string | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          pickup_id: string
          description: string
          photo_url?: string | null
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high'
          admin_notes?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          pickup_id?: string
          description?: string
          photo_url?: string | null
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high'
          admin_notes?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          entity_type: string
          entity_id: string | null
          old_data: Record<string, any> | null
          new_data: Record<string, any> | null
          ip_address: string | null
          user_agent: string | null
          timestamp: string
          metadata: Record<string, any> | null
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          entity_type: string
          entity_id?: string | null
          old_data?: Record<string, any> | null
          new_data?: Record<string, any> | null
          ip_address?: string | null
          user_agent?: string | null
          timestamp?: string
          metadata?: Record<string, any> | null
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          entity_type?: string
          entity_id?: string | null
          old_data?: Record<string, any> | null
          new_data?: Record<string, any> | null
          ip_address?: string | null
          user_agent?: string | null
          timestamp?: string
          metadata?: Record<string, any> | null
        }
      }
      notification_preferences: {
        Row: {
          id: string
          user_id: string
          email_notifications: boolean
          sms_notifications: boolean
          push_notifications: boolean
          pickup_reminders: boolean
          payment_reminders: boolean
          complaint_updates: boolean
          system_alerts: boolean
          marketing_emails: boolean
          weekly_reports: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_notifications?: boolean
          sms_notifications?: boolean
          push_notifications?: boolean
          pickup_reminders?: boolean
          payment_reminders?: boolean
          complaint_updates?: boolean
          system_alerts?: boolean
          marketing_emails?: boolean
          weekly_reports?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_notifications?: boolean
          sms_notifications?: boolean
          push_notifications?: boolean
          pickup_reminders?: boolean
          payment_reminders?: boolean
          complaint_updates?: boolean
          system_alerts?: boolean
          marketing_emails?: boolean
          weekly_reports?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      error_reports: {
        Row: {
          id: string
          user_id: string | null
          error_type: string
          error_message: string
          error_stack: string | null
          user_agent: string | null
          url: string | null
          timestamp: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          context: Record<string, any> | null
          resolved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          error_type: string
          error_message: string
          error_stack?: string | null
          user_agent?: string | null
          url?: string | null
          timestamp: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
          context?: Record<string, any> | null
          resolved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          error_type?: string
          error_message?: string
          error_stack?: string | null
          user_agent?: string | null
          url?: string | null
          timestamp?: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
          context?: Record<string, any> | null
          resolved?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      user_pickup_summary: {
        Row: {
          id: string
          name: string
          email: string
          area: string
          total_pickups: number
          completed_pickups: number
          missed_pickups: number
          total_complaints: number
        }
      }
      collector_performance: {
        Row: {
          id: string
          name: string
          email: string
          area: string
          assigned_pickups: number
          completed_pickups: number
          completion_rate: number
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}