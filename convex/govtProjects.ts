// convex/govtProjects.ts
// 🆕 ENHANCED: Now validates implementing agencies and updates usage counts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { logGovtProjectActivity, logBulkGovtProjectActivity } from "./lib/govtProjectActivityLogger";
import { recalculateProjectMetrics } from "./lib/projectAggregation";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// Reusable status validator
const statusValidator = v.union(
  v.literal("completed"),
  v.literal("delayed"),
  v.literal("ongoing")
);

/**
 * CREATE: Single project breakdown row
 * 🆕 ENHANCED: Now validates implementing agency
 */
export const createProjectBreakdown = mutation({
  args: {
      projectName: v.string(),
      implementingOffice: v.string(),
      projectId: v.optional(v.id("projects")),
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
      batchId: v.optional(v.string()),
      fundSource: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // 🆕 Validate implementing agency exists and is active
        const agency = await ctx.db
          .query("implementingAgencies")
          .withIndex("code", (q) => q.eq("code", args.implementingOffice))
          .first();

        if (!agency) {
          throw new Error(
            `Implementing agency "${args.implementingOffice}" does not exist. Please add it in Implementing Agencies management first.`
          );
        }

        if (!agency.isActive) {
          throw new Error(
            `Implementing agency "${args.implementingOffice}" is inactive and cannot be used. Please activate it first.`
          );
        }

        const now = Date.now();
        const { reason, ...breakdownData } = args;

        if (args.projectId) {
            const project = await ctx.db.get(args.projectId);
            if (!project) throw new Error("Parent project not found");
        }

        const breakdownId = await ctx.db.insert("govtProjectBreakdowns", {
            ...breakdownData,
            createdBy: userId,
            createdAt: now,
            updatedAt: now,
            updatedBy: userId,
            isDeleted: false,
        });

        // 🆕 Update usage count for implementing agency
        await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
          code: args.implementingOffice,
          usageContext: "breakdown",
          delta: 1,
        });

        const createdBreakdown = await ctx.db.get(breakdownId);
        await logGovtProjectActivity(ctx, userId, {
            action: "created",
            breakdownId: breakdownId,
            breakdown: createdBreakdown,
            newValues: createdBreakdown,
            source: "web_ui",
            reason: reason,
        });

        if (args.projectId) {
            await recalculateProjectMetrics(ctx, args.projectId, userId);
        }

        return { breakdownId };
    },
});

/**
 * UPDATE: Single project breakdown row
 * 🆕 ENHANCED: Now validates implementing agency if changed
 */
export const updateProjectBreakdown = mutation({
  args: {
    breakdownId: v.id("govtProjectBreakdowns"),
    projectName: v.optional(v.string()),
    implementingOffice: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
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
    if (!previousBreakdown) {
      throw new Error("Breakdown not found");
    }

    // 🆕 If implementing office is changing, validate and update counts
    // FIX: Store the value in a const to properly narrow the type
    const newImplementingOffice = args.implementingOffice;
    if (newImplementingOffice && newImplementingOffice !== previousBreakdown.implementingOffice) {
      const agency = await ctx.db
        .query("implementingAgencies")
        .withIndex("code", (q) => q.eq("code", newImplementingOffice))
        .first();

      if (!agency) {
        throw new Error(
          `Implementing agency "${newImplementingOffice}" does not exist. Please add it in Implementing Agencies management first.`
        );
      }

      if (!agency.isActive) {
        throw new Error(
          `Implementing agency "${newImplementingOffice}" is inactive and cannot be used. Please activate it first.`
        );
      }

      // Update usage counts
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

    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (!project) {
        throw new Error("Parent project not found");
      }
    }

    const oldProjectId = previousBreakdown.projectId;

    await ctx.db.patch(breakdownId, {
      ...updates,
      updatedAt: Date.now(),
      updatedBy: userId,
    });

    const updatedBreakdown = await ctx.db.get(breakdownId);

    await logGovtProjectActivity(ctx, userId, {
      action: "updated",
      breakdownId: breakdownId,
      breakdown: updatedBreakdown,
      previousValues: previousBreakdown,
      newValues: updatedBreakdown,
      source: "web_ui",
      reason: reason,
    });

    const projectsToRecalculate = new Set<Id<"projects">>();

    if (oldProjectId && oldProjectId !== args.projectId) {
      projectsToRecalculate.add(oldProjectId);
    }

    if (args.projectId) {
      projectsToRecalculate.add(args.projectId);
    }

    for (const projectId of projectsToRecalculate) {
      await recalculateProjectMetrics(ctx, projectId, userId);
    }

    return { success: true, breakdownId };
  },
});

