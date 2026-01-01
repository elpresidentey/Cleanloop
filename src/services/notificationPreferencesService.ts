import { supabase } from '../lib/supabase'

export interface NotificationPreferences {
  userId: string
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  pickupReminders: boolean
  paymentReminders: boolean
  complaintUpdates: boolean
  systemAlerts: boolean
  marketingEmails: boolean
  weeklyReports: boolean
  createdAt?: string
  updatedAt?: string
}

export class NotificationPreferencesService {
  /**
   * Get user's notification preferences
   */
  static async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No preferences found, return default preferences
        return {
          userId,
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
          pickupReminders: true,
          paymentReminders: true,
          complaintUpdates: true,
          systemAlerts: true,
          marketingEmails: false,
          weeklyReports: true
        }
      }
      throw error
    }

    return {
      userId: (data as any).user_id,
      emailNotifications: (data as any).email_notifications,
      smsNotifications: (data as any).sms_notifications,
      pushNotifications: (data as any).push_notifications,
      pickupReminders: (data as any).pickup_reminders,
      paymentReminders: (data as any).payment_reminders,
      complaintUpdates: (data as any).complaint_updates,
      systemAlerts: (data as any).system_alerts,
      marketingEmails: (data as any).marketing_emails,
      weeklyReports: (data as any).weekly_reports,
      createdAt: (data as any).created_at,
      updatedAt: (data as any).updated_at
    }
  }

  /**
   * Save user's notification preferences
   */
  static async savePreferences(preferences: NotificationPreferences): Promise<{ error: any }> {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: preferences.userId,
        email_notifications: preferences.emailNotifications,
        sms_notifications: preferences.smsNotifications,
        push_notifications: preferences.pushNotifications,
        pickup_reminders: preferences.pickupReminders,
        payment_reminders: preferences.paymentReminders,
        complaint_updates: preferences.complaintUpdates,
        system_alerts: preferences.systemAlerts,
        marketing_emails: preferences.marketingEmails,
        weekly_reports: preferences.weeklyReports,
        updated_at: new Date().toISOString()
      } as any)

    return { error }
  }

  /**
   * Reset preferences to default values
   */
  static async resetToDefaults(userId: string): Promise<{ error: any }> {
    const defaultPreferences: NotificationPreferences = {
      userId,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      pickupReminders: true,
      paymentReminders: true,
      complaintUpdates: true,
      systemAlerts: true,
      marketingEmails: false,
      weeklyReports: true
    }

    return this.savePreferences(defaultPreferences)
  }
}