// convex/trash.ts
// 🗑️ TRASH SYSTEM UPGRADE - Complete cascade preview and restore functionality

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { recalculateBudgetItemMetrics } from "./lib/budgetAggregation";
import { recalculateProjectMetrics } from "./lib/projectAggregation";
import { logBudgetActivity } from "./lib/budgetActivityLogger";
import { logProjectActivity } from "./lib/projectActivityLogger";
import { logGovtProjectActivity } from "./lib/govtProjectActivityLogger";
import {
  syncBudgetItemSearchIndex,
  syncProjectBreakdownSearchIndex,
  syncProjectSearchIndex,
} from "./lib/searchIndexSync";

// =============================================================================
// TYPES (for reference - actual types inferred from return values)
// =============================================================================

type EntityType = "budgetItem" | "project" | "breakdown";

interface TrashPreviewResult {
  targetItem: {
    id: string;
    name: string;
    type: EntityType;
  };
  cascadeCounts: {
    projects: number;
    breakdowns: number;
    inspections: number;
    totalFinancialImpact: {
      allocated: number;
      utilized: number;
      obligated: number;
    };
  };
  affectedItems: {
    projects: Array<{
      id: string;
      name: string;
      type: "project";
      financials: { allocated: number; utilized: number; obligated?: number };
    }>;
    breakdowns: Array<{
      id: string;
      name: string;
      type: "breakdown";
      parentId: string;
      financials: { allocated?: number; utilized?: number };
    }>;
  };
  warnings: string[];
  canDelete: boolean;
}

