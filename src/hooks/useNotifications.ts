import { useQuery, useMutation } from 'convex/react';
import { api } from '../lib/convex';
import { useAuth } from './useAuth';
import { useCallback } from 'react';

export const useNotifications = () => {
  const { user } = useAuth();

  // Real-time queries - using string literals for compatibility
  const notifications = useQuery(
    api.notifications.getUserNotifications as any, 
    user ? { userId: user.id, unreadOnly: false, limit: 50 } : 'skip'
  );
  
  const unreadCount = useQuery(
    api.notifications.getUnreadNotificationCount as any,
    user ? { userId: user.id } : 'skip'
  );

  const systemNotifications = useQuery(
    api.notifications.getSystemNotifications as any,
    user?.role === 'admin' ? { limit: 100, hours: 24 } : 'skip'
  );

  // Mutations
  const sendNotification = useMutation(api.notifications.sendNotification as any);
  const markAsRead = useMutation(api.notifications.markNotificationAsRead as any);
  const markAllAsRead = useMutation(api.notifications.markAllNotificationsAsRead as any);
  const broadcastStatusChange = useMutation(api.notifications.broadcastStatusChange as any);
  const sendPaymentNotification = useMutation(api.notifications.sendPaymentNotification as any);

  // Helper functions
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;
    try {
      await markAsRead({ notificationId, userId: user.id });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }, [markAsRead, user]);

  const markAllNotificationsAsRead = useCallback(async () => {
    if (!user) return;
    try {
      await markAllAsRead({ userId: user.id });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }, [markAllAsRead, user]);

  const sendPickupStatusNotification = useCallback(async (
    userId: string,
    pickupId: string,
    oldStatus: string,
    newStatus: string
  ) => {
    try {
      await sendNotification({
        userId,
        type: 'pickup_status_change',
        title: 'Pickup Status Updated',
        message: `Your pickup status has been updated from ${oldStatus} to ${newStatus}`,
        data: {
          pickupId,
          oldStatus,
          newStatus,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      console.error('Failed to send pickup status notification:', error);
      throw error;
    }
  }, [sendNotification]);

  const sendComplaintUpdateNotification = useCallback(async (
    userId: string,
    complaintId: string,
    status: string,
    adminNotes?: string
  ) => {
    try {
      await sendNotification({
        userId,
        type: 'complaint_update',
        title: 'Complaint Status Updated',
        message: `Your complaint status has been updated to: ${status}`,
        data: {
          complaintId,
          status,
          adminNotes,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      console.error('Failed to send complaint update notification:', error);
      throw error;
    }
  }, [sendNotification]);

  const sendPickupAssignmentNotification = useCallback(async (
    collectorId: string,
    pickupId: string,
    scheduledDate: string,
    location: { area: string; street: string; houseNumber: string }
  ) => {
    try {
      await sendNotification({
        userId: collectorId,
        type: 'new_pickup_assigned',
        title: 'New Pickup Assigned',
        message: `You have been assigned a new pickup for ${scheduledDate}`,
        data: {
          pickupId,
          scheduledDate,
          location,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      console.error('Failed to send pickup assignment notification:', error);
      throw error;
    }
  }, [sendNotification]);

  const broadcastPickupStatusChange = useCallback(async (
    pickupId: string,
    status: string,
    affectedUsers: string[],
    title: string,
    message: string,
    data?: any
  ) => {
    try {
      await broadcastStatusChange({
        pickupId,
        status,
        affectedUsers,
        title,
        message,
        data
      });
    } catch (error) {
      console.error('Failed to broadcast status change:', error);
      throw error;
    }
  }, [broadcastStatusChange]);

  const sendPaymentConfirmation = useCallback(async (
    userId: string,
    paymentId: string,
    amount: number,
    currency: string,
    paymentMethod: string
  ) => {
    try {
      await sendPaymentNotification({
        userId,
        paymentId,
        amount,
        currency,
        paymentMethod
      });
    } catch (error) {
      console.error('Failed to send payment notification:', error);
      throw error;
    }
  }, [sendPaymentNotification]);

  const sendSystemAlert = useCallback(async (
    title: string,
    message: string,
    data?: any
  ) => {
    try {
      await sendNotification({
        userId: 'system',
        type: 'system_alert',
        title,
        message,
        data
      });
    } catch (error) {
      console.error('Failed to send system alert:', error);
      throw error;
    }
  }, [sendNotification]);

  return {
    // Data
    notifications,
    unreadCount,
    systemNotifications,
    
    // Actions
    markNotificationAsRead,
    markAllNotificationsAsRead,
    sendPickupStatusNotification,
    sendComplaintUpdateNotification,
    sendPickupAssignmentNotification,
    broadcastPickupStatusChange,
    sendPaymentConfirmation,
    sendSystemAlert,
    
    // Loading states
    isLoading: notifications === undefined,
    isUnreadCountLoading: unreadCount === undefined,
    isSystemNotificationsLoading: systemNotifications === undefined
  };
};