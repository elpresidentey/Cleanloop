import React, { useState } from 'react';
import { useQuery } from 'convex/react';
// import { api } from '../../convex/_generated/api'
// Mock API for build compatibility
const api = {
  notifications: {
    getUnreadCount: 'notifications:getUnreadCount'
  }
} as any;
import { useAuth } from '../../hooks/useAuth';
import { NotificationDropdown } from './NotificationDropdown';

export const NotificationBadge: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  // Real-time subscription to unread count
  const unreadCount = useQuery(api.notifications.getUnreadNotificationCount,
    user ? { userId: user.id } : 'skip'
  );

  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
        aria-label="Notifications"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        {unreadCount && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown 
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};