import React, { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
// import { api } from '../../convex/_generated/api'
// Mock API for build compatibility
const api = {
  pickups: {
    getPickupUpdates: 'pickups:getPickupUpdates'
  },
  complaints: {
    getComplaintUpdates: 'complaints:getComplaintUpdates'
  }
} as any;
import { useAuth } from '../../hooks/useAuth';

interface StatusUpdate {
  _id: string;
  pickupId: string;
  userId: string;
  collectorId?: string;
  oldStatus?: string;
  newStatus: string;
  timestamp: number;
  notes?: string;
  location?: {
    area: string;
    street: string;
    houseNumber: string;
  };
}

interface RealTimeStatusUpdatesProps {
  pickupId?: string;
  collectorId?: string;
  limit?: number;
}

export const RealTimeStatusUpdates: React.FC<RealTimeStatusUpdatesProps> = ({
  pickupId,
  collectorId,
  limit = 10
}) => {
  const { user } = useAuth();
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const [newUpdatesCount, setNewUpdatesCount] = useState(0);

  // Real-time subscription to pickup status updates
  const statusUpdates = useQuery(api.pickups.getPickupStatusUpdates, 
    user ? {
      userId: user.role === 'resident' ? user.id : undefined,
      collectorId: user.role === 'collector' ? (collectorId || user.id) : collectorId,
      pickupId,
      limit
    } : 'skip'
  );

  // Track new updates
  useEffect(() => {
    if (statusUpdates && statusUpdates.length > 0) {
      const latestUpdate = statusUpdates[0];
      if (latestUpdate.timestamp > lastUpdateTime) {
        if (lastUpdateTime > 0) {
          setNewUpdatesCount(prev => prev + 1);
        }
        setLastUpdateTime(latestUpdate.timestamp);
      }
    }
  }, [statusUpdates, lastUpdateTime]);

  // Clear new updates count after a delay
  useEffect(() => {
    if (newUpdatesCount > 0) {
      const timer = setTimeout(() => {
        setNewUpdatesCount(0);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [newUpdatesCount]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested':
        return 'text-yellow-600 bg-yellow-100';
      case 'scheduled':
        return 'text-blue-600 bg-blue-100';
      case 'picked_up':
        return 'text-green-600 bg-green-100';
      case 'missed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!user) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Real-time Status Updates
        </h3>
        {newUpdatesCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-sm text-green-600">
              {newUpdatesCount} new update{newUpdatesCount > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {statusUpdates === undefined ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 text-sm mt-2">Loading updates...</p>
          </div>
        ) : statusUpdates.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No status updates yet</p>
          </div>
        ) : (
          statusUpdates.map((update: StatusUpdate, index: number) => (
            <div
              key={update._id}
              className={`border-l-4 pl-4 py-3 ${
                index === 0 && newUpdatesCount > 0
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      update.newStatus
                    )}`}
                  >
                    {formatStatus(update.newStatus)}
                  </span>
                  {update.oldStatus && (
                    <span className="text-xs text-gray-500">
                      from {formatStatus(update.oldStatus)}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(update.timestamp)}
                </span>
              </div>

              {update.location && (
                <div className="mt-2 text-sm text-gray-600">
                  📍 {update.location.houseNumber} {update.location.street}, {update.location.area}
                </div>
              )}

              {update.notes && (
                <div className="mt-2 text-sm text-gray-600 italic">
                  "{update.notes}"
                </div>
              )}

              <div className="mt-2 text-xs text-gray-500">
                Pickup ID: {update.pickupId}
                {update.collectorId && (
                  <span className="ml-2">• Collector: {update.collectorId}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};