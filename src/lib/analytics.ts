// Analytics integration utilities
// Supports Google Analytics 4 (GA4) and is extensible for other analytics providers

interface AnalyticsEvent {
  action: string
  category: string
  label?: string
  value?: number
}

class AnalyticsService {
  private gaMeasurementId?: string
  private enabled: boolean = false

  constructor() {
    this.gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID
    this.enabled = !!this.gaMeasurementId && import.meta.env.NODE_ENV === 'production'

    if (this.enabled) {
      this.initGA()
    }
  }

  /**
   * Initialize Google Analytics
   */
  private initGA() {
    if (!this.gaMeasurementId || typeof window === 'undefined') return

    // Load gtag script
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.gaMeasurementId}`
    document.head.appendChild(script);

    // Initialize gtag
    (window as any).dataLayer = (window as any).dataLayer || []
    function gtag(...args: any[]) {
      (window as any).dataLayer.push(args)
    }
    gtag('js', new Date())
    gtag('config', this.gaMeasurementId, {
      page_path: window.location.pathname,
    })

      // Make gtag globally available
      ; (window as any).gtag = gtag

    console.log('Google Analytics initialized')
  }

  /**
   * Track a page view
   */
  trackPageView(path: string, title?: string) {
    if (!this.enabled) return

    try {
      if ((window as any).gtag) {
        ; (window as any).gtag('config', this.gaMeasurementId, {
          page_path: path,
          page_title: title || document.title,
        })
      }
    } catch (error) {
      console.warn('Failed to track page view:', error)
    }
  }

  /**
   * Track an event
   */
  trackEvent(event: AnalyticsEvent) {
    if (!this.enabled) return

    try {
      if ((window as any).gtag) {
        ; (window as any).gtag('event', event.action, {
          event_category: event.category,
          event_label: event.label,
          value: event.value,
        })
      }
    } catch (error) {
      console.warn('Failed to track event:', error)
    }
  }

  /**
   * Track user login
   */
  trackLogin(method: string = 'email') {
    this.trackEvent({
      action: 'login',
      category: 'Authentication',
      label: method,
    })
  }

  /**
   * Track user signup
   */
  trackSignup(method: string = 'email') {
    this.trackEvent({
      action: 'sign_up',
      category: 'Authentication',
      label: method,
    })
  }

  /**
   * Track payment
   */
  trackPayment(amount: number, currency: string = 'USD') {
    this.trackEvent({
      action: 'purchase',
      category: 'Payment',
      value: amount,
      label: currency,
    })
  }

  /**
   * Track pickup request
   */
  trackPickupRequest() {
    this.trackEvent({
      action: 'request_pickup',
      category: 'Service',
    })
  }

  /**
   * Track form submission
   */
  trackFormSubmission(formName: string) {
    this.trackEvent({
      action: 'submit',
      category: 'Form',
      label: formName,
    })
  }

  /**
   * Set user properties
   */
  setUserProperties(userId: string, properties?: Record<string, any>) {
    if (!this.enabled) return

    try {
      if ((window as any).gtag) {
        ; (window as any).gtag('set', 'user_id', userId)
        if (properties) {
          ; (window as any).gtag('set', 'user_properties', properties)
        }
      }
    } catch (error) {
      console.warn('Failed to set user properties:', error)
    }
  }
}

// Export singleton instance
export const analytics = new AnalyticsService()

// Export hook for React components
export const useAnalytics = () => {
  return {
    trackPageView: analytics.trackPageView.bind(analytics),
    trackEvent: analytics.trackEvent.bind(analytics),
    trackLogin: analytics.trackLogin.bind(analytics),
    trackSignup: analytics.trackSignup.bind(analytics),
    trackPayment: analytics.trackPayment.bind(analytics),
    trackPickupRequest: analytics.trackPickupRequest.bind(analytics),
    trackFormSubmission: analytics.trackFormSubmission.bind(analytics),
    setUserProperties: analytics.setUserProperties.bind(analytics),
  }
}

export default analytics