interface RestorePreviewResult {
  targetItem: {
    id: string;
    name: string;
    type: EntityType;
  };
  cascadeRestoreCounts: {
    projects: number;
    breakdowns: number;
  };
  parentStatus: {
    parentId?: string;
    parentName?: string;
    parentType?: "budgetItem" | "project";
    isParentDeleted: boolean;
  };
  warnings: string[];
  canRestore: boolean;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Count inspections for a project
 */
async function countInspectionsForProject(
  ctx: any,
  projectId: Id<"projects">
): Promise<number> {
  const inspections = await ctx.db
    .query("inspections")
    .withIndex("projectId", (q: any) => q.eq("projectId", projectId))
    .collect();
  return inspections.length;
}

/**
 * Get all non-deleted projects for a budget item
 */
async function getActiveProjectsForBudgetItem(
  ctx: any,
  budgetItemId: Id<"budgetItems">
) {
  return await ctx.db
    .query("projects")
    .withIndex("budgetItemId", (q: any) => q.eq("budgetItemId", budgetItemId))
    .filter((q: any) => q.neq(q.field("isDeleted"), true))
    .collect();
}

/**
 * Get all non-deleted breakdowns for a project
 */
async function getActiveBreakdownsForProject(
  ctx: any,
  projectId: Id<"projects">
) {
  return await ctx.db
    .query("govtProjectBreakdowns")
    .withIndex("projectId", (q: any) => q.eq("projectId", projectId))
    .filter((q: any) => q.neq(q.field("isDeleted"), true))
    .collect();
}

/**
 * Get all deleted projects for a budget item
 */
async function getDeletedProjectsForBudgetItem(
  ctx: any,
  budgetItemId: Id<"budgetItems">
) {
  return await ctx.db
    .query("projects")
    .withIndex("budgetItemId", (q: any) => q.eq("budgetItemId", budgetItemId))
    .filter((q: any) => q.eq(q.field("isDeleted"), true))
    .collect();
}

/**
 * Get all deleted breakdowns for a project
 */
async function getDeletedBreakdownsForProject(
  ctx: any,
  projectId: Id<"projects">
) {
  return await ctx.db
    .query("govtProjectBreakdowns")
    .withIndex("projectId", (q: any) => q.eq("projectId", projectId))
    .filter((q: any) => q.eq(q.field("isDeleted"), true))
    .collect();
}

// =============================================================================
// GET TRASH PREVIEW QUERY
// =============================================================================

/**
 * Get trash preview - Returns cascade impact before trashing an item
 */
export const getTrashPreview = query({
  args: {
    entityType: v.union(
      v.literal("budgetItem"),
      v.literal("project"),
      v.literal("breakdown")
    ),
    entityId: v.optional(v.string()),
    entityIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args): Promise<TrashPreviewResult> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { entityType, entityId, entityIds } = args;
    
    // Handle bulk preview for multiple entities
    if (entityIds && entityIds.length > 0) {
      if (entityType === "project") {
        return await getBulkProjectTrashPreview(ctx, entityIds);
      }
      throw new Error(`Bulk preview not supported for entity type: ${entityType}`);
    }
    
    if (!entityId) {
      throw new Error("Either entityId or entityIds must be provided");
    }
    
    const warnings: string[] = [];

    // Handle budgetItem preview
    if (entityType === "budgetItem") {
      const budgetItem = await ctx.db.get(entityId as Id<"budgetItems">);
      if (!budgetItem) throw new Error("Budget item not found");

      // Get all active projects
      const projects = await getActiveProjectsForBudgetItem(
        ctx,
        entityId as Id<"budgetItems">
      );

      // Collect all breakdowns and inspections
      let allBreakdowns: any[] = [];
      let totalInspections = 0;
      const projectFinancials: Array<{
        id: string;
        name: string;
        type: "project";
        financials: { allocated: number; utilized: number; obligated?: number };
      }> = [];

      for (const project of projects) {
        const breakdowns = await getActiveBreakdownsForProject(ctx, project._id);
        allBreakdowns = allBreakdowns.concat(breakdowns);

        const inspectionCount = await countInspectionsForProject(ctx, project._id);
        totalInspections += inspectionCount;

        projectFinancials.push({
          id: project._id,
          name: project.particulars,
          type: "project",
          financials: {
            allocated: project.totalBudgetAllocated || 0,
            utilized: project.totalBudgetUtilized || 0,
            obligated: project.obligatedBudget || 0,
          },
        });
      }

      // Calculate financial totals
      const totalFinancialImpact = {
        allocated: projects.reduce((sum: number, p: any) => sum + (p.totalBudgetAllocated || 0), 0),
        utilized: projects.reduce((sum: number, p: any) => sum + (p.totalBudgetUtilized || 0), 0),
        obligated: projects.reduce((sum: number, p: any) => sum + (p.obligatedBudget || 0), 0),
      };

      // Build breakdowns list
      const breakdownItems = allBreakdowns.map((b) => ({
        id: b._id,
        name: b.projectName,
        type: "breakdown" as const,
        parentId: b.projectId || "unknown",
        financials: {
          allocated: b.allocatedBudget,
          utilized: b.budgetUtilized,
        },
      }));

      // Generate warnings
      if (projects.length > 0) {
        warnings.push(
          `This budget item has ${projects.length} project(s) that will be moved to trash`
        );
      }
      if (allBreakdowns.length > 0) {
        warnings.push(
          `${allBreakdowns.length} breakdown(s) will also be moved to trash`
        );
      }
      if (totalInspections > 0) {
        warnings.push(
          `This budget item has ${totalInspections} inspection(s) that will remain active`
        );
      }
      if (totalFinancialImpact.allocated > 0) {
        warnings.push(
          `Total allocated budget impact: ₱${totalFinancialImpact.allocated.toLocaleString()}`
        );
      }

      return {
        targetItem: {
          id: entityId,
          name: budgetItem.particulars,
          type: "budgetItem",
        },
        cascadeCounts: {
          projects: projects.length,
          breakdowns: allBreakdowns.length,
          inspections: totalInspections,
          totalFinancialImpact,
        },
        affectedItems: {
          projects: projectFinancials,
          breakdowns: breakdownItems,
        },
        warnings,
        canDelete: true,
      };
    }

    // Handle project preview
    if (entityType === "project") {
      const project = await ctx.db.get(entityId as Id<"projects">);
      if (!project) throw new Error("Project not found");

      // Get breakdowns
      const breakdowns = await getActiveBreakdownsForProject(
        ctx,
        entityId as Id<"projects">
      );

      // Count inspections
      const inspectionCount = await countInspectionsForProject(
        ctx,
        entityId as Id<"projects">
      );

      // Calculate financials
      const totalFinancialImpact = {
        allocated: project.totalBudgetAllocated || 0,
        utilized: project.totalBudgetUtilized || 0,
        obligated: project.obligatedBudget || 0,
      };

      // Build breakdowns list
      const breakdownItems = breakdowns.map((b: any) => ({
        id: b._id,
        name: b.projectName,
        type: "breakdown" as const,
        parentId: entityId,
        financials: {
          allocated: b.allocatedBudget,
          utilized: b.budgetUtilized,
        },
      }));

      // Generate warnings
      if (breakdowns.length > 0) {
        warnings.push(
          `This project has ${breakdowns.length} breakdown(s) that will be moved to trash`
        );
      }
      if (inspectionCount > 0) {
        warnings.push(
          `This project has ${inspectionCount} inspection(s) that will remain active`
        );
      }
      if (totalFinancialImpact.allocated > 0) {
        warnings.push(
          `Total allocated budget impact: ₱${totalFinancialImpact.allocated.toLocaleString()}`
        );
      }

      return {
        targetItem: {
          id: entityId,
          name: project.particulars,
          type: "project",
        },
        cascadeCounts: {
          projects: 0, // Self not counted
          breakdowns: breakdowns.length,
          inspections: inspectionCount,
          totalFinancialImpact,
        },
        affectedItems: {
          projects: [],
          breakdowns: breakdownItems,
        },
        warnings,
        canDelete: true,
      };
    }

    // Handle breakdown preview
    if (entityType === "breakdown") {
      const breakdown = await ctx.db.get(entityId as Id<"govtProjectBreakdowns">);
      if (!breakdown) throw new Error("Breakdown not found");

      const totalFinancialImpact = {
        allocated: breakdown.allocatedBudget || 0,
        utilized: breakdown.budgetUtilized || 0,
        obligated: breakdown.obligatedBudget || 0,
      };

      // Generate warning for breakdown with budget
      if (totalFinancialImpact.allocated > 0) {
        warnings.push(
          `Breakdown has allocated budget of ₱${totalFinancialImpact.allocated.toLocaleString()}`
        );
      }

      return {
        targetItem: {
          id: entityId,
          name: breakdown.projectName,
          type: "breakdown",
        },
        cascadeCounts: {
          projects: 0,
          breakdowns: 0, // No children
          inspections: 0,
          totalFinancialImpact,
        },
        affectedItems: {
          projects: [],
          breakdowns: [],
        },
        warnings,
        canDelete: true,
      };
    }

    throw new Error(`Invalid entity type: ${entityType}`);
  },
});

