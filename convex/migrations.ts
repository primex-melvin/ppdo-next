/**
 * Data Migration Module
 *
 * Handles migration of data from budgetItems → projects → govtProjectBreakdowns
 * to twentyPercentDF → twentyPercentDFBreakdowns
 *
 * @module convex/migrations
 */

import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { recalculateTwentyPercentDFMetrics } from "./lib/twentyPercentDFAggregation";
import { logTwentyPercentDFActivity, logTwentyPercentDFBreakdownActivity } from "./lib/twentyPercentDFActivityLogger";
import { Doc, Id } from "./_generated/dataModel";

// ============================================================================
// TYPES
// ============================================================================

type ProjectWithBreakdowns = {
  project: Doc<"projects">;
  breakdowns: Doc<"govtProjectBreakdowns">[];
  breakdownCount: number;
};

type MigrationDetail = {
  projectId: Id<"projects">;
  projectName: string;
  breakdownsMigrated: number;
  breakdownIds: Id<"twentyPercentDFBreakdowns">[];
  error?: string;
};

type MigrationError = {
  projectId?: Id<"projects">;
  projectName?: string;
  breakdownId?: Id<"govtProjectBreakdowns">;
  error: string;
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get a preview of migration data before executing
 * Shows source budget item, target 20% DF, and breakdowns to be migrated
 */
export const getMigrationPreview = query({
  args: {
    sourceBudgetItemId: v.id("budgetItems"),
    targetTwentyPercentDFId: v.id("twentyPercentDF"),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    sourceBudgetItem: Doc<"budgetItems"> | null;
    targetTwentyPercentDF: Doc<"twentyPercentDF"> | null;
    projectsCount: number;
    totalBreakdownsCount: number;
    projectsWithBreakdowns: Array<{
      projectId: Id<"projects">;
      projectName: string;
      implementingOffice: string;
      breakdownCount: number;
      breakdowns: Array<{
        breakdownId: Id<"govtProjectBreakdowns">;
        projectName: string;
        implementingOffice: string;
        allocatedBudget?: number;
        status?: string;
      }>;
    }>;
    errors: string[];
  }> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const errors: string[] = [];

    // Validate source budget item exists
    const sourceBudgetItem = await ctx.db.get(args.sourceBudgetItemId);
    if (!sourceBudgetItem) {
      errors.push(`Source budget item with ID ${args.sourceBudgetItemId} not found`);
    } else if (sourceBudgetItem.isDeleted) {
      errors.push(`Source budget item with ID ${args.sourceBudgetItemId} has been deleted`);
    }

    // Validate target 20% DF exists
    const targetTwentyPercentDF = await ctx.db.get(args.targetTwentyPercentDFId);
    if (!targetTwentyPercentDF) {
      errors.push(`Target 20% DF with ID ${args.targetTwentyPercentDFId} not found`);
    } else if (targetTwentyPercentDF.isDeleted) {
      errors.push(`Target 20% DF with ID ${args.targetTwentyPercentDFId} has been deleted`);
    }

    // If either source or target is invalid, return early
    if (errors.length > 0) {
      return {
        success: false,
        sourceBudgetItem: sourceBudgetItem || null,
        targetTwentyPercentDF: targetTwentyPercentDF || null,
        projectsCount: 0,
        totalBreakdownsCount: 0,
        projectsWithBreakdowns: [],
        errors,
      };
    }

    // Fetch all projects linked to the source budget item (non-deleted only)
    const projects = await ctx.db
      .query("projects")
      .withIndex("budgetItemId", (q) => q.eq("budgetItemId", args.sourceBudgetItemId))
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    // Fetch breakdowns for each project
    const projectsWithBreakdowns: Array<{
      projectId: Id<"projects">;
      projectName: string;
      implementingOffice: string;
      breakdownCount: number;
      breakdowns: Array<{
        breakdownId: Id<"govtProjectBreakdowns">;
        projectName: string;
        implementingOffice: string;
        allocatedBudget?: number;
        status?: string;
      }>;
    }> = [];

    let totalBreakdownsCount = 0;

    for (const project of projects) {
      const breakdowns = await ctx.db
        .query("govtProjectBreakdowns")
        .withIndex("projectId", (q) => q.eq("projectId", project._id))
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .collect();

      const breakdownCount = breakdowns.length;
      totalBreakdownsCount += breakdownCount;

      projectsWithBreakdowns.push({
        projectId: project._id,
        projectName: project.particulars,
        implementingOffice: project.implementingOffice,
        breakdownCount,
        breakdowns: breakdowns.map((b) => ({
          breakdownId: b._id,
          projectName: b.projectName,
          implementingOffice: b.implementingOffice,
          allocatedBudget: b.allocatedBudget,
          status: b.status,
        })),
      });
    }

    return {
      success: true,
      sourceBudgetItem,
      targetTwentyPercentDF,
      projectsCount: projects.length,
      totalBreakdownsCount,
      projectsWithBreakdowns,
      errors,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Migrate data from budgetItems → projects → govtProjectBreakdowns
 * to twentyPercentDF → twentyPercentDFBreakdowns
 */
export const migrateBudgetToTwentyPercentDF = mutation({
  args: {
    sourceBudgetItemId: v.id("budgetItems"),
    targetTwentyPercentDFId: v.id("twentyPercentDF"),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    migratedProjects: number;
    migratedBreakdowns: number;
    details: MigrationDetail[];
    errors: MigrationError[];
  }> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const errors: MigrationError[] = [];
    const details: MigrationDetail[] = [];
    let migratedProjects = 0;
    let migratedBreakdowns = 0;

    // Validate source budget item exists
    const sourceBudgetItem = await ctx.db.get(args.sourceBudgetItemId);
    if (!sourceBudgetItem) {
      throw new Error(`Source budget item with ID ${args.sourceBudgetItemId} not found`);
    }
    if (sourceBudgetItem.isDeleted) {
      throw new Error(`Source budget item with ID ${args.sourceBudgetItemId} has been deleted`);
    }

    // Validate target 20% DF exists
    const targetTwentyPercentDF = await ctx.db.get(args.targetTwentyPercentDFId);
    if (!targetTwentyPercentDF) {
      throw new Error(`Target 20% DF with ID ${args.targetTwentyPercentDFId} not found`);
    }
    if (targetTwentyPercentDF.isDeleted) {
      throw new Error(`Target 20% DF with ID ${args.targetTwentyPercentDFId} has been deleted`);
    }

    // Fetch all projects linked to the source budget item (non-deleted only)
    const projects = await ctx.db
      .query("projects")
      .withIndex("budgetItemId", (q) => q.eq("budgetItemId", args.sourceBudgetItemId))
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    // Process each project and its breakdowns
    for (const project of projects) {
      const detail: MigrationDetail = {
        projectId: project._id,
        projectName: project.particulars,
        breakdownsMigrated: 0,
        breakdownIds: [],
      };

      try {
        // Fetch all non-deleted breakdowns for this project
        const breakdowns = await ctx.db
          .query("govtProjectBreakdowns")
          .withIndex("projectId", (q) => q.eq("projectId", project._id))
          .filter((q) => q.neq(q.field("isDeleted"), true))
          .collect();

        // Migrate each breakdown to twentyPercentDFBreakdowns
        for (const breakdown of breakdowns) {
          try {
            const newBreakdownId = await migrateBreakdown(
              ctx,
              breakdown,
              args.targetTwentyPercentDFId,
              userId
            );

            detail.breakdownIds.push(newBreakdownId);
            detail.breakdownsMigrated++;
            migratedBreakdowns++;

            // Log breakdown creation activity
            await logTwentyPercentDFBreakdownActivity(ctx, userId, {
              action: "created",
              breakdownId: newBreakdownId,
              projectName: breakdown.projectName,
              implementingOffice: breakdown.implementingOffice,
              source: "migration",
              reason: `Migrated from govtProjectBreakdown ${breakdown._id} (project: ${project._id})`,
            });

            // Update implementing agency usage count
            await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
              code: breakdown.implementingOffice,
              usageContext: "breakdown",
              delta: 1,
            });
          } catch (breakdownError) {
            const errorMessage = breakdownError instanceof Error ? breakdownError.message : String(breakdownError);
            errors.push({
              projectId: project._id,
              projectName: project.particulars,
              breakdownId: breakdown._id,
              error: `Failed to migrate breakdown: ${errorMessage}`,
            });
          }
        }

        migratedProjects++;
        details.push(detail);
      } catch (projectError) {
        const errorMessage = projectError instanceof Error ? projectError.message : String(projectError);
        detail.error = errorMessage;
        details.push(detail);
        errors.push({
          projectId: project._id,
          projectName: project.particulars,
          error: `Failed to process project: ${errorMessage}`,
        });
      }
    }

    // Recalculate target 20% DF metrics
    try {
      await recalculateTwentyPercentDFMetrics(ctx, args.targetTwentyPercentDFId, userId);
    } catch (metricsError) {
      const errorMessage = metricsError instanceof Error ? metricsError.message : String(metricsError);
      errors.push({
        error: `Failed to recalculate target metrics: ${errorMessage}`,
      });
    }

    // Log migration activity
    await logTwentyPercentDFActivity(ctx, userId, {
      action: "data_migration",
      twentyPercentDFId: args.targetTwentyPercentDFId,
      previousValues: {
        sourceBudgetItemId: args.sourceBudgetItemId,
        sourceBudgetItemName: sourceBudgetItem.particulars,
      },
      newValues: {
        migratedProjects,
        migratedBreakdowns,
        targetTwentyPercentDFId: args.targetTwentyPercentDFId,
      },
      reason: `Migration from budget item ${args.sourceBudgetItemId} to 20% DF ${args.targetTwentyPercentDFId}`,
    });

    return {
      success: errors.length === 0,
      migratedProjects,
      migratedBreakdowns,
      details,
      errors,
    };
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Migrate a single govtProjectBreakdown to twentyPercentDFBreakdown
 */
async function migrateBreakdown(
  ctx: any,
  sourceBreakdown: Doc<"govtProjectBreakdowns">,
  targetTwentyPercentDFId: Id<"twentyPercentDF">,
  userId: Id<"users">
): Promise<Id<"twentyPercentDFBreakdowns">> {
  const now = Date.now();

  // Map all fields from baseBreakdownSchema
  const newBreakdownData = {
    // Parent reference (target)
    twentyPercentDFId: targetTwentyPercentDFId,

    // Core fields
    projectName: sourceBreakdown.projectName,
    implementingOffice: sourceBreakdown.implementingOffice,
    projectTitle: sourceBreakdown.projectTitle,
    municipality: sourceBreakdown.municipality,
    barangay: sourceBreakdown.barangay,
    district: sourceBreakdown.district,
    remarks: sourceBreakdown.remarks,

    // Financial data
    allocatedBudget: sourceBreakdown.allocatedBudget,
    obligatedBudget: sourceBreakdown.obligatedBudget,
    budgetUtilized: sourceBreakdown.budgetUtilized,
    balance: sourceBreakdown.balance,
    utilizationRate: sourceBreakdown.utilizationRate,
    fundSource: sourceBreakdown.fundSource,

    // Progress tracking
    projectAccomplishment: sourceBreakdown.projectAccomplishment,
    status: sourceBreakdown.status,

    // Timeline
    reportDate: sourceBreakdown.reportDate,
    dateStarted: sourceBreakdown.dateStarted,
    targetDate: sourceBreakdown.targetDate,
    completionDate: sourceBreakdown.completionDate,

    // Soft delete / Trash system (reset for new record)
    isDeleted: false,
    deletedAt: undefined,
    deletedBy: undefined,
    deletionReason: undefined,

    // Metadata & system fields
    batchId: `migration_${now}`,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
    updatedBy: userId,
  };

  const newBreakdownId = await ctx.db.insert("twentyPercentDFBreakdowns", newBreakdownData);

  return newBreakdownId;
}
