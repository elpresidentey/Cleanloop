import React from 'react'
import { ConvexProvider } from 'convex/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { convex } from '../lib/convex'
import { validateEnvironment } from '../config/environment'

// Validate environment variables on app startup
validateEnvironment()

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
})

interface AppProvidersProps {
  children: React.ReactNode
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ConvexProvider client={convex}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ConvexProvider>
  )
}