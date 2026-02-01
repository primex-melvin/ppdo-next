/**
 * Data Migration Module
 *
 * Handles migration of data from budgetItems → projects → govtProjectBreakdowns
 * to twentyPercentDF → twentyPercentDFBreakdowns (year-based migration)
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
  createdTwentyPercentDFId?: Id<"twentyPercentDF">;
  error?: string;
};

type MigrationError = {
  projectId?: Id<"projects">;
  projectName?: string;
  breakdownId?: Id<"govtProjectBreakdowns">;
  error: string;
};

// ============================================================================
// CONSTANTS
// ============================================================================

const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all fiscal years for dropdown selection
 */
export const getFiscalYears = query({
  args: {},
  handler: async (ctx): Promise<{
    success: boolean;
    years: Array<{
      id: Id<"fiscalYears">;
      year: number;
      label?: string;
      isActive: boolean;
      isCurrent?: boolean;
    }>;
    errors: string[];
  }> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    try {
      const fiscalYears = await ctx.db
        .query("fiscalYears")
        .withIndex("isActive", (q) => q.eq("isActive", true))
        .order("desc")
        .collect();

      return {
        success: true,
        years: fiscalYears.map((fy) => ({
          id: fy._id,
          year: fy.year,
          label: fy.label,
          isActive: fy.isActive,
          isCurrent: fy.isCurrent,
        })),
        errors: [],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        years: [],
        errors: [`Failed to fetch fiscal years: ${errorMessage}`],
      };
    }
  },
});

/**
 * Get a preview of migration data before executing
 * Shows source budget item, target year, and breakdowns to be migrated
 */
