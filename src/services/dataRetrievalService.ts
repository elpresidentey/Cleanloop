import { supabase } from '../lib/supabase'
import {
  User,
  PickupRequest,
  Payment,
  Complaint,
  Subscription,
  UserRole,
  PickupStatus,
  PaymentMethod,
  ComplaintStatus
} from '../types'

// Common pagination and filtering interfaces
export interface PaginationOptions {
  page: number
  limit: number
  offset?: number
}

export interface SortOptions {
  field: string
  direction: 'asc' | 'desc'
}

export interface DateRangeFilter {
  startDate?: Date
  endDate?: Date
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Pickup request filters
export interface PickupRequestFilters extends DateRangeFilter {
  userId?: string
  collectorId?: string
  status?: PickupStatus[]
  area?: string
  searchTerm?: string
}

// Payment filters
export interface PaymentFilters extends DateRangeFilter {
  userId?: string
  paymentMethod?: PaymentMethod[]
  minAmount?: number
  maxAmount?: number
  searchTerm?: string
}

// Complaint filters
export interface ComplaintFilters extends DateRangeFilter {
  userId?: string
  status?: ComplaintStatus[]
  priority?: string[]
  searchTerm?: string
}

// User filters
export interface UserFilters {
  role?: UserRole[]
  isActive?: boolean
  area?: string
  searchTerm?: string
}

// Customer details interface
export interface CustomerDetails extends User {
  subscription?: Subscription
  totalPayments: number
  lastPaymentDate?: Date
  pickupCount: number
  lastPickupDate?: Date
  completionRate: number
}

export class DataRetrievalService {
  // Generic pagination helper
  private static calculatePagination(page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit)
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  }

  // Generic search helper for text fields
  private static buildTextSearch(query: any, searchTerm: string, fields: string[]) {
    if (!searchTerm.trim()) return query

    const searchConditions = fields.map(field => `${field}.ilike.%${searchTerm}%`).join(',')
    return query.or(searchConditions)
  }