// =============================================================================
// MOVE TO TRASH WITH CONFIRMATION MUTATION
// =============================================================================

/**
 * Move to trash with confirmation - Executes trash with confirmation flag
 */
export const moveToTrashWithConfirmation = mutation({
  args: {
    entityType: v.union(
      v.literal("budgetItem"),
      v.literal("project"),
      v.literal("breakdown")
    ),
    entityId: v.string(),
    reason: v.optional(v.string()),
    confirmedCascade: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { entityType, entityId, reason, confirmedCascade } = args;

    // Must confirm cascade preview
    if (!confirmedCascade) {
      throw new Error("Must confirm cascade preview");
    }

    const now = Date.now();

    // Handle budgetItem trash
    if (entityType === "budgetItem") {
      const existing = await ctx.db.get(entityId as Id<"budgetItems">);
      if (!existing) throw new Error("Budget item not found");

      // 1. Trash Budget Item
      await ctx.db.patch(entityId as Id<"budgetItems">, {
        isDeleted: true,
        deletedAt: now,
        deletedBy: userId,
        updatedAt: now,
        updatedBy: userId,
      });

      // 2. Trash Linked Projects (Cascade)
      const projects = await ctx.db
        .query("projects")
        .withIndex("budgetItemId", (q) => q.eq("budgetItemId", entityId as Id<"budgetItems">))
        .collect();

      for (const project of projects) {
        await ctx.db.patch(project._id, {
          isDeleted: true,
          deletedAt: now,
          deletedBy: userId,
        });
        await syncProjectSearchIndex(ctx, project, { isDeleted: true });

        // 3. Trash Linked Breakdowns (Deep Cascade)
        const breakdowns = await ctx.db
          .query("govtProjectBreakdowns")
          .withIndex("projectId", (q) => q.eq("projectId", project._id))
          .collect();

        for (const breakdown of breakdowns) {
          await ctx.db.patch(breakdown._id, {
            isDeleted: true,
            deletedAt: now,
            deletedBy: userId,
          });
          await syncProjectBreakdownSearchIndex(ctx, breakdown, { isDeleted: true });
        }
      }

      // Update usage count for the particular
      await ctx.runMutation(internal.budgetParticulars.updateUsageCount, {
        code: existing.particulars,
        type: "budget" as const,
        delta: -1,
      });

      // Log Activity
      await logBudgetActivity(ctx, userId, {
        action: "updated",
        budgetItemId: entityId as Id<"budgetItems">,
        previousValues: existing,
        newValues: { ...existing, isDeleted: true },
        reason: reason || "Moved to trash (Cascaded to children)",
      });

      await syncBudgetItemSearchIndex(ctx, existing, { isDeleted: true });

      return { success: true, message: "Moved to trash" };
    }

    // Handle project trash
    if (entityType === "project") {
      const existing = await ctx.db.get(entityId as Id<"projects">);
      if (!existing) throw new Error("Project not found");

      // 1. Trash Project
      await ctx.db.patch(entityId as Id<"projects">, {
        isDeleted: true,
        deletedAt: now,
        deletedBy: userId,
        updatedAt: now,
        updatedBy: userId,
      });

      // 2. Trash Linked Breakdowns (Cascade)
      const breakdowns = await ctx.db
        .query("govtProjectBreakdowns")
        .withIndex("projectId", (q) => q.eq("projectId", entityId as Id<"projects">))
        .collect();

      for (const breakdown of breakdowns) {
        await ctx.db.patch(breakdown._id, {
          isDeleted: true,
          deletedAt: now,
          deletedBy: userId,
        });
        await syncProjectBreakdownSearchIndex(ctx, breakdown, { isDeleted: true });
      }

      // Update usage counts
      await ctx.runMutation(internal.projectParticulars.updateUsageCount, {
        code: existing.particulars,
        delta: -1,
      });
      await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
        code: existing.implementingOffice,
        usageContext: "project",
        delta: -1,
      });
      if (existing.categoryId) {
        await ctx.runMutation(internal.projectCategories.updateUsageCount, {
          categoryId: existing.categoryId,
          delta: -1,
        });
      }

      // Recalculate Parent Budget
      if (existing.budgetItemId) {
        await recalculateBudgetItemMetrics(ctx, existing.budgetItemId, userId);
      }

      // Log Activity
      await logProjectActivity(ctx, userId, {
        action: "updated",
        projectId: entityId as Id<"projects">,
        previousValues: existing,
        newValues: { ...existing, isDeleted: true },
        reason: reason || "Moved to trash",
      });

      await syncProjectSearchIndex(ctx, existing, { isDeleted: true });

      return { success: true, message: "Project moved to trash" };
    }

    // Handle breakdown trash
    if (entityType === "breakdown") {
      const breakdown = await ctx.db.get(entityId as Id<"govtProjectBreakdowns">);
      if (!breakdown) throw new Error("Breakdown not found");

      // Trash Breakdown
      await ctx.db.patch(entityId as Id<"govtProjectBreakdowns">, {
        isDeleted: true,
        deletedAt: now,
        deletedBy: userId,
        updatedAt: now,
        updatedBy: userId,
      });
      await syncProjectBreakdownSearchIndex(ctx, breakdown, { isDeleted: true });

      // Recalculate Parent Project
      if (breakdown.projectId) {
        await recalculateProjectMetrics(ctx, breakdown.projectId, userId);
      }

      // Log Activity
      await logGovtProjectActivity(ctx, userId, {
        action: "updated",
        breakdownId: entityId as Id<"govtProjectBreakdowns">,
        breakdown: breakdown,
        previousValues: breakdown,
        newValues: { ...breakdown, isDeleted: true },
        source: "web_ui",
        reason: reason || "Moved to trash",
      });

      return { success: true, message: "Breakdown moved to trash" };
    }

    throw new Error(`Invalid entity type: ${entityType}`);
  },
});

