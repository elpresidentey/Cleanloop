import { render, RenderOptions } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
})

// Test wrapper component with router
const TestWrapperWithRouter = ({ children }: { children: ReactNode }) => {
  const queryClient = createTestQueryClient()
  
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  )
}

// Test wrapper component without router (for App component tests)
const TestWrapperWithoutRouter = ({ children }: { children: ReactNode }) => {
  const queryClient = createTestQueryClient()
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { withRouter?: boolean }
) => {
  const { withRouter = true, ...renderOptions } = options || {}
  
  // Don't wrap App component with router since it has its own BrowserRouter
  const wrapper = withRouter ? TestWrapperWithRouter : TestWrapperWithoutRouter
  return render(ui, { wrapper, ...renderOptions })
}

export * from '@testing-library/react'
export { customRender as render }