/**
 * HARD DELETE: Permanent Removal
 */
export const deleteProjectBreakdown = mutation({
  args: {
    breakdownId: v.id("govtProjectBreakdowns"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const breakdown = await ctx.db.get(args.breakdownId);
    if (!breakdown) throw new Error("Breakdown not found");

    const projectId = breakdown.projectId;

    await ctx.db.delete(args.breakdownId);

    // 🆕 Update usage count for implementing agency
    await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
      code: breakdown.implementingOffice,
      usageContext: "breakdown",
      delta: -1,
    });

    await logGovtProjectActivity(ctx, userId, {
      action: "deleted",
      breakdownId: args.breakdownId,
      previousValues: breakdown,
      source: "web_ui",
      reason: args.reason,
    });

    if (projectId) {
      await recalculateProjectMetrics(ctx, projectId, userId);
    }

    return { success: true };
  },
});

/**
 * BULK CREATE: Multiple project breakdowns
 * 🆕 ENHANCED: Now validates implementing agencies for bulk operations
 */
export const bulkCreateBreakdowns = mutation({
  args: {
    breakdowns: v.array(v.object({
      projectName: v.string(),
      implementingOffice: v.string(),
      projectId: v.optional(v.id("projects")),
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
      projectTitle: v.optional(v.string()),
      utilizationRate: v.optional(v.number()),
      projectAccomplishment: v.optional(v.number()),
      reportDate: v.optional(v.number()),
      batchId: v.optional(v.string()),
      fundSource: v.optional(v.string()),
    })),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // 🆕 Validate all implementing agencies before inserting
    const uniqueAgencies = new Set(args.breakdowns.map(b => b.implementingOffice));
    const agencyMap = new Map<string, any>();

    for (const agencyCode of uniqueAgencies) {
      const agency = await ctx.db
        .query("implementingAgencies")
        .withIndex("code", (q) => q.eq("code", agencyCode))
        .first();

      if (!agency) {
        throw new Error(
          `Implementing agency "${agencyCode}" does not exist. Please add it in Implementing Agencies management first.`
        );
      }

      if (!agency.isActive) {
        throw new Error(
          `Implementing agency "${agencyCode}" is inactive and cannot be used. Please activate it first.`
        );
      }

      agencyMap.set(agencyCode, agency);
    }

    const now = Date.now();
    const insertedRecords: Array<{ 
      breakdownId: Id<"govtProjectBreakdowns">; 
      breakdown: any 
    }> = [];

    const affectedProjects = new Set<Id<"projects">>();

    // Insert all breakdowns
    for (const breakdown of args.breakdowns) {
      const breakdownId = await ctx.db.insert("govtProjectBreakdowns", {
        ...breakdown,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
        updatedBy: userId,
      });

      const createdBreakdown = await ctx.db.get(breakdownId);
      insertedRecords.push({ 
        breakdownId, 
        breakdown: createdBreakdown 
      });

      if (breakdown.projectId) {
        affectedProjects.add(breakdown.projectId);
      }
    }

    // 🆕 Update usage counts for all agencies
    for (const agencyCode of uniqueAgencies) {
      const count = args.breakdowns.filter(b => b.implementingOffice === agencyCode).length;
      await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
        code: agencyCode,
        usageContext: "breakdown",
        delta: count,
      });
    }

    const batchId = await logBulkGovtProjectActivity(
      ctx,
      userId,
      "bulk_created",
      insertedRecords.map(r => ({
        breakdownId: r.breakdownId,
        breakdown: r.breakdown,
        newValues: r.breakdown,
      })),
      {
        source: "bulk_import",
        reason: args.reason || "Excel import",
      }
    );

    for (const projectId of affectedProjects) {
      await recalculateProjectMetrics(ctx, projectId, userId);
    }

    return { 
      count: insertedRecords.length, 
      ids: insertedRecords.map(r => r.breakdownId),
      batchId,
      affectedProjects: affectedProjects.size,
    };
  },
});

