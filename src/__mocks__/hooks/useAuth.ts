import { User, UserRole } from '../../types'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { SignUpData } from '../../services/authService'

export interface MockAuthState {
  user: SupabaseUser | null
  profile: User | null
  session: Session | null
  loading: boolean
  error: string | null
  signUp: (userData: SignUpData) => Promise<{ user: SupabaseUser | null; error: any }>
  signIn: (email: string, password: string) => Promise<{ user: SupabaseUser | null; error: any }>
  signOut: () => Promise<{ error: any }>
  updateProfile: (updates: Partial<User>) => Promise<{ error: any }>
  hasRole: (role: UserRole) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
  isAuthenticated: boolean
  isResident: boolean
  isCollector: boolean
  isAdmin: boolean
}

export const createMockAuthState = (overrides: Partial<MockAuthState> = {}): MockAuthState => ({
  user: null,
  profile: null,
  session: null,
  loading: false,
  error: null,
  signUp: jest.fn().mockResolvedValue({ user: null, error: null }),
  signIn: jest.fn().mockResolvedValue({ user: null, error: null }),
  signOut: jest.fn().mockResolvedValue({ error: null }),
  updateProfile: jest.fn().mockResolvedValue({ error: null }),
  hasRole: jest.fn().mockReturnValue(false),
  hasAnyRole: jest.fn().mockReturnValue(false),
  isAuthenticated: false,
  isResident: false,
  isCollector: false,
  isAdmin: false,
  ...overrides
})

export const useAuth = jest.fn(() => createMockAuthState())