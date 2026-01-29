
import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ============================================================================
// 20% DF ACTIVITIES (Main)
// ============================================================================

/**
 * Get all 20% DF activities (for the main 20% DF page)
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
            .query("twentyPercentDFActivities")
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
 * Get activity log for a specific 20% DF project (fund level)
 */
export const getByTwentyPercentDFId = query({
    args: {
        twentyPercentDFId: v.id("twentyPercentDF"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const activities = await ctx.db
            .query("twentyPercentDFActivities")
            .withIndex("twentyPercentDFId", (q) => q.eq("twentyPercentDFId", args.twentyPercentDFId))
            .order("desc")
            .take(args.limit || 50);

        return activities;
    },
});

// ============================================================================
// 20% DF BREAKDOWN ACTIVITIES
// ============================================================================

/**
 * Get activities for a specific breakdown
 */
export const getBreakdownActivities = query({
    args: {
        breakdownId: v.id("twentyPercentDFBreakdowns"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        return await ctx.db
            .query("twentyPercentDFBreakdownActivities")
            .withIndex("breakdownId", (q) => q.eq("breakdownId", args.breakdownId))
            .order("desc")
            .take(args.limit || 50);
    },
});

/**
 * Get activities for a specific project and office (aggregated breakdowns)
 */
export const getProjectOfficeActivities = query({
    args: {
        projectName: v.string(),
        implementingOffice: v.string(),
        action: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const limit = args.limit || 50;

        // Query using the composite index on projectName and implementingOffice
        let activities = await ctx.db
            .query("twentyPercentDFBreakdownActivities")
            .withIndex("projectNameAndOffice", (q) =>
                q.eq("projectName", args.projectName).eq("implementingOffice", args.implementingOffice)
            )
            .order("desc")
            .take(limit);

        // Filter by action
        if (args.action && args.action !== "all") {
            activities = activities.filter(a => a.action === args.action);
        }

        return activities;
    },
});