export const getBreakdownStats = query({
  args: {
    budgetItemId: v.optional(v.id("budgetItems")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let allBreakdowns = [];
    
    if (args.budgetItemId) {
      const projects = await ctx.db
        .query("projects")
        .withIndex("budgetItemId", (q) => q.eq("budgetItemId", args.budgetItemId))
        .collect();
      
      const breakdownPromises = projects.map(project =>
        ctx.db
          .query("govtProjectBreakdowns")
          .withIndex("projectId", (q) => q.eq("projectId", project._id))
          .collect()
      );
      
      const allBreakdownArrays = await Promise.all(breakdownPromises);
      allBreakdowns = allBreakdownArrays.flat();
    } else {
      allBreakdowns = await ctx.db
        .query("govtProjectBreakdowns")
        .collect();
    }

    const totalBreakdowns = allBreakdowns.length;
    const totalAllocated = allBreakdowns.reduce((sum, b) => sum + (b.allocatedBudget || 0), 0);
    const totalUtilized = allBreakdowns.reduce((sum, b) => sum + (b.budgetUtilized || 0), 0);
    
    const statusCounts = allBreakdowns.reduce(
      (acc, b) => {
        if (b.status === "completed") acc.completed++;
        else if (b.status === "delayed") acc.delayed++;
        else if (b.status === "ongoing") acc.ongoing++;
        return acc;
      },
      { completed: 0, delayed: 0, ongoing: 0 }
    );

    return {
      totalBreakdowns,
      totalAllocated,
      totalUtilized,
      statusCounts,
      utilizationRate: totalAllocated > 0 ? (totalUtilized / totalAllocated) * 100 : 0,
    };
  },
});

/**
 * BULK UPDATE: Multiple project breakdowns
 * 🆕 ENHANCED: Now validates implementing agencies for bulk operations
 */
export const bulkUpdateBreakdowns = mutation({
  args: {
    updates: v.array(v.object({
      breakdownId: v.id("govtProjectBreakdowns"),
      projectName: v.optional(v.string()),
      implementingOffice: v.optional(v.string()),
      projectId: v.optional(v.id("projects")),
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
      projectTitle: v.optional(v.string()),
      utilizationRate: v.optional(v.number()),
      projectAccomplishment: v.optional(v.number()),
      reportDate: v.optional(v.number()),
      fundSource: v.optional(v.string()),
    })),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // 🆕 Validate all new implementing agencies before updating
    // FIX: Filter properly to get only defined values
    const newAgencies = new Set(
      args.updates
        .map(u => u.implementingOffice)
        .filter((office): office is string => office !== undefined)
    );

    for (const agencyCode of newAgencies) {
      const agency = await ctx.db
        .query("implementingAgencies")
        .withIndex("code", (q) => q.eq("code", agencyCode))
        .first();

      if (!agency) {
        throw new Error(
          `Implementing agency "${agencyCode}" does not exist. Please add it in Implementing Agencies management first.`
        );
      }

      if (!agency.isActive) {
        throw new Error(
          `Implementing agency "${agencyCode}" is inactive and cannot be used. Please activate it first.`
        );
      }
    }

    const now = Date.now();
    const updatedRecords: Array<{
      breakdownId: Id<"govtProjectBreakdowns">;
      breakdown: any;
      previousValues: any;
      newValues: any;
    }> = [];

    const affectedProjects = new Set<Id<"projects">>();
    const agencyChanges = new Map<string, number>(); // Track agency usage changes

    for (const update of args.updates) {
      const { breakdownId, ...updateData } = update;

      const previousBreakdown = await ctx.db.get(breakdownId);
      if (!previousBreakdown) {
        console.warn(`Breakdown ${breakdownId} not found, skipping`);
        continue;
      }

      // Track agency changes
      // FIX: Store in const for proper type narrowing
      const newOffice = update.implementingOffice;
      if (newOffice && newOffice !== previousBreakdown.implementingOffice) {
        const oldAgency = previousBreakdown.implementingOffice;
        
        agencyChanges.set(oldAgency, (agencyChanges.get(oldAgency) || 0) - 1);
        agencyChanges.set(newOffice, (agencyChanges.get(newOffice) || 0) + 1);
      }

      if (previousBreakdown.projectId) {
        affectedProjects.add(previousBreakdown.projectId);
      }
      if (update.projectId) {
        affectedProjects.add(update.projectId);
      }

      await ctx.db.patch(breakdownId, {
        ...updateData,
        updatedAt: now,
        updatedBy: userId,
      });

      const updatedBreakdown = await ctx.db.get(breakdownId);

      updatedRecords.push({
        breakdownId,
        breakdown: updatedBreakdown,
        previousValues: previousBreakdown,
        newValues: updatedBreakdown,
      });
    }

    // 🆕 Apply all agency usage count changes
    for (const [agencyCode, delta] of agencyChanges.entries()) {
      if (delta !== 0) {
        await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
          code: agencyCode,
          usageContext: "breakdown",
          delta: delta,
        });
      }
    }

    const batchId = await logBulkGovtProjectActivity(
      ctx,
      userId,
      "bulk_updated",
      updatedRecords.map(r => ({
        breakdownId: r.breakdownId,
        breakdown: r.breakdown,
        previousValues: r.previousValues,
        newValues: r.newValues,
      })),
      {
        source: "bulk_import",
        reason: args.reason || "Bulk update",
      }
    );

    for (const projectId of affectedProjects) {
      await recalculateProjectMetrics(ctx, projectId, userId);
    }

    return { 
      count: updatedRecords.length, 
      ids: updatedRecords.map(r => r.breakdownId),
      batchId,
      affectedProjects: affectedProjects.size,
    };
  },
});

