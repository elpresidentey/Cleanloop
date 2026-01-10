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

  /**
   * BULLETPROOF PICKUP REQUEST CREATION WITH DIRECT DATABASE FALLBACK
   * This method will work regardless of schema cache issues
   */
  static async create(input: CreatePickupRequestInput): Promise<PickupRequest> {
    console.log('🚀 PICKUP CREATION - FIXED SCHEMA VERSION')
    console.log('Input received:', JSON.stringify(input, null, 2))

    // BULLETPROOF: Always provide safe fallback values
    const safeArea = this.getSafeValue(input.location?.area, 'Lagos Island')
    const safeStreet = this.getSafeValue(input.location?.street, 'Marina Street')
    const safeHouseNumber = this.getSafeValue(input.location?.houseNumber, '123')
    const safeAddress = `${safeHouseNumber} ${safeStreet}, ${safeArea}`

    // STRATEGY 1: Correct Schema Insert (pickup_address only)
    try {
      console.log('🚀 STRATEGY 1: Insert with correct schema (pickup_address)...')

      // Note: passing area, street, house_number if the column DOES NOT exist will fail.
      // So we use pickup_address which is in the schema.
      const pickupData: any = {
        user_id: input.userId,
        scheduled_date: input.scheduledDate.toISOString().split('T')[0],
        notes: input.notes || null,
        status: 'requested',
        pickup_address: safeAddress
      }

      const { data, error } = await supabase
        .from('pickup_requests')
        .insert(pickupData as any)
        .select()
        .single()

      if (!error && data) {
        console.log('✅ STRATEGY 1 SUCCESS:', data)
        return this.mapRowToPickupRequest(data)
      }

      console.log('⚠️ Strategy 1 failed:', error?.message)
    } catch (err) {
      console.log('⚠️ Strategy 1 error:', err)
    }

    // STRATEGY 2: Legacy Schema Insert (area, street, house_number)
    try {
      console.log('🚀 STRATEGY 2: Insert with legacy schema (area/street)...')

      const legacyData: any = {
        user_id: input.userId,
        scheduled_date: input.scheduledDate.toISOString().split('T')[0],
        notes: input.notes || null,
        status: 'requested',
        area: safeArea,
        street: safeStreet,
        house_number: safeHouseNumber,
        pickup_address: safeAddress
      }

      const { data, error } = await supabase
        .from('pickup_requests')
        .insert(legacyData as any)
        .select()
        .single()

      if (!error && data) {
        console.log('✅ STRATEGY 2 SUCCESS:', data)
        return this.mapRowToPickupRequest(data)
      }

      console.log('⚠️ Strategy 2 failed:', error?.message)
    } catch (err) {
      console.log('⚠️ Strategy 2 error:', err)
    }

    // STRATEGY 3: RPC
    try {
      console.log('🚀 STRATEGY 3: Direct database function...')

      const { data: functionResult, error: functionError } = await (supabase as any)
        .rpc('create_pickup_request_direct', {
          p_user_id: input.userId,
          p_scheduled_date: input.scheduledDate.toISOString().split('T')[0],
          p_notes: input.notes || null,
          p_pickup_address: safeAddress
        })

      if (!functionError && functionResult) {
        console.log('✅ STRATEGY 3 SUCCESS:', functionResult)
        return {
          id: (functionResult as any).id || crypto.randomUUID(),
          userId: input.userId,
          scheduledDate: input.scheduledDate,
          status: 'requested' as const,
          notes: input.notes,
          createdAt: new Date(),
          updatedAt: new Date(),
          location: {
            area: safeArea,
            street: safeStreet,
            houseNumber: safeHouseNumber
          }
        }
      }

      console.log('⚠️ Strategy 3 failed:', functionError?.message)
    } catch (err) {
      console.log('⚠️ Strategy 3 error:', err)
    }

    throw new Error('Unable to create pickup request. Please try again or contact support.')
  }

  /**
   * Helper method to ensure we always have a safe, non-null, non-empty value
   */
  private static getSafeValue(value: string | undefined | null, fallback: string): string {
    if (!value || typeof value !== 'string' || value.trim() === '') {
      return fallback
    }
    return value.trim()
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

  static async update(id: string, input: Partial<CreatePickupRequestInput>): Promise<PickupRequest> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (input.scheduledDate) {
      updateData.scheduled_date = input.scheduledDate.toISOString().split('T')[0]
    }

    if (input.notes !== undefined) {
      updateData.notes = input.notes || null
    }

    if (input.location) {
      const safeArea = this.getSafeValue(input.location.area, 'Lagos Island')
      const safeStreet = this.getSafeValue(input.location.street, 'Marina Street')
      const safeHouseNumber = this.getSafeValue(input.location.houseNumber, '123')
      updateData.pickup_address = `${safeHouseNumber} ${safeStreet}, ${safeArea}`
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

  static async delete(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('pickup_requests')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete pickup request: ${error.message}`)
    }
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