// =============================================================================
// BULK TRASH PREVIEW HELPER
// =============================================================================

/**
 * Helper function to get trash preview for multiple projects (bulk operation)
 */
async function getBulkProjectTrashPreview(
  ctx: any,
  projectIds: string[]
): Promise<TrashPreviewResult> {
  const warnings: string[] = [];
  let totalBreakdowns = 0;
  let totalInspections = 0;
  let totalAllocated = 0;
  let totalUtilized = 0;
  let totalObligated = 0;

  const projectItems: Array<{
    id: string;
    name: string;
    type: "project";
    financials: { allocated: number; utilized: number; obligated?: number };
  }> = [];
  const breakdownItems: Array<{
    id: string;
    name: string;
    type: "breakdown";
    parentId: string;
    financials: { allocated?: number; utilized?: number };
  }> = [];

  // Fetch all projects
  for (const projectId of projectIds) {
    const project = await ctx.db.get(projectId as Id<"projects">);
    if (!project || project.isDeleted) continue;

    const breakdowns = await getActiveBreakdownsForProject(ctx, projectId as Id<"projects">);
    const inspectionCount = await countInspectionsForProject(ctx, projectId as Id<"projects">);

    totalBreakdowns += breakdowns.length;
    totalInspections += inspectionCount;
    totalAllocated += project.totalBudgetAllocated || 0;
    totalUtilized += project.totalBudgetUtilized || 0;
    totalObligated += project.obligatedBudget || 0;

    projectItems.push({
      id: projectId,
      name: project.particulars,
      type: "project",
      financials: {
        allocated: project.totalBudgetAllocated || 0,
        utilized: project.totalBudgetUtilized || 0,
        obligated: project.obligatedBudget || 0,
      },
    });

    for (const b of breakdowns) {
      breakdownItems.push({
        id: b._id,
        name: b.projectName,
        type: "breakdown",
        parentId: projectId,
        financials: {
          allocated: b.allocatedBudget,
          utilized: b.budgetUtilized,
        },
      });
    }
  }

  // Generate warnings
  if (projectIds.length > 1) {
    warnings.push(`This will move ${projectIds.length} projects to trash`);
  }
  if (totalBreakdowns > 0) {
    warnings.push(`Total ${totalBreakdowns} breakdown(s) will be moved to trash`);
  }
  if (totalInspections > 0) {
    warnings.push(`${totalInspections} inspection(s) will remain active`);
  }
  if (totalAllocated > 0) {
    warnings.push(`Total allocated budget impact: ₱${totalAllocated.toLocaleString()}`);
  }

  return {
    targetItem: {
      id: projectIds[0],
      name: `${projectIds.length} Projects`,
      type: "project",
    },
    cascadeCounts: {
      projects: projectItems.length,
      breakdowns: totalBreakdowns,
      inspections: totalInspections,
      totalFinancialImpact: {
        allocated: totalAllocated,
        utilized: totalUtilized,
        obligated: totalObligated,
      },
    },
    affectedItems: {
      projects: projectItems,
      breakdowns: breakdownItems,
    },
    warnings,
    canDelete: true,
  };
}

