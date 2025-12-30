import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';

interface ActivityItem {
  _id: string;
  userId: string;
  action: string;
  entityType: 'pickup_request' | 'complaint' | 'payment' | 'subscription' | 'user';
  entityId: string;
  oldData?: any;
  newData?: any;
  timestamp: number;
  metadata?: any;
}

interface ActivityFeedProps {
  entityType?: string;
  limit?: number;
  hours?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  entityType,
  limit = 20,
  hours = 24
}) => {
  const { user } = useAuth();
  const [selectedEntityType, setSelectedEntityType] = useState<string>(entityType || '');

  // Real-time subscription to activity feed
  const activities = useQuery(api.notifications.getActivityFeed, 
    user ? {
      userId: user.role === 'admin' ? undefined : user.id,
      entityType: selectedEntityType || undefined,
      limit,
      hours
    } : 'skip'
  );

  const getActivityIcon = (action: string, entityType: string) => {
    switch (action) {
      case 'pickup_status_update':
        return '🚛';
      case 'pickup_assigned':
        return '📅';
      case 'complaint_created':
        return '📝';
      case 'complaint_status_update':
        return '🔄';
      case 'complaint_resolved':
        return '✅';
      case 'payment_logged':
        return '💰';
      case 'user_registered':
        return '👤';
      case 'subscription_activated':
        return '📋';
      case 'notification_sent':
        return '📢';
      default:
        return '📊';
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'pickup_status_update':
      case 'pickup_assigned':
        return 'text-blue-600 bg-blue-50';
      case 'complaint_created':
        return 'text-red-600 bg-red-50';
      case 'complaint_resolved':
        return 'text-green-600 bg-green-50';
      case 'payment_logged':
        return 'text-green-600 bg-green-50';
      case 'user_registered':
        return 'text-purple-600 bg-purple-50';
      case 'subscription_activated':
        return 'text-indigo-600 bg-indigo-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getEntityTypeOptions = () => [
    { value: '', label: 'All Activities' },
    { value: 'pickup_request', label: 'Pickup Requests' },
    { value: 'complaint', label: 'Complaints' },
    { value: 'payment', label: 'Payments' },
    { value: 'subscription', label: 'Subscriptions' },
    { value: 'user', label: 'Users' }
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Activity Feed
        </h3>
        <select
          value={selectedEntityType}
          onChange={(e) => setSelectedEntityType(e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {getEntityTypeOptions().map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities === undefined ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 text-sm mt-2">Loading activities...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No recent activity</p>
          </div>
        ) : (
          activities.map((activity: ActivityItem) => (
            <div
              key={activity._id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50"
            >
              <div className={`p-2 rounded-full ${getActivityColor(activity.action)}`}>
                <span className="text-lg">
                  {getActivityIcon(activity.action, activity.entityType)}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-gray-900">
                    {formatAction(activity.action)}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mt-1">
                  {activity.entityType.replace('_', ' ')} • {activity.entityId}
                </p>
                
                {activity.newData && (
                  <div className="mt-2 text-xs text-gray-500">
                    {activity.action === 'pickup_status_update' && activity.newData.status && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        Status: {activity.newData.status}
                      </span>
                    )}
                    {activity.action === 'complaint_created' && activity.newData.priority && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        Priority: {activity.newData.priority}
                      </span>
                    )}
                    {activity.action === 'payment_logged' && activity.newData.amount && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        Amount: ₦{activity.newData.amount}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="mt-1 text-xs text-gray-400">
                  User: {activity.userId}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};