import { supabase } from '../lib/supabase'
import { User, Complaint } from '../types'
import { Database } from '../types/database'

type UserRow = Database['public']['Tables']['users']['Row']

export interface AdminMetrics {
  totalCustomers: number
  totalPickups: number
  completedPickups: number
  missedPickups: number
  pendingPickups: number
  totalComplaints: number
  openComplaints: number
  resolvedComplaints: number
  totalRevenue: number
  completionRate: number
}

export interface AreaMetrics {
  area: string
  totalPickups: number
  completedPickups: number
  missedPickups: number
  totalComplaints: number
  completionRate: number
  complaintRate: number
}

export interface UserManagementData extends User {
  totalPickups: number
  completionRate?: number
  totalComplaints: number
  lastActivity?: Date
}

export class AdminService {
  static async getMetrics(): Promise<AdminMetrics> {
    try {
      // Get total customers (residents)
      const { count: totalCustomers, error: customersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'resident')
        .eq('is_active', true)

      if (customersError) throw customersError

      // Get pickup statistics
      const { data: pickupData, error: pickupError } = await supabase
        .from('pickup_requests')
        .select('status')

      if (pickupError) throw pickupError

      const pickupStats = (pickupData || []).reduce((acc, pickup: any) => {
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

      // Get complaint statistics
      const { data: complaintData, error: complaintError } = await supabase
        .from('complaints')
        .select('status')

      if (complaintError) throw complaintError

      const complaintStats = (complaintData || []).reduce((acc, complaint: any) => {
        acc.total++
        if (complaint.status === 'open' || complaint.status === 'in_progress') {
          acc.open++
        } else {
          acc.resolved++
        }
        return acc
      }, { total: 0, open: 0, resolved: 0 })

      // Get revenue statistics
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed')

      if (paymentError) throw paymentError

      const totalRevenue = (paymentData || []).reduce((sum, payment: any) => sum + payment.amount, 0)

      const completionRate = pickupStats.total > 0 ? (pickupStats.completed / pickupStats.total) * 100 : 0

      return {
        totalCustomers: totalCustomers || 0,
        totalPickups: pickupStats.total,
        completedPickups: pickupStats.completed,
        missedPickups: pickupStats.missed,
        pendingPickups: pickupStats.pending,
        totalComplaints: complaintStats.total,
        openComplaints: complaintStats.open,
        resolvedComplaints: complaintStats.resolved,
        totalRevenue,
        completionRate
      }
    } catch (error) {
      throw new Error(`Failed to fetch admin metrics: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static async getAreaMetrics(): Promise<AreaMetrics[]> {
    try {
      // Get pickup data grouped by area
      const { data: pickupData, error: pickupError } = await supabase
        .from('pickup_requests')
        .select('area, status')

      if (pickupError) throw pickupError

      // Get complaint data grouped by area (via pickup requests)
      const { data: complaintData, error: complaintError } = await supabase
        .from('complaints')
        .select(`
          id,
          pickup_requests!inner(area)
        `)

      if (complaintError) throw complaintError

      // Group pickup data by area
      const areaPickupStats = (pickupData || []).reduce((acc, pickup: any) => {
        const area = pickup.area
        if (!acc[area]) {
          acc[area] = { total: 0, completed: 0, missed: 0 }
        }
        acc[area].total++
        if (pickup.status === 'picked_up') {
          acc[area].completed++
        } else if (pickup.status === 'missed') {
          acc[area].missed++
        }
        return acc
      }, {} as Record<string, { total: number; completed: number; missed: number }>)

      // Group complaint data by area
      const areaComplaintStats = (complaintData || []).reduce((acc, complaint: any) => {
        const area = complaint.pickup_requests.area
        if (!acc[area]) {
          acc[area] = 0
        }
        acc[area]++
        return acc
      }, {} as Record<string, number>)

      // Combine data
      const areas = Object.keys(areaPickupStats)
      return areas.map(area => {
        const pickupStats = areaPickupStats[area]
        const complaintCount = areaComplaintStats[area] || 0
        const completionRate = pickupStats.total > 0 ? (pickupStats.completed / pickupStats.total) * 100 : 0
        const complaintRate = pickupStats.total > 0 ? (complaintCount / pickupStats.total) * 100 : 0

        return {
          area,
          totalPickups: pickupStats.total,
          completedPickups: pickupStats.completed,
          missedPickups: pickupStats.missed,
          totalComplaints: complaintCount,
          completionRate,
          complaintRate
        }
      }).sort((a, b) => b.complaintRate - a.complaintRate) // Sort by complaint rate descending
    } catch (error) {
      throw new Error(`Failed to fetch area metrics: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static async getAllUsers(role?: 'resident' | 'collector' | 'admin'): Promise<UserManagementData[]> {
    try {
      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (role) {
        query = query.eq('role', role)
      }

      const { data: users, error: usersError } = await query

      if (usersError) throw usersError

      if (!users || users.length === 0) {
        return []
      }

      // Get pickup statistics for each user
      const userIds = users.map((user: any) => user.id)
      
      const { data: pickupData, error: pickupError } = await supabase
        .from('pickup_requests')
        .select('user_id, collector_id, status, created_at')
        .or(`user_id.in.(${userIds.join(',')}),collector_id.in.(${userIds.join(',')})`)

      if (pickupError) throw pickupError

      // Get complaint statistics for each user
      const { data: complaintData, error: complaintError } = await supabase
        .from('complaints')
        .select('user_id, created_at')
        .in('user_id', userIds)

      if (complaintError) throw complaintError

      return users.map((user: any) => {
        const userPickups = (pickupData || []).filter((p: any) => 
          p.user_id === user.id || p.collector_id === user.id
        )
        const userComplaints = (complaintData || []).filter((c: any) => c.user_id === user.id)

        let completionRate: number | undefined
        if (user.role === 'collector') {
          const collectorPickups = userPickups.filter((p: any) => p.collector_id === user.id)
          const completed = collectorPickups.filter((p: any) => p.status === 'picked_up').length
          completionRate = collectorPickups.length > 0 ? (completed / collectorPickups.length) * 100 : 0
        }

        const allActivities = [
          ...userPickups.map((p: any) => new Date(p.created_at)),
          ...userComplaints.map((c: any) => new Date(c.created_at))
        ]
        const lastActivity = allActivities.length > 0 
          ? new Date(Math.max(...allActivities.map(d => d.getTime())))
          : undefined

        return {
          ...this.mapRowToUser(user),
          totalPickups: userPickups.length,
          completionRate,
          totalComplaints: userComplaints.length,
          lastActivity
        }
      })
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static async updateUserStatus(userId: string, isActive: boolean): Promise<User> {
    try {
      const updateData: Database['public']['Tables']['users']['Update'] = {
        is_active: isActive,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await (supabase as any)
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      return this.mapRowToUser(data)
    } catch (error) {
      throw new Error(`Failed to update user status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static async getAllComplaints(): Promise<Complaint[]> {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map(this.mapRowToComplaint)
    } catch (error) {
      throw new Error(`Failed to fetch complaints: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static async updateComplaint(id: string, updates: {
    status?: 'open' | 'in_progress' | 'resolved' | 'closed'
    priority?: 'low' | 'medium' | 'high'
    adminNotes?: string
  }): Promise<Complaint> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (updates.status !== undefined) {
        updateData.status = updates.status
        if (updates.status === 'resolved' || updates.status === 'closed') {
          updateData.resolved_at = new Date().toISOString()
        }
      }

      if (updates.priority !== undefined) {
        updateData.priority = updates.priority
      }

      if (updates.adminNotes !== undefined) {
        updateData.admin_notes = updates.adminNotes
      }

      const { data, error } = await (supabase as any)
        .from('complaints')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return this.mapRowToComplaint(data)
    } catch (error) {
      throw new Error(`Failed to update complaint: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
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