import {
  parseError,
  isAPIError,
  isNetworkError,
  getUserFriendlyMessage,
  getRecoverySuggestions,
  parseSupabaseError,
  parseNetworkError,
  createErrorNotification
} from '../errorHandling'

describe('Error Handling Utilities', () => {
  describe('parseError', () => {
    it('should parse network errors', () => {
      const networkError = new Error('fetch failed')
      networkError.name = 'NetworkError'
      
      const parsed = parseError(networkError)
      expect(isNetworkError(parsed)).toBe(true)
    })

    it('should parse API errors', () => {
      const apiError = {
        response: {
          data: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR'
          },
          status: 400
        }
      }
      
      const parsed = parseError(apiError)
      expect(isAPIError(parsed)).toBe(true)
      expect(parsed.message).toBe('Validation failed')
    })

    it('should parse standard JavaScript errors', () => {
      const jsError = new Error('Something went wrong')
      const parsed = parseError(jsError)
      expect(parsed instanceof Error).toBe(true)
      expect(parsed.message).toBe('Something went wrong')
    })
  })

  describe('parseSupabaseError', () => {
    it('should parse Supabase errors correctly', () => {
      const supabaseError = {
        message: 'Invalid credentials',
        code: 'auth/invalid-email',
        status: 401
      }
      
      const parsed = parseSupabaseError(supabaseError)
      expect(parsed.message).toBe('Invalid credentials')
      expect(parsed.code).toBe('auth/invalid-email')
      expect(parsed.status).toBe(401)
    })

    it('should handle unknown Supabase errors', () => {
      const parsed = parseSupabaseError({})
      expect(parsed.message).toBe('An unexpected database error occurred')
      expect(parsed.code).toBe('UNKNOWN_DB_ERROR')
    })
  })

  describe('parseNetworkError', () => {
    it('should parse network errors correctly', () => {
      const networkError = new Error('Network connection failed')
      networkError.name = 'NetworkError'
      
      const parsed = parseNetworkError(networkError)
      expect(parsed.isNetworkError).toBe(true)
      expect(parsed.message).toContain('Network connection failed')
    })

    it('should handle fetch errors', () => {
      const fetchError = new Error('fetch is not defined')
      const parsed = parseNetworkError(fetchError)
      expect(parsed.isNetworkError).toBe(true)
      expect(parsed.message).toContain('Unable to connect to the server')
    })
  })

  describe('getUserFriendlyMessage', () => {
    it('should return user-friendly messages for common errors', () => {
      const authError = {
        message: 'Invalid email',
        code: 'auth/invalid-email',
        status: 400
      }
      
      expect(getUserFriendlyMessage(authError)).toBe('Please enter a valid email address.')
    })

    it('should return the original message for unknown errors', () => {
      const unknownError = {
        message: 'Custom error message',
        code: 'UNKNOWN_ERROR',
        status: 500
      }
      
      expect(getUserFriendlyMessage(unknownError)).toBe('Custom error message')
    })

    it('should handle network errors', () => {
      const networkError = {
        message: 'Connection failed',
        isNetworkError: true as const
      }
      
      expect(getUserFriendlyMessage(networkError)).toBe('Connection failed')
    })
  })

  describe('getRecoverySuggestions', () => {
    it('should provide suggestions for network errors', () => {
      const networkError = {
        message: 'Connection failed',
        isNetworkError: true as const
      }
      
      const suggestions = getRecoverySuggestions(networkError)
      expect(suggestions).toContain('Check your internet connection')
      expect(suggestions).toContain('Try refreshing the page')
    })

    it('should provide suggestions for validation errors', () => {
      const validationError = {
        message: 'Invalid input',
        code: 'VALIDATION_ERROR',
        status: 400
      }
      
      const suggestions = getRecoverySuggestions(validationError)
      expect(suggestions).toContain('Double-check your input')
      expect(suggestions).toContain('Make sure all required fields are filled')
    })

    it('should provide suggestions for permission errors', () => {
      const permissionError = {
        message: 'Access denied',
        code: 'PERMISSION_DENIED',
        status: 403
      }
      
      const suggestions = getRecoverySuggestions(permissionError)
      expect(suggestions).toContain('Make sure you are logged in')
      expect(suggestions).toContain('Contact support if you believe this is an error')
    })
  })

  describe('createErrorNotification', () => {
    it('should create error notifications with correct structure', () => {
      const error = {
        message: 'Something went wrong',
        code: 'SERVER_ERROR',
        status: 500
      }
      
      const notification = createErrorNotification(error)
      expect(notification.title).toBe('Server Error')
      expect(notification.message).toBe('Something went wrong')
      expect(notification.type).toBe('error')
      expect(notification.suggestions).toBeDefined()
      expect(notification.actions).toBeDefined()
    })

    it('should create network error notifications', () => {
      const networkError = {
        message: 'Connection failed',
        isNetworkError: true as const
      }
      
      const notification = createErrorNotification(networkError)
      expect(notification.title).toBe('Connection Error')
      expect(notification.type).toBe('warning')
    })

    it('should create validation error notifications', () => {
      const validationError = {
        message: 'Invalid input',
        code: 'VALIDATION_ERROR',
        status: 400
      }
      
      const notification = createErrorNotification(validationError)
      expect(notification.title).toBe('Validation Error')
      expect(notification.type).toBe('warning')
    })
  })

  describe('Type Guards', () => {
    it('should correctly identify API errors', () => {
      const apiError = {
        message: 'Error',
        status: 400
      }
      expect(isAPIError(apiError)).toBe(true)
      
      const notApiError = { message: 'Error' }
      expect(isAPIError(notApiError)).toBe(false)
    })

    it('should correctly identify network errors', () => {
      const networkError = {
        message: 'Connection failed',
        isNetworkError: true as const
      }
      expect(isNetworkError(networkError)).toBe(true)
      
      const notNetworkError = { message: 'Error' }
      expect(isNetworkError(notNetworkError)).toBe(false)
    })
  })
})