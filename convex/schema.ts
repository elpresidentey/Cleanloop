import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Real-time notifications table
  notifications: defineTable({
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
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "read"]),

  // Real-time activity log for audit and synchronization
  activity_log: defineTable({
    userId: v.string(),
    action: v.string(),
    entityType: v.union(
      v.literal("pickup_request"),
      v.literal("complaint"),
      v.literal("payment"),
      v.literal("subscription"),
      v.literal("user")
    ),
    entityId: v.string(),
    oldData: v.optional(v.any()),
    newData: v.optional(v.any()),
    timestamp: v.number(),
    metadata: v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_entity", ["entityType", "entityId"])
    .index("by_timestamp", ["timestamp"]),

  // Real-time pickup status tracking
  pickup_status_updates: defineTable({
    pickupId: v.string(),
    userId: v.string(),
    collectorId: v.optional(v.string()),
    oldStatus: v.optional(v.string()),
    newStatus: v.string(),
    timestamp: v.number(),
    notes: v.optional(v.string()),
    location: v.optional(v.object({
      area: v.string(),
      street: v.string(),
      houseNumber: v.string(),
    })),
  })
    .index("by_pickup", ["pickupId"])
    .index("by_user", ["userId"])
    .index("by_collector", ["collectorId"])
    .index("by_timestamp", ["timestamp"]),

  // Real-time complaint updates
  complaint_updates: defineTable({
    complaintId: v.string(),
    userId: v.string(),
    pickupId: v.string(),
    oldStatus: v.optional(v.string()),
    newStatus: v.string(),
    adminId: v.optional(v.string()),
    adminNotes: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_complaint", ["complaintId"])
    .index("by_user", ["userId"])
    .index("by_pickup", ["pickupId"])
    .index("by_admin", ["adminId"])
    .index("by_timestamp", ["timestamp"]),

  // Real-time system metrics for admin dashboard
  system_metrics: defineTable({
    metricType: v.union(
      v.literal("daily_pickups"),
      v.literal("completion_rate"),
      v.literal("complaint_count"),
      v.literal("active_users"),
      v.literal("revenue")
    ),
    value: v.number(),
    date: v.string(), // YYYY-MM-DD format
    area: v.optional(v.string()),
    collectorId: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_type_date", ["metricType", "date"])
    .index("by_area", ["area"])
    .index("by_collector", ["collectorId"])
    .index("by_timestamp", ["timestamp"]),
});