// Mock Supabase client for testing
export const supabase = {
  auth: {
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signUp: jest.fn().mockResolvedValue({ data: null, error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: null, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    }),
  },
  from: jest.fn(),
}

export const auth = {
  signUp: jest.fn().mockResolvedValue({ data: null, error: null }),
  signIn: jest.fn().mockResolvedValue({ data: null, error: null }),
  signOut: jest.fn().mockResolvedValue({ error: null }),
  getCurrentUser: jest.fn().mockResolvedValue({ user: null, error: null }),
  getSession: jest.fn().mockResolvedValue({ session: null, error: null }),
  onAuthStateChange: jest.fn().mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } }
  }),
}