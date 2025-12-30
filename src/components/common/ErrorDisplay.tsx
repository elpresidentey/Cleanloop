import React from 'react'
import { AppError, isNetworkError, isAPIError, getUserFriendlyMessage, getRecoverySuggestions } from '../../utils/errorHandling'

interface ErrorDisplayProps {
  error: AppError | string | null
  title?: string
  showSuggestions?: boolean
  showRetry?: boolean
  onRetry?: () => void
  className?: string
  variant?: 'alert' | 'card' | 'inline' | 'toast'
  size?: 'sm' | 'md' | 'lg'
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  title,
  showSuggestions = true,
  showRetry = true,
  onRetry,
  className = '',
  variant = 'alert',
  size = 'md'
}) => {
  if (!error) return null

  const errorMessage = typeof error === 'string' ? error : getUserFriendlyMessage(error)
  const suggestions = typeof error === 'string' ? [] : getRecoverySuggestions(error)
  
  const getIcon = () => {
    if (typeof error === 'string') {
      return (
        <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    }

    if (isNetworkError(error)) {
      return (
        <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }

    return (
      <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    )
  }

  const getTitle = () => {
    if (title) return title
    
    if (typeof error === 'string') return 'Error'
    
    if (isNetworkError(error)) return 'Connection Problem'
    if (isAPIError(error)) {
      switch (error.code) {
        case 'VALIDATION_ERROR': return 'Invalid Input'
        case 'PERMISSION_DENIED': return 'Access Denied'
        case 'NOT_FOUND': return 'Not Found'
        default: return 'Server Error'
      }
    }
    
    return 'Error'
  }

  const getColorClasses = () => {
    if (typeof error === 'string') return 'red'
    
    if (isNetworkError(error)) return 'yellow'
    if (isAPIError(error)) {
      switch (error.code) {
        case 'VALIDATION_ERROR': return 'yellow'
        case 'PERMISSION_DENIED': return 'red'
        case 'NOT_FOUND': return 'blue'
        default: return 'red'
      }
    }
    
    return 'red'
  }

  const colorClasses = getColorClasses()
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  if (variant === 'alert') {
    return (
      <div className={`bg-${colorClasses}-50 border border-${colorClasses}-200 rounded-md p-4 ${className}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3">
            <h3 className={`${sizeClasses[size]} font-medium text-${colorClasses}-800`}>
              {getTitle()}
            </h3>
            <div className={`mt-2 ${sizeClasses[size]} text-${colorClasses}-700`}>
              <p>{errorMessage}</p>
              
              {showSuggestions && suggestions.length > 0 && (
                <div className="mt-3">
                  <p className="font-medium">Try these solutions:</p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {showRetry && onRetry && (
                <div className="mt-4">
                  <button
                    onClick={onRetry}
                    className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-${colorClasses}-700 bg-${colorClasses}-100 hover:bg-${colorClasses}-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${colorClasses}-500`}
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className={`mx-auto h-12 w-12 text-${colorClasses}-500`}>
            {getIcon()}
          </div>
          <h3 className={`mt-2 ${sizeClasses[size]} font-medium text-gray-900`}>
            {getTitle()}
          </h3>
          <p className={`mt-1 ${sizeClasses[size]} text-gray-500`}>
            {errorMessage}
          </p>
          
          {showSuggestions && suggestions.length > 0 && (
            <div className="mt-4 text-left">
              <p className="text-sm font-medium text-gray-700">Suggestions:</p>
              <ul className="mt-2 text-sm text-gray-600 space-y-1">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {showRetry && onRetry && (
            <div className="mt-6">
              <button
                onClick={onRetry}
                className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-${colorClasses}-600 hover:bg-${colorClasses}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${colorClasses}-500`}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center space-x-2 text-${colorClasses}-600 ${sizeClasses[size]} ${className}`}>
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <span>{errorMessage}</span>
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className={`text-${colorClasses}-700 hover:text-${colorClasses}-900 underline`}
          >
            Retry
          </button>
        )}
      </div>
    )
  }

  if (variant === 'toast') {
    return (
      <div className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 ${className}`}>
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className={`${sizeClasses[size]} font-medium text-gray-900`}>
                {getTitle()}
              </p>
              <p className={`mt-1 ${sizeClasses[size]} text-gray-500`}>
                {errorMessage}
              </p>
              {showRetry && onRetry && (
                <div className="mt-3 flex space-x-7">
                  <button
                    onClick={onRetry}
                    className={`bg-white rounded-md text-sm font-medium text-${colorClasses}-600 hover:text-${colorClasses}-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${colorClasses}-500`}
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

// Specialized error components
export const NetworkErrorDisplay: React.FC<Omit<ErrorDisplayProps, 'error'> & { error: any }> = ({ error, ...props }) => {
  if (!isNetworkError(error)) return null
  
  return (
    <ErrorDisplay
      {...props}
      error={error}
      title="Connection Problem"
      variant="alert"
    />
  )
}

export const ValidationErrorDisplay: React.FC<{ errors: Record<string, string>; className?: string }> = ({ 
  errors, 
  className = '' 
}) => {
  const errorEntries = Object.entries(errors).filter(([_, message]) => message)
  
  if (errorEntries.length === 0) return null

  return (
    <div className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            Please correct the following errors:
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <ul className="list-disc list-inside space-y-1">
              {errorEntries.map(([field, message]) => (
                <li key={field}>
                  <span className="font-medium">{field}:</span> {message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export const LoadingErrorDisplay: React.FC<{ onRetry?: () => void; className?: string }> = ({ 
  onRetry, 
  className = '' 
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="mx-auto h-12 w-12 text-gray-400">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="mt-2 text-sm font-medium text-gray-900">
        Failed to load data
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        There was a problem loading the information.
      </p>
      {onRetry && (
        <div className="mt-6">
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}