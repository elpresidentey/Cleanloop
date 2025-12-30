import { supabase } from '../lib/supabase'
import { User, Subscription, Payment } from '../types'
import { Database } from '../types/database'
import { DataRetrievalService, UserFilters, PaginationOptions, SortOptions } from './dataRetrievalService'

type UserRow = Database['public']['Tables']['users']['Row']
type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row']
type PaymentRow = Database['public']['Tables']['payments']['Row']

export interface CustomerWithDetails extends User {
  subscription?: Subscription
  totalPayments: number
  lastPaymentDate?: Date
  pickupCount: number
  lastPickupDate?: Date
  completionRate: number
}

export class CustomerService {
  // Enhanced method using DataRetrievalService
  static async getCustomerDetails(
    collectorId: string,
    filters: UserFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 20 },
    sort: SortOptions = { field: 'name', direction: 'asc' }
  ) {
    return DataRetrievalService.getCustomerDetails(collectorId, filters, pagination, sort)
  }

  static async getCollectorCustomers(collectorId: string): Promise<CustomerWithDetails[]> {
    const response = await DataRetrievalService.getCustomerDetails(
      collectorId,
      {},
      { page: 1, limit: 1000 } // Get all customers
    )
    return response.data
  }

  static async getCustomerPaymentHistory(customerId: string, limit?: number): Promise<Payment[]> {
    const response = await DataRetrievalService.getPayments(
      { userId: customerId },
      { page: 1, limit: limit || 20 },
      { field: 'created_at', direction: 'desc' }
    )
    return response.data
  }

  static async searchCustomers(collectorId: string, searchTerm: string): Promise<CustomerWithDetails[]> {
    const response = await DataRetrievalService.getCustomerDetails(
      collectorId,
      { searchTerm },
      { page: 1, limit: 1000 } // Get all matching customers
    )
    return response.data
  }

  private static mapRowToUser(row: UserRow): User {
    return {
      id: row.id,
      email: row.email || undefined,
      phone: row.phone,
      name: row.name,
      role: row.role as 'resident' | 'collector' | 'admin',
      location: {
        area: row.area,
        street: row.street,
        houseNumber: row.house_number,
        coordinates: row.coordinates ? this.parseCoordinates(row.coordinates) : undefined
      },
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      isActive: row.is_active
    }
  }

  private static mapRowToSubscription(row: SubscriptionRow): Subscription {
    return {
      id: row.id,
      userId: row.user_id,
      planType: row.plan_type as 'weekly' | 'bi-weekly' | 'on-demand',
      status: row.status as 'active' | 'paused' | 'cancelled',
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

  private static mapRowToPayment(row: PaymentRow): Payment {
    return {
      id: row.id,
      userId: row.user_id,
      amount: row.amount,
      currency: row.currency,
      paymentMethod: row.payment_method as 'cash' | 'transfer' | 'card',
      reference: row.reference,
      status: row.status as 'pending' | 'completed' | 'failed',
      createdAt: new Date(row.created_at),
      metadata: row.metadata as Record<string, string | number | boolean> | undefined
    }
  }

  private static parseCoordinates(coordinates: unknown): [number, number] | undefined {
    // Parse PostGIS POINT format: "POINT(lng lat)"
    if (typeof coordinates === 'string') {
      const match = coordinates.match(/POINT\(([^)]+)\)/)
      if (match) {
        const [lng, lat] = match[1].split(' ').map(Number)
        return [lng, lat]
      }
    }
    return undefined
  }
}