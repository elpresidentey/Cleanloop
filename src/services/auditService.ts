import { supabase } from '../lib/supabase'
import { 
  AuditLog, 
  AuditAction, 
  AuditEntityType, 
  CreateAuditLogInput,
  CreateAuditLogSchema 
} from '../types'

export class AuditService {
  /**
   * Log an audit event
   */
  static async logEvent(input: CreateAuditLogInput): Promise<void> {
    try {
      // Validate input
      const validatedInput = CreateAuditLogSchema.parse(input)
      
      // Get client IP and user agent from request headers if available
      const ipAddress = validatedInput.ipAddress || this.getClientIP()
      const userAgent = validatedInput.userAgent || this.getUserAgent()

      const auditLogData = {
        user_id: validatedInput.userId,
        action: validatedInput.action,
        entity_type: validatedInput.entityType,
        entity_id: validatedInput.entityId || null,
        old_data: validatedInput.oldData || null,
        new_data: validatedInput.newData || null,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: validatedInput.metadata || null
      }

      const { error } = await (supabase as any)
        .from('audit_logs')
        .insert(auditLogData)

      if (error) {
        console.error('Failed to log audit event:', error)
        // Don't throw error to avoid breaking main functionality
      }
    } catch (error) {
      console.error('Audit logging error:', error)
      // Don't throw error to avoid breaking main functionality
    }
  }

  /**
   * Log user authentication events
   */
  static async logAuthEvent(
    userId: string, 
    action: 'login_success' | 'login_failed' | 'logout',
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      userId,
      action,
      entityType: 'user',
      entityId: userId,
      metadata
    })
  }

  /**
   * Log user management events
   */
  static async logUserEvent(
    userId: string,
    action: 'user_created' | 'user_updated' | 'user_deleted' | 'user_suspended' | 'user_activated',
    entityId: string,
    oldData?: Record<string, any>,
    newData?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      userId,
      action,
      entityType: 'user',
      entityId,
      oldData,
      newData
    })
  }

  /**
   * Log subscription events
   */
  static async logSubscriptionEvent(
    userId: string,
    action: 'subscription_created' | 'subscription_updated' | 'subscription_cancelled',
    subscriptionId: string,
    oldData?: Record<string, any>,
    newData?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      userId,
      action,
      entityType: 'subscription',
      entityId: subscriptionId,
      oldData,
      newData
    })
  }

  /**
   * Log pickup request events
   */
  static async logPickupEvent(
    userId: string,
    action: 'pickup_created' | 'pickup_updated' | 'pickup_completed' | 'pickup_missed',
    pickupId: string,
    oldData?: Record<string, any>,
    newData?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      userId,
      action,
      entityType: 'pickup_request',
      entityId: pickupId,
      oldData,
      newData
    })
  }

  /**
   * Log payment events
   */
  static async logPaymentEvent(
    userId: string,
    action: 'payment_created' | 'payment_updated' | 'payment_completed',
    paymentId: string,
    oldData?: Record<string, any>,
    newData?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      userId,
      action,
      entityType: 'payment',
      entityId: paymentId,
      oldData,
      newData
    })
  }

  /**
   * Log complaint events
   */
  static async logComplaintEvent(
    userId: string,
    action: 'complaint_created' | 'complaint_updated' | 'complaint_resolved',
    complaintId: string,
    oldData?: Record<string, any>,
    newData?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      userId,
      action,
      entityType: 'complaint',
      entityId: complaintId,
      oldData,
      newData
    })
  }

  /**
   * Log password security events
   */
  static async logPasswordEvent(
    userId: string,
    action: 'password_changed' | 'password_reset_requested' | 'password_reset_completed',
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      userId,
      action,
      entityType: 'user',
      entityId: userId,
      metadata
    })
  }

  /**
   * Log admin actions
   */
  static async logAdminAction(
    adminId: string,
    action: string,
    entityType: AuditEntityType,
    entityId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      userId: adminId,
      action: 'admin_action',
      entityType,
      entityId,
      metadata: {
        ...metadata,
        adminAction: action
      }
    })
  }

  /**
   * Get audit logs for a user (with pagination)
   */
  static async getUserAuditLogs(
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ logs: AuditLog[], total: number }> {
    const offset = (page - 1) * limit

    const { data: logs, error, count } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to fetch user audit logs: ${error.message}`)
    }

    return {
      logs: logs?.map(this.mapDatabaseToAuditLog) || [],
      total: count || 0
    }
  }

  /**
   * Get all audit logs (admin only, with pagination and filters)
   */
  static async getAllAuditLogs(
    page: number = 1,
    limit: number = 50,
    filters?: {
      userId?: string
      action?: AuditAction
      entityType?: AuditEntityType
      startDate?: Date
      endDate?: Date
    }
  ): Promise<{ logs: AuditLog[], total: number }> {
    const offset = (page - 1) * limit
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })

    // Apply filters
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId)
    }
    if (filters?.action) {
      query = query.eq('action', filters.action)
    }
    if (filters?.entityType) {
      query = query.eq('entity_type', filters.entityType)
    }
    if (filters?.startDate) {
      query = query.gte('timestamp', filters.startDate.toISOString())
    }
    if (filters?.endDate) {
      query = query.lte('timestamp', filters.endDate.toISOString())
    }

    const { data: logs, error, count } = await query
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`)
    }

    return {
      logs: logs?.map(this.mapDatabaseToAuditLog) || [],
      total: count || 0
    }
  }

  /**
   * Get audit logs for a specific entity
   */
  static async getEntityAuditLogs(
    entityType: AuditEntityType,
    entityId: string
  ): Promise<AuditLog[]> {
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('timestamp', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch entity audit logs: ${error.message}`)
    }

    return logs?.map(this.mapDatabaseToAuditLog) || []
  }

  /**
   * Map database row to AuditLog interface
   */
  private static mapDatabaseToAuditLog(row: any): AuditLog {
    return {
      id: row.id,
      userId: row.user_id,
      action: row.action as AuditAction,
      entityType: row.entity_type as AuditEntityType,
      entityId: row.entity_id,
      oldData: row.old_data,
      newData: row.new_data,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      timestamp: new Date(row.timestamp),
      metadata: row.metadata
    }
  }

  /**
   * Get client IP address (placeholder - would need proper implementation)
   */
  private static getClientIP(): string | undefined {
    // In a real implementation, this would extract IP from request headers
    // For now, return undefined as this is client-side code
    return undefined
  }

  /**
   * Get user agent string
   */
  private static getUserAgent(): string | undefined {
    if (typeof navigator !== 'undefined') {
      return navigator.userAgent
    }
    return undefined
  }
}