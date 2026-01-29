// convex/twentyPercentDF.ts
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { recalculateTwentyPercentDFMetrics } from "./lib/twentyPercentDFAggregation";
import { logTwentyPercentDFActivity } from "./lib/twentyPercentDFActivityLogger";
import { internal } from "./_generated/api";

/**
 * Get ACTIVE 20% DF Records (Hidden Trash)
 */
export const list = query({
    args: {
        year: v.optional(v.number()),
        categoryId: v.optional(v.id("projectCategories")),
        budgetItemId: v.optional(v.id("budgetItems")),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) throw new Error("Not authenticated");

        let records;

        if (args.categoryId) {
            records = await ctx.db
                .query("twentyPercentDF")
                .withIndex("categoryId", (q) => q.eq("categoryId", args.categoryId))
                .filter((q) => q.neq(q.field("isDeleted"), true))
                .order("desc")
                .collect();
        } else if (args.budgetItemId) {
            records = await ctx.db
                .query("twentyPercentDF")
                .withIndex("budgetItemId", (q) => q.eq("budgetItemId", args.budgetItemId))
                .filter((q) => q.neq(q.field("isDeleted"), true))
                .order("desc")
                .collect();
        } else {
            records = await ctx.db
                .query("twentyPercentDF")
                .filter((q) => q.neq(q.field("isDeleted"), true))
                .order("desc")
                .collect();
        }

        if (args.year !== undefined) {
            records = records.filter((r) => r.year === args.year);
        }

        return records;
    },
});

/**
 * Get TRASHED records only
 */
export const getTrash = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        return await ctx.db
            .query("twentyPercentDF")
            .withIndex("isDeleted", (q) => q.eq("isDeleted", true))
            .order("desc")
            .collect();
    },
});

/**
 * Create a new 20% DF Record
 */
export const create = mutation({
    args: {
        particulars: v.string(),
        implementingOffice: v.string(),
        categoryId: v.optional(v.id("projectCategories")),
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
        if (!userId) {
            return { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } };
        }

        // Validate particular
        const particular = await ctx.db
            .query("projectParticulars")
            .withIndex("code", (q) => q.eq("code", args.particulars))
            .first();

        if (!particular) {
            return { success: false, error: { code: "VALIDATION_ERROR", message: `Particular "${args.particulars}" not found.` } };
        }
        if (!particular.isActive) {
            return { success: false, error: { code: "VALIDATION_ERROR", message: `Particular "${args.particulars}" is inactive.` } };
        }

        // Validate Implementing Agency
        const agency = await ctx.db
            .query("implementingAgencies")
            .withIndex("code", (q) => q.eq("code", args.implementingOffice))
            .first();

        if (!agency) {
            return { success: false, error: { code: "VALIDATION_ERROR", message: `Agency "${args.implementingOffice}" not found.` } };
        }
        if (!agency.isActive) {
            return { success: false, error: { code: "VALIDATION_ERROR", message: `Agency "${args.implementingOffice}" is inactive.` } };
        }

        // Validate Category
        if (args.categoryId) {
            const category = await ctx.db.get(args.categoryId);
            if (!category || !category.isActive) {
                return { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid or inactive category." } };
            }
        }

        const now = Date.now();
        const utilizationRate = args.totalBudgetAllocated > 0
            ? (args.totalBudgetUtilized / args.totalBudgetAllocated) * 100
            : 0;

        const departmentId = agency.departmentId;

        const id = await ctx.db.insert("twentyPercentDF", {
            particulars: args.particulars,
            implementingOffice: args.implementingOffice,
            departmentId: departmentId,
            categoryId: args.categoryId,
            budgetItemId: args.budgetItemId,
            totalBudgetAllocated: args.totalBudgetAllocated,
            obligatedBudget: args.obligatedBudget,
            totalBudgetUtilized: args.totalBudgetUtilized,
            utilizationRate,
            projectCompleted: 0,
            projectDelayed: 0,
            projectsOnTrack: 0,
            status: "ongoing",
            remarks: args.remarks,
            year: args.year,
            targetDateCompletion: args.targetDateCompletion,
            projectManagerId: args.projectManagerId,
            autoCalculateBudgetUtilized: args.autoCalculateBudgetUtilized !== undefined
                ? args.autoCalculateBudgetUtilized
                : true,
            createdBy: userId,
            createdAt: now,
            updatedAt: now,
            isDeleted: false,
        });

        // Update usage counts
        await ctx.runMutation(internal.projectParticulars.updateUsageCount, { code: args.particulars, delta: 1 });
        await ctx.runMutation(internal.implementingAgencies.updateUsageCount, { code: args.implementingOffice, usageContext: "project", delta: 1 });
        if (args.categoryId) {
            await ctx.runMutation(internal.projectCategories.updateUsageCount, { categoryId: args.categoryId, delta: 1 });
        }

        const newRecord = await ctx.db.get(id);
        await logTwentyPercentDFActivity(ctx, userId, {
            action: "created",
            twentyPercentDFId: id,
            newValues: newRecord,
            reason: "New 20% DF created"
        });

        return { success: true, data: { id, record: newRecord }, message: "20% DF record created successfully" };
    },
});

