// convex/twentyPercentDFBreakdowns.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { recalculateTwentyPercentDFMetrics } from "./lib/twentyPercentDFAggregation";
import { logTwentyPercentDFBreakdownActivity } from "./lib/twentyPercentDFActivityLogger";
import { internal } from "./_generated/api";
import { validateImplementingOffice } from "./lib/breakdownBase";
import { Id } from "./_generated/dataModel";
import { syncTwentyPercentDFBreakdownSearchIndex } from "./lib/searchIndexSync";

// Reusable status validator
const statusValidator = v.union(
    v.literal("completed"),
    v.literal("delayed"),
    v.literal("ongoing")
);

/**
 * GET: Single breakdown by ID
 */
export const getBreakdown = query({
    args: { id: v.id("twentyPercentDFBreakdowns") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

/**
 * CREATE: Single breakdown row
 */
export const createBreakdown = mutation({
    args: {
        projectName: v.string(), // "particulars" in UI, typically
        implementingOffice: v.string(),
        twentyPercentDFId: v.optional(v.id("twentyPercentDF")),
        municipality: v.optional(v.string()),
        barangay: v.optional(v.string()),
        district: v.optional(v.string()),
        allocatedBudget: v.optional(v.number()),
        obligatedBudget: v.optional(v.number()),
        budgetUtilized: v.optional(v.number()),
        balance: v.optional(v.number()),
        status: v.optional(statusValidator),
        dateStarted: v.optional(v.number()),
        targetDate: v.optional(v.number()),
        completionDate: v.optional(v.number()),
        remarks: v.optional(v.string()),
        reason: v.optional(v.string()),
        // Optional fields matching baseBreakdownSchema
        projectTitle: v.optional(v.string()),
        utilizationRate: v.optional(v.number()),
        projectAccomplishment: v.optional(v.number()),
        reportDate: v.optional(v.number()),
        fundSource: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        await validateImplementingOffice(ctx, args.implementingOffice);

        const now = Date.now();
        const { reason, ...breakdownData } = args;

        if (args.twentyPercentDFId) {
            const parent = await ctx.db.get(args.twentyPercentDFId);
            if (!parent) throw new Error("Parent 20% DF record not found");
        }

        const breakdownId = await ctx.db.insert("twentyPercentDFBreakdowns", {
            ...breakdownData,
            createdBy: userId,
            createdAt: now,
            updatedAt: now,
            updatedBy: userId,
            isDeleted: false,
        });

        await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
            code: args.implementingOffice,
            usageContext: "breakdown",
            delta: 1,
        });

        const createdBreakdown = await ctx.db.get(breakdownId);
        await logTwentyPercentDFBreakdownActivity(ctx, userId, {
            action: "created",
            breakdownId: breakdownId,
            projectName: args.projectName,
            implementingOffice: args.implementingOffice,
            newValues: createdBreakdown,
            source: "web_ui",
            reason: reason,
        });

        // RECALCULATE PARENT
        if (args.twentyPercentDFId) {
            await recalculateTwentyPercentDFMetrics(ctx, args.twentyPercentDFId, userId);
        }

        return { breakdownId };
    },
});

/**
 * UPDATE: Single breakdown row
 */
export const updateBreakdown = mutation({
    args: {
        breakdownId: v.id("twentyPercentDFBreakdowns"),
        projectName: v.optional(v.string()),
        implementingOffice: v.optional(v.string()),
        twentyPercentDFId: v.optional(v.id("twentyPercentDF")),
        municipality: v.optional(v.string()),
        barangay: v.optional(v.string()),
        district: v.optional(v.string()),
        allocatedBudget: v.optional(v.number()),
        obligatedBudget: v.optional(v.number()),
        budgetUtilized: v.optional(v.number()),
        balance: v.optional(v.number()),
        status: v.optional(statusValidator),
        dateStarted: v.optional(v.number()),
        targetDate: v.optional(v.number()),
        completionDate: v.optional(v.number()),
        remarks: v.optional(v.string()),
        reason: v.optional(v.string()),
        projectTitle: v.optional(v.string()),
        utilizationRate: v.optional(v.number()),
        projectAccomplishment: v.optional(v.number()),
        reportDate: v.optional(v.number()),
        fundSource: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const { breakdownId, reason, ...updates } = args;

        const previousBreakdown = await ctx.db.get(breakdownId);
        if (!previousBreakdown) throw new Error("Breakdown not found");

        // Handle Implementing Office Change
        const newImplementingOffice = args.implementingOffice;
        if (newImplementingOffice && newImplementingOffice !== previousBreakdown.implementingOffice) {
            await validateImplementingOffice(ctx, newImplementingOffice);

            await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
                code: previousBreakdown.implementingOffice,
                usageContext: "breakdown",
                delta: -1,
            });
            await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
                code: newImplementingOffice,
                usageContext: "breakdown",
                delta: 1,
            });
        }

        const oldParentId = previousBreakdown.twentyPercentDFId;

        await ctx.db.patch(breakdownId, {
            ...updates,
            updatedAt: Date.now(),
            updatedBy: userId,
        });

        const updatedBreakdown = await ctx.db.get(breakdownId);
        await logTwentyPercentDFBreakdownActivity(ctx, userId, {
            action: "updated",
            breakdownId: breakdownId,
            projectName: updatedBreakdown?.projectName || previousBreakdown.projectName,
            implementingOffice: updatedBreakdown?.implementingOffice || previousBreakdown.implementingOffice,
            previousValues: previousBreakdown,
            newValues: updatedBreakdown,
            source: "web_ui",
            reason: reason,
        });

        // RECALCULATE PARENTS
        if (oldParentId && oldParentId !== args.twentyPercentDFId) {
            await recalculateTwentyPercentDFMetrics(ctx, oldParentId, userId);
        }

        if (args.twentyPercentDFId) {
            await recalculateTwentyPercentDFMetrics(ctx, args.twentyPercentDFId, userId);
        } else if (oldParentId && args.twentyPercentDFId === undefined) {
            await recalculateTwentyPercentDFMetrics(ctx, oldParentId, userId);
        }

        return { success: true, breakdownId };
    },
});

