import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query to get notifications for a user
export const getUserNotifications = query({
  args: { 
    userId: v.string(),
    unreadOnly: v.optional(v.boolean()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));
    
    if (args.unreadOnly) {
      query = query.withIndex("by_user_unread", (q) => 
        q.eq("userId", args.userId).eq("read", false)
      );
    }
    
    const notifications = await query
      .order("desc")
      .take(args.limit || 50);
    
    return notifications;
  },
});

// Query to get unread notification count
export const getUnreadNotificationCount = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const notifications = await ctx.db.query("notifications")
      .withIndex("by_user_unread", (q) => 
        q.eq("userId", args.userId).eq("read", false)
      )
      .collect();
    
    return notifications.length;
  },
});

// Query to get system notifications for admins
export const getSystemNotifications = query({
  args: { 
    limit: v.optional(v.number()),
    hours: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const hoursAgo = args.hours || 24;
    const cutoffTime = Date.now() - (hoursAgo * 60 * 60 * 1000);
    
    const notifications = await ctx.db.query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", "system"))
      .filter((q) => q.gte(q.field("createdAt"), cutoffTime))
      .order("desc")
      .take(args.limit || 100);
    
    return notifications;
  },
});

// Mutation to mark notification as read
export const markNotificationAsRead = mutation({
  args: { 
    notificationId: v.id("notifications"),
    userId: v.string()
  },
  handler: async (ctx, args) => {
    // Verify the notification belongs to the user
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== args.userId) {
      throw new Error("Notification not found or access denied");
    }
    
    await ctx.db.patch(args.notificationId, { read: true });
    return { success: true };
  },
});

// Mutation to mark all notifications as read for a user
export const markAllNotificationsAsRead = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db.query("notifications")
      .withIndex("by_user_unread", (q) => 
        q.eq("userId", args.userId).eq("read", false)
      )
      .collect();
    
    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, { read: true });
    }
    
    return { success: true, count: unreadNotifications.length };
  },
});

// Mutation to send real-time notification
export const sendNotification = mutation({
  args: {
    userId: v.string(),
    type: v.union(
      v.literal("pickup_status_change"),
      v.literal("complaint_update"),
      v.literal("payment_received"),
      v.literal("new_pickup_assigned"),
      v.literal("system_alert")
    ),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      data: args.data,
      read: false,
      createdAt: timestamp,
    });

    // Log the notification activity
    await ctx.db.insert("activity_log", {
      userId: "system",
      action: "notification_sent",
      entityType: "user",
      entityId: args.userId,
      newData: {
        type: args.type,
        title: args.title,
        message: args.message,
      },
      timestamp,
    });

    return { success: true, notificationId };
  },
});

// Mutation to broadcast status change to multiple users
export const broadcastStatusChange = mutation({
  args: {
    pickupId: v.string(),
    status: v.string(),
    affectedUsers: v.array(v.string()),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    const notificationIds = [];
    
    // Send notification to each affected user
    for (const userId of args.affectedUsers) {
      const notificationId = await ctx.db.insert("notifications", {
        userId,
        type: "pickup_status_change",
        title: args.title,
        message: args.message,
        data: {
          ...args.data,
          pickupId: args.pickupId,
          status: args.status,
        },
        read: false,
        createdAt: timestamp,
      });
      
      notificationIds.push(notificationId);
    }

    // Log the broadcast activity
    await ctx.db.insert("activity_log", {
      userId: "system",
      action: "status_broadcast",
      entityType: "pickup_request",
      entityId: args.pickupId,
      newData: {
        status: args.status,
        affectedUsers: args.affectedUsers,
        title: args.title,
      },
      timestamp,
    });

    return { success: true, notificationIds, count: notificationIds.length };
  },
});

// Mutation to send payment confirmation notification
export const sendPaymentNotification = mutation({
  args: {
    userId: v.string(),
    paymentId: v.string(),
    amount: v.number(),
    currency: v.string(),
    paymentMethod: v.string(),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "payment_received",
      title: "Payment Received",
      message: `Payment of ${args.currency} ${args.amount} via ${args.paymentMethod} has been recorded`,
      data: {
        paymentId: args.paymentId,
        amount: args.amount,
        currency: args.currency,
        paymentMethod: args.paymentMethod,
        timestamp,
      },
      read: false,
      createdAt: timestamp,
    });

    return { success: true, notificationId };
  },
});

// Query to get real-time activity feed for dashboard
export const getActivityFeed = query({
  args: { 
    userId: v.optional(v.string()),
    entityType: v.optional(v.string()),
    limit: v.optional(v.number()),
    hours: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const hoursAgo = args.hours || 24;
    const cutoffTime = Date.now() - (hoursAgo * 60 * 60 * 1000);
    
    let query = ctx.db.query("activity_log")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", cutoffTime));
    
    const activities = await query.order("desc").take(args.limit || 100);
    
    // Filter by user or entity type if specified
    return activities.filter(activity => {
      if (args.userId && activity.userId !== args.userId) return false;
      if (args.entityType && activity.entityType !== args.entityType) return false;
      return true;
    });
  },
});

// Mutation to clean up old notifications (for maintenance)
export const cleanupOldNotifications = mutation({
  args: { daysOld: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const daysOld = args.daysOld || 30;
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    
    const oldNotifications = await ctx.db.query("notifications")
      .filter((q) => q.lt(q.field("createdAt"), cutoffTime))
      .collect();
    
    let deletedCount = 0;
    for (const notification of oldNotifications) {
      await ctx.db.delete(notification._id);
      deletedCount++;
    }
    
    return { success: true, deletedCount };
  },
});