/**
 * Update existing 20% DF Record
 */
export const update = mutation({
    args: {
        id: v.id("twentyPercentDF"),
        particulars: v.string(),
        implementingOffice: v.string(),
        categoryId: v.optional(v.id("projectCategories")),
        budgetItemId: v.optional(v.id("budgetItems")),
        totalBudgetAllocated: v.number(),
        obligatedBudget: v.optional(v.number()),
        totalBudgetUtilized: v.number(),
        remarks: v.optional(v.string()),
        year: v.optional(v.number()),
        targetDateCompletion: v.optional(v.number()),
        projectManagerId: v.optional(v.id("users")),
        autoCalculateBudgetUtilized: v.optional(v.boolean()),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const existing = await ctx.db.get(args.id);
        if (!existing) throw new Error("Record not found");

        // Handle reference changes (Agency, Particular, Category)
        if (args.particulars !== existing.particulars) {
            const particular = await ctx.db.query("projectParticulars").withIndex("code", q => q.eq("code", args.particulars)).first();
            if (!particular || !particular.isActive) throw new Error("Invalid particular");

            await ctx.runMutation(internal.projectParticulars.updateUsageCount, { code: existing.particulars, delta: -1 });
            await ctx.runMutation(internal.projectParticulars.updateUsageCount, { code: args.particulars, delta: 1 });
        }

        let departmentId = existing.departmentId;
        if (args.implementingOffice !== existing.implementingOffice) {
            const agency = await ctx.db.query("implementingAgencies").withIndex("code", q => q.eq("code", args.implementingOffice)).first();
            if (!agency || !agency.isActive) throw new Error("Invalid agency");

            departmentId = agency.departmentId;

            await ctx.runMutation(internal.implementingAgencies.updateUsageCount, { code: existing.implementingOffice, usageContext: "project", delta: -1 });
            await ctx.runMutation(internal.implementingAgencies.updateUsageCount, { code: args.implementingOffice, usageContext: "project", delta: 1 });
        }

        if (args.categoryId !== existing.categoryId) {
            if (args.categoryId) {
                const cat = await ctx.db.get(args.categoryId);
                if (!cat || !cat.isActive) throw new Error("Invalid category");
            }

            if (existing.categoryId) await ctx.runMutation(internal.projectCategories.updateUsageCount, { categoryId: existing.categoryId, delta: -1 });
            if (args.categoryId) await ctx.runMutation(internal.projectCategories.updateUsageCount, { categoryId: args.categoryId, delta: 1 });
        }

        const now = Date.now();
        const utilizationRate = args.totalBudgetAllocated > 0
            ? (args.totalBudgetUtilized / args.totalBudgetAllocated) * 100
            : 0;

        await ctx.db.patch(args.id, {
            particulars: args.particulars,
            implementingOffice: args.implementingOffice,
            departmentId,
            categoryId: args.categoryId,
            budgetItemId: args.budgetItemId,
            totalBudgetAllocated: args.totalBudgetAllocated,
            obligatedBudget: args.obligatedBudget,
            totalBudgetUtilized: args.totalBudgetUtilized,
            utilizationRate,
            remarks: args.remarks,
            year: args.year,
            targetDateCompletion: args.targetDateCompletion,
            projectManagerId: args.projectManagerId,
            autoCalculateBudgetUtilized: args.autoCalculateBudgetUtilized,
            updatedAt: now,
            updatedBy: userId,
        });

        await recalculateTwentyPercentDFMetrics(ctx, args.id, userId);

        const updated = await ctx.db.get(args.id);
        await logTwentyPercentDFActivity(ctx, userId, {
            action: "updated",
            twentyPercentDFId: args.id,
            previousValues: existing,
            newValues: updated,
            reason: args.reason
        });

        return { success: true, id: args.id };
    },
});

