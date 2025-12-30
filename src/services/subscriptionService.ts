import { supabase } from '../lib/supabase'
import { Subscription, CreateSubscriptionInput } from '../types'
import { Database } from '../types/database'

type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row']
type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert']

export class SubscriptionService {
  static async getByUserId(userId: string): Promise<Subscription | null> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle() // Use maybeSingle instead of single to avoid PGRST116 errors

      if (error) {
        console.warn('Subscription query error:', error.message)
        return null
      }

      return data ? this.mapRowToSubscription(data) : null
    } catch (error) {
      console.warn('Subscription service error:', error)
      return null
    }
  }

  static async create(input: CreateSubscriptionInput): Promise<Subscription> {
    const insertData: SubscriptionInsert = {
      user_id: input.userId,
      plan_type: input.planType,
      amount: input.pricing.amount,
      currency: input.pricing.currency,
      billing_cycle: input.pricing.billingCycle,
      start_date: input.startDate?.toISOString() || new Date().toISOString(),
      status: 'active'
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .insert(insertData as any)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create subscription: ${error.message}`)
    }

    return this.mapRowToSubscription(data)
  }

  static async updateStatus(id: string, status: 'active' | 'paused' | 'cancelled'): Promise<Subscription> {
    const { data, error } = await (supabase as any)
      .from('subscriptions')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update subscription: ${error.message}`)
    }

    return this.mapRowToSubscription(data)
  }

  private static mapRowToSubscription(row: SubscriptionRow): Subscription {
    return {
      id: row.id,
      userId: row.user_id,
      planType: row.plan_type,
      status: row.status,
      startDate: new Date(row.start_date),
      endDate: row.end_date ? new Date(row.end_date) : undefined,
      pricing: {
        amount: row.amount,
        currency: row.currency,
        billingCycle: row.billing_cycle
      },
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }
}