// =============================================================================
// GET RESTORE PREVIEW QUERY
// =============================================================================

/**
 * Get restore preview - Returns restore preview with orphan warnings
 */
export const getRestorePreview = query({
  args: {
    entityType: v.union(
      v.literal("budgetItem"),
      v.literal("project"),
      v.literal("breakdown")
    ),
    entityId: v.string(),
  },
  handler: async (ctx, args): Promise<RestorePreviewResult> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { entityType, entityId } = args;
    const warnings: string[] = [];

    // Handle budgetItem restore preview
    if (entityType === "budgetItem") {
      const budgetItem = await ctx.db.get(entityId as Id<"budgetItems">);
      if (!budgetItem) throw new Error("Budget item not found");

      // Find all deleted projects with this budgetItemId
      const deletedProjects = await getDeletedProjectsForBudgetItem(
        ctx,
        entityId as Id<"budgetItems">
      );

      // For each deleted project, find deleted breakdowns
      let deletedBreakdownCount = 0;
      for (const project of deletedProjects) {
        const breakdowns = await getDeletedBreakdownsForProject(ctx, project._id);
        deletedBreakdownCount += breakdowns.length;
      }

      return {
        targetItem: {
          id: entityId,
          name: budgetItem.particulars,
          type: "budgetItem",
        },
        cascadeRestoreCounts: {
          projects: deletedProjects.length,
          breakdowns: deletedBreakdownCount,
        },
        parentStatus: {
          isParentDeleted: false, // Budget items are top-level
        },
        warnings,
        canRestore: true,
      };
    }

    // Handle project restore preview
    if (entityType === "project") {
      const project = await ctx.db.get(entityId as Id<"projects">);
      if (!project) throw new Error("Project not found");

      // Check if parent budgetItem is deleted
      let parentStatus: RestorePreviewResult["parentStatus"] = {
        isParentDeleted: false,
      };

      if (project.budgetItemId) {
        const budgetItem = await ctx.db.get(project.budgetItemId);
        if (budgetItem) {
          parentStatus = {
            parentId: project.budgetItemId,
            parentName: budgetItem.particulars,
            parentType: "budgetItem",
            isParentDeleted: budgetItem.isDeleted === true,
          };

          if (budgetItem.isDeleted) {
            warnings.push(
              `Parent budget item "${budgetItem.particulars}" is deleted - project will be orphaned`
            );
          }
        }
      }

      // Find all deleted breakdowns with this projectId
      const deletedBreakdowns = await getDeletedBreakdownsForProject(
        ctx,
        entityId as Id<"projects">
      );

      return {
        targetItem: {
          id: entityId,
          name: project.particulars,
          type: "project",
        },
        cascadeRestoreCounts: {
          projects: 0,
          breakdowns: deletedBreakdowns.length,
        },
        parentStatus,
        warnings,
        canRestore: true,
      };
    }

    // Handle breakdown restore preview
    if (entityType === "breakdown") {
      const breakdown = await ctx.db.get(entityId as Id<"govtProjectBreakdowns">);
      if (!breakdown) throw new Error("Breakdown not found");

      // Check if parent project is deleted
      let parentStatus: RestorePreviewResult["parentStatus"] = {
        isParentDeleted: false,
      };

      if (breakdown.projectId) {
        const parentProject = await ctx.db.get(breakdown.projectId);
        if (parentProject) {
          parentStatus = {
            parentId: breakdown.projectId,
            parentName: parentProject.particulars,
            parentType: "project",
            isParentDeleted: parentProject.isDeleted === true,
          };

          if (parentProject.isDeleted) {
            warnings.push(
              `Parent project "${parentProject.particulars}" is deleted - breakdown will be orphaned`
            );
          }
        }
      }

      return {
        targetItem: {
          id: entityId,
          name: breakdown.projectName,
          type: "breakdown",
        },
        cascadeRestoreCounts: {
          projects: 0,
          breakdowns: 0,
        },
        parentStatus,
        warnings,
        canRestore: true,
      };
    }

    throw new Error(`Invalid entity type: ${entityType}`);
  },
});

