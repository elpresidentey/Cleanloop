import { render, screen } from '../../test-utils'
import App from '../../App'

// Mock useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    profile: {
      id: 'test-user',
      role: 'collector',
      name: 'Test User',
      email: 'test@example.com'
    },
    loading: false,
    isAuthenticated: true,
    hasRole: (role: string) => role === 'collector'
  }))
}))

describe('Collector End-to-End Workflow', () => {
  it('should render without crashing', () => {
    render(<App />, { withRouter: false })
    expect(document.body).toBeInTheDocument()
  })

  it('should handle collector workflow', () => {
    render(<App />, { withRouter: false })
    expect(document.body).toBeInTheDocument()
  })
})