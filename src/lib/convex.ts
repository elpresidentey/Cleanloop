import { ConvexReactClient } from 'convex/react'

// Mock API for build compatibility - hooks can import from generated API directly
// This provides a fallback when the generated API is not available
export const api = {
  pickups: {
    updatePickupStatus: 'pickups:updatePickupStatus',
    assignPickupToCollector: 'pickups:assignPickupToCollector',
    getPickupStatusUpdates: 'pickups:getPickupStatusUpdates',
    getCollectorPickups: 'pickups:getCollectorPickups'
  },
  complaints: {
    createComplaint: 'complaints:createComplaint',
    updateComplaintStatus: 'complaints:updateComplaintStatus',
    resolveComplaint: 'complaints:resolveComplaint',
    getComplaintUpdates: 'complaints:getComplaintUpdates'
  },
  notifications: {
    sendNotification: 'notifications:sendNotification',
    markNotificationAsRead: 'notifications:markNotificationAsRead',
    markAllNotificationsAsRead: 'notifications:markAllNotificationsAsRead',
    getUserNotifications: 'notifications:getUserNotifications',
    getUnreadNotificationCount: 'notifications:getUnreadNotificationCount',
    getSystemNotifications: 'notifications:getSystemNotifications',
    getActivityFeed: 'notifications:getActivityFeed',
    broadcastStatusChange: 'notifications:broadcastStatusChange',
    sendPaymentNotification: 'notifications:sendPaymentNotification'
  },
  metrics: {
    updateDailyPickupMetrics: 'metrics:updateDailyPickupMetrics',
    getDashboardSummary: 'metrics:getDashboardSummary',
    getAreaMetrics: 'metrics:getAreaMetrics'
  }
} as any

// Use environment variable or fallback to known value for development
const convexUrl = import.meta.env.VITE_CONVEX_URL || 'https://first-hornet-199.convex.cloud'

// Warn if using fallback value (means .env.local is not set)
if (typeof window !== 'undefined' && !import.meta.env.VITE_CONVEX_URL) {
  console.warn('⚠️ Using default Convex URL. For production, please set VITE_CONVEX_URL in .env.local')
}

const safeConvexUrl = convexUrl

export const convex = new ConvexReactClient(safeConvexUrl)

// Real-time subscription helpers
export const realtimeHelpers = {
  // Subscribe to pickup updates for a specific user
  subscribeToPickupUpdates: (userId: string) => {
    console.log(`Setting up pickup updates subscription for user: ${userId}`)
    // This will be used with useQuery hook in components
    return {
      queryName: "pickups:getPickupStatusUpdates",
      args: { userId }
    }
  },

  // Subscribe to complaint updates for admins
  subscribeToComplaintUpdates: (adminId: string) => {
    console.log(`Setting up complaint updates subscription for admin: ${adminId}`)
    return {
      queryName: "complaints:getComplaintUpdates",
      args: { adminId }
    }
  },

  // Subscribe to notifications for a user
  subscribeToNotifications: (userId: string) => {
    console.log(`Setting up notifications subscription for user: ${userId}`)
    return {
      queryName: "notifications:getUserNotifications",
      args: { userId, unreadOnly: false, limit: 20 }
    }
  },

  // Subscribe to unread notification count
  subscribeToUnreadCount: (userId: string) => {
    console.log(`Setting up unread count subscription for user: ${userId}`)
    return {
      queryName: "notifications:getUnreadNotificationCount",
      args: { userId }
    }
  },

  // Subscribe to system notifications for admins
  subscribeToSystemNotifications: () => {
    console.log(`Setting up system notifications subscription`)
    return {
      queryName: "notifications:getSystemNotifications",
      args: { limit: 50, hours: 24 }
    }
  },

  // Subscribe to real-time dashboard metrics
  subscribeToDashboardMetrics: (area?: string) => {
    console.log(`Setting up dashboard metrics subscription for area: ${area || 'all'}`)
    return {
      queryName: "metrics:getDashboardSummary",
      args: { area }
    }
  },

  // Subscribe to activity feed
  subscribeToActivityFeed: (userId?: string, entityType?: string) => {
    console.log(`Setting up activity feed subscription`)
    return {
      queryName: "notifications:getActivityFeed",
      args: { userId, entityType, limit: 50, hours: 24 }
    }
  },

  // Subscribe to collector pickups
  subscribeToCollectorPickups: (collectorId: string, date?: string) => {
    console.log(`Setting up collector pickups subscription for: ${collectorId}`)
    return {
      queryName: "pickups:getCollectorPickups",
      args: { collectorId, date }
    }
  },

  // Subscribe to area metrics for monitoring
  subscribeToAreaMetrics: (area?: string) => {
    console.log(`Setting up area metrics subscription for: ${area || 'all areas'}`)
    return {
      queryName: "metrics:getAreaMetrics",
      args: { area, days: 7 }
    }
  }
}

// Real-time mutation helpers
export const realtimeMutations = {
  // Update pickup status with real-time broadcasting
  updatePickupStatus: async (args: {
    pickupId: string
    userId: string
    collectorId?: string
    oldStatus?: string
    newStatus: string
    notes?: string
    location?: {
      area: string
      street: string
      houseNumber: string
    }
  }) => {
    return convex.mutation(api.pickups.updatePickupStatus as any, args)
  },

  // Create complaint with real-time notification
  createComplaint: async (args: {
    complaintId: string
    userId: string
    pickupId: string
    description: string
    photoUrl?: string
    priority?: string
  }) => {
    return convex.mutation(api.complaints.createComplaint as any, args)
  },

  // Send notification
  sendNotification: async (args: {
    userId: string
    type: "pickup_status_change" | "complaint_update" | "payment_received" | "new_pickup_assigned" | "system_alert"
    title: string
    message: string
    data?: any
  }) => {
    return convex.mutation(api.notifications.sendNotification as any, args)
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId: string, userId: string) => {
    return convex.mutation(api.notifications.markNotificationAsRead as any, { 
      notificationId, 
      userId 
    })
  },

  // Mark all notifications as read
  markAllNotificationsAsRead: async (userId: string) => {
    return convex.mutation(api.notifications.markAllNotificationsAsRead as any, { userId })
  },

  // Assign pickup to collector
  assignPickupToCollector: async (args: {
    pickupId: string
    userId: string
    collectorId: string
    scheduledDate: string
    location: {
      area: string
      street: string
      houseNumber: string
    }
  }) => {
    return convex.mutation(api.pickups.assignPickupToCollector as any, args)
  },

  // Update complaint status
  updateComplaintStatus: async (args: {
    complaintId: string
    userId: string
    adminId: string
    oldStatus?: string
    newStatus: string
    adminNotes?: string
  }) => {
    return convex.mutation(api.complaints.updateComplaintStatus as any, args)
  },

  // Resolve complaint
  resolveComplaint: async (args: {
    complaintId: string
    userId: string
    adminId: string
    resolution: string
    adminNotes?: string
  }) => {
    return convex.mutation(api.complaints.resolveComplaint as any, args)
  },

  // Update daily metrics
  updateDailyPickupMetrics: async (args: {
    date: string
    area?: string
    collectorId?: string
    totalPickups: number
    completedPickups: number
    missedPickups: number
  }) => {
    return convex.mutation(api.metrics.updateDailyPickupMetrics as any, args)
  }
}