// =============================================================================
// RESTORE FROM TRASH WITH CONFIRMATION MUTATION
// =============================================================================

/**
 * Restore from trash with confirmation - Executes restore with confirmation
 */
export const restoreFromTrashWithConfirmation = mutation({
  args: {
    entityType: v.union(
      v.literal("budgetItem"),
      v.literal("project"),
      v.literal("breakdown")
    ),
    entityId: v.string(),
    reason: v.optional(v.string()),
    confirmedCascade: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { entityType, entityId, reason, confirmedCascade } = args;

    // Must confirm cascade preview
    if (!confirmedCascade) {
      throw new Error("Must confirm cascade preview");
    }

    const now = Date.now();

    // Handle budgetItem restore
    if (entityType === "budgetItem") {
      const existing = await ctx.db.get(entityId as Id<"budgetItems">);
      if (!existing) throw new Error("Budget item not found");

      // 1. Restore Budget Item
      await ctx.db.patch(entityId as Id<"budgetItems">, {
        isDeleted: false,
        deletedAt: undefined,
        deletedBy: undefined,
        updatedAt: now,
      });

      // 2. Restore Linked Projects
      const projects = await ctx.db
        .query("projects")
        .withIndex("budgetItemId", (q) => q.eq("budgetItemId", entityId as Id<"budgetItems">))
        .collect();

      for (const project of projects) {
        if (project.isDeleted) {
          await ctx.db.patch(project._id, {
            isDeleted: false,
            deletedAt: undefined,
            deletedBy: undefined,
          });
          await syncProjectSearchIndex(ctx, project, { isDeleted: false });

          // 3. Restore Linked Breakdowns
          const breakdowns = await ctx.db
            .query("govtProjectBreakdowns")
            .withIndex("projectId", (q) => q.eq("projectId", project._id))
            .collect();

          for (const breakdown of breakdowns) {
            if (breakdown.isDeleted) {
              await ctx.db.patch(breakdown._id, {
                isDeleted: false,
                deletedAt: undefined,
                deletedBy: undefined,
              });
              await syncProjectBreakdownSearchIndex(ctx, breakdown, { isDeleted: false });
            }
          }
        }
      }

      // Update usage count for the particular
      await ctx.runMutation(internal.budgetParticulars.updateUsageCount, {
        code: existing.particulars,
        type: "budget" as const,
        delta: 1,
      });

      // Recalculate metrics immediately to ensure data is fresh
      await recalculateBudgetItemMetrics(ctx, entityId as Id<"budgetItems">, userId);

      await syncBudgetItemSearchIndex(ctx, existing, { isDeleted: false });

      return { success: true, message: "Restored from trash" };
    }

    // Handle project restore
    if (entityType === "project") {
      const existing = await ctx.db.get(entityId as Id<"projects">);
      if (!existing) throw new Error("Project not found");

      // 1. Restore Project
      await ctx.db.patch(entityId as Id<"projects">, {
        isDeleted: false,
        deletedAt: undefined,
        deletedBy: undefined,
        updatedAt: now,
      });

      // 2. Restore Breakdowns
      const breakdowns = await ctx.db
        .query("govtProjectBreakdowns")
        .withIndex("projectId", (q) => q.eq("projectId", entityId as Id<"projects">))
        .collect();

      for (const breakdown of breakdowns) {
        if (breakdown.isDeleted) {
          await ctx.db.patch(breakdown._id, {
            isDeleted: false,
            deletedAt: undefined,
            deletedBy: undefined,
          });
          await syncProjectBreakdownSearchIndex(ctx, breakdown, { isDeleted: false });
        }
      }

      // Update usage counts
      await ctx.runMutation(internal.projectParticulars.updateUsageCount, {
        code: existing.particulars,
        delta: 1,
      });
      await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
        code: existing.implementingOffice,
        usageContext: "project",
        delta: 1,
      });
      if (existing.categoryId) {
        await ctx.runMutation(internal.projectCategories.updateUsageCount, {
          categoryId: existing.categoryId,
          delta: 1,
        });
      }

      // Recalculate Parent Budget Item (only if not deleted)
      if (existing.budgetItemId) {
        const budgetItem = await ctx.db.get(existing.budgetItemId);
        if (budgetItem && !budgetItem.isDeleted) {
          await recalculateBudgetItemMetrics(ctx, existing.budgetItemId, userId);
        }
      }

      // Recalculate the project itself
      await recalculateProjectMetrics(ctx, entityId as Id<"projects">, userId);

      await syncProjectSearchIndex(ctx, existing, { isDeleted: false });

      return { success: true, message: "Project restored" };
    }

    // Handle breakdown restore
    if (entityType === "breakdown") {
      const breakdown = await ctx.db.get(entityId as Id<"govtProjectBreakdowns">);
      if (!breakdown) throw new Error("Breakdown not found");

      // Restore Breakdown
      await ctx.db.patch(entityId as Id<"govtProjectBreakdowns">, {
        isDeleted: false,
        deletedAt: undefined,
        deletedBy: undefined,
        updatedAt: now,
      });
      await syncProjectBreakdownSearchIndex(ctx, breakdown, { isDeleted: false });

      // Recalculate Parent Project
      if (breakdown.projectId) {
        await recalculateProjectMetrics(ctx, breakdown.projectId, userId);
      }

      return { success: true, message: "Breakdown restored" };
    }

    throw new Error(`Invalid entity type: ${entityType}`);
  },
});