/**
 * BULK DELETE: Multiple project breakdowns
 */
export const bulkDeleteBreakdowns = mutation({
  args: {
    breakdownIds: v.array(v.id("govtProjectBreakdowns")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const deletedRecords: Array<{
      breakdownId: Id<"govtProjectBreakdowns">;
      previousValues: any;
    }> = [];

    const affectedProjects = new Set<Id<"projects">>();
    const agencyUsage = new Map<string, number>(); // Track deletions per agency

    for (const breakdownId of args.breakdownIds) {
      const breakdown = await ctx.db.get(breakdownId);
      if (!breakdown) {
        console.warn(`Breakdown ${breakdownId} not found, skipping`);
        continue;
      }

      // Track agency usage
      const agency = breakdown.implementingOffice;
      agencyUsage.set(agency, (agencyUsage.get(agency) || 0) + 1);

      if (breakdown.projectId) {
        affectedProjects.add(breakdown.projectId);
      }

      await ctx.db.delete(breakdownId);

      deletedRecords.push({
        breakdownId,
        previousValues: breakdown,
      });
    }

    // 🆕 Update usage counts for all affected agencies
    for (const [agencyCode, count] of agencyUsage.entries()) {
      await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
        code: agencyCode,
        usageContext: "breakdown",
        delta: -count,
      });
    }

    const batchId = await logBulkGovtProjectActivity(
      ctx,
      userId,
      "bulk_deleted",
      deletedRecords.map(r => ({
        breakdownId: r.breakdownId,
        previousValues: r.previousValues,
      })),
      {
        source: "web_ui",
        reason: args.reason || "Bulk deletion",
      }
    );

    for (const projectId of affectedProjects) {
      await recalculateProjectMetrics(ctx, projectId, userId);
    }

    return { 
      count: deletedRecords.length, 
      ids: deletedRecords.map(r => r.breakdownId),
      batchId,
      affectedProjects: affectedProjects.size,
    };
  },
});

/**
 * READ: Get a single project breakdown by ID
 */
export const getProjectBreakdown = query({
  args: {
    breakdownId: v.id("govtProjectBreakdowns"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const breakdown = await ctx.db.get(args.breakdownId);
    
    return breakdown;
  },
});

/**
 * Get ACTIVE breakdowns (Hidden Trash)
 */
export const getProjectBreakdowns = query({
  args: {
    projectName: v.optional(v.string()),
    implementingOffice: v.optional(v.string()),
    municipality: v.optional(v.string()),
    status: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let breakdowns = await ctx.db
      .query("govtProjectBreakdowns")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    if (args.projectId) {
      breakdowns = breakdowns.filter(b => b.projectId === args.projectId);
    }

    if (args.projectName) {
      breakdowns = breakdowns.filter(b => 
        b.projectName.toLowerCase().includes(args.projectName!.toLowerCase())
      );
    }

    if (args.implementingOffice) {
      breakdowns = breakdowns.filter(b => 
        b.implementingOffice.toLowerCase().includes(args.implementingOffice!.toLowerCase())
      );
    }

    if (args.municipality) {
      breakdowns = breakdowns.filter(b => 
        b.municipality?.toLowerCase().includes(args.municipality!.toLowerCase())
      );
    }

    if (args.status) {
      breakdowns = breakdowns.filter(b => b.status === args.status);
    }

    if (args.limit) {
      breakdowns = breakdowns.slice(0, args.limit);
    }

    return breakdowns;
  },
});

/**
 * Get TRASHED breakdowns only
 */
export const getTrash = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("govtProjectBreakdowns")
      .withIndex("isDeleted", (q) => q.eq("isDeleted", true))
      .order("desc")
      .collect();
  },
});

