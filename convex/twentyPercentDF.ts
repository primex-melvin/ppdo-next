// convex/twentyPercentDF.ts
import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";
import { recalculateTwentyPercentDFMetrics } from "./lib/twentyPercentDFAggregation";
import { logTwentyPercentDFActivity } from "./lib/twentyPercentDFActivityLogger";
import { indexEntity } from "./search/index";

// ============================================================================
// QUERY: LIST
// ============================================================================

/**
 * List 20% DF records with optional filters
 */
export const list = query({
    args: {
        categoryId: v.optional(v.id("projectCategories")),
        budgetItemId: v.optional(v.id("budgetItems")),
        year: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        let results;

        // Apply filters using indexes where available
        if (args.budgetItemId) {
            results = await ctx.db
                .query("twentyPercentDF")
                .withIndex("budgetItemId", (q) =>
                    q.eq("budgetItemId", args.budgetItemId)
                )
                .collect();
        } else if (args.categoryId) {
            results = await ctx.db
                .query("twentyPercentDF")
                .withIndex("categoryId", (q) =>
                    q.eq("categoryId", args.categoryId)
                )
                .collect();
        } else {
            results = await ctx.db
                .query("twentyPercentDF")
                .collect();
        }

        // Filter out deleted items
        results = results.filter((item) => !item.isDeleted);

        // Apply year filter if specified
        if (args.year !== undefined) {
            results = results.filter((item) => item.year === args.year);
        }

        return results;
    },
});

/**
 * Get a single 20% DF record by ID
 */
