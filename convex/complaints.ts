import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query to get complaint updates for real-time tracking
export const getComplaintUpdates = query({
  args: { 
    userId: v.optional(v.string()),
    adminId: v.optional(v.string()),
    complaintId: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("complaint_updates");
    
    if (args.userId) {
      query = query.withIndex("by_user", (q) => q.eq("userId", args.userId));
    } else if (args.adminId) {
      query = query.withIndex("by_admin", (q) => q.eq("adminId", args.adminId));
    } else if (args.complaintId) {
      query = query.withIndex("by_complaint", (q) => q.eq("complaintId", args.complaintId));
    }
    
    const updates = await query
      .order("desc")
      .take(args.limit || 50);
    
    return updates;
  },
});

// Query to get recent complaint activity for admin dashboard
export const getRecentComplaintActivity = query({
  args: { 
    adminId: v.optional(v.string()),
    hours: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const hoursAgo = args.hours || 24;
    const cutoffTime = Date.now() - (hoursAgo * 60 * 60 * 1000);
    
    const updates = await ctx.db.query("complaint_updates")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", cutoffTime))
      .order("desc")
      .take(100);
    
    return updates;
  },
});

// Query to get complaints requiring admin attention
export const getComplaintsForAdmin = query({
  args: { 
    status: v.optional(v.string()),
    priority: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const recentTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // Last 7 days
    
    let query = ctx.db.query("complaint_updates")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", recentTime));
    
    const updates = await query.order("desc").take(200);
    
    // Group by complaint ID to get latest status for each complaint
    const latestUpdates = new Map();
    updates.forEach(update => {
      if (!latestUpdates.has(update.complaintId) || 
          update.timestamp > latestUpdates.get(update.complaintId).timestamp) {
        latestUpdates.set(update.complaintId, update);
      }
    });
    
    // Filter by status if provided
    const filteredUpdates = Array.from(latestUpdates.values());
    return filteredUpdates.filter(update => {
      if (args.status && update.newStatus !== args.status) return false;
      return true;
    });
  },
});

// Mutation to create a new complaint with real-time notification
export const createComplaint = mutation({
  args: {
    complaintId: v.string(),
    userId: v.string(),
    pickupId: v.string(),
    description: v.string(),
    photoUrl: v.optional(v.string()),
    priority: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    const priority = args.priority || "medium";
    
    // Create complaint update record
    const updateId = await ctx.db.insert("complaint_updates", {
      complaintId: args.complaintId,
      userId: args.userId,
      pickupId: args.pickupId,
      newStatus: "open",
      timestamp,
    });

    // Create activity log entry
    await ctx.db.insert("activity_log", {
      userId: args.userId,
      action: "complaint_created",
      entityType: "complaint",
      entityId: args.complaintId,
      newData: {
        status: "open",
        description: args.description,
        pickupId: args.pickupId,
        priority,
      },
      timestamp,
    });

    // Create notification for user confirmation
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "complaint_update",
      title: "Complaint Submitted",
      message: "Your complaint has been submitted and is being reviewed",
      data: {
        complaintId: args.complaintId,
        pickupId: args.pickupId,
        status: "open",
      },
      read: false,
      createdAt: timestamp,
    });

    // TODO: Notify admins about new complaint (would need admin user IDs)
    // For now, we'll create a system alert that admins can query
    await ctx.db.insert("notifications", {
      userId: "system", // Special system user ID for admin notifications
      type: "system_alert",
      title: "New Complaint Received",
      message: `New ${priority} priority complaint received for pickup ${args.pickupId}`,
      data: {
        complaintId: args.complaintId,
        userId: args.userId,
        pickupId: args.pickupId,
        priority,
      },
      read: false,
      createdAt: timestamp,
    });

    return { success: true, updateId };
  },
});

// Mutation to update complaint status with real-time notification
export const updateComplaintStatus = mutation({
  args: {
    complaintId: v.string(),
    userId: v.string(),
    adminId: v.string(),
    oldStatus: v.optional(v.string()),
    newStatus: v.string(),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    // Create complaint update record
    const updateId = await ctx.db.insert("complaint_updates", {
      complaintId: args.complaintId,
      userId: args.userId,
      pickupId: "", // Will be filled from existing complaint data
      oldStatus: args.oldStatus,
      newStatus: args.newStatus,
      adminId: args.adminId,
      adminNotes: args.adminNotes,
      timestamp,
    });

    // Create activity log entry
    await ctx.db.insert("activity_log", {
      userId: args.adminId,
      action: "complaint_status_update",
      entityType: "complaint",
      entityId: args.complaintId,
      oldData: { status: args.oldStatus },
      newData: { status: args.newStatus, adminNotes: args.adminNotes },
      timestamp,
    });

    // Notify the user who filed the complaint
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "complaint_update",
      title: "Complaint Status Updated",
      message: `Your complaint status has been updated to: ${args.newStatus}`,
      data: {
        complaintId: args.complaintId,
        oldStatus: args.oldStatus,
        newStatus: args.newStatus,
        adminNotes: args.adminNotes,
        timestamp,
      },
      read: false,
      createdAt: timestamp,
    });

    return { success: true, updateId };
  },
});

// Mutation to resolve complaint with notification
export const resolveComplaint = mutation({
  args: {
    complaintId: v.string(),
    userId: v.string(),
    adminId: v.string(),
    resolution: v.string(),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    // Create complaint update record
    await ctx.db.insert("complaint_updates", {
      complaintId: args.complaintId,
      userId: args.userId,
      pickupId: "", // Will be filled from existing complaint data
      oldStatus: "in_progress",
      newStatus: "resolved",
      adminId: args.adminId,
      adminNotes: args.adminNotes,
      timestamp,
    });

    // Create activity log entry
    await ctx.db.insert("activity_log", {
      userId: args.adminId,
      action: "complaint_resolved",
      entityType: "complaint",
      entityId: args.complaintId,
      oldData: { status: "in_progress" },
      newData: { 
        status: "resolved", 
        resolution: args.resolution,
        adminNotes: args.adminNotes 
      },
      timestamp,
    });

    // Notify the user about resolution
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "complaint_update",
      title: "Complaint Resolved",
      message: `Your complaint has been resolved: ${args.resolution}`,
      data: {
        complaintId: args.complaintId,
        resolution: args.resolution,
        adminNotes: args.adminNotes,
        timestamp,
      },
      read: false,
      createdAt: timestamp,
    });

    return { success: true };
  },
});