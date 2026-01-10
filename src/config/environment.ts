// Environment configuration for development and production

export const config = {
  // Environment
  isDevelopment: import.meta.env.NODE_ENV === 'development',
  isProduction: import.meta.env.NODE_ENV === 'production',
  
  // Supabase
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  
  // Convex
  convex: {
    url: import.meta.env.VITE_CONVEX_URL,
  },
  
  // API endpoints (for future use)
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  },
  
  // App settings
  app: {
    name: 'CleanLoop',
    version: '1.0.0',
    description: 'Refuse Collection Platform',
  }
}

// Validation function to ensure all required environment variables are present
// Only validates at runtime, not during build
export const validateEnvironment = () => {
  // Skip validation during build
  if (typeof window === 'undefined') {
    return true
  }

  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_CONVEX_URL'
  ]
  
  const missingVars = requiredVars.filter(varName => {
    const value = import.meta.env[varName]
    return !value || value.includes('placeholder') || value.includes('your-')
  })
  
  if (missingVars.length > 0) {
    console.warn(
      `⚠️ Missing or invalid environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.\n' +
      'The app will continue to load, but some features may not work correctly.'
    )
    // Don't throw - allow app to load with warnings so user can see the UI
    // User can create .env.local file manually
  }
  
  return true
}

// Development vs Production specific configurations
export const getEnvironmentConfig = () => {
  if (config.isDevelopment) {
    return {
      ...config,
      debug: true,
      logLevel: 'debug',
      enableDevTools: true,
    }
  }
  
  return {
    ...config,
    debug: false,
    logLevel: 'error',
    enableDevTools: false,
  }
}