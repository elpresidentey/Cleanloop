import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { NotificationPreferencesService, NotificationPreferences as NotificationPreferencesType } from '../../services/notificationPreferencesService';

interface NotificationPreferencesProps {
  userRole: 'resident' | 'collector' | 'admin';
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({ userRole: _userRole }) => {
  const { profile } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferencesType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPreferences = async () => {
      if (!profile?.id) return;
      
      try {
        setLoading(true);
        const userPreferences = await NotificationPreferencesService.getPreferences(profile.id);
        setPreferences(userPreferences);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load preferences');
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [profile?.id]);

  const handlePreferenceChange = (key: keyof NotificationPreferencesType, value: boolean) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      [key]: value
    });
  };

  const handleSave = async () => {
    if (!preferences || !profile?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await NotificationPreferencesService.savePreferences(preferences);
      
      if (error) {
        throw error;
      }
      
      alert('Notification preferences saved successfully!');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!profile?.id) return;
    
    if (!confirm('Are you sure you want to reset all preferences to default values?')) {
      return;
    }
    
    setIsSaving(true);
    try {
      const { error } = await NotificationPreferencesService.resetToDefaults(profile.id);
      
      if (error) {
        throw error;
      }
      
      // Reload preferences
      const userPreferences = await NotificationPreferencesService.getPreferences(profile.id);
      setPreferences(userPreferences);
      
      alert('Preferences reset to defaults successfully!');
    } catch (error) {
      console.error('Failed to reset preferences:', error);
      alert('Failed to reset preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Error Loading Preferences</h3>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">No preferences available</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
          <p className="text-gray-600 mt-1">Manage how you receive notifications and updates</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Communication Channels */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Communication Channels</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">SMS Notifications</label>
                  <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.smsNotifications}
                  onChange={(e) => handlePreferenceChange('smsNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Push Notifications</label>
                  <p className="text-sm text-gray-500">Receive push notifications in the app</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.pushNotifications}
                  onChange={(e) => handlePreferenceChange('pushNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>

          {/* Notification Types */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Types</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Pickup Reminders</label>
                  <p className="text-sm text-gray-500">Get reminded about upcoming pickups</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.pickupReminders}
                  onChange={(e) => handlePreferenceChange('pickupReminders', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Payment Reminders</label>
                  <p className="text-sm text-gray-500">Get reminded about payment due dates</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.paymentReminders}
                  onChange={(e) => handlePreferenceChange('paymentReminders', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Complaint Updates</label>
                  <p className="text-sm text-gray-500">Get notified about complaint status changes</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.complaintUpdates}
                  onChange={(e) => handlePreferenceChange('complaintUpdates', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">System Alerts</label>
                  <p className="text-sm text-gray-500">Important system notifications and updates</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.systemAlerts}
                  onChange={(e) => handlePreferenceChange('systemAlerts', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Weekly Reports</label>
                  <p className="text-sm text-gray-500">Receive weekly activity summaries</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.weeklyReports}
                  onChange={(e) => handlePreferenceChange('weeklyReports', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Marketing Emails</label>
                  <p className="text-sm text-gray-500">Promotional content and service updates</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.marketingEmails}
                  onChange={(e) => handlePreferenceChange('marketingEmails', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-between">
          <button
            onClick={handleReset}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Reset to Defaults
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};