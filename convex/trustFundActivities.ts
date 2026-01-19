// convex/trustFundActivities.ts - ADD THIS FILE for Activity Log Support

import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Get activity log for a specific trust fund
 * Used by ActivityLogSheet component
 */
export const getByTrustFundId = query({
  args: {
    trustFundId: v.id("trustFunds"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const activities = await ctx.db
      .query("trustFundActivities")
      .withIndex("trustFundId", (q) => q.eq("trustFundId", args.trustFundId))
      .order("desc")
      .take(args.limit || 50);

    return activities;
  },
});

/**
 * Get all activities with pagination
 */
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const activities = await ctx.db
      .query("trustFundActivities")
      .order("desc")
      .take(args.limit || 100);

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
      .query("trustFundActivities")
      .withIndex("performedBy", (q) => q.eq("performedBy", args.userId))
      .order("desc")
      .take(args.limit || 50);

    return activities;
  },
});