  // Pickup Requests Data Retrieval
  static async getPickupRequests(
    filters: PickupRequestFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 20 },
    sort: SortOptions = { field: 'created_at', direction: 'desc' }
  ): Promise<PaginatedResponse<PickupRequest>> {
    const offset = (pagination.page - 1) * pagination.limit

    // Build base query
    let query = supabase
      .from('pickup_requests')
      .select('*', { count: 'exact' })

    // Apply filters
    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.collectorId) {
      query = query.eq('collector_id', filters.collectorId)
    }

    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    if (filters.area) {
      query = query.ilike('area', `%${filters.area}%`)
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString())
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString())
    }

    // Apply search across multiple fields
    if (filters.searchTerm) {
      query = this.buildTextSearch(query, filters.searchTerm, ['area', 'street', 'house_number', 'notes'])
    }

    // Apply sorting and pagination
    query = query
      .order(sort.field, { ascending: sort.direction === 'asc' })
      .range(offset, offset + pagination.limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch pickup requests: ${error.message}`)
    }

    const pickupRequests = (data || []).map(this.mapRowToPickupRequest)
    const paginationInfo = this.calculatePagination(safePage, safeLimit, count || 0)

    return {
      data: pickupRequests,
      pagination: paginationInfo
    }
  }

  // Payments Data Retrieval
  static async getPayments(
    filters: PaymentFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 20 },
    sort: SortOptions = { field: 'created_at', direction: 'desc' }
  ): Promise<PaginatedResponse<Payment>> {
    // Validate and limit pagination to prevent 400 errors
    const safeLimit = Math.min(pagination.limit, 1000) // Max 1000 records per query
    const safePage = Math.max(1, pagination.page)
    const offset = (safePage - 1) * safeLimit

    let query = supabase
      .from('payments')
      .select('*', { count: 'exact' })

    // Apply filters
    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.paymentMethod && filters.paymentMethod.length > 0) {
      query = query.in('payment_method', filters.paymentMethod)
    }

    if (filters.minAmount !== undefined) {
      query = query.gte('amount', filters.minAmount)
    }

    if (filters.maxAmount !== undefined) {
      query = query.lte('amount', filters.maxAmount)
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString())
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString())
    }

    // Apply search across payment_reference field (handles both column naming conventions)
    // Note: We'll search in payment_reference (new schema) only to avoid 400 errors
    // If the column doesn't exist, the query will still work but won't filter
    if (filters.searchTerm) {
      const searchPattern = `%${filters.searchTerm}%`
      // Try payment_reference first (most common in new schema)
      // If column doesn't exist, Supabase will return an error which we'll handle
      query = query.ilike('payment_reference', searchPattern)
    }

    // Apply sorting - ensure field name matches database column
    const sortField = sort.field === 'createdAt' ? 'created_at' : sort.field
    query = query
      .order(sortField, { ascending: sort.direction === 'asc' })
      .range(offset, offset + safeLimit - 1)

    // Execute query with error handling
    console.log('Executing payments query with filters:', {
      userId: filters.userId,
      limit: safeLimit,
      page: safePage,
      offset,
      sortField: sort.field === 'createdAt' ? 'created_at' : sort.field
    })
    
    let result
    try {
      result = await query
    } catch (queryError: any) {
      console.error('Query execution error:', queryError)
      throw new Error(`Query execution failed: ${queryError.message || 'Unknown error'}`)
    }

    const { data, error, count } = result

    if (error) {
      console.error('DataRetrievalService.getPayments error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      
      // If error is about payment_reference column not found, try with reference column
      if (error.code === '42703' || error.message?.includes('payment_reference') || error.message?.includes('column') && filters.searchTerm) {
        console.log('Retrying query with "reference" column instead of "payment_reference"')
        
        // Retry without search or with reference column
        let retryQuery = supabase
          .from('payments')
          .select('*', { count: 'exact' })
        
        if (filters.userId) {
          retryQuery = retryQuery.eq('user_id', filters.userId)
        }
        
        if (filters.searchTerm) {
          retryQuery = retryQuery.ilike('reference', `%${filters.searchTerm}%`)
        }
        
        const sortField = sort.field === 'createdAt' ? 'created_at' : sort.field
        const retryResult = await retryQuery
          .order(sortField, { ascending: sort.direction === 'asc' })
          .range(offset, offset + safeLimit - 1)
        
        if (retryResult.error) {
          // Still failing, throw original error
          throw new Error(`Failed to fetch payments: ${error.message}`)
        }
        
        // Success with retry
        const payments = (retryResult.data || []).map((row: any) => {
          try {
            return this.mapRowToPayment(row)
          } catch (mapError) {
            console.error('Error mapping payment row:', row, mapError)
            throw mapError
          }
        })
        
        const paginationInfo = this.calculatePagination(safePage, safeLimit, retryResult.count || 0)
        
        return {
          data: payments,
          pagination: paginationInfo
        }
      }
      
      // Provide more helpful error messages
      if (error.code === 'PGRST204') {
        throw new Error(`Database schema issue: ${error.message}. Please check if the payments table exists and has the correct columns.`)
      } else if (error.code === '42703') {
        throw new Error(`Column not found: ${error.message}. The database schema may have changed.`)
      } else if (error.message?.includes('JWT')) {
        throw new Error('Authentication error. Please log in again.')
      }
      
      throw new Error(`Failed to fetch payments: ${error.message}`)
    }

    console.log('DataRetrievalService.getPayments raw data:', { data, count, error })
    
    const payments = (data || []).map((row: any) => {
      try {
        return this.mapRowToPayment(row)
      } catch (mapError) {
        console.error('Error mapping payment row:', row, mapError)
        throw mapError
      }
    })
    
    console.log('DataRetrievalService.getPayments mapped payments:', payments.length)
    
    const paginationInfo = this.calculatePagination(safePage, safeLimit, count || 0)

    return {
      data: payments,
      pagination: paginationInfo
    }
  }

  // Complaints Data Retrieval
  static async getComplaints(
    filters: ComplaintFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 20 },
    sort: SortOptions = { field: 'created_at', direction: 'desc' }
  ): Promise<PaginatedResponse<Complaint>> {
    const offset = (pagination.page - 1) * pagination.limit

    let query = supabase
      .from('complaints')
      .select('*', { count: 'exact' })

    // Apply filters
    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    if (filters.priority && filters.priority.length > 0) {
      query = query.in('priority', filters.priority)
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString())
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString())
    }

    // Apply search across description and admin notes
    if (filters.searchTerm) {
      query = this.buildTextSearch(query, filters.searchTerm, ['description', 'admin_notes'])
    }

    // Apply sorting and pagination
    query = query
      .order(sort.field, { ascending: sort.direction === 'asc' })
      .range(offset, offset + pagination.limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch complaints: ${error.message}`)
    }

    const complaints = (data || []).map(this.mapRowToComplaint)
    const paginationInfo = this.calculatePagination(safePage, safeLimit, count || 0)

    return {
      data: complaints,
      pagination: paginationInfo
    }
  }

  // Users Data Retrieval
  static async getUsers(
    filters: UserFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 20 },
    sort: SortOptions = { field: 'created_at', direction: 'desc' }
  ): Promise<PaginatedResponse<User>> {
    const offset = (pagination.page - 1) * pagination.limit

    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })

    // Apply filters
    if (filters.role && filters.role.length > 0) {
      query = query.in('role', filters.role)
    }

    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }

    if (filters.area) {
      query = query.ilike('area', `%${filters.area}%`)
    }

    // Apply search across multiple fields
    if (filters.searchTerm) {
      query = this.buildTextSearch(query, filters.searchTerm, ['name', 'email', 'phone', 'area', 'street'])
    }

    // Apply sorting and pagination
    query = query
      .order(sort.field, { ascending: sort.direction === 'asc' })
      .range(offset, offset + pagination.limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`)
    }

    const users = (data || []).map(this.mapRowToUser)
    const paginationInfo = this.calculatePagination(safePage, safeLimit, count || 0)

    return {
      data: users,
      pagination: paginationInfo
    }
  }

  // Customer Details with Enhanced Information
  static async getCustomerDetails(
    collectorId: string,
    filters: UserFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 20 },
    sort: SortOptions = { field: 'name', direction: 'asc' }
  ): Promise<PaginatedResponse<CustomerDetails>> {
    // First get all customers for this collector
    const { data: pickupData, error: pickupError } = await supabase
      .from('pickup_requests')
      .select('user_id')
      .eq('collector_id', collectorId)

    if (pickupError) {
      throw new Error(`Failed to fetch collector customers: ${pickupError.message}`)
    }

    if (!pickupData || pickupData.length === 0) {
      return {
        data: [],
        pagination: this.calculatePagination(pagination.page, pagination.limit, 0)
      }
    }

    const userIds = [...new Set(pickupData.map((p: any) => p.user_id))]
    const offset = (pagination.page - 1) * pagination.limit

    // Build user query with filters
    let userQuery = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .in('id', userIds)
      .eq('role', 'resident')

    if (filters.isActive !== undefined) {
      userQuery = userQuery.eq('is_active', filters.isActive)
    }

    if (filters.area) {
      userQuery = userQuery.ilike('area', `%${filters.area}%`)
    }

    if (filters.searchTerm) {
      userQuery = this.buildTextSearch(userQuery, filters.searchTerm, ['name', 'email', 'phone', 'area', 'street'])
    }

    userQuery = userQuery
      .order(sort.field, { ascending: sort.direction === 'asc' })
      .range(offset, offset + pagination.limit - 1)

    const { data: users, error: usersError, count } = await userQuery

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    if (!users || users.length === 0) {
      return {
        data: [],
        pagination: this.calculatePagination(pagination.page, pagination.limit, count || 0)
      }
    }

    const currentUserIds = users.map((u: any) => u.id)

    // Get additional data for these users
    const [subscriptions, payments, pickupCounts] = await Promise.all([
      // Get subscriptions
      supabase
        .from('subscriptions')
        .select('*')
        .in('user_id', currentUserIds)
        .eq('status', 'active'),

      // Get payment summaries
      supabase
        .from('payments')
        .select('user_id, amount, created_at')
        .in('user_id', currentUserIds)
        .eq('status', 'completed'),

      // Get pickup statistics
      supabase
        .from('pickup_requests')
        .select('user_id, status, created_at')
        .eq('collector_id', collectorId)
        .in('user_id', currentUserIds)
    ])

    if (subscriptions.error) {
      throw new Error(`Failed to fetch subscriptions: ${subscriptions.error.message}`)
    }

    if (payments.error) {
      throw new Error(`Failed to fetch payments: ${payments.error.message}`)
    }

    if (pickupCounts.error) {
      throw new Error(`Failed to fetch pickup counts: ${pickupCounts.error.message}`)
    }

    // Combine all data
    const customerDetails = users.map((user: any) => {
      const userSubscription = (subscriptions.data || []).find((s: any) => s.user_id === user.id)
      const userPayments = (payments.data || []).filter((p: any) => p.user_id === user.id)
      const userPickups = (pickupCounts.data || []).filter((p: any) => p.user_id === user.id)

      const totalPayments = userPayments.reduce((sum: number, payment: any) => sum + payment.amount, 0)
      const lastPayment = userPayments
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

      const lastPickup = userPickups
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

      const completedPickups = userPickups.filter((p: any) => p.status === 'picked_up').length
      const completionRate = userPickups.length > 0 ? (completedPickups / userPickups.length) * 100 : 0

      return {
        ...this.mapRowToUser(user),
        subscription: userSubscription ? this.mapRowToSubscription(userSubscription) : undefined,
        totalPayments,
        lastPaymentDate: lastPayment ? new Date((lastPayment as any).created_at) : undefined,
        pickupCount: userPickups.length,
        lastPickupDate: lastPickup ? new Date((lastPickup as any).created_at) : undefined,
        completionRate
      }
    })

    const paginationInfo = this.calculatePagination(safePage, safeLimit, count || 0)

    return {
      data: customerDetails,
      pagination: paginationInfo
    }
  }

  // Advanced search across multiple data types
  static async globalSearch(
    searchTerm: string,
    userId?: string,
    dataTypes: ('pickups' | 'payments' | 'complaints' | 'users')[] = ['pickups', 'payments', 'complaints'],
    limit: number = 10
  ): Promise<{
    pickups: PickupRequest[]
    payments: Payment[]
    complaints: Complaint[]
    users: User[]
  }> {
    const results = {
      pickups: [] as PickupRequest[],
      payments: [] as Payment[],
      complaints: [] as Complaint[],
      users: [] as User[]
    }

    if (!searchTerm.trim()) {
      return results
    }

    const searchPromises: Promise<any>[] = []

    // Search pickups
    if (dataTypes.includes('pickups')) {
      const pickupFilters: PickupRequestFilters = { searchTerm }
      if (userId) pickupFilters.userId = userId

      searchPromises.push(
        this.getPickupRequests(pickupFilters, { page: 1, limit })
          .then(response => ({ type: 'pickups', data: response.data }))
      )
    }

    // Search payments
    if (dataTypes.includes('payments')) {
      const paymentFilters: PaymentFilters = { searchTerm }
      if (userId) paymentFilters.userId = userId

      searchPromises.push(
        this.getPayments(paymentFilters, { page: 1, limit })
          .then(response => ({ type: 'payments', data: response.data }))
      )
    }

    // Search complaints
    if (dataTypes.includes('complaints')) {
      const complaintFilters: ComplaintFilters = { searchTerm }
      if (userId) complaintFilters.userId = userId

      searchPromises.push(
        this.getComplaints(complaintFilters, { page: 1, limit })
          .then(response => ({ type: 'complaints', data: response.data }))
      )
    }

    // Search users (only for admin/collector roles)
    if (dataTypes.includes('users') && !userId) {
      searchPromises.push(
        this.getUsers({ searchTerm }, { page: 1, limit })
          .then(response => ({ type: 'users', data: response.data }))
      )
    }

    const searchResults = await Promise.all(searchPromises)

    // Organize results by type
    searchResults.forEach(result => {
      if (result.type in results) {
        (results as any)[result.type] = result.data
      }
    })

    return results
  }

  // Data mapping helpers
  private static mapRowToPickupRequest(row: any): PickupRequest {
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
        area: row.area,
        street: row.street,
        houseNumber: row.house_number,
        coordinates: row.coordinates ? this.parseCoordinates(row.coordinates) : undefined
      }
    }
  }

  private static mapRowToPayment(row: any): Payment {
    return {
      id: row.id,
      userId: row.user_id,
      amount: row.amount,
      currency: row.currency,
      paymentMethod: row.payment_method,
      // Handle both column naming conventions: payment_reference (new) and reference (legacy)
      reference: row.payment_reference || row.reference || `PAY-${row.id}`,
      status: row.status,
      createdAt: new Date(row.created_at),
      metadata: row.metadata || undefined
    }
  }

  private static mapRowToComplaint(row: any): Complaint {
    return {
      id: row.id,
      userId: row.user_id,
      pickupId: row.pickup_id,
      description: row.description,
      photoUrl: row.photo_url || undefined,
      status: row.status,
      priority: row.priority,
      createdAt: new Date(row.created_at),
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
      adminNotes: row.admin_notes || undefined
    }
  }

  private static mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email || undefined,
      phone: row.phone,
      name: row.name,
      role: row.role,
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

  private static mapRowToSubscription(row: any): Subscription {
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

  private static parseCoordinates(coordinates: unknown): [number, number] | undefined {
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