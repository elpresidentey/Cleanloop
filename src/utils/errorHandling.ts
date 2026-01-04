import { ErrorReportingService } from '../services/errorReportingService'

// Error types
export interface APIError {
  message: string
  code?: string
  status?: number
  details?: Record<string, any>
}

export interface ValidationError {
  field: string
  message: string
}

export interface NetworkError {
  message: string
  isNetworkError: true
  originalError?: Error
}

export type AppError = APIError | NetworkError | Error

// Error classification
export const isAPIError = (error: any): error is APIError => {
  return error && typeof error === 'object' && 'message' in error && 'status' in error
}

export const isNetworkError = (error: any): error is NetworkError => {
  return error && typeof error === 'object' && error.isNetworkError === true
}

export const isValidationError = (error: any): error is { errors: ValidationError[] } => {
  return error && typeof error === 'object' && Array.isArray(error.errors)
}

// Error parsing utilities
export const parseSupabaseError = (error: any): APIError => {
  if (error?.message) {
    return {
      message: error.message,
      code: error.code || 'SUPABASE_ERROR',
      status: error.status || 500,
      details: error.details || {}
    }
  }
  
  return {
    message: 'An unexpected database error occurred',
    code: 'UNKNOWN_DB_ERROR',
    status: 500
  }
}

export const parseConvexError = (error: any): APIError => {
  if (error?.message) {
    return {
      message: error.message,
      code: 'CONVEX_ERROR',
      status: 500,
      details: error.data || {}
    }
  }
  
  return {
    message: 'An unexpected real-time service error occurred',
    code: 'UNKNOWN_CONVEX_ERROR',
    status: 500
  }
}

export const parseNetworkError = (error: any): NetworkError => {
  if (error?.name === 'NetworkError' || error?.code === 'NETWORK_ERROR') {
    return {
      message: 'Network connection failed. Please check your internet connection.',
      isNetworkError: true,
      originalError: error
    }
  }
  
  if (error?.message?.includes('fetch')) {
    return {
      message: 'Unable to connect to the server. Please try again.',
      isNetworkError: true,
      originalError: error
    }
  }
  
  return {
    message: 'A network error occurred. Please check your connection and try again.',
    isNetworkError: true,
    originalError: error
  }
}

// Generic error parser
export const parseError = (error: any): AppError => {
  // Network errors
  if (error?.name === 'NetworkError' || error?.code === 'NETWORK_ERROR' || 
      (error?.message && error.message.includes('fetch'))) {
    return parseNetworkError(error)
  }
  
  // Supabase errors
  if (error?.code && (error.code.startsWith('PGRST') || error.code.includes('auth'))) {
    return parseSupabaseError(error)
  }
  
  // Convex errors
  if (error?.data || (error?.message && error.message.includes('convex'))) {
    return parseConvexError(error)
  }
  
  // Validation errors (Zod)
  if (error?.errors && Array.isArray(error.errors)) {
    return {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      status: 400,
      details: { validationErrors: error.errors }
    }
  }
  
  // Generic API errors
  if (error?.response) {
    return {
      message: error.response.data?.message || error.message || 'API request failed',
      code: error.response.data?.code || 'API_ERROR',
      status: error.response.status || 500,
      details: error.response.data || {}
    }
  }
  
  // Standard JavaScript errors
  if (error instanceof Error) {
    return error
  }
  
  // Fallback for unknown errors
  return new Error(typeof error === 'string' ? error : 'An unknown error occurred')
}

// User-friendly error messages
export const getUserFriendlyMessage = (error: AppError): string => {
  if (isNetworkError(error)) {
    return error.message
  }
  
  if (isAPIError(error)) {
    switch (error.code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.'
      case 'auth/user-not-found':
        return 'No account found with this email address.'
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.'
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.'
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.'
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.'
      case 'VALIDATION_ERROR':
        return 'Please check your input and try again.'
      case 'PERMISSION_DENIED':
        return 'You do not have permission to perform this action.'
      case 'NOT_FOUND':
        return 'The requested resource was not found.'
      case 'RATE_LIMITED':
        return 'Too many requests. Please wait a moment and try again.'
      default:
        return error.message || 'An unexpected error occurred.'
    }
  }
  
  return error.message || 'An unexpected error occurred.'
}

