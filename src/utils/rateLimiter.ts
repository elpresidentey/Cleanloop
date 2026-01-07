// Client-side rate limiting utilities
// Prevents excessive API calls and improves user experience

interface RateLimitOptions {
  maxRequests: number
  windowMs: number
  identifier?: string
}

interface RequestRecord {
  count: number
  resetTime: number
}

class RateLimiter {
  private records: Map<string, RequestRecord> = new Map()

  /**
   * Check if a request is allowed
   */
  isAllowed(options: RateLimitOptions): boolean {
    const identifier = options.identifier || 'default'
    const now = Date.now()
    const record = this.records.get(identifier)

    // No record exists or window has expired
    if (!record || now > record.resetTime) {
      this.records.set(identifier, {
        count: 1,
        resetTime: now + options.windowMs,
      })
      return true
    }

    // Check if limit exceeded
    if (record.count >= options.maxRequests) {
      return false
    }

    // Increment count
    record.count++
    this.records.set(identifier, record)
    return true
  }

  /**
   * Get remaining requests in current window
   */
  getRemaining(options: RateLimitOptions): number {
    const identifier = options.identifier || 'default'
    const record = this.records.get(identifier)

    if (!record) {
      return options.maxRequests
    }

    const now = Date.now()
    if (now > record.resetTime) {
      return options.maxRequests
    }

    return Math.max(0, options.maxRequests - record.count)
  }

  /**
   * Get time until next request window
   */
  getTimeUntilReset(options: RateLimitOptions): number {
    const identifier = options.identifier || 'default'
    const record = this.records.get(identifier)

    if (!record) {
      return 0
    }

    const now = Date.now()
    return Math.max(0, record.resetTime - now)
  }

  /**
   * Clear all rate limit records
   */
  clear() {
    this.records.clear()
  }

  /**
   * Clear records for a specific identifier
   */
  clearIdentifier(identifier: string) {
    this.records.delete(identifier)
  }
}

// Singleton instance
const rateLimiter = new RateLimiter()

/**
 * Create a rate-limited function wrapper
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RateLimitOptions
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (!rateLimiter.isAllowed(options)) {
      const timeUntilReset = rateLimiter.getTimeUntilReset(options)
      const seconds = Math.ceil(timeUntilReset / 1000)
      throw new Error(
        `Rate limit exceeded. Please try again in ${seconds} second${seconds !== 1 ? 's' : ''}.`
      )
    }

    return fn(...args)
  }) as T
}

/**
 * Default rate limit configurations
 */
export const RateLimits = {
  // API calls: 10 requests per second
  API: {
    maxRequests: 10,
    windowMs: 1000,
  },
  // Form submissions: 5 per minute
  FORM_SUBMIT: {
    maxRequests: 5,
    windowMs: 60 * 1000,
  },
  // Authentication: 3 attempts per minute
  AUTH: {
    maxRequests: 3,
    windowMs: 60 * 1000,
  },
  // General: 30 requests per minute
  GENERAL: {
    maxRequests: 30,
    windowMs: 60 * 1000,
  },
}

export { rateLimiter }
export default rateLimiter

