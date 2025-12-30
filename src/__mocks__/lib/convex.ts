// Mock Convex client for testing
export const convex = {
  query: jest.fn(),
  mutation: jest.fn(),
}

export const realtimeHelpers = {
  subscribeToPickupUpdates: jest.fn(),
  subscribeToComplaintUpdates: jest.fn(),
  broadcastStatusChange: jest.fn(),
}