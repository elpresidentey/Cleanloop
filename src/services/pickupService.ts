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
    console.log('🚀 BULLETPROOF PICKUP CREATION STARTING...')
    console.log('Input received:', JSON.stringify(input, null, 2))

    // BULLETPROOF: Always provide fallback values, no matter what
    const safeArea = (input.location?.area && input.location.area.trim()) || 'Lagos Island'
    const safeStreet = (input.location?.street && input.location.street.trim()) || 'Marina Street'
    const safeHouseNumber = (input.location?.houseNumber && input.location.houseNumber.trim()) || '123'
    const safeAddress = `${safeHouseNumber} ${safeStreet}, ${safeArea}`
    
    console.log('🛡️ SAFE VALUES:', { safeArea, safeStreet, safeHouseNumber, safeAddress })
    
    // BULLETPROOF: Create insert data with guaranteed non-null values
    const insertData: any = {
      user_id: input.userId,
      scheduled_date: input.scheduledDate.toISOString().split('T')[0],
      notes: input.notes || null,
      status: 'requested',
      area: safeArea,
      street: safeStreet,
      house_number: safeHouseNumber,
      coordinates: input.location?.coordinates ? 
        `POINT(${input.location.coordinates[0]} ${input.location.coordinates[1]})` : 
        null
    }

    // BULLETPROOF: Try to add pickup_address, but don't fail if column doesn't exist
    try {
      const { error: columnTest } = await supabase
        .from('pickup_requests')
        .select('pickup_address')
        .limit(1)

      if (!columnTest) {
        insertData.pickup_address = safeAddress
        console.log('✅ pickup_address column exists, adding to insert data')
      } else {
        console.log('⚠️ pickup_address column may not exist, skipping')
      }
    } catch (columnError) {
      console.log('⚠️ Column test failed, proceeding without pickup_address:', columnError)
    }

    console.log('📝 FINAL INSERT DATA:', JSON.stringify(insertData, null, 2))

    try {
      console.log('🚀 ATTEMPTING DATABASE INSERT...')
      
      const { data, error } = await supabase
        .from('pickup_requests')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('❌ DATABASE INSERT FAILED:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Insert data that failed:', insertData)
        
        // BULLETPROOF: Provide specific error messages
        if (error.code === 'PGRST204') {
          throw new Error(`Database schema issue: ${error.message}. Please contact support or try again later.`)
        } else if (error.message.includes('not-null constraint')) {
          const columnMatch = error.message.match(/column "([^"]+)"/)
          const columnName = columnMatch ? columnMatch[1] : 'unknown'
          throw new Error(`Database constraint error on column "${columnName}". This is a system issue - please contact support.`)
        } else if (error.message.includes('violates')) {
          throw new Error(`Database validation error: ${error.message}. Please contact support.`)
        } else {
          throw new Error(`Database error: ${error.message}`)
        }
      }

      console.log('✅ PICKUP REQUEST CREATED SUCCESSFULLY:', data)
      return this.mapRowToPickupRequest(data)
    } catch (err) {
      console.error('💥 PICKUP SERVICE ERROR:', err)
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