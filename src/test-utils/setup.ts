import '@testing-library/jest-dom'

// Mock import.meta.env for Vite environment variables
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_SUPABASE_URL: 'http://localhost:54321',
        VITE_SUPABASE_ANON_KEY: 'test-key',
        VITE_CONVEX_URL: 'http://localhost:3210',
        NODE_ENV: 'test',
      },
    },
  },
})

// Setup proper window.location for React Router
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  },
  writable: true,
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
;(
  globalThis as unknown as { IntersectionObserver: unknown }
).IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null
  }
  disconnect() {
    return null
  }
  unobserve() {
    return null
  }
}

// Mock all service classes to prevent network calls
jest.mock('../services/authService', () => ({
  AuthService: {
    signUp: jest.fn().mockResolvedValue({ user: null, error: null }),
    signIn: jest.fn().mockResolvedValue({ user: null, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    updateProfile: jest.fn().mockResolvedValue({ error: null }),
  }
}))

jest.mock('../services/dataRetrievalService', () => ({
  DataRetrievalService: {
    getComplaints: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, totalPages: 1 }),
    getPickupRequests: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, totalPages: 1 }),
    getPayments: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, totalPages: 1 }),
    getCustomers: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, totalPages: 1 }),
  }
}))

jest.mock('../services/complaintService', () => ({
  ComplaintService: {
    getComplaints: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, totalPages: 1 }),
    createComplaint: jest.fn().mockResolvedValue({ data: null, error: null }),
    updateComplaint: jest.fn().mockResolvedValue({ data: null, error: null }),
  }
}))

jest.mock('../services/pickupService', () => ({
  PickupService: {
    getPickupRequests: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, totalPages: 1 }),
    createPickupRequest: jest.fn().mockResolvedValue({ data: null, error: null }),
    updatePickupRequest: jest.fn().mockResolvedValue({ data: null, error: null }),
  }
}))

jest.mock('../services/paymentService', () => ({
  PaymentService: {
    getPayments: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, totalPages: 1 }),
    logPayment: jest.fn().mockResolvedValue({ data: null, error: null }),
  }
}))

jest.mock('../services/subscriptionService', () => ({
  SubscriptionService: {
    getByUserId: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ data: null, error: null }),
    update: jest.fn().mockResolvedValue({ data: null, error: null }),
  }
}))

jest.mock('../services/customerService', () => ({
  CustomerService: {
    getCustomerDetails: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, totalPages: 1 }),
  }
}))

jest.mock('../services/adminService', () => ({
  AdminService: {
    getMetrics: jest.fn().mockResolvedValue({
      totalUsers: 0,
      totalPickups: 0,
      totalComplaints: 0,
      totalRevenue: 0,
    }),
  }
}))

// Mock React Query to prevent network calls
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isLoading: false,
    error: null,
  })),
}))