/**
 * Move to Trash (Soft Delete)
 */
export const moveToTrash = mutation({
    args: {
        id: v.id("twentyPercentDF"),
        reason: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const existing = await ctx.db.get(args.id);
        if (!existing) throw new Error("Record not found");

        const now = Date.now();
        await ctx.db.patch(args.id, {
            isDeleted: true,
            deletedAt: now,
            deletedBy: userId,
            updatedAt: now,
            updatedBy: userId
        });

        // Cascade to breakdowns
        const breakdowns = await ctx.db
            .query("twentyPercentDFBreakdowns")
            .withIndex("twentyPercentDFId", q => q.eq("twentyPercentDFId", args.id))
            .collect();

        for (const b of breakdowns) {
            await ctx.db.patch(b._id, { isDeleted: true, deletedAt: now, deletedBy: userId });
        }

        // Decrement usages
        await ctx.runMutation(internal.projectParticulars.updateUsageCount, { code: existing.particulars, delta: -1 });
        await ctx.runMutation(internal.implementingAgencies.updateUsageCount, { code: existing.implementingOffice, usageContext: "project", delta: -1 });
        if (existing.categoryId) {
            await ctx.runMutation(internal.projectCategories.updateUsageCount, { categoryId: existing.categoryId, delta: -1 });
        }

        await logTwentyPercentDFActivity(ctx, userId, {
            action: "updated",
            twentyPercentDFId: args.id,
            previousValues: existing,
            newValues: { ...existing, isDeleted: true },
            reason: args.reason || "Moved to trash"
        });

        return { success: true };
    }
});

/**
 * Toggle Pin Status
 */
export const togglePin = mutation({
    args: { id: v.id("twentyPercentDF") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const existing = await ctx.db.get(args.id);
        if (!existing) throw new Error("Record not found");

        const now = Date.now();
        const newPinnedState = !existing.isPinned;

        await ctx.db.patch(args.id, {
            isPinned: newPinnedState,
            pinnedAt: newPinnedState ? now : undefined,
            pinnedBy: newPinnedState ? userId : undefined,
            updatedAt: now,
            updatedBy: userId,
        });

        return args.id;
    },
});

/**
 * Restore from Trash
 */
export const restoreFromTrash = mutation({
    args: { id: v.id("twentyPercentDF") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const existing = await ctx.db.get(args.id);
        if (!existing) throw new Error("Record not found");

        await ctx.db.patch(args.id, {
            isDeleted: false,
            deletedAt: undefined,
            deletedBy: undefined,
            updatedAt: Date.now()
        });

        const breakdowns = await ctx.db
            .query("twentyPercentDFBreakdowns")
            .withIndex("twentyPercentDFId", (q) => q.eq("twentyPercentDFId", args.id))
            .collect();

        for (const breakdown of breakdowns) {
            if (breakdown.isDeleted) {
                await ctx.db.patch(breakdown._id, {
                    isDeleted: false,
                    deletedAt: undefined,
                    deletedBy: undefined
                });
            }
        }

        await ctx.runMutation(internal.projectParticulars.updateUsageCount, { code: existing.particulars, delta: 1 });
        await ctx.runMutation(internal.implementingAgencies.updateUsageCount, { code: existing.implementingOffice, usageContext: "project", delta: 1 });
        if (existing.categoryId) {
            await ctx.runMutation(internal.projectCategories.updateUsageCount, { categoryId: existing.categoryId, delta: 1 });
        }

        await recalculateTwentyPercentDFMetrics(ctx, args.id, userId);

        return { success: true, message: "Restored successfully" };
    },
});