/**
 * SOFT DELETE: Move to Trash
 */
export const moveToTrash = mutation({
    args: {
        breakdownId: v.id("twentyPercentDFBreakdowns"),
        reason: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const breakdown = await ctx.db.get(args.breakdownId);
        if (!breakdown) throw new Error("Breakdown not found");

        const now = Date.now();
        await ctx.db.patch(args.breakdownId, {
            isDeleted: true,
            deletedAt: now,
            deletedBy: userId,
        });
        await syncTwentyPercentDFBreakdownSearchIndex(ctx, breakdown, { isDeleted: true });

        // Note: Usage count NOT decremented for soft delete, only hard delete.

        if (breakdown.twentyPercentDFId) {
            await recalculateTwentyPercentDFMetrics(ctx, breakdown.twentyPercentDFId, userId);
        }

        await logTwentyPercentDFBreakdownActivity(ctx, userId, {
            action: "updated",
            breakdownId: args.breakdownId,
            projectName: breakdown.projectName,
            implementingOffice: breakdown.implementingOffice,
            previousValues: breakdown,
            newValues: { ...breakdown, isDeleted: true },
            source: "web_ui",
            reason: args.reason || "Moved to trash",
        });

        return { success: true };
    },
});

/**
 * Bulk move breakdowns to trash
 */
export const bulkMoveToTrash = mutation({
    args: {
        ids: v.array(v.id("twentyPercentDFBreakdowns")),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[],
        };

        let parentId: Id<"twentyPercentDF"> | null = null;

        // Process each breakdown
        for (const id of args.ids) {
            try {
                const breakdown = await ctx.db.get(id);
                if (!breakdown) {
                    results.failed++;
                    results.errors.push(`Breakdown ${id} not found`);
                    continue;
                }

                // Track parent for recalculation
                if (!parentId && breakdown.twentyPercentDFId) {
                    parentId = breakdown.twentyPercentDFId;
                }

                const now = Date.now();
                await ctx.db.patch(id, {
                    isDeleted: true,
                    deletedAt: now,
                    deletedBy: userId,
                });
                await syncTwentyPercentDFBreakdownSearchIndex(ctx, breakdown, { isDeleted: true });

                await logTwentyPercentDFBreakdownActivity(ctx, userId, {
                    action: "updated",
                    breakdownId: id,
                    projectName: breakdown.projectName,
                    implementingOffice: breakdown.implementingOffice,
                    previousValues: breakdown,
                    newValues: { ...breakdown, isDeleted: true },
                    source: "web_ui",
                    reason: args.reason || "Bulk trash operation",
                });

                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push(`Failed to trash ${id}: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        }

        // Recalculate metrics once after all deletions
        if (parentId && results.success > 0) {
            await recalculateTwentyPercentDFMetrics(ctx, parentId, userId);
        }

        return results;
    },
});

/**
 * Get breakdows for a specific 20% DF record
 */
export const list = query({
    args: {
        twentyPercentDFId: v.id("twentyPercentDF"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        return await ctx.db
            .query("twentyPercentDFBreakdowns")
            .withIndex("twentyPercentDFId", q => q.eq("twentyPercentDFId", args.twentyPercentDFId))
            .filter(q => q.neq(q.field("isDeleted"), true))
            .order("desc") // implicit creation order or add createdAt index
            .collect();
    },
});
