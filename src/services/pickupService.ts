import { supabase } from '../lib/supabase'
import { PickupRequest, CreatePickupRequestInput, UpdatePickupStatusInput } from '../types'
import { Database } from '../types/database'
import { DataRetrievalService, PickupRequestFilters, PaginationOptions, SortOptions } from './dataRetrievalService'

type PickupRequestRow = Database['public']['Tables']['pickup_requests']['Row']

export class PickupService {
  // Enhanced method using DataRetrievalService
  static async getPickupRequests(
    filters: PickupRequestFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 20 },
    sort: SortOptions = { field: 'created_at', direction: 'desc' }
  ) {
    return DataRetrievalService.getPickupRequests(filters, pagination, sort)
  }

  static async getByUserId(userId: string, limit?: number): Promise<PickupRequest[]> {
    try {
      const response = await DataRetrievalService.getPickupRequests(
        { userId },
        { page: 1, limit: limit || 5 }
      )
      return response.data
    } catch (error) {
      console.warn('Get pickups by user error:', error)
      return []
    }
  }

  static async getNextPickup(userId: string): Promise<PickupRequest | null> {
    try {
      const { data, error } = await supabase
        .from('pickup_requests')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['pending', 'scheduled'])
        .order('scheduled_date', { ascending: true })
        .limit(1)
        .maybeSingle() // Use maybeSingle to avoid PGRST116 errors

      if (error) {
        console.warn('Next pickup query error:', error.message)
        return null
      }

      return data ? this.mapRowToPickupRequest(data) : null
    } catch (error) {
      console.warn('Next pickup service error:', error)
      return null
    }
  }

  static async create(input: CreatePickupRequestInput): Promise<PickupRequest> {
    // Validate location data
    if (!input.location) {
      throw new Error('Location data is required for pickup request')
    }

    // Create a full address string from location components with fallbacks
    const houseNumber = input.location.houseNumber || 'N/A'
    const street = input.location.street || 'N/A'
    const area = input.location.area || 'N/A'
    const fullAddress = `${houseNumber} ${street}, ${area}`
    
    // Base insert data (columns that should always exist)
    const insertData: any = {
      user_id: input.userId,
      scheduled_date: input.scheduledDate.toISOString().split('T')[0], // Date only
      notes: input.notes || null,
      status: 'requested' as const,
      area: area,
      street: street,
      house_number: houseNumber,
      coordinates: input.location.coordinates ? 
        `POINT(${input.location.coordinates[0]} ${input.location.coordinates[1]})` : 
        null
    }

    // Try to add pickup_address if the column exists
    try {
      // First, test if pickup_address column exists by doing a simple select
      const { error: columnTest } = await supabase
        .from('pickup_requests')
        .select('pickup_address')
        .limit(1)

      if (!columnTest) {
        // Column exists, add it to insert data
        insertData.pickup_address = fullAddress
      }
    } catch (columnError) {
      console.warn('pickup_address column may not exist, proceeding without it')
    }

    console.log('Creating pickup request with data:', insertData)
    console.log('Input location data:', input.location)

    try {
      const { data, error } = await supabase
        .from('pickup_requests')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Pickup request creation error:', error)
        console.error('Error code:', error.code)
        console.error('Insert data that failed:', insertData)
        
        // Provide helpful error messages based on error type
        if (error.code === 'PGRST204') {
          throw new Error(`Database schema issue detected. Please run the database migration script or contact support. Error: ${error.message}`)
        } else if (error.message.includes('pickup_address')) {
          throw new Error(`Address field issue: ${error.message}. Please ensure your profile has complete location information.`)
        } else if (error.message.includes('not-null constraint')) {
          throw new Error(`Required field missing: ${error.message}. Please check your profile information.`)
        } else {
          throw new Error(`Failed to create pickup request: ${error.message}`)
        }
      }

      console.log('Pickup request created successfully:', data)
      return this.mapRowToPickupRequest(data)
    } catch (err) {
      console.error('Pickup service error:', err)
      throw err
    }
  }

  static async updateStatus(id: string, input: UpdatePickupStatusInput): Promise<PickupRequest> {
    const updateData: any = {
      status: input.status,
      updated_at: new Date().toISOString()
    }

    if (input.collectorId) {
      updateData.collector_id = input.collectorId
    }

    if (input.notes) {
      updateData.special_instructions = input.notes
    }

    const { data, error } = await (supabase as any)
      .from('pickup_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update pickup request: ${error.message}`)
    }

    return this.mapRowToPickupRequest(data)
  }

  private static mapRowToPickupRequest(row: PickupRequestRow): PickupRequest {
    // Parse address back to location components (basic parsing)
    const addressParts = (row.notes || '').split(', ')
    const area = addressParts[0] || ''
    const streetAndHouse = addressParts[1] || ''
    const streetParts = streetAndHouse.split(' ')
    const houseNumber = streetParts.pop() || ''
    const street = streetParts.join(' ')

    return {
      id: row.id,
      userId: row.user_id,
      collectorId: row.collector_id || undefined,
      scheduledDate: new Date(row.scheduled_date),
      status: row.status,
      notes: row.notes || undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      location: {
        area,
        street,
        houseNumber,
        coordinates: undefined // Not stored in current schema
      }
    }
  }

  static async getCollectorPickupsForDate(collectorId: string, date: Date): Promise<PickupRequest[]> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const response = await DataRetrievalService.getPickupRequests(
      {
        collectorId,
        startDate: startOfDay,
        endDate: endOfDay
      },
      { page: 1, limit: 1000 }, // Get all for the day
      { field: 'scheduled_date', direction: 'asc' }
    )

    return response.data
  }

  static async getCollectorStats(collectorId: string, days: number): Promise<{
    total: number
    completed: number
    missed: number
    pending: number
    completionRate: number
  }> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const response = await DataRetrievalService.getPickupRequests(
      {
        collectorId,
        startDate
      },
      { page: 1, limit: 10000 } // Get all for stats calculation
    )

    const stats = response.data.reduce((acc, pickup) => {
      acc.total++
      switch (pickup.status) {
        case 'picked_up':
          acc.completed++
          break
        case 'missed':
          acc.missed++
          break
        case 'requested':
        case 'scheduled':
          acc.pending++
          break
      }
      return acc
    }, { total: 0, completed: 0, missed: 0, pending: 0 })

    const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0

    return {
      ...stats,
      completionRate
    }
  }

  static async getCollectorPickups(collectorId: string, limit?: number): Promise<PickupRequest[]> {
    const response = await DataRetrievalService.getPickupRequests(
      { collectorId },
      { page: 1, limit: limit || 20 },
      { field: 'scheduled_date', direction: 'desc' }
    )

    return response.data
  }

  static async updateLocationForFuturePickups(userId: string, newLocation: { area: string; street: string; houseNumber: string; coordinates?: [number, number] }): Promise<void> {
    const now = new Date()
    
    const updateData: any = {
      pickup_address: `${newLocation.area}, ${newLocation.street} ${newLocation.houseNumber}`,
      updated_at: now.toISOString()
    }

    const { error } = await (supabase as any)
      .from('pickup_requests')
      .update(updateData)
      .eq('user_id', userId)
      .gt('scheduled_date', now.toISOString().split('T')[0])
      .in('status', ['requested', 'scheduled'])

    if (error) {
      throw new Error(`Failed to update location for future pickups: ${error.message}`)
    }
  }
}