/**
 * Bulk Move to Trash
 */
export const bulkMoveToTrash = mutation({
    args: {
        ids: v.array(v.id("twentyPercentDF")),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const user = await ctx.db.get(userId);
        if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
            throw new Error("Unauthorized: Only admins can perform bulk actions.");
        }

        const now = Date.now();
        let successCount = 0;

        for (const id of args.ids) {
            const existing = await ctx.db.get(id);
            if (!existing || existing.isDeleted) continue;

            await ctx.db.patch(id, {
                isDeleted: true,
                deletedAt: now,
                deletedBy: userId,
                updatedAt: now,
                updatedBy: userId,
            });

            const breakdowns = await ctx.db
                .query("twentyPercentDFBreakdowns")
                .withIndex("twentyPercentDFId", (q) => q.eq("twentyPercentDFId", id))
                .collect();

            for (const breakdown of breakdowns) {
                await ctx.db.patch(breakdown._id, {
                    isDeleted: true,
                    deletedAt: now,
                    deletedBy: userId,
                });
            }

            await ctx.runMutation(internal.projectParticulars.updateUsageCount, { code: existing.particulars, delta: -1 });
            await ctx.runMutation(internal.implementingAgencies.updateUsageCount, { code: existing.implementingOffice, usageContext: "project", delta: -1 });
            if (existing.categoryId) {
                await ctx.runMutation(internal.projectCategories.updateUsageCount, { categoryId: existing.categoryId, delta: -1 });
            }

            await logTwentyPercentDFActivity(ctx, userId, {
                action: "deleted",
                twentyPercentDFId: id,
                previousValues: existing,
                reason: args.reason || "Bulk move to trash",
            });

            successCount++;
        }

        return { success: true, count: successCount };
    },
});

/**
 * Bulk Update Category
 */
export const bulkUpdateCategory = mutation({
    args: {
        ids: v.array(v.id("twentyPercentDF")),
        categoryId: v.id("projectCategories"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const user = await ctx.db.get(userId);
        if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
            throw new Error("Unauthorized: Only admins can perform bulk actions.");
        }

        const category = await ctx.db.get(args.categoryId);
        if (!category) throw new Error("Category not found");

        const now = Date.now();
        let successCount = 0;

        for (const id of args.ids) {
            const existing = await ctx.db.get(id);
            if (!existing) continue;
            if (existing.categoryId === args.categoryId) continue;

            const previousValues = { ...existing };

            if (existing.categoryId) {
                await ctx.runMutation(internal.projectCategories.updateUsageCount, { categoryId: existing.categoryId, delta: -1 });
            }

            await ctx.db.patch(id, {
                categoryId: args.categoryId,
                updatedAt: now,
                updatedBy: userId,
            });

            await ctx.runMutation(internal.projectCategories.updateUsageCount, { categoryId: args.categoryId, delta: 1 });

            await logTwentyPercentDFActivity(ctx, userId, {
                action: "updated",
                twentyPercentDFId: id,
                previousValues: previousValues,
                newValues: { ...existing, categoryId: args.categoryId },
                reason: "Bulk category update",
            });

            successCount++;
        }

        return { success: true, count: successCount };
    },
});

/**
 * Toggle Auto-Calculate
 */
