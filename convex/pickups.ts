import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query to get pickup status updates for real-time tracking
export const getPickupStatusUpdates = query({
  args: { 
    userId: v.optional(v.string()),
    collectorId: v.optional(v.string()),
    pickupId: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("pickup_status_updates");
    
    if (args.userId) {
      query = query.withIndex("by_user", (q) => q.eq("userId", args.userId));
    } else if (args.collectorId) {
      query = query.withIndex("by_collector", (q) => q.eq("collectorId", args.collectorId));
    } else if (args.pickupId) {
      query = query.withIndex("by_pickup", (q) => q.eq("pickupId", args.pickupId));
    }
    
    const updates = await query
      .order("desc")
      .take(args.limit || 50);
    
    return updates;
  },
});

// Query to get recent pickup activity for dashboard
export const getRecentPickupActivity = query({
  args: { 
    userId: v.optional(v.string()),
    collectorId: v.optional(v.string()),
    hours: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const hoursAgo = args.hours || 24;
    const cutoffTime = Date.now() - (hoursAgo * 60 * 60 * 1000);
    
    let query = ctx.db.query("pickup_status_updates")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", cutoffTime));
    
    const updates = await query.order("desc").take(100);
    
    // Filter by user or collector if specified
    return updates.filter(update => {
      if (args.userId && update.userId !== args.userId) return false;
      if (args.collectorId && update.collectorId !== args.collectorId) return false;
      return true;
    });
  },
});

// Mutation to update pickup status with real-time broadcasting
export const updatePickupStatus = mutation({
  args: { 
    pickupId: v.string(), 
    userId: v.string(),
    collectorId: v.optional(v.string()),
    oldStatus: v.optional(v.string()),
    newStatus: v.string(),
    notes: v.optional(v.string()),
    location: v.optional(v.object({
      area: v.string(),
      street: v.string(),
      houseNumber: v.string(),
    }))
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    // Create pickup status update record
    const updateId = await ctx.db.insert("pickup_status_updates", {
      pickupId: args.pickupId,
      userId: args.userId,
      collectorId: args.collectorId,
      oldStatus: args.oldStatus,
      newStatus: args.newStatus,
      timestamp,
      notes: args.notes,
      location: args.location,
    });

    // Create activity log entry
    await ctx.db.insert("activity_log", {
      userId: args.userId,
      action: "pickup_status_update",
      entityType: "pickup_request",
      entityId: args.pickupId,
      oldData: { status: args.oldStatus },
      newData: { status: args.newStatus },
      timestamp,
      metadata: {
        collectorId: args.collectorId,
        notes: args.notes,
      },
    });

    // Create notification for the resident
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "pickup_status_change",
      title: "Pickup Status Updated",
      message: `Your pickup request status has been updated to: ${args.newStatus}`,
      data: {
        pickupId: args.pickupId,
        oldStatus: args.oldStatus,
        newStatus: args.newStatus,
        timestamp,
      },
      read: false,
      createdAt: timestamp,
    });

    // If there's a collector, notify them too
    if (args.collectorId && args.collectorId !== args.userId) {
      await ctx.db.insert("notifications", {
        userId: args.collectorId,
        type: "pickup_status_change",
        title: "Pickup Status Updated",
        message: `Pickup request ${args.pickupId} status updated to: ${args.newStatus}`,
        data: {
          pickupId: args.pickupId,
          oldStatus: args.oldStatus,
          newStatus: args.newStatus,
          timestamp,
        },
        read: false,
        createdAt: timestamp,
      });
    }

    return { success: true, updateId };
  },
});

// Mutation to assign pickup to collector with real-time notification
export const assignPickupToCollector = mutation({
  args: {
    pickupId: v.string(),
    userId: v.string(),
    collectorId: v.string(),
    scheduledDate: v.string(),
    location: v.object({
      area: v.string(),
      street: v.string(),
      houseNumber: v.string(),
    })
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    // Update pickup status to scheduled
    await ctx.db.insert("pickup_status_updates", {
      pickupId: args.pickupId,
      userId: args.userId,
      collectorId: args.collectorId,
      oldStatus: "requested",
      newStatus: "scheduled",
      timestamp,
      location: args.location,
    });

    // Create activity log
    await ctx.db.insert("activity_log", {
      userId: args.userId,
      action: "pickup_assigned",
      entityType: "pickup_request",
      entityId: args.pickupId,
      oldData: { status: "requested" },
      newData: { status: "scheduled", collectorId: args.collectorId },
      timestamp,
    });

    // Notify collector of new assignment
    await ctx.db.insert("notifications", {
      userId: args.collectorId,
      type: "new_pickup_assigned",
      title: "New Pickup Assigned",
      message: `You have been assigned a new pickup for ${args.scheduledDate}`,
      data: {
        pickupId: args.pickupId,
        scheduledDate: args.scheduledDate,
        location: args.location,
      },
      read: false,
      createdAt: timestamp,
    });

    // Notify resident that pickup is scheduled
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "pickup_status_change",
      title: "Pickup Scheduled",
      message: `Your pickup has been scheduled for ${args.scheduledDate}`,
      data: {
        pickupId: args.pickupId,
        scheduledDate: args.scheduledDate,
        collectorId: args.collectorId,
      },
      read: false,
      createdAt: timestamp,
    });

    return { success: true };
  },
});

// Query to get pickup assignments for collectors
export const getCollectorPickups = query({
  args: { 
    collectorId: v.string(),
    date: v.optional(v.string()), // YYYY-MM-DD format
    status: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("pickup_status_updates")
      .withIndex("by_collector", (q) => q.eq("collectorId", args.collectorId));
    
    const updates = await query.order("desc").take(200);
    
    // Filter by date and status if provided
    return updates.filter(update => {
      if (args.status && update.newStatus !== args.status) return false;
      if (args.date) {
        const updateDate = new Date(update.timestamp).toISOString().split('T')[0];
        if (updateDate !== args.date) return false;
      }
      return true;
    });
  },
});