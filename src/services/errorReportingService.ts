import { supabase } from '../lib/supabase'

export interface ErrorReport {
  id?: string
  userId?: string
  errorType: string
  errorMessage: string
  errorStack?: string
  userAgent: string
  url: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  context?: Record<string, any>
  resolved?: boolean
  createdAt?: string
}

export class ErrorReportingService {
  /**
   * Report an error to the backend for tracking and analysis
   */
  static async reportError(errorReport: Omit<ErrorReport, 'id' | 'createdAt'>): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('error_reports')
        .insert({
          user_id: errorReport.userId,
          error_type: errorReport.errorType,
          error_message: errorReport.errorMessage,
          error_stack: errorReport.errorStack,
          user_agent: errorReport.userAgent,
          url: errorReport.url,
          timestamp: errorReport.timestamp,
          severity: errorReport.severity,
          context: errorReport.context,
          resolved: false
        } as any)

      return { error }
    } catch (err) {
      // Don't throw errors from error reporting to avoid infinite loops
      console.warn('Failed to report error:', err)
      return { error: err }
    }
  }

  /**
   * Report a JavaScript error with automatic context collection
   */
  static async reportJSError(
    error: Error,
    userId?: string,
    severity: ErrorReport['severity'] = 'medium',
    additionalContext?: Record<string, any>
  ): Promise<void> {
    try {
      const errorReport: Omit<ErrorReport, 'id' | 'createdAt'> = {
        userId,
        errorType: error.name || 'JavaScript Error',
        errorMessage: error.message,
        errorStack: error.stack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        severity,
        context: {
          ...additionalContext,
          timestamp: Date.now(),
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          screen: {
            width: screen.width,
            height: screen.height
          }
        }
      }

      await this.reportError(errorReport)
    } catch (reportingError) {
      console.warn('Error reporting failed:', reportingError)
    }
  }

  /**
   * Report a network error
   */
  static async reportNetworkError(
    url: string,
    method: string,
    status: number,
    statusText: string,
    userId?: string,
    additionalContext?: Record<string, any>
  ): Promise<void> {
    try {
      const errorReport: Omit<ErrorReport, 'id' | 'createdAt'> = {
        userId,
        errorType: 'Network Error',
        errorMessage: `${method} ${url} failed with ${status} ${statusText}`,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        severity: status >= 500 ? 'high' : 'medium',
        context: {
          ...additionalContext,
          request: {
            url,
            method,
            status,
            statusText
          }
        }
      }

      await this.reportError(errorReport)
    } catch (reportingError) {
      console.warn('Network error reporting failed:', reportingError)
    }
  }

  /**
   * Report a user action error (e.g., form submission failure)
   */
  static async reportUserActionError(
    action: string,
    errorMessage: string,
    userId?: string,
    severity: ErrorReport['severity'] = 'medium',
    additionalContext?: Record<string, any>
  ): Promise<void> {
    try {
      const errorReport: Omit<ErrorReport, 'id' | 'createdAt'> = {
        userId,
        errorType: 'User Action Error',
        errorMessage: `${action}: ${errorMessage}`,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        severity,
        context: {
          ...additionalContext,
          action
        }
      }

      await this.reportError(errorReport)
    } catch (reportingError) {
      console.warn('User action error reporting failed:', reportingError)
    }
  }

  /**
   * Get error reports for admin dashboard
   */
  static async getErrorReports(
    limit: number = 50,
    offset: number = 0,
    severity?: ErrorReport['severity']
  ): Promise<{ data: ErrorReport[]; error: any }> {
    try {
      let query = supabase
        .from('error_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (severity) {
        query = query.eq('severity', severity)
      }

      const { data, error } = await query

      if (error) {
        return { data: [], error }
      }

      const errorReports: ErrorReport[] = (data as any[]).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        errorType: row.error_type,
        errorMessage: row.error_message,
        errorStack: row.error_stack,
        userAgent: row.user_agent,
        url: row.url,
        timestamp: row.timestamp,
        severity: row.severity,
        context: row.context,
        resolved: row.resolved,
        createdAt: row.created_at
      }))

      return { data: errorReports, error: null }
    } catch (err) {
      return { data: [], error: err }
    }
  }

  /**
   * Mark an error report as resolved
   */
  static async markAsResolved(errorId: string): Promise<{ error: any }> {
    try {
      const { error } = await (supabase as any)
        .from('error_reports')
        .update({ resolved: true })
        .eq('id', errorId)

      return { error }
    } catch (err) {
      return { error: err }
    }
  }
}