// Mock Convex API for testing
export const api = {
  notifications: {
    getNotifications: 'notifications:getNotifications',
    markAsRead: 'notifications:markAsRead',
    markAllAsRead: 'notifications:markAllAsRead',
    sendNotification: 'notifications:sendNotification'
  },
  pickups: {
    getPickups: 'pickups:getPickups',
    updatePickupStatus: 'pickups:updatePickupStatus',
    assignPickupToCollector: 'pickups:assignPickupToCollector'
  },
  complaints: {
    getComplaints: 'complaints:getComplaints',
    createComplaint: 'complaints:createComplaint',
    updateComplaintStatus: 'complaints:updateComplaintStatus',
    resolveComplaint: 'complaints:resolveComplaint'
  },
  metrics: {
    getDashboardMetrics: 'metrics:getDashboardMetrics',
    updateDailyPickupMetrics: 'metrics:updateDailyPickupMetrics'
  }
}