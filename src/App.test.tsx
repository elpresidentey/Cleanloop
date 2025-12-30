import { render, waitFor } from './test-utils'
import App from './App'
import { createMockAuthState } from './__mocks__/hooks/useAuth'

// Mock the useAuth hook to control authentication state
jest.mock('./hooks/useAuth', () => ({
  useAuth: jest.fn()
}))

import { useAuth } from './hooks/useAuth'
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('App', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockUseAuth.mockReset()
  })

  it('shows loading spinner when authentication is loading', () => {
    mockUseAuth.mockReturnValue(createMockAuthState({
      loading: true
    }))

    render(<App />, { withRouter: false })
    
    // Should show loading spinner
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('redirects to login when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue(createMockAuthState({
      loading: false
    }))

    render(<App />, { withRouter: false })
    
    await waitFor(() => {
      // Should redirect to login page
      expect(window.location.pathname).toBe('/login')
    })
  })

  it('renders without crashing when authenticated', () => {
    const mockUser = {
      id: '123',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2023-01-01T00:00:00Z'
    }
    
    const mockProfile = {
      id: '123',
      role: 'resident' as const,
      name: 'Test User',
      email: 'test@example.com',
      phone: '123-456-7890',
      location: {
        area: 'Test Area',
        street: 'Test Street',
        houseNumber: '123'
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    }

    mockUseAuth.mockReturnValue(createMockAuthState({
      profile: mockProfile,
      user: mockUser,
      isAuthenticated: true,
      isResident: true
    }))

    const { container } = render(<App />, { withRouter: false })
    expect(container).toBeInTheDocument()
  })
})
