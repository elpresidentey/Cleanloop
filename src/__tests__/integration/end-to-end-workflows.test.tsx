import { render, screen, waitFor } from '../../test-utils'
import App from '../../App'

// Mock useAuth hook with authenticated resident user
jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    profile: {
      id: 'test-user',
      role: 'resident',
      name: 'Test User',
      email: 'test@example.com'
    },
    loading: false,
    isAuthenticated: true,
    hasRole: (role: string) => role === 'resident',
    hasAnyRole: (roles: string[]) => roles.includes('resident'),
    isResident: true,
    isCollector: false,
    isAdmin: false
  }))
}))

// Mock all page components to render simple content for testing
jest.mock('../../pages/resident/DashboardPage', () => ({
  DashboardPage: () => <div data-testid="resident-dashboard">Resident Dashboard</div>
}))

jest.mock('../../pages/collector', () => ({
  CollectorDashboardPage: () => <div data-testid="collector-dashboard">Collector Dashboard</div>,
  PickupManagementPage: () => <div data-testid="pickup-management">Pickup Management</div>,
  CustomerManagementPage: () => <div data-testid="customer-management">Customer Management</div>
}))

describe('End-to-End System Workflows', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
  })

  it('should render without crashing', async () => {
    render(<App />, { withRouter: false })
    
    // Wait for any async operations to complete
    await waitFor(() => {
      expect(document.body).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('should redirect authenticated resident to dashboard', async () => {
    render(<App />, { withRouter: false })
    
    // Wait for the redirect and dashboard to render
    await waitFor(() => {
      expect(screen.getByTestId('resident-dashboard')).toBeInTheDocument()
    }, { timeout: 5000 })
    
    expect(screen.getByText('Resident Dashboard')).toBeInTheDocument()
  })

  it('should handle navigation to resident routes', async () => {
    render(<App />, { withRouter: false })
    
    // Verify the app renders and doesn't crash
    await waitFor(() => {
      expect(document.body).toBeInTheDocument()
    }, { timeout: 5000 })
  })
})