export const get = query({
    args: {
        id: v.id("twentyPercentDF"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const record = await ctx.db.get(args.id);
        if (!record) throw new Error("Record not found");
        if (record.isDeleted) throw new Error("Record has been deleted");

        return record;
    },
});

// ============================================================================
// MUTATION: CREATE
// ============================================================================

export const create = mutation({
    args: {
        particulars: v.string(),
        implementingOffice: v.string(),
        categoryId: v.optional(v.id("projectCategories")),
        departmentId: v.optional(v.id("departments")),
        budgetItemId: v.optional(v.id("budgetItems")),
        totalBudgetAllocated: v.number(),
        obligatedBudget: v.optional(v.number()),
        totalBudgetUtilized: v.number(),
        remarks: v.optional(v.string()),
        year: v.optional(v.number()),
        targetDateCompletion: v.optional(v.number()),
        projectManagerId: v.optional(v.id("users")),
        autoCalculateBudgetUtilized: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const now = Date.now();

        // Calculate initial utilization rate
        const utilizationRate = args.totalBudgetAllocated > 0
            ? (args.totalBudgetUtilized / args.totalBudgetAllocated) * 100
            : 0;

        const id = await ctx.db.insert("twentyPercentDF", {
            particulars: args.particulars,
            implementingOffice: args.implementingOffice,
            categoryId: args.categoryId,
            departmentId: args.departmentId,
            budgetItemId: args.budgetItemId,
            totalBudgetAllocated: args.totalBudgetAllocated,
            obligatedBudget: args.obligatedBudget,
            totalBudgetUtilized: args.totalBudgetUtilized,
            utilizationRate,
            projectCompleted: 0,
            projectDelayed: 0,
            projectsOngoing: 0,
            remarks: args.remarks,
            year: args.year,
            status: "ongoing",
            targetDateCompletion: args.targetDateCompletion,
            projectManagerId: args.projectManagerId,
            autoCalculateBudgetUtilized: args.autoCalculateBudgetUtilized ?? true,
            isPinned: false,
            isDeleted: false,
            createdBy: userId,
            createdAt: now,
            updatedAt: now,
            updatedBy: userId,
        });

        const created = await ctx.db.get(id);

        await logTwentyPercentDFActivity(ctx, userId, {
            action: "created",
            twentyPercentDFId: id,
            newValues: created,
        });

        // 🔍 Add to search index
        await indexEntity(ctx, {
            entityType: "twentyPercentDF",
            entityId: id,
            primaryText: args.particulars,
            secondaryText: args.implementingOffice,
            departmentId: args.departmentId,
            status: "ongoing",
            year: args.year,
            isDeleted: false,
        });

        return { id };
    },
});

// ============================================================================
// MUTATION: UPDATE
// ============================================================================

export const update = mutation({
    args: {
        id: v.id("twentyPercentDF"),
        particulars: v.optional(v.string()),
        implementingOffice: v.optional(v.string()),
        categoryId: v.optional(v.id("projectCategories")),
        departmentId: v.optional(v.id("departments")),
        budgetItemId: v.optional(v.id("budgetItems")),
        totalBudgetAllocated: v.optional(v.number()),
        obligatedBudget: v.optional(v.number()),
        totalBudgetUtilized: v.optional(v.number()),
        remarks: v.optional(v.string()),
        year: v.optional(v.number()),
        status: v.optional(v.union(
            v.literal("completed"),
            v.literal("delayed"),
            v.literal("ongoing")
        )),
        targetDateCompletion: v.optional(v.number()),
        projectManagerId: v.optional(v.id("users")),
        autoCalculateBudgetUtilized: v.optional(v.boolean()),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const { id, reason, ...updates } = args;
        const previous = await ctx.db.get(id);
        if (!previous) throw new Error("Record not found");
        if (previous.isDeleted) throw new Error("Cannot update deleted record");

        const now = Date.now();

        // Recalculate utilization rate if budget values changed
        let utilizationRate = previous.utilizationRate;
        const newAllocated = updates.totalBudgetAllocated ?? previous.totalBudgetAllocated;
        const newUtilized = updates.totalBudgetUtilized ?? previous.totalBudgetUtilized;

        if (newAllocated > 0) {
            utilizationRate = (newUtilized / newAllocated) * 100;
        }

        await ctx.db.patch(id, {
            ...updates,
            utilizationRate,
            updatedAt: now,
            updatedBy: userId,
        });

        const updated = await ctx.db.get(id);

        await logTwentyPercentDFActivity(ctx, userId, {
            action: "updated",
            twentyPercentDFId: id,
            previousValues: previous,
            newValues: updated,
            reason,
        });

        // 🔍 Update search index
        await indexEntity(ctx, {
            entityType: "twentyPercentDF",
            entityId: id,
            primaryText: updated?.particulars || previous.particulars,
            secondaryText: updated?.implementingOffice || previous.implementingOffice,
            departmentId: updated?.departmentId || previous.departmentId,
            status: updated?.status || previous.status,
            year: updated?.year || previous.year,
            isDeleted: false,
        });

        return { success: true };
    },
});

// ============================================================================
// MUTATION: SOFT DELETE (Move to Trash)
// ============================================================================

export const moveToTrash = mutation({
    args: {
        id: v.id("twentyPercentDF"),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const record = await ctx.db.get(args.id);
        if (!record) throw new Error("Record not found");
        if (record.isDeleted) throw new Error("Record already deleted");

        const now = Date.now();

        await ctx.db.patch(args.id, {
            isDeleted: true,
            deletedAt: now,
            deletedBy: userId,
            updatedAt: now,
            updatedBy: userId,
        });

        await logTwentyPercentDFActivity(ctx, userId, {
            action: "deleted",
            twentyPercentDFId: args.id,
            previousValues: record,
            reason: args.reason,
        });

        // 🔍 Update search index - mark as deleted
        await indexEntity(ctx, {
            entityType: "twentyPercentDF",
            entityId: args.id,
            primaryText: record.particulars,
            secondaryText: record.implementingOffice,
            departmentId: record.departmentId,
            status: record.status,
            year: record.year,
            isDeleted: true,
        });

        return { success: true };
    },
});

// ============================================================================
// MUTATION: BULK MOVE TO TRASH
// ============================================================================

export const bulkMoveToTrash = mutation({
    args: {
        ids: v.array(v.id("twentyPercentDF")),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const now = Date.now();
        const results = [];

        for (const id of args.ids) {
            const record = await ctx.db.get(id);
            if (!record || record.isDeleted) {
                results.push({ id, success: false, reason: "Not found or already deleted" });
                continue;
            }

            await ctx.db.patch(id, {
                isDeleted: true,
                deletedAt: now,
                deletedBy: userId,
                updatedAt: now,
                updatedBy: userId,
            });

            await logTwentyPercentDFActivity(ctx, userId, {
                action: "deleted",
                twentyPercentDFId: id,
                previousValues: record,
                reason: args.reason || "Bulk delete",
            });

            // 🔍 Update search index - mark as deleted
            await indexEntity(ctx, {
                entityType: "twentyPercentDF",
                entityId: id,
                primaryText: record.particulars,
                secondaryText: record.implementingOffice,
                departmentId: record.departmentId,
                status: record.status,
                year: record.year,
                isDeleted: true,
            });

            results.push({ id, success: true });
        }

        const successCount = results.filter(r => r.success).length;

        return {
            results,
            total: args.ids.length,
            count: successCount,
        };
    },
});

// ============================================================================
// MUTATION: RESTORE FROM TRASH
// ============================================================================

export const restoreFromTrash = mutation({
    args: {
        id: v.id("twentyPercentDF"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const record = await ctx.db.get(args.id);
        if (!record) throw new Error("Record not found");
        if (!record.isDeleted) throw new Error("Record is not deleted");

        const now = Date.now();

        await ctx.db.patch(args.id, {
            isDeleted: false,
            deletedAt: undefined,
            deletedBy: undefined,
            updatedAt: now,
            updatedBy: userId,
        });

        await logTwentyPercentDFActivity(ctx, userId, {
            action: "restored",
            twentyPercentDFId: args.id,
            previousValues: record,
        });

        // 🔍 Update search index - restore from trash
        await indexEntity(ctx, {
            entityType: "twentyPercentDF",
            entityId: args.id,
            primaryText: record.particulars,
            secondaryText: record.implementingOffice,
            departmentId: record.departmentId,
            status: record.status,
            year: record.year,
            isDeleted: false,
        });

        return { success: true };
    },
});

// ============================================================================
// MUTATION: PERMANENT DELETE (Remove)
// ============================================================================

export const remove = mutation({
    args: {
        id: v.id("twentyPercentDF"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const record = await ctx.db.get(args.id);
        if (!record) throw new Error("Record not found");

        // Ideally only deleted items should be permanently deleted, but 
        // we can enforce that or just allow force delete.
        // For trash bin logic, typically it's already in trash (isDeleted=true).

        await ctx.db.delete(args.id);

        await logTwentyPercentDFActivity(ctx, userId, {
            action: "deleted", // or a specific "permanently_deleted" if supported
            twentyPercentDFId: args.id,
            previousValues: record,
            reason: "Permanent deletion from trash",
        });

        return { success: true };
    },
});

// ============================================================================
// MUTATION: TOGGLE PIN
// ============================================================================

export const togglePin = mutation({
    args: {
        id: v.id("twentyPercentDF"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const record = await ctx.db.get(args.id);
        if (!record) throw new Error("Record not found");

        const now = Date.now();
        const newPinState = !record.isPinned;

        await ctx.db.patch(args.id, {
            isPinned: newPinState,
            pinnedAt: newPinState ? now : undefined,
            pinnedBy: newPinState ? userId : undefined,
            updatedAt: now,
            updatedBy: userId,
        });

        return { success: true, isPinned: newPinState };
    },
});

// ============================================================================
// MUTATION: BULK UPDATE CATEGORY
// ============================================================================

export const bulkUpdateCategory = mutation({
    args: {
        ids: v.array(v.id("twentyPercentDF")),
        categoryId: v.optional(v.id("projectCategories")),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const now = Date.now();
        const results = [];

        for (const id of args.ids) {
            const record = await ctx.db.get(id);
            if (!record || record.isDeleted) {
                results.push({ id, success: false, reason: "Not found or deleted" });
                continue;
            }

            const previous = { ...record };

            await ctx.db.patch(id, {
                categoryId: args.categoryId,
                updatedAt: now,
                updatedBy: userId,
            });

            const updated = await ctx.db.get(id);

            await logTwentyPercentDFActivity(ctx, userId, {
                action: "updated",
                twentyPercentDFId: id,
                previousValues: previous,
                newValues: updated,
                reason: args.reason || "Bulk category update",
            });

            results.push({ id, success: true });
        }

        const successCount = results.filter(r => r.success).length;

        return {
            results,
            total: args.ids.length,
            count: successCount,
        };
    },
});

// ============================================================================
// MUTATION: TOGGLE AUTO CALCULATE (Single)
// ============================================================================

export const toggleAutoCalculateFinancials = mutation({
    args: {
        id: v.id("twentyPercentDF"),
        autoCalculate: v.boolean(),
        reason: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const record = await ctx.db.get(args.id);
        if (!record) throw new Error("Record not found");
        if (record.isDeleted) throw new Error("Cannot update deleted record");

        const previous = { ...record };
        const now = Date.now();

        await ctx.db.patch(args.id, {
            autoCalculateBudgetUtilized: args.autoCalculate,
            updatedAt: now,
            updatedBy: userId,
        });

        // If enabling auto-calculate, recalculate metrics immediately
        if (args.autoCalculate) {
            await recalculateTwentyPercentDFMetrics(ctx, args.id, userId);
        }

        const updated = await ctx.db.get(args.id);

        await logTwentyPercentDFActivity(ctx, userId, {
            action: "updated",
            twentyPercentDFId: args.id,
            previousValues: previous,
            newValues: updated,
            reason: args.reason || `Auto-calculate ${args.autoCalculate ? "enabled" : "disabled"}`,
        });

        return { success: true };
    },
});

// ============================================================================
// MUTATION: BULK TOGGLE AUTO CALCULATE
// ============================================================================

export const bulkToggleAutoCalculate = mutation({
    args: {
        ids: v.array(v.id("twentyPercentDF")),
        autoCalculate: v.boolean(),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const now = Date.now();
        const results = [];

        for (const id of args.ids) {
            const record = await ctx.db.get(id);
            if (!record || record.isDeleted) {
                results.push({ id, success: false, reason: "Not found or deleted" });
                continue;
            }

            const previous = { ...record };

            await ctx.db.patch(id, {
                autoCalculateBudgetUtilized: args.autoCalculate,
                updatedAt: now,
                updatedBy: userId,
            });

            // If enabling auto-calculate, recalculate metrics immediately
            if (args.autoCalculate) {
                await recalculateTwentyPercentDFMetrics(ctx, id, userId);
            }

            const updated = await ctx.db.get(id);

            await logTwentyPercentDFActivity(ctx, userId, {
                action: "updated",
                twentyPercentDFId: id,
                previousValues: previous,
                newValues: updated,
                reason: args.reason || `Bulk auto-calculate ${args.autoCalculate ? "enabled" : "disabled"}`,
            });

            results.push({ id, success: true });
        }

        const successCount = results.filter(r => r.success).length;

        return {
            results,
            total: args.ids.length,
            count: successCount,
        };
    },
});

// ============================================================================
// MUTATION: RECALCULATE METRICS (Manual Trigger)
// ============================================================================

export const recalculateMetrics = mutation({
    args: {
        id: v.id("twentyPercentDF"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const record = await ctx.db.get(args.id);
        if (!record) throw new Error("Record not found");

        const result = await recalculateTwentyPercentDFMetrics(ctx, args.id, userId);

        return { success: true, ...result };
    },
});

// ============================================================================
// QUERY: GET TRASH ITEMS
// ============================================================================

export const getTrash = query({
    args: {
        budgetItemId: v.optional(v.id("budgetItems")),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        let results;

        if (args.budgetItemId) {
            results = await ctx.db
                .query("twentyPercentDF")
                .withIndex("budgetItemId", (q) =>
                    q.eq("budgetItemId", args.budgetItemId)
                )
                .collect();
        } else {
            results = await ctx.db
                .query("twentyPercentDF")
                .collect();
        }

        // Filter for deleted items only
        results = results.filter((item) => item.isDeleted === true);

        return results;
    },
});

// ============================================================================
// BULK RECALCULATION: Admin Only
// ============================================================================

/**
 * Recalculate metrics for all 20% DF records
 * Admin only - use when data appears inconsistent
 */
export const recalculateAllMetrics = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // Check if user is admin
        const user = await ctx.db.get(userId);
        if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
            throw new Error("Admin access required");
        }

        const allRecords = await ctx.db.query("twentyPercentDF").collect();
        const results = [];
        let successCount = 0;
        let errorCount = 0;

        for (const record of allRecords) {
            try {
                const result = await recalculateTwentyPercentDFMetrics(ctx, record._id, userId);
                results.push({
                    id: record._id,
                    particulars: record.particulars,
                    success: true,
                    ...result,
                });
                successCount++;
            } catch (error) {
                results.push({
                    id: record._id,
                    particulars: record.particulars,
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                });
                errorCount++;
            }
        }

        return {
            totalProcessed: allRecords.length,
            successCount,
            errorCount,
            results,
        };
    },
});

// ============================================================================
// INTERNAL MUTATION: System Recalculation
// ============================================================================

export const internalRecalculateMetrics = internalMutation({
    args: {
        id: v.id("twentyPercentDF"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const result = await recalculateTwentyPercentDFMetrics(ctx, args.id, args.userId);
        return result;
    },
});

/**
 * Quick update status only (for generic FundsTable)
 */
export const updateStatus = mutation({
    args: {
        id: v.id("twentyPercentDF"),
        status: v.union(
            v.literal("ongoing"),
            v.literal("completed"),
            v.literal("delayed")
        ),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) throw new Error("Not authenticated");

        const existing = await ctx.db.get(args.id);
        if (!existing) throw new Error("Record not found");

        const now = Date.now();

        await ctx.db.patch(args.id, {
            status: args.status,
            updatedAt: now,
            updatedBy: userId,
        });

        // Log activity
        await logTwentyPercentDFActivity(ctx, userId, {
            action: "updated",
            twentyPercentDFId: args.id,
            previousValues: existing,
            newValues: { ...existing, status: args.status, updatedAt: now, updatedBy: userId },
            reason: args.reason || `Status changed to ${args.status}`
        });

        return args.id;
    },
});