export const getMigrationPreview = query({
  args: {
    sourceBudgetItemId: v.id("budgetItems"),
    targetYear: v.number(),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    sourceBudgetItem: Doc<"budgetItems"> | null;
    targetYear: number;
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

    // Validate target year is reasonable
    if (args.targetYear < MIN_YEAR || args.targetYear > MAX_YEAR) {
      errors.push(`Target year must be between ${MIN_YEAR} and ${MAX_YEAR}`);
    }

    // Validate source budget item exists
    const sourceBudgetItem = await ctx.db.get(args.sourceBudgetItemId);
    if (!sourceBudgetItem) {
      errors.push(`Source budget item with ID ${args.sourceBudgetItemId} not found`);
    } else if (sourceBudgetItem.isDeleted) {
      errors.push(`Source budget item with ID ${args.sourceBudgetItemId} has been deleted`);
    }

    // If validation failed, return early
    if (errors.length > 0) {
      return {
        success: false,
        sourceBudgetItem: sourceBudgetItem || null,
        targetYear: args.targetYear,
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
      targetYear: args.targetYear,
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
 * to twentyPercentDF → twentyPercentDFBreakdowns (year-based)
 * 
 * For each project, creates a new twentyPercentDF item for the target year,
 * then migrates all breakdowns to link to the newly created items.
 */
export const migrateBudgetToTwentyPercentDF = mutation({
  args: {
    sourceBudgetItemId: v.id("budgetItems"),
    targetYear: v.number(),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    targetYear: number;
    migratedProjects: number;
    migratedBreakdowns: number;
    createdTwentyPercentDFItems: Array<{
      id: Id<"twentyPercentDF">;
      particulars: string;
      implementingOffice: string;
    }>;
    errors: Array<{
      projectId?: string;
      projectName?: string;
      breakdownId?: string;
      error: string;
    }>;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const errors: Array<{
      projectId?: string;
      projectName?: string;
      breakdownId?: string;
      error: string;
    }> = [];
    const createdTwentyPercentDFItems: Array<{
      id: Id<"twentyPercentDF">;
      particulars: string;
      implementingOffice: string;
    }> = [];
    
    let migratedProjects = 0;
    let migratedBreakdowns = 0;

    // Validate target year
    if (args.targetYear < MIN_YEAR || args.targetYear > MAX_YEAR) {
      throw new Error(`Target year must be between ${MIN_YEAR} and ${MAX_YEAR}`);
    }

    // Validate source budget item exists
    const sourceBudgetItem = await ctx.db.get(args.sourceBudgetItemId);
    if (!sourceBudgetItem) {
      throw new Error(`Source budget item with ID ${args.sourceBudgetItemId} not found`);
    }
    if (sourceBudgetItem.isDeleted) {
      throw new Error(`Source budget item with ID ${args.sourceBudgetItemId} has been deleted`);
    }

    // Fetch all projects linked to the source budget item (non-deleted only)
    const projects = await ctx.db
      .query("projects")
      .withIndex("budgetItemId", (q) => q.eq("budgetItemId", args.sourceBudgetItemId))
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    // Map to track projectId -> newly created twentyPercentDFId
    const projectToTwentyPercentDFMap = new Map<Id<"projects">, Id<"twentyPercentDF">>();

    // Step 1: Create twentyPercentDF items for each project
    for (const project of projects) {
      try {
        const newTwentyPercentDFId = await createTwentyPercentDFFromProject(
          ctx,
          project,
          args.targetYear,
          userId
        );

        projectToTwentyPercentDFMap.set(project._id, newTwentyPercentDFId);
        createdTwentyPercentDFItems.push({
          id: newTwentyPercentDFId,
          particulars: project.particulars,
          implementingOffice: project.implementingOffice,
        });

        // Log creation activity
        await logTwentyPercentDFActivity(ctx, userId, {
          action: "created",
          twentyPercentDFId: newTwentyPercentDFId,
          newValues: {
            particulars: project.particulars,
            implementingOffice: project.implementingOffice,
            year: args.targetYear,
            sourceProjectId: project._id,
          },
          reason: `Created from project during migration to year ${args.targetYear}`,
        });
      } catch (createError) {
        const errorMessage = createError instanceof Error ? createError.message : String(createError);
        errors.push({
          projectId: project._id,
          projectName: project.particulars,
          error: `Failed to create twentyPercentDF from project: ${errorMessage}`,
        });
      }
    }

    // Step 2: Migrate breakdowns for each project
    for (const project of projects) {
      const targetTwentyPercentDFId = projectToTwentyPercentDFMap.get(project._id);
      
      // Skip if we failed to create the twentyPercentDF item for this project
      if (!targetTwentyPercentDFId) {
        continue;
      }

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
              targetTwentyPercentDFId,
              userId
            );

            migratedBreakdowns++;

            // Log breakdown creation activity
            await logTwentyPercentDFBreakdownActivity(ctx, userId, {
              action: "created",
              breakdownId: newBreakdownId,
              projectName: breakdown.projectName,
              implementingOffice: breakdown.implementingOffice,
              source: "migration",
              reason: `Migrated from govtProjectBreakdown ${breakdown._id} (project: ${project._id}) to twentyPercentDF ${targetTwentyPercentDFId}`,
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

        // Recalculate metrics for the newly created twentyPercentDF item
        try {
          await recalculateTwentyPercentDFMetrics(ctx, targetTwentyPercentDFId, userId);
        } catch (metricsError) {
          const errorMessage = metricsError instanceof Error ? metricsError.message : String(metricsError);
          errors.push({
            projectId: project._id,
            projectName: project.particulars,
            error: `Failed to recalculate metrics: ${errorMessage}`,
          });
        }

        migratedProjects++;
      } catch (projectError) {
        const errorMessage = projectError instanceof Error ? projectError.message : String(projectError);
        errors.push({
          projectId: project._id,
          projectName: project.particulars,
          error: `Failed to process project: ${errorMessage}`,
        });
      }
    }

    return {
      success: errors.length === 0,
      targetYear: args.targetYear,
      migratedProjects,
      migratedBreakdowns,
      createdTwentyPercentDFItems,
      errors,
    };
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a new twentyPercentDF item from a project
 * Copies all fields from the project and sets year to targetYear
 */
async function createTwentyPercentDFFromProject(
  ctx: any,
  project: Doc<"projects">,
  targetYear: number,
  userId: Id<"users">
): Promise<Id<"twentyPercentDF">> {
  const now = Date.now();

  // Copy all fields from project to twentyPercentDF
  // Note: projectsOngoing is optional in projects but required in twentyPercentDF
  const twentyPercentDFData = {
    // Project identification
    particulars: project.particulars,
    implementingOffice: project.implementingOffice,
    departmentId: project.departmentId,
    categoryId: project.categoryId,
    // budgetItemId is intentionally left undefined to break link with old budget

    // Financial data
    totalBudgetAllocated: project.totalBudgetAllocated,
    obligatedBudget: project.obligatedBudget,
    totalBudgetUtilized: project.totalBudgetUtilized,
    utilizationRate: project.utilizationRate,
    autoCalculateBudgetUtilized: project.autoCalculateBudgetUtilized,

    // Metrics
    projectCompleted: project.projectCompleted,
    projectDelayed: project.projectDelayed,
    // projectsOngoing: use project's value or default to 0
    projectsOngoing: project.projectsOngoing ?? 0,

    // Additional fields
    remarks: project.remarks,
    year: targetYear, // Set to target year
    status: project.status,
    targetDateCompletion: project.targetDateCompletion,
    projectManagerId: project.projectManagerId,

    // Pin functionality (reset for new record)
    isPinned: false,
    pinnedAt: undefined,
    pinnedBy: undefined,

    // Trash system (reset for new record)
    isDeleted: false,
    deletedAt: undefined,
    deletedBy: undefined,

    // System fields
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
    updatedBy: userId,
  };

  const newTwentyPercentDFId = await ctx.db.insert("twentyPercentDF", twentyPercentDFData);

  return newTwentyPercentDFId;
}

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
