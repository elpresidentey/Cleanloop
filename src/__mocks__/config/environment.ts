// Mock environment configuration for testing
export const config = {
  isDevelopment: true,
  isProduction: false,
  supabase: {
    url: 'http://localhost:54321',
    anonKey: 'test-key',
  },
  convex: {
    url: 'http://localhost:3210',
  },
  api: {
    baseUrl: 'http://localhost:3000',
  },
  app: {
    name: 'CleanLoop',
    version: '1.0.0',
    description: 'Refuse Collection Platform',
  },
}

export const validateEnvironment = jest.fn().mockReturnValue(true)

export const getEnvironmentConfig = jest.fn().mockReturnValue({
  ...config,
  debug: true,
  logLevel: 'debug',
  enableDevTools: true,
})