// Retry logic
export interface RetryOptions {
  maxAttempts?: number
  delay?: number
  backoff?: boolean
  retryCondition?: (error: AppError) => boolean
}

export const withRetry = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = true,
    retryCondition = (error) => isNetworkError(error) || (isAPIError(error) && (error.status ?? 0) >= 500)
  } = options

  let lastError: AppError
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = parseError(error)
      
      // Don't retry on the last attempt or if retry condition is not met
      if (attempt === maxAttempts || !retryCondition(lastError)) {
        throw lastError
      }
      
      // Calculate delay with optional backoff
      const currentDelay = backoff ? delay * Math.pow(2, attempt - 1) : delay
      await new Promise(resolve => setTimeout(resolve, currentDelay))
    }
  }
  
  throw lastError!
}

// Error logging
export const logError = (error: AppError, context?: Record<string, any>) => {
  const errorInfo = {
    message: error.message,
    timestamp: new Date().toISOString(),
    context,
    ...(isAPIError(error) && {
      code: error.code,
      status: error.status,
      details: error.details
    }),
    ...(isNetworkError(error) && {
      isNetworkError: true,
      originalError: error.originalError?.message
    }),
    ...(error instanceof Error && {
      stack: error.stack
    })
  }

  console.error('Application Error:', errorInfo)

  // In production, send to error reporting service
  if (import.meta.env.MODE === 'production') {
    ErrorReportingService.reportJSError(
      error instanceof Error ? error : new Error(error.message),
      context?.userId as string,
      'medium',
      context
    ).catch(reportingError => {
      console.warn('Failed to report error to service:', reportingError)
    })
  }
}

// Error recovery suggestions
export const getRecoverySuggestions = (error: AppError): string[] => {
  const suggestions: string[] = []
  
  if (isNetworkError(error)) {
    suggestions.push('Check your internet connection')
    suggestions.push('Try refreshing the page')
    suggestions.push('Wait a moment and try again')
  } else if (isAPIError(error)) {
    switch (error.code) {
      case 'auth/invalid-email':
      case 'VALIDATION_ERROR':
        suggestions.push('Double-check your input')
        suggestions.push('Make sure all required fields are filled')
        break
      case 'auth/too-many-requests':
      case 'RATE_LIMITED':
        suggestions.push('Wait a few minutes before trying again')
        suggestions.push('Avoid making too many requests quickly')
        break
      case 'PERMISSION_DENIED':
        suggestions.push('Make sure you are logged in')
        suggestions.push('Contact support if you believe this is an error')
        break
      case 'NOT_FOUND':
        suggestions.push('Check that the item still exists')
        suggestions.push('Try refreshing the page')
        break
      default:
        suggestions.push('Try refreshing the page')
        suggestions.push('Contact support if the problem persists')
    }
  } else {
    suggestions.push('Try refreshing the page')
    suggestions.push('Clear your browser cache')
    suggestions.push('Contact support if the problem persists')
  }
  
  return suggestions
}

// Error notification helpers
export interface ErrorNotification {
  title: string
  message: string
  type: 'error' | 'warning' | 'info'
  suggestions?: string[]
  actions?: Array<{
    label: string
    action: () => void
  }>
}

export const createErrorNotification = (error: AppError): ErrorNotification => {
  const message = getUserFriendlyMessage(error)
  const suggestions = getRecoverySuggestions(error)
  
  let title = 'Error'
  let type: 'error' | 'warning' | 'info' = 'error'
  
  if (isNetworkError(error)) {
    title = 'Connection Error'
    type = 'warning'
  } else if (isAPIError(error)) {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        title = 'Validation Error'
        type = 'warning'
        break
      case 'PERMISSION_DENIED':
        title = 'Access Denied'
        break
      case 'NOT_FOUND':
        title = 'Not Found'
        type = 'info'
        break
      default:
        title = 'Server Error'
    }
  }
  
  return {
    title,
    message,
    type,
    suggestions,
    actions: [
      {
        label: 'Retry',
        action: () => window.location.reload()
      }
    ]
  }
}