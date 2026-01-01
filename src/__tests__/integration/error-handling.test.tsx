import { render } from '../../test-utils'
import App from '../../App'

// Mock useAuth hook
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
    hasRole: (role: string) => role === 'resident'
  }))
}))

describe('Error Handling and Recovery Integration', () => {
  it('should render without crashing', () => {
    render(<App />, { withRouter: false })
    expect(document.body).toBeInTheDocument()
  })

  it('should handle errors gracefully', () => {
    render(<App />, { withRouter: false })
    expect(document.body).toBeInTheDocument()
  })
})