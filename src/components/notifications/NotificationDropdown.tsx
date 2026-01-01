import React, { useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
// import { api } from '../../convex/_generated/api'
// Mock API for build compatibility
const api = {
  notifications: {
    getNotifications: 'notifications:getNotifications',
    markAsRead: 'notifications:markAsRead'
  }
} as any;
import { useAuth } from '../../hooks/useAuth';

interface NotificationDropdownProps {
  onClose: () => void;
}

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

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
  const { user } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Real-time subscription to recent notifications
  const notifications = useQuery(api.notifications.getUserNotifications, 
    user ? { 
      userId: user.id, 
      unreadOnly: false,
      limit: 5
    } : 'skip'
  );
  
  const markAsRead = useMutation(api.notifications.markNotificationAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllNotificationsAsRead);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

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

  if (!user) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Notifications</h3>
          <button
            onClick={handleMarkAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Mark all read
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications === undefined ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 text-sm mt-2">Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-gray-500 text-sm">No notifications</p>
          </div>
        ) : (
          notifications.map((notification: Notification) => (
            <div
              key={notification._id}
              className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                !notification.read ? 'bg-blue-50' : ''
              }`}
              onClick={() => !notification.read && handleMarkAsRead(notification._id)}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm text-gray-900 truncate">
                      {notification.title}
                    </h4>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatTimestamp(notification.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-gray-200">
        <button
          onClick={onClose}
          className="w-full text-center text-sm text-blue-600 hover:text-blue-800"
        >
          View all notifications
        </button>
      </div>
    </div>
  );
};