// =============================================================================
// ADDITIONAL UTILITY QUERIES
// =============================================================================

/**
 * Get all trashed items across all entity types (for admin trash bin)
 */
export const getAllTrash = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      throw new Error("Unauthorized: Only admins can view all trash");
    }

    const limit = args.limit || 100;

    // Get trashed budget items
    const budgetItems = await ctx.db
      .query("budgetItems")
      .withIndex("isDeleted", (q) => q.eq("isDeleted", true))
      .order("desc")
      .take(limit);

    // Get trashed projects
    const projects = await ctx.db
      .query("projects")
      .withIndex("isDeleted", (q) => q.eq("isDeleted", true))
      .order("desc")
      .take(limit);

    // Get trashed breakdowns
    const breakdowns = await ctx.db
      .query("govtProjectBreakdowns")
      .withIndex("isDeleted", (q) => q.eq("isDeleted", true))
      .order("desc")
      .take(limit);

    return {
      budgetItems: budgetItems.map((item) => ({
        id: item._id,
        name: item.particulars,
        type: "budgetItem" as const,
        deletedAt: item.deletedAt,
      })),
      projects: projects.map((item) => ({
        id: item._id,
        name: item.particulars,
        type: "project" as const,
        deletedAt: item.deletedAt,
      })),
      breakdowns: breakdowns.map((item) => ({
        id: item._id,
        name: item.projectName,
        type: "breakdown" as const,
        deletedAt: item.deletedAt,
      })),
    };
  },
});

/**
 * Check if an item is in trash
 */
export const isInTrash = query({
  args: {
    entityType: v.union(
      v.literal("budgetItem"),
      v.literal("project"),
      v.literal("breakdown")
    ),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { entityType, entityId } = args;

    if (entityType === "budgetItem") {
      const item = await ctx.db.get(entityId as Id<"budgetItems">);
      return item?.isDeleted === true;
    }

    if (entityType === "project") {
      const item = await ctx.db.get(entityId as Id<"projects">);
      return item?.isDeleted === true;
    }

    if (entityType === "breakdown") {
      const item = await ctx.db.get(entityId as Id<"govtProjectBreakdowns">);
      return item?.isDeleted === true;
    }

    return false;
  },
});
