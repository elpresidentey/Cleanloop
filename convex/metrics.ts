import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query to get real-time system metrics for admin dashboard
export const getSystemMetrics = query({
  args: { 
    metricType: v.optional(v.string()),
    date: v.optional(v.string()),
    area: v.optional(v.string()),
    days: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const days = args.days || 7;
    const endDate = args.date || new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000))
      .toISOString().split('T')[0];
    
    let query = ctx.db.query("system_metrics");
    
    if (args.metricType) {
      query = query.withIndex("by_type_date", (q) => 
        q.eq("metricType", args.metricType).gte("date", startDate).lte("date", endDate)
      );
    } else {
      query = query.filter((q) => 
        q.gte(q.field("date"), startDate) && q.lte(q.field("date"), endDate)
      );
    }
    
    const metrics = await query.collect();
    
    // Filter by area if specified
    return metrics.filter(metric => {
      if (args.area && metric.area !== args.area) return false;
      return true;
    });
  },
});

// Query to get daily pickup completion rates
export const getDailyCompletionRates = query({
  args: { 
    days: v.optional(v.number()),
    area: v.optional(v.string()),
    collectorId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000))
      .toISOString().split('T')[0];
    
    let query = ctx.db.query("system_metrics")
      .withIndex("by_type_date", (q) => 
        q.eq("metricType", "completion_rate").gte("date", startDate)
      );
    
    const metrics = await query.collect();
    
    return metrics.filter(metric => {
      if (args.area && metric.area !== args.area) return false;
      if (args.collectorId && metric.collectorId !== args.collectorId) return false;
      return true;
    });
  },
});

// Query to get area-based performance metrics
export const getAreaMetrics = query({
  args: { 
    area: v.optional(v.string()),
    metricType: v.optional(v.string()),
    days: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const days = args.days || 7;
    const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000))
      .toISOString().split('T')[0];
    
    let query = ctx.db.query("system_metrics");
    
    if (args.area) {
      query = query.withIndex("by_area", (q) => q.eq("area", args.area));
    }
    
    const metrics = await query
      .filter((q) => q.gte(q.field("date"), startDate))
      .collect();
    
    return metrics.filter(metric => {
      if (args.metricType && metric.metricType !== args.metricType) return false;
      return true;
    });
  },
});

// Query to get collector performance metrics
export const getCollectorMetrics = query({
  args: { 
    collectorId: v.optional(v.string()),
    days: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000))
      .toISOString().split('T')[0];
    
    let query = ctx.db.query("system_metrics");
    
    if (args.collectorId) {
      query = query.withIndex("by_collector", (q) => q.eq("collectorId", args.collectorId));
    }
    
    const metrics = await query
      .filter((q) => q.gte(q.field("date"), startDate))
      .collect();
    
    return metrics;
  },
});

// Mutation to update daily pickup metrics
export const updateDailyPickupMetrics = mutation({
  args: {
    date: v.string(),
    area: v.optional(v.string()),
    collectorId: v.optional(v.string()),
    totalPickups: v.number(),
    completedPickups: v.number(),
    missedPickups: v.number(),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    const completionRate = args.totalPickups > 0 
      ? (args.completedPickups / args.totalPickups) * 100 
      : 0;
    
    // Update daily pickups metric
    await ctx.db.insert("system_metrics", {
      metricType: "daily_pickups",
      value: args.totalPickups,
      date: args.date,
      area: args.area,
      collectorId: args.collectorId,
      timestamp,
    });
    
    // Update completion rate metric
    await ctx.db.insert("system_metrics", {
      metricType: "completion_rate",
      value: completionRate,
      date: args.date,
      area: args.area,
      collectorId: args.collectorId,
      timestamp,
    });
    
    return { success: true, completionRate };
  },
});

// Mutation to update complaint metrics
export const updateComplaintMetrics = mutation({
  args: {
    date: v.string(),
    area: v.optional(v.string()),
    newComplaints: v.number(),
    resolvedComplaints: v.number(),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    await ctx.db.insert("system_metrics", {
      metricType: "complaint_count",
      value: args.newComplaints,
      date: args.date,
      area: args.area,
      timestamp,
    });
    
    return { success: true };
  },
});

// Mutation to update user activity metrics
export const updateUserMetrics = mutation({
  args: {
    date: v.string(),
    area: v.optional(v.string()),
    activeUsers: v.number(),
    newRegistrations: v.number(),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    await ctx.db.insert("system_metrics", {
      metricType: "active_users",
      value: args.activeUsers,
      date: args.date,
      area: args.area,
      timestamp,
    });
    
    return { success: true };
  },
});

// Query to get real-time dashboard summary
export const getDashboardSummary = query({
  args: { 
    area: v.optional(v.string()),
    date: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const date = args.date || new Date().toISOString().split('T')[0];
    
    // Get today's metrics
    let query = ctx.db.query("system_metrics")
      .filter((q) => q.eq(q.field("date"), date));
    
    if (args.area) {
      query = query.filter((q) => q.eq(q.field("area"), args.area));
    }
    
    const todayMetrics = await query.collect();
    
    // Aggregate metrics by type
    const summary = {
      totalPickups: 0,
      completionRate: 0,
      complaintCount: 0,
      activeUsers: 0,
      revenue: 0,
    };
    
    todayMetrics.forEach(metric => {
      switch (metric.metricType) {
        case "daily_pickups":
          summary.totalPickups += metric.value;
          break;
        case "completion_rate":
          summary.completionRate = metric.value; // Use latest value
          break;
        case "complaint_count":
          summary.complaintCount += metric.value;
          break;
        case "active_users":
          summary.activeUsers = Math.max(summary.activeUsers, metric.value);
          break;
        case "revenue":
          summary.revenue += metric.value;
          break;
      }
    });
    
    return summary;
  },
});

// Query to get trending metrics for charts
export const getTrendingMetrics = query({
  args: { 
    metricType: v.string(),
    days: v.optional(v.number()),
    area: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000))
      .toISOString().split('T')[0];
    
    let query = ctx.db.query("system_metrics")
      .withIndex("by_type_date", (q) => 
        q.eq("metricType", args.metricType).gte("date", startDate)
      );
    
    const metrics = await query.collect();
    
    // Filter by area if specified and group by date
    const filteredMetrics = metrics.filter(metric => {
      if (args.area && metric.area !== args.area) return false;
      return true;
    });
    
    // Group by date and sum values
    const groupedMetrics = new Map();
    filteredMetrics.forEach(metric => {
      const existing = groupedMetrics.get(metric.date) || 0;
      groupedMetrics.set(metric.date, existing + metric.value);
    });
    
    // Convert to array format for charts
    return Array.from(groupedMetrics.entries()).map(([date, value]) => ({
      date,
      value,
    })).sort((a, b) => a.date.localeCompare(b.date));
  },
});