export const toggleAutoCalculate = mutation({
    args: {
        id: v.id("twentyPercentDF"),
        autoCalculate: v.boolean(),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const existing = await ctx.db.get(args.id);
        if (!existing) throw new Error("Record not found");

        await ctx.db.patch(args.id, {
            autoCalculateBudgetUtilized: args.autoCalculate,
            updatedAt: Date.now(),
            updatedBy: userId,
        });

        if (args.autoCalculate) {
            await recalculateTwentyPercentDFMetrics(ctx, args.id, userId);
        } else {
            const utilizationRate = existing.totalBudgetAllocated > 0
                ? (existing.totalBudgetUtilized / existing.totalBudgetAllocated) * 100
                : 0;
            await ctx.db.patch(args.id, {
                utilizationRate,
                updatedAt: Date.now(),
                updatedBy: userId
            });
        }

        const updated = await ctx.db.get(args.id);
        await logTwentyPercentDFActivity(ctx, userId, {
            action: "updated",
            twentyPercentDFId: args.id,
            previousValues: existing,
            newValues: updated,
            reason: args.reason || `Switched to ${args.autoCalculate ? 'auto-calculate' : 'manual'} mode`
        });

        return { success: true, mode: args.autoCalculate ? "auto" : "manual" };
    }
});

/**
 * Bulk Toggle Auto-Calculate
 */
export const bulkToggleAutoCalculate = mutation({
    args: {
        ids: v.array(v.id("twentyPercentDF")),
        autoCalculate: v.boolean(),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const user = await ctx.db.get(userId);
        if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
            throw new Error("Unauthorized: Only admins can perform bulk actions.");
        }

        const now = Date.now();
        let successCount = 0;

        for (const id of args.ids) {
            const existing = await ctx.db.get(id);
            if (!existing || existing.isDeleted) continue;

            await ctx.db.patch(id, {
                autoCalculateBudgetUtilized: args.autoCalculate,
                updatedAt: now,
                updatedBy: userId,
            });

            if (args.autoCalculate) {
                await recalculateTwentyPercentDFMetrics(ctx, id, userId);
            }

            const updated = await ctx.db.get(id);

            await logTwentyPercentDFActivity(ctx, userId, {
                action: "updated",
                twentyPercentDFId: id,
                previousValues: existing,
                newValues: updated,
                reason: args.reason || `Bulk switched to ${args.autoCalculate ? 'auto-calculate' : 'manual'} mode`,
            });

            successCount++;
        }

        return {
            success: true,
            count: successCount,
            mode: args.autoCalculate ? "auto" : "manual",
            message: `${successCount} record(s) switched to ${args.autoCalculate ? 'auto-calculate' : 'manual'} mode`,
        };
    },
});

/**
 * Get single record
 */
export const get = query({
    args: { id: v.id("twentyPercentDF") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");
        const record = await ctx.db.get(args.id);
        if (!record || record.isDeleted) throw new Error("Record not found");
        return record;
    },
});

/**
 * Hard Delete
 */
export const remove = mutation({
    args: {
        id: v.id("twentyPercentDF"),
        reason: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const user = await ctx.db.get(userId);
        const existing = await ctx.db.get(args.id);
        if (!existing) throw new Error("Record not found");

        const isSuperAdmin = user?.role === 'super_admin';
        const isCreator = existing.createdBy === userId;

        if (!isCreator && !isSuperAdmin) throw new Error("Not authorized");

        const breakdowns = await ctx.db
            .query("twentyPercentDFBreakdowns")
            .withIndex("twentyPercentDFId", (q) => q.eq("twentyPercentDFId", args.id))
            .collect();

        for (const breakdown of breakdowns) {
            await ctx.db.delete(breakdown._id);
            await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
                code: breakdown.implementingOffice,
                usageContext: "breakdown",
                delta: -1,
            });
        }

        await ctx.db.delete(args.id);

        await ctx.runMutation(internal.projectParticulars.updateUsageCount, { code: existing.particulars, delta: -1 });
        await ctx.runMutation(internal.implementingAgencies.updateUsageCount, { code: existing.implementingOffice, usageContext: "project", delta: -1 });
        if (existing.categoryId) {
            await ctx.runMutation(internal.projectCategories.updateUsageCount, { categoryId: existing.categoryId, delta: -1 });
        }

        await logTwentyPercentDFActivity(ctx, userId, {
            action: "deleted",
            twentyPercentDFId: args.id,
            previousValues: existing,
            reason: args.reason || "Permanent Delete"
        });

        return { success: true };
    },
});
