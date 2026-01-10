import { useQuery, useMutation } from 'convex/react';
import { api } from '../lib/convex';
import { useAuth } from './useAuth';
import { useCallback } from 'react';

export const useRealTimeUpdates = () => {
  const { user } = useAuth();

  // Real-time queries for different user roles
  const pickupUpdates = useQuery(api.pickups.getPickupStatusUpdates as any, 
    user ? {
      userId: user.role === 'resident' ? user.id : undefined,
      collectorId: user.role === 'collector' ? user.id : undefined,
      limit: 50
    } : 'skip'
  );

  const complaintUpdates = useQuery(api.complaints.getComplaintUpdates as any,
    user ? {
      userId: user.role === 'resident' ? user.id : undefined,
      adminId: user.role === 'admin' ? user.id : undefined,
      limit: 50
    } : 'skip'
  );

  const recentPickupActivity = useQuery(api.pickups.getPickupStatusUpdates as any,
    user ? {
      userId: user.role === 'resident' ? user.id : undefined,
      collectorId: user.role === 'collector' ? user.id : undefined,
      hours: 24
    } : 'skip'
  );

  const recentComplaintActivity = useQuery(api.complaints.getComplaintUpdates as any,
    user?.role === 'admin' ? { hours: 24 } : 'skip'
  );

  const collectorPickups = useQuery(api.pickups.getCollectorPickups as any,
    user?.role === 'collector' ? { 
      collectorId: user.id,
      date: new Date().toISOString().split('T')[0]
    } : 'skip'
  );

  const complaintsForAdmin = useQuery(api.complaints.getComplaintUpdates as any,
    user?.role === 'admin' ? {} : 'skip'
  );

  const activityFeed = useQuery(api.notifications.getActivityFeed as any,
    user ? {
      userId: user.role === 'admin' ? undefined : user.id,
      limit: 50,
      hours: 24
    } : 'skip'
  );

  // Mutations
  const updatePickupStatus = useMutation(api.pickups.updatePickupStatus as any);
  const assignPickupToCollector = useMutation(api.pickups.assignPickupToCollector as any);
  const createComplaint = useMutation(api.complaints.createComplaint as any);
  const updateComplaintStatus = useMutation(api.complaints.updateComplaintStatus as any);
  const resolveComplaint = useMutation(api.complaints.resolveComplaint as any);

  // Helper functions
  const updatePickupStatusWithNotification = useCallback(async (
    pickupId: string,
    userId: string,
    newStatus: string,
    options?: {
      collectorId?: string;
      oldStatus?: string;
      notes?: string;
      location?: {
        area: string;
        street: string;
        houseNumber: string;
      };
    }
  ) => {
    try {
      await updatePickupStatus({
        pickupId,
        userId,
        newStatus,
        collectorId: options?.collectorId,
        oldStatus: options?.oldStatus,
        notes: options?.notes,
        location: options?.location
      });
    } catch (error) {
      console.error('Failed to update pickup status:', error);
      throw error;
    }
  }, [updatePickupStatus]);

  const assignPickup = useCallback(async (
    pickupId: string,
    userId: string,
    collectorId: string,
    scheduledDate: string,
    location: {
      area: string;
      street: string;
      houseNumber: string;
    }
  ) => {
    try {
      await assignPickupToCollector({
        pickupId,
        userId,
        collectorId,
        scheduledDate,
        location
      });
    } catch (error) {
      console.error('Failed to assign pickup:', error);
      throw error;
    }
  }, [assignPickupToCollector]);

  const createComplaintWithNotification = useCallback(async (
    complaintId: string,
    userId: string,
    pickupId: string,
    description: string,
    options?: {
      photoUrl?: string;
      priority?: string;
    }
  ) => {
    try {
      await createComplaint({
        complaintId,
        userId,
        pickupId,
        description,
        photoUrl: options?.photoUrl,
        priority: options?.priority
      });
    } catch (error) {
      console.error('Failed to create complaint:', error);
      throw error;
    }
  }, [createComplaint]);

  const updateComplaintStatusWithNotification = useCallback(async (
    complaintId: string,
    userId: string,
    adminId: string,
    newStatus: string,
    options?: {
      oldStatus?: string;
      adminNotes?: string;
    }
  ) => {
    try {
      await updateComplaintStatus({
        complaintId,
        userId,
        adminId,
        newStatus,
        oldStatus: options?.oldStatus,
        adminNotes: options?.adminNotes
      });
    } catch (error) {
      console.error('Failed to update complaint status:', error);
      throw error;
    }
  }, [updateComplaintStatus]);

  const resolveComplaintWithNotification = useCallback(async (
    complaintId: string,
    userId: string,
    adminId: string,
    resolution: string,
    adminNotes?: string
  ) => {
    try {
      await resolveComplaint({
        complaintId,
        userId,
        adminId,
        resolution,
        adminNotes
      });
    } catch (error) {
      console.error('Failed to resolve complaint:', error);
      throw error;
    }
  }, [resolveComplaint]);

  // Utility functions
  const getLatestPickupStatus = useCallback((pickupId: string) => {
    if (!pickupUpdates) return null;
    
    const updates = pickupUpdates.filter((update: any) => update.pickupId === pickupId);
    return updates.length > 0 ? updates[0] : null;
  }, [pickupUpdates]);

  const getLatestComplaintStatus = useCallback((complaintId: string) => {
    if (!complaintUpdates) return null;
    
    const updates = complaintUpdates.filter((update: any) => update.complaintId === complaintId);
    return updates.length > 0 ? updates[0] : null;
  }, [complaintUpdates]);

  const getTodayPickupsForCollector = useCallback(() => {
    if (!collectorPickups) return [];
    
    const today = new Date().toISOString().split('T')[0];
    return collectorPickups.filter((pickup: any) => {
      const pickupDate = new Date(pickup.timestamp).toISOString().split('T')[0];
      return pickupDate === today;
    });
  }, [collectorPickups]);

  const getUnresolvedComplaints = useCallback(() => {
    if (!complaintsForAdmin) return [];
    
    return complaintsForAdmin.filter((complaint: any) => 
      complaint.newStatus !== 'resolved' && complaint.newStatus !== 'closed'
    );
  }, [complaintsForAdmin]);

  return {
    // Data
    pickupUpdates,
    complaintUpdates,
    recentPickupActivity,
    recentComplaintActivity,
    collectorPickups,
    complaintsForAdmin,
    activityFeed,
    
    // Actions
    updatePickupStatusWithNotification,
    assignPickup,
    createComplaintWithNotification,
    updateComplaintStatusWithNotification,
    resolveComplaintWithNotification,
    
    // Utilities
    getLatestPickupStatus,
    getLatestComplaintStatus,
    getTodayPickupsForCollector,
    getUnresolvedComplaints,
    
    // Loading states
    isPickupUpdatesLoading: pickupUpdates === undefined,
    isComplaintUpdatesLoading: complaintUpdates === undefined,
    isActivityFeedLoading: activityFeed === undefined
  };
};