/**
 * Soft Delete: Move Breakdown to Trash
 */
export const moveToTrash = mutation({
  args: {
    breakdownId: v.id("govtProjectBreakdowns"),
    reason: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const breakdown = await ctx.db.get(args.breakdownId);
    if (!breakdown) throw new Error("Breakdown not found");

    await ctx.db.patch(args.breakdownId, {
      isDeleted: true,
      deletedAt: Date.now(),
      deletedBy: userId
    });

    // 🆕 Update usage count for implementing agency
    await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
      code: breakdown.implementingOffice,
      usageContext: "breakdown",
      delta: -1,
    });

    if (breakdown.projectId) {
      await recalculateProjectMetrics(ctx, breakdown.projectId, userId);
    }

    await logGovtProjectActivity(ctx, userId, {
      action: "updated",
      breakdownId: args.breakdownId,
      previousValues: breakdown,
      newValues: { ...breakdown, isDeleted: true },
      source: "web_ui",
      reason: args.reason || "Moved to trash",
    });

    return { success: true };
  },
});

/**
 * Restore Breakdown from Trash
 */
export const restoreFromTrash = mutation({
  args: { breakdownId: v.id("govtProjectBreakdowns") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const breakdown = await ctx.db.get(args.breakdownId);
    if (!breakdown) throw new Error("Breakdown not found");

    await ctx.db.patch(args.breakdownId, {
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined
    });

    // 🆕 Update usage count for implementing agency
    await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
      code: breakdown.implementingOffice,
      usageContext: "breakdown",
      delta: 1,
    });

    if (breakdown.projectId) {
      await recalculateProjectMetrics(ctx, breakdown.projectId, userId);
    }

    return { success: true };
  },
});

/**
 * 🆕 MANUAL RECALCULATION: Recalculate specific project
 */
export const recalculateProject = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const result = await recalculateProjectMetrics(ctx, args.projectId, userId);

    return {
      success: true,
      projectId: args.projectId,
      ...result,
    };
  },
});

/**
 * 🆕 MANUAL RECALCULATION: Recalculate ALL projects
 */
export const recalculateAllProjects = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "super_admin") {
      throw new Error("Only super_admin can recalculate all projects");
    }

    const allProjects = await ctx.db.query("projects").collect();
    const results = [];

    for (const project of allProjects) {
      const result = await recalculateProjectMetrics(ctx, project._id, userId);
      results.push({
        projectId: project._id,
        projectName: project.particulars,
        ...result,
      });
    }

    return {
      success: true,
      totalProjects: allProjects.length,
      results,
    };
  },
});

export const logBreakdownView = mutation({
  args: {
    breakdownId: v.id("govtProjectBreakdowns"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const breakdown = await ctx.db.get(args.breakdownId);
    if (!breakdown) {
      throw new Error("Breakdown not found");
    }

    await logGovtProjectActivity(ctx, userId, {
      action: "viewed",
      breakdownId: args.breakdownId,
      breakdown: breakdown,
      source: "web_ui",
    });

    return { success: true };
  },
});

export const logBreakdownExport = mutation({
  args: {
    breakdownIds: v.array(v.id("govtProjectBreakdowns")),
    exportFormat: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const breakdowns = await Promise.all(
      args.breakdownIds.map(id => ctx.db.get(id))
    );

    const validBreakdowns = breakdowns.filter(b => b !== null);
    
    for (let i = 0; i < validBreakdowns.length; i++) {
      const breakdown = validBreakdowns[i];
      if (breakdown) {
        await logGovtProjectActivity(ctx, userId, {
          action: "exported",
          breakdownId: args.breakdownIds[i],
          breakdown: breakdown,
          source: "web_ui",
          reason: args.exportFormat ? `Exported as ${args.exportFormat}` : undefined,
        });
      }
    }

    return { success: true, count: validBreakdowns.length };
  },
});