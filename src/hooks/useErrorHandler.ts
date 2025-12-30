import { useState, useCallback } from 'react'
import { 
  AppError, 
  parseError, 
  getUserFriendlyMessage, 
  getRecoverySuggestions,
  logError,
  withRetry,
  RetryOptions,
  createErrorNotification,
  ErrorNotification
} from '../utils/errorHandling'

interface ErrorState {
  error: AppError | null
  isLoading: boolean
  hasError: boolean
}

interface UseErrorHandlerOptions {
  logErrors?: boolean
  showNotifications?: boolean
  onError?: (error: AppError) => void
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}) => {
  const { logErrors = true, onError } = options
  
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isLoading: false,
    hasError: false
  })

  const handleError = useCallback((error: any, context?: Record<string, any>) => {
    const parsedError = parseError(error)
    
    setErrorState({
      error: parsedError,
      isLoading: false,
      hasError: true
    })

    if (logErrors) {
      logError(parsedError, context)
    }

    onError?.(parsedError)

    return parsedError
  }, [logErrors, onError])

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isLoading: false,
      hasError: false
    })
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    setErrorState(prev => ({
      ...prev,
      isLoading: loading,
      hasError: loading ? false : prev.hasError
    }))
  }, [])

  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T | null> => {
    try {
      setLoading(true)
      clearError()
      const result = await operation()
      setLoading(false)
      return result
    } catch (error) {
      handleError(error, context)
      return null
    }
  }, [handleError, clearError, setLoading])

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    retryOptions?: RetryOptions,
    context?: Record<string, any>
  ): Promise<T | null> => {
    try {
      setLoading(true)
      clearError()
      const result = await withRetry(operation, retryOptions)
      setLoading(false)
      return result
    } catch (error) {
      handleError(error, context)
      return null
    }
  }, [handleError, clearError, setLoading])

  const getErrorMessage = useCallback(() => {
    return errorState.error ? getUserFriendlyMessage(errorState.error) : null
  }, [errorState.error])

  const getErrorSuggestions = useCallback(() => {
    return errorState.error ? getRecoverySuggestions(errorState.error) : []
  }, [errorState.error])

  const getErrorNotification = useCallback((): ErrorNotification | null => {
    return errorState.error ? createErrorNotification(errorState.error) : null
  }, [errorState.error])

  return {
    error: errorState.error,
    isLoading: errorState.isLoading,
    hasError: errorState.hasError,
    handleError,
    clearError,
    setLoading,
    executeWithErrorHandling,
    executeWithRetry,
    getErrorMessage,
    getErrorSuggestions,
    getErrorNotification
  }
}

// Specialized hooks for different operations
export const useAsyncOperation = <T>(
  operation: () => Promise<T>,
  dependencies: any[] = []
) => {
  const errorHandler = useErrorHandler()
  const [data, setData] = useState<T | null>(null)

  const execute = useCallback(async (context?: Record<string, any>) => {
    const result = await errorHandler.executeWithErrorHandling(operation, context)
    if (result !== null) {
      setData(result)
    }
    return result
  }, [operation, errorHandler, ...dependencies])

  const executeWithRetry = useCallback(async (
    retryOptions?: RetryOptions,
    context?: Record<string, any>
  ) => {
    const result = await errorHandler.executeWithRetry(operation, retryOptions, context)
    if (result !== null) {
      setData(result)
    }
    return result
  }, [operation, errorHandler, ...dependencies])

  return {
    data,
    execute,
    executeWithRetry,
    error: errorHandler.error,
    isLoading: errorHandler.isLoading,
    hasError: errorHandler.hasError,
    handleError: errorHandler.handleError,
    clearError: errorHandler.clearError,
    setLoading: errorHandler.setLoading,
    executeWithErrorHandling: errorHandler.executeWithErrorHandling,
    getErrorMessage: errorHandler.getErrorMessage,
    getErrorSuggestions: errorHandler.getErrorSuggestions,
    getErrorNotification: errorHandler.getErrorNotification
  }
}

// Hook for form submissions with error handling
export const useFormSubmission = <T>(
  submitFunction: (data: T) => Promise<void>,
  options: UseErrorHandlerOptions = {}
) => {
  const errorHandler = useErrorHandler(options)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const submit = useCallback(async (data: T) => {
    setIsSubmitting(true)
    setIsSuccess(false)
    
    const result = await errorHandler.executeWithErrorHandling(
      () => submitFunction(data),
      { formData: data }
    )
    
    setIsSubmitting(false)
    
    if (result !== null) {
      setIsSuccess(true)
      return true
    }
    
    return false
  }, [submitFunction, errorHandler])

  const reset = useCallback(() => {
    setIsSuccess(false)
    errorHandler.clearError()
  }, [errorHandler])

  return {
    submit,
    isSubmitting,
    isSuccess,
    reset,
    ...errorHandler
  }
}

// Hook for API calls with automatic retry
export const useApiCall = <T>(
  apiFunction: () => Promise<T>,
  autoRetry: boolean = false,
  retryOptions?: RetryOptions
) => {
  const errorHandler = useErrorHandler({ logErrors: true })
  const [data, setData] = useState<T | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  const fetch = useCallback(async (forceRefresh: boolean = false) => {
    if (!forceRefresh && data && lastFetch) {
      // Return cached data if available and not forcing refresh
      return data
    }

    const executeFunction = autoRetry 
      ? () => errorHandler.executeWithRetry(apiFunction, retryOptions)
      : () => errorHandler.executeWithErrorHandling(apiFunction)

    const result = await executeFunction()
    
    if (result !== null) {
      setData(result)
      setLastFetch(new Date())
    }
    
    return result
  }, [apiFunction, autoRetry, retryOptions, errorHandler, data, lastFetch])

  const refresh = useCallback(() => fetch(true), [fetch])

  return {
    data,
    fetch,
    refresh,
    lastFetch,
    ...errorHandler
  }
}