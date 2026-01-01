import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
// import { api } from '../../convex/_generated/api'
// Mock API for build compatibility
const api = {
  notifications: {
    getNotifications: 'notifications:getNotifications',
    markAsRead: 'notifications:markAsRead',
    markAllAsRead: 'notifications:markAllAsRead'
  }
} as any;
import { useAuth } from '../../hooks/useAuth';

interface Notification {
  _id: string;
  userId: string;
  type: 'pickup_status_change' | 'complaint_update' | 'payment_received' | 'new_pickup_assigned' | 'system_alert';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: number;
}

export const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const [showAll, setShowAll] = useState(false);
  
  // Real-time subscription to user notifications
  const notifications = useQuery(api.notifications.getUserNotifications, 
    user ? { 
      userId: user.id, 
      unreadOnly: !showAll,
      limit: showAll ? 50 : 10
    } : 'skip'
  );
  
  const unreadCount = useQuery(api.notifications.getUnreadNotificationCount,
    user ? { userId: user.id } : 'skip'
  );
  
  const markAsRead = useMutation(api.notifications.markNotificationAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllNotificationsAsRead);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user) return;
    try {
      await markAsRead({ notificationId, userId: user.id });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await markAllAsRead({ userId: user.id });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'pickup_status_change':
        return '🚛';
      case 'complaint_update':
        return '📝';
      case 'payment_received':
        return '💰';
      case 'new_pickup_assigned':
        return '📅';
      case 'system_alert':
        return '⚠️';
      default:
        return '📢';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Notifications
          {unreadCount && unreadCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showAll ? 'Show Unread' : 'Show All'}
          </button>
          {unreadCount && unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Mark All Read
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {notifications === undefined ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {showAll ? 'No notifications yet' : 'No unread notifications'}
            </p>
          </div>
        ) : (
          notifications.map((notification: Notification) => (
            <div
              key={notification._id}
              className={`p-4 rounded-lg border transition-colors ${
                notification.read
                  ? 'bg-gray-50 border-gray-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 truncate">
                      {notification.title}
                    </h3>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatTimestamp(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.message}
                  </p>
                  {notification.data && (
                    <div className="mt-2 text-xs text-gray-500">
                      {notification.data.pickupId && (
                        <span>Pickup: {notification.data.pickupId}</span>
                      )}
                    </div>
                  )}
                  {!notification.read && (
                    <button
                      onClick={() => handleMarkAsRead(notification._id)}
                      className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};