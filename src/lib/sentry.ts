// Sentry error monitoring integration
// This service provides error tracking and monitoring in production

interface SentryConfig {
  dsn?: string
  environment?: string
  enabled: boolean
}

const config: SentryConfig = {
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.NODE_ENV || 'development',
  enabled: import.meta.env.NODE_ENV === 'production' && !!import.meta.env.VITE_SENTRY_DSN,
}

/**
 * Initialize Sentry error monitoring
 * This will only work if VITE_SENTRY_DSN is configured
 */
export const initSentry = async () => {
  if (!config.enabled || !config.dsn) {
    return
  }

  try {
    // Dynamically import Sentry to avoid bundling in dev
    const Sentry = await import('@sentry/react')
    
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      tracesSampleRate: 0.1, // 10% of transactions
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of error sessions
      beforeSend(event) {
        // Filter out development errors
        if (config.environment === 'development') {
          return null
        }
        return event
      },
    })

    console.log('Sentry initialized for error monitoring')
  } catch (error) {
    console.warn('Failed to initialize Sentry:', error)
  }
}

/**
 * Capture an exception to Sentry
 */
export const captureException = async (error: Error, context?: Record<string, any>) => {
  if (!config.enabled) {
    console.error('Error (Sentry not configured):', error, context)
    return
  }

  try {
    const Sentry = await import('@sentry/react')
    Sentry.captureException(error, {
      contexts: {
        custom: context || {},
      },
    })
  } catch (err) {
    console.warn('Failed to capture exception to Sentry:', err)
    console.error('Original error:', error, context)
  }
}

/**
 * Capture a message to Sentry
 */
export const captureMessage = async (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  if (!config.enabled) {
    console.log(`[${level.toUpperCase()}]`, message)
    return
  }

  try {
    const Sentry = await import('@sentry/react')
    Sentry.captureMessage(message, level)
  } catch (err) {
    console.warn('Failed to capture message to Sentry:', err)
    console.log(`[${level.toUpperCase()}]`, message)
  }
}

/**
 * Set user context for Sentry
 */
export const setUserContext = async (userId: string, email?: string, username?: string) => {
  if (!config.enabled) return

  try {
    const Sentry = await import('@sentry/react')
    Sentry.setUser({
      id: userId,
      email,
      username,
    })
  } catch (err) {
    console.warn('Failed to set Sentry user context:', err)
  }
}

/**
 * Clear user context (e.g., on logout)
 */
export const clearUserContext = async () => {
  if (!config.enabled) return

  try {
    const Sentry = await import('@sentry/react')
    Sentry.setUser(null)
  } catch (err) {
    console.warn('Failed to clear Sentry user context:', err)
  }
}

export default {
  initSentry,
  captureException,
  captureMessage,
  setUserContext,
  clearUserContext,
}

