// convex/specialEducationFundActivities.ts

import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Get activity log for a specific special education fund
 * Used by ActivityLogSheet component when viewing individual special education fund
 */
export const getBySpecialEducationFundId = query({
  args: {
    specialEducationFundId: v.id("specialEducationFunds"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const activities = await ctx.db
      .query("specialEducationFundActivities")
      .withIndex("specialEducationFundId", (q) => q.eq("specialEducationFundId", args.specialEducationFundId))
      .order("desc")
      .take(args.limit || 50);

    return activities;
  },
});

/**
 * Get all special education fund activities (for the main Special Education Funds page)
 * This is what the ActivityLogSheet needs when entityId="all"
 */
export const list = query({
  args: {
    limit: v.optional(v.number()),
    action: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 100;

    let activities = await ctx.db
      .query("specialEducationFundActivities")
      .withIndex("timestamp")
      .order("desc")
      .take(limit);

    // Filter by action if specified
    if (args.action && args.action !== "all") {
      activities = activities.filter(a => a.action === args.action);
    }

    return activities;
  },
});

/**
 * Get activities by user
 */
export const getByUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    const activities = await ctx.db
      .query("specialEducationFundActivities")
      .withIndex("performedBy", (q) => q.eq("performedBy", args.userId))
      .order("desc")
      .take(args.limit || 50);

    return activities;
  },
});

/**
 * Get activities by office in charge
 */
export const getByOffice = query({
  args: {
    officeInCharge: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const activities = await ctx.db
      .query("specialEducationFundActivities")
      .filter((q) => q.eq(q.field("officeInCharge"), args.officeInCharge))
      .order("desc")
      .take(args.limit || 50);

    return activities;
  },
});

/**
 * Get recent activities (for dashboard widgets)
 */
export const getRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const activities = await ctx.db
      .query("specialEducationFundActivities")
      .withIndex("timestamp")
      .order("desc")
      .take(args.limit || 20);

    return activities;
  },
});

/**
 * Get activity statistics
 */
export const getStatistics = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      throw new Error("Not authorized - administrator access required");
    }

    let activities = await ctx.db
      .query("specialEducationFundActivities")
      .withIndex("timestamp")
      .order("desc")
      .collect();

    // Apply date filters
    if (args.startDate) {
      activities = activities.filter(a => a.timestamp >= args.startDate!);
    }

    if (args.endDate) {
      activities = activities.filter(a => a.timestamp <= args.endDate!);
    }

    // Calculate statistics
    const stats = {
      total: activities.length,
      created: activities.filter(a => a.action === "created").length,
      updated: activities.filter(a => a.action === "updated").length,
      deleted: activities.filter(a => a.action === "deleted").length,
      restored: activities.filter(a => a.action === "restored").length,
    };

    // User activity breakdown
    const userActivityMap = new Map<string, number>();
    activities.forEach(a => {
      const count = userActivityMap.get(a.performedByName) || 0;
      userActivityMap.set(a.performedByName, count + 1);
    });

    const topUsers = Array.from(userActivityMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      stats,
      topUsers,
    };
  },
});
