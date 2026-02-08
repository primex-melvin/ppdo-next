// convex/search/reindex.ts
/**
 * Search Reindexing System
 * Provides functions to backfill and maintain the search index for all entity types.
 */

import { v } from "convex/values";
import { mutation, query, MutationCtx, QueryCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";
import { EntityType } from "./types";
import { indexEntity } from "./index";
import { buildSlug } from "../lib/searchUtils";

// ============================================================================
// TYPES
// ============================================================================

interface ReindexStats {
  entityType: EntityType;
  total: number;
  indexed: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
}

// ============================================================================
// BUDGET ITEMS REINDEXING (1st page)
// ============================================================================

async function reindexBudgetItems(ctx: MutationCtx): Promise<ReindexStats> {
  const stats: ReindexStats = {
    entityType: "budgetItem",
    total: 0,
    indexed: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  const budgetItems = await ctx.db
    .query("budgetItems")
    .filter((q) => q.neq(q.field("isDeleted"), true))
    .collect();

  stats.total = budgetItems.length;

  for (const item of budgetItems) {
    try {
      await indexEntity(ctx, {
        entityType: "budgetItem",
        entityId: item._id,
        primaryText: item.particulars || "",
        secondaryText: undefined, // Budget items don't have secondary text
        departmentId: item.departmentId,
        status: item.status, // Budget items have status
        year: item.year,
        isDeleted: false,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
      stats.indexed++;
    } catch (error) {
      stats.errors++;
      stats.errorDetails.push(
        `Budget Item ${item._id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return stats;
}

// ============================================================================
// PROJECT ITEMS REINDEXING (2nd page)
// ============================================================================

async function reindexProjectItems(ctx: MutationCtx): Promise<ReindexStats> {
  const stats: ReindexStats = {
    entityType: "projectItem",
    total: 0,
    indexed: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  const projects = await ctx.db
    .query("projects")
    .filter((q) => q.neq(q.field("isDeleted"), true))
    .collect();

  stats.total = projects.length;

  for (const project of projects) {
    try {
      // Fetch parent budget item for URL generation
      // Project page uses URL-encoded particular name (not slug) as route param
      let parentSlug: string | undefined;
      let parentId: string | undefined;
      if (project.budgetItemId) {
        const budgetItem = await ctx.db.get(project.budgetItemId);
        if (budgetItem) {
          parentSlug = encodeURIComponent(budgetItem.particulars);
          parentId = budgetItem._id as string;
        }
      }

      await indexEntity(ctx, {
        entityType: "projectItem",
        entityId: project._id,
        primaryText: project.particulars,
        secondaryText: project.implementingOffice,
        departmentId: project.departmentId,
        status: project.status,
        year: project.year,
        parentSlug,
        parentId,
        isDeleted: false,
        createdBy: project.createdBy,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      });
      stats.indexed++;
    } catch (error) {
      stats.errors++;
      stats.errorDetails.push(
        `Project ${project._id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return stats;
}

// ============================================================================
// PROJECT BREAKDOWNS REINDEXING (3rd page)
// ============================================================================

async function reindexProjectBreakdowns(ctx: MutationCtx): Promise<ReindexStats> {
  const stats: ReindexStats = {
    entityType: "projectBreakdown",
    total: 0,
    indexed: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  const breakdowns = await ctx.db
    .query("govtProjectBreakdowns")
    .filter((q) => q.neq(q.field("isDeleted"), true))
    .collect();

  stats.total = breakdowns.length;

  for (const breakdown of breakdowns) {
    try {
      // Lookup parent project and grandparent budget item for year and URL generation
      let parentSlug: string | undefined;
      let parentId: string | undefined;
      let year: number | undefined;
      if (breakdown.projectId) {
        const project = await ctx.db.get(breakdown.projectId);
        if (project) {
          year = project.year;
          parentId = project._id as string;
          if (project.budgetItemId) {
            const budgetItem = await ctx.db.get(project.budgetItemId);
            if (budgetItem) {
              // 3rd page URL: /dashboard/project/{year}/{encoded-particular}/{project-slug}
              parentSlug = `${encodeURIComponent(budgetItem.particulars)}/${buildSlug(project.particulars, project._id as string)}`;
            }
          }
        }
      }

      await indexEntity(ctx, {
        entityType: "projectBreakdown",
        entityId: breakdown._id,
        primaryText: breakdown.projectName || "",
        secondaryText: breakdown.implementingOffice,
        departmentId: undefined,
        status: breakdown.status,
        year,
        parentSlug,
        parentId,
        isDeleted: false,
        createdBy: breakdown.createdBy,
        createdAt: breakdown.createdAt,
        updatedAt: breakdown.updatedAt,
      });
      stats.indexed++;
    } catch (error) {
      stats.errors++;
      stats.errorDetails.push(
        `Project Breakdown ${breakdown._id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return stats;
}

// ============================================================================
// 20% DF REINDEXING (1st page)
// ============================================================================

async function reindexTwentyPercentDF(ctx: MutationCtx): Promise<ReindexStats> {
  const stats: ReindexStats = {
    entityType: "twentyPercentDF",
    total: 0,
    indexed: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  const items = await ctx.db
    .query("twentyPercentDF")
    .filter((q) => q.neq(q.field("isDeleted"), true))
    .collect();

  stats.total = items.length;

  for (const item of items) {
    try {
      await indexEntity(ctx, {
        entityType: "twentyPercentDF",
        entityId: item._id,
        primaryText: item.particulars,
        secondaryText: item.implementingOffice,
        departmentId: item.departmentId,
        status: item.status,
        year: item.year,
        isDeleted: false,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
      stats.indexed++;
    } catch (error) {
      stats.errors++;
      stats.errorDetails.push(
        `20% DF ${item._id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return stats;
}

// ============================================================================
// 20% DF ITEMS REINDEXING (2nd page - Breakdowns)
// ============================================================================

async function reindexTwentyPercentDFItems(ctx: MutationCtx): Promise<ReindexStats> {
  const stats: ReindexStats = {
    entityType: "twentyPercentDFItem",
    total: 0,
    indexed: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  const items = await ctx.db
    .query("twentyPercentDFBreakdowns")
    .filter((q) => q.neq(q.field("isDeleted"), true))
    .collect();

  stats.total = items.length;

  for (const item of items) {
    try {
      // Lookup parent 20% DF for year and URL generation
      let parentSlug: string | undefined;
      let parentId: string | undefined;
      let year: number | undefined;
      if (item.twentyPercentDFId) {
        const parentDF = await ctx.db.get(item.twentyPercentDFId);
        if (parentDF) {
          year = parentDF.year;
          parentId = parentDF._id as string;
          parentSlug = buildSlug(parentDF.particulars, parentDF._id as string);
        }
      }

      await indexEntity(ctx, {
        entityType: "twentyPercentDFItem",
        entityId: item._id,
        primaryText: item.projectName || "",
        secondaryText: item.implementingOffice,
        departmentId: undefined,
        status: item.status,
        year,
        parentSlug,
        parentId,
        isDeleted: false,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
      stats.indexed++;
    } catch (error) {
      stats.errors++;
      stats.errorDetails.push(
        `20% DF Item ${item._id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return stats;
}

// ============================================================================
// TRUST FUNDS REINDEXING (1st page)
// ============================================================================

async function reindexTrustFunds(ctx: MutationCtx): Promise<ReindexStats> {
  const stats: ReindexStats = {
    entityType: "trustFund",
    total: 0,
    indexed: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  const items = await ctx.db
    .query("trustFunds")
    .filter((q) => q.neq(q.field("isDeleted"), true))
    .collect();

  stats.total = items.length;

  for (const item of items) {
    try {
      await indexEntity(ctx, {
        entityType: "trustFund",
        entityId: item._id,
        primaryText: item.projectTitle,
        secondaryText: item.officeInCharge,
        departmentId: item.departmentId,
        status: item.status,
        year: item.year,
        isDeleted: false,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
      stats.indexed++;
    } catch (error) {
      stats.errors++;
      stats.errorDetails.push(
        `Trust Fund ${item._id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return stats;
}

// ============================================================================
// TRUST FUND ITEMS REINDEXING (2nd page - Breakdowns)
// ============================================================================

async function reindexTrustFundItems(ctx: MutationCtx): Promise<ReindexStats> {
  const stats: ReindexStats = {
    entityType: "trustFundItem",
    total: 0,
    indexed: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  const items = await ctx.db
    .query("trustFundBreakdowns")
    .filter((q) => q.neq(q.field("isDeleted"), true))
    .collect();

  stats.total = items.length;

  for (const item of items) {
    try {
      // Lookup parent trust fund for year and URL generation
      let parentSlug: string | undefined;
      let parentId: string | undefined;
      let year: number | undefined;
      if (item.trustFundId) {
        const parentFund = await ctx.db.get(item.trustFundId);
        if (parentFund) {
          year = parentFund.year;
          parentId = parentFund._id as string;
          parentSlug = buildSlug(parentFund.projectTitle, parentFund._id as string);
        }
      }

      await indexEntity(ctx, {
        entityType: "trustFundItem",
        entityId: item._id,
        primaryText: item.projectName || "",
        secondaryText: item.implementingOffice,
        departmentId: undefined,
        status: item.status,
        year,
        parentSlug,
        parentId,
        isDeleted: false,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
      stats.indexed++;
    } catch (error) {
      stats.errors++;
      stats.errorDetails.push(
        `Trust Fund Item ${item._id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return stats;
}

// ============================================================================
// SPECIAL EDUCATION FUNDS REINDEXING (1st page)
// ============================================================================

async function reindexSpecialEducationFunds(ctx: MutationCtx): Promise<ReindexStats> {
  const stats: ReindexStats = {
    entityType: "specialEducationFund",
    total: 0,
    indexed: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  const items = await ctx.db
    .query("specialEducationFunds")
    .filter((q) => q.neq(q.field("isDeleted"), true))
    .collect();

  stats.total = items.length;

  for (const item of items) {
    try {
      await indexEntity(ctx, {
        entityType: "specialEducationFund",
        entityId: item._id,
        primaryText: item.projectTitle,
        secondaryText: item.officeInCharge,
        departmentId: item.departmentId,
        status: item.status,
        year: item.year,
        isDeleted: false,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
      stats.indexed++;
    } catch (error) {
      stats.errors++;
      stats.errorDetails.push(
        `SEF ${item._id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return stats;
}

// ============================================================================
// SPECIAL EDUCATION FUND ITEMS REINDEXING (2nd page - Breakdowns)
// ============================================================================

async function reindexSpecialEducationFundItems(ctx: MutationCtx): Promise<ReindexStats> {
  const stats: ReindexStats = {
    entityType: "specialEducationFundItem",
    total: 0,
    indexed: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  const items = await ctx.db
    .query("specialEducationFundBreakdowns")
    .filter((q) => q.neq(q.field("isDeleted"), true))
    .collect();

  stats.total = items.length;

  for (const item of items) {
    try {
      // Lookup parent special education fund for year and URL generation
      let parentSlug: string | undefined;
      let parentId: string | undefined;
      let year: number | undefined;
      if (item.specialEducationFundId) {
        const parentFund = await ctx.db.get(item.specialEducationFundId);
        if (parentFund) {
          year = parentFund.year;
          parentId = parentFund._id as string;
          parentSlug = buildSlug(parentFund.projectTitle, parentFund._id as string);
        }
      }

      await indexEntity(ctx, {
        entityType: "specialEducationFundItem",
        entityId: item._id,
        primaryText: item.projectName || "",
        secondaryText: item.implementingOffice,
        departmentId: undefined,
        status: item.status,
        year,
        parentSlug,
        parentId,
        isDeleted: false,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
      stats.indexed++;
    } catch (error) {
      stats.errors++;
      stats.errorDetails.push(
        `SEF Item ${item._id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return stats;
}

// ============================================================================
// SPECIAL HEALTH FUNDS REINDEXING (1st page)
// ============================================================================

async function reindexSpecialHealthFunds(ctx: MutationCtx): Promise<ReindexStats> {
  const stats: ReindexStats = {
    entityType: "specialHealthFund",
    total: 0,
    indexed: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  const items = await ctx.db
    .query("specialHealthFunds")
    .filter((q) => q.neq(q.field("isDeleted"), true))
    .collect();

  stats.total = items.length;

  for (const item of items) {
    try {
      await indexEntity(ctx, {
        entityType: "specialHealthFund",
        entityId: item._id,
        primaryText: item.projectTitle,
        secondaryText: item.officeInCharge,
        departmentId: item.departmentId,
        status: item.status,
        year: item.year,
        isDeleted: false,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
      stats.indexed++;
    } catch (error) {
      stats.errors++;
      stats.errorDetails.push(
        `SHF ${item._id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return stats;
}

// ============================================================================
// SPECIAL HEALTH FUND ITEMS REINDEXING (2nd page - Breakdowns)
// ============================================================================

async function reindexSpecialHealthFundItems(ctx: MutationCtx): Promise<ReindexStats> {
  const stats: ReindexStats = {
    entityType: "specialHealthFundItem",
    total: 0,
    indexed: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  const items = await ctx.db
    .query("specialHealthFundBreakdowns")
    .filter((q) => q.neq(q.field("isDeleted"), true))
    .collect();

  stats.total = items.length;

  for (const item of items) {
    try {
      // Lookup parent special health fund for year and URL generation
      let parentSlug: string | undefined;
      let parentId: string | undefined;
      let year: number | undefined;
      if (item.specialHealthFundId) {
        const parentFund = await ctx.db.get(item.specialHealthFundId);
        if (parentFund) {
          year = parentFund.year;
          parentId = parentFund._id as string;
          parentSlug = buildSlug(parentFund.projectTitle, parentFund._id as string);
        }
      }

      await indexEntity(ctx, {
        entityType: "specialHealthFundItem",
        entityId: item._id,
        primaryText: item.projectName || "",
        secondaryText: item.implementingOffice,
        departmentId: undefined,
        status: item.status,
        year,
        parentSlug,
        parentId,
        isDeleted: false,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
      stats.indexed++;
    } catch (error) {
      stats.errors++;
      stats.errorDetails.push(
        `SHF Item ${item._id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return stats;
}

// ============================================================================
// DEPARTMENTS REINDEXING
// ============================================================================

async function reindexDepartments(ctx: MutationCtx): Promise<ReindexStats> {
  const stats: ReindexStats = {
    entityType: "department",
    total: 0,
    indexed: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  const items = await ctx.db
    .query("departments")
    .filter((q) => q.eq(q.field("isActive"), true))
    .collect();

  stats.total = items.length;

  for (const item of items) {
    try {
      await indexEntity(ctx, {
        entityType: "department",
        entityId: item._id,
        primaryText: item.name,
        secondaryText: item.description,
        departmentId: item._id,
        status: item.isActive ? "active" : "inactive",
        isDeleted: false,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
      stats.indexed++;
    } catch (error) {
      stats.errors++;
      stats.errorDetails.push(
        `Department ${item._id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return stats;
}

// ============================================================================
// IMPLEMENTING AGENCIES REINDEXING
// ============================================================================

async function reindexAgencies(ctx: MutationCtx): Promise<ReindexStats> {
  const stats: ReindexStats = {
    entityType: "agency",
    total: 0,
    indexed: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  const items = await ctx.db
    .query("implementingAgencies")
    .filter((q) => q.eq(q.field("isActive"), true))
    .collect();

  stats.total = items.length;

  for (const item of items) {
    try {
      await indexEntity(ctx, {
        entityType: "agency",
        entityId: item._id,
        primaryText: item.fullName,
        secondaryText: item.code,
        departmentId: item.departmentId,
        status: item.isActive ? "active" : "inactive",
        isDeleted: false,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
      stats.indexed++;
    } catch (error) {
      stats.errors++;
      stats.errorDetails.push(
        `Agency ${item._id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return stats;
}

// ============================================================================
// USERS REINDEXING
// ============================================================================

async function reindexUsers(ctx: MutationCtx): Promise<ReindexStats> {
  const stats: ReindexStats = {
    entityType: "user",
    total: 0,
    indexed: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  const items = await ctx.db.query("users").collect();

  stats.total = items.length;

  for (const item of items) {
    try {
      // Skip users without email (incomplete accounts)
      if (!item.email) {
        stats.skipped++;
        continue;
      }

      await indexEntity(ctx, {
        entityType: "user",
        entityId: item._id,
        primaryText: item.name || item.email,
        secondaryText: item.email,
        departmentId: item.departmentId,
        status: item.status,
        isDeleted: false,
        createdBy: item._id, // Users are their own creators
        createdAt: item._creationTime,
        updatedAt: item.updatedAt || item._creationTime,
      });
      stats.indexed++;
    } catch (error) {
      stats.errors++;
      stats.errorDetails.push(
        `User ${item._id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return stats;
}

// ============================================================================
// PUBLIC MUTATIONS
// ============================================================================

/**
 * Reindex all entities of a specific type
 */
export const reindexByType = mutation({
  args: {
    entityType: v.union(
      // 1st page
      v.literal("budgetItem"),
      v.literal("twentyPercentDF"),
      v.literal("trustFund"),
      v.literal("specialEducationFund"),
      v.literal("specialHealthFund"),
      v.literal("department"),
      v.literal("agency"),
      v.literal("user"),
      // 2nd page
      v.literal("projectItem"),
      v.literal("twentyPercentDFItem"),
      v.literal("trustFundItem"),
      v.literal("specialEducationFundItem"),
      v.literal("specialHealthFundItem"),
      // 3rd page
      v.literal("projectBreakdown")
    ),
  },
  handler: async (ctx, args): Promise<ReindexStats> => {
    switch (args.entityType) {
      // 1st page
      case "budgetItem":
        return await reindexBudgetItems(ctx);
      case "twentyPercentDF":
        return await reindexTwentyPercentDF(ctx);
      case "trustFund":
        return await reindexTrustFunds(ctx);
      case "specialEducationFund":
        return await reindexSpecialEducationFunds(ctx);
      case "specialHealthFund":
        return await reindexSpecialHealthFunds(ctx);
      case "department":
        return await reindexDepartments(ctx);
      case "agency":
        return await reindexAgencies(ctx);
      case "user":
        return await reindexUsers(ctx);
      // 2nd page
      case "projectItem":
        return await reindexProjectItems(ctx);
      case "twentyPercentDFItem":
        return await reindexTwentyPercentDFItems(ctx);
      case "trustFundItem":
        return await reindexTrustFundItems(ctx);
      case "specialEducationFundItem":
        return await reindexSpecialEducationFundItems(ctx);
      case "specialHealthFundItem":
        return await reindexSpecialHealthFundItems(ctx);
      // 3rd page
      case "projectBreakdown":
        return await reindexProjectBreakdowns(ctx);
      default:
        throw new Error(`Unknown entity type: ${args.entityType}`);
    }
  },
});

/**
 * Reindex ALL entity types
 * This is the main function to fix missing search index entries
 */
export const reindexAll = mutation({
  args: {},
  handler: async (ctx): Promise<ReindexStats[]> => {
    const allStats: ReindexStats[] = [];

    // Reindex all entity types sequentially to avoid overwhelming the database
    // 1st page entities
    allStats.push(await reindexBudgetItems(ctx));
    allStats.push(await reindexTwentyPercentDF(ctx));
    allStats.push(await reindexTrustFunds(ctx));
    allStats.push(await reindexSpecialEducationFunds(ctx));
    allStats.push(await reindexSpecialHealthFunds(ctx));
    allStats.push(await reindexDepartments(ctx));
    allStats.push(await reindexAgencies(ctx));
    allStats.push(await reindexUsers(ctx));

    // 2nd page entities
    allStats.push(await reindexProjectItems(ctx));
    allStats.push(await reindexTwentyPercentDFItems(ctx));
    allStats.push(await reindexTrustFundItems(ctx));
    allStats.push(await reindexSpecialEducationFundItems(ctx));
    allStats.push(await reindexSpecialHealthFundItems(ctx));

    // 3rd page entities
    allStats.push(await reindexProjectBreakdowns(ctx));

    return allStats;
  },
});

// ============================================================================
// STATISTICS QUERIES
// ============================================================================

/**
 * Get search index statistics for all entity types
 * Shows indexed count vs total entities in database
 */
export const getIndexStats = query({
  args: {},
  handler: async (ctx): Promise<{
    overall: {
      totalEntities: number;
      totalIndexed: number;
      coverage: number;
    };
    byType: Record<
      EntityType,
      {
        inDatabase: number;
        indexed: number;
        coverage: number;
      }
    >;
  }> => {
    // Get all index entries
    const indexEntries = await ctx.db.query("searchIndex").collect();

    // Count indexed entries by type
    const indexedCounts: Record<string, number> = {};
    for (const entry of indexEntries) {
      if (!entry.isDeleted) {
        indexedCounts[entry.entityType] = (indexedCounts[entry.entityType] || 0) + 1;
      }
    }

    // Count entities in database
    const [
      budgetItems,
      projects,
      projectBreakdowns,
      twentyPercentDF,
      twentyPercentDFBreakdowns,
      trustFunds,
      trustFundBreakdowns,
      specialEducationFunds,
      specialEducationFundBreakdowns,
      specialHealthFunds,
      specialHealthFundBreakdowns,
      departments,
      agencies,
      users,
    ] = await Promise.all([
      ctx.db
        .query("budgetItems")
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .collect(),
      ctx.db
        .query("projects")
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .collect(),
      ctx.db
        .query("govtProjectBreakdowns")
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .collect(),
      ctx.db
        .query("twentyPercentDF")
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .collect(),
      ctx.db
        .query("twentyPercentDFBreakdowns")
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .collect(),
      ctx.db
        .query("trustFunds")
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .collect(),
      ctx.db
        .query("trustFundBreakdowns")
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .collect(),
      ctx.db
        .query("specialEducationFunds")
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .collect(),
      ctx.db
        .query("specialEducationFundBreakdowns")
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .collect(),
      ctx.db
        .query("specialHealthFunds")
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .collect(),
      ctx.db
        .query("specialHealthFundBreakdowns")
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .collect(),
      ctx.db
        .query("departments")
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect(),
      ctx.db
        .query("implementingAgencies")
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect(),
      ctx.db.query("users").collect(),
    ]);

    const dbCounts: Record<EntityType, number> = {
      // 1st page
      budgetItem: budgetItems.length,
      twentyPercentDF: twentyPercentDF.length,
      trustFund: trustFunds.length,
      specialEducationFund: specialEducationFunds.length,
      specialHealthFund: specialHealthFunds.length,
      department: departments.length,
      agency: agencies.length,
      user: users.length,
      // 2nd page
      projectItem: projects.length,
      twentyPercentDFItem: twentyPercentDFBreakdowns.length,
      trustFundItem: trustFundBreakdowns.length,
      specialEducationFundItem: specialEducationFundBreakdowns.length,
      specialHealthFundItem: specialHealthFundBreakdowns.length,
      // 3rd page
      projectBreakdown: projectBreakdowns.length,
    };

    // Build stats by type
    const byType = {} as Record<
      EntityType,
      { inDatabase: number; indexed: number; coverage: number }
    >;

    const entityTypes: EntityType[] = [
      // 1st page
      "budgetItem",
      "twentyPercentDF",
      "trustFund",
      "specialEducationFund",
      "specialHealthFund",
      "department",
      "agency",
      "user",
      // 2nd page
      "projectItem",
      "twentyPercentDFItem",
      "trustFundItem",
      "specialEducationFundItem",
      "specialHealthFundItem",
      // 3rd page
      "projectBreakdown",
    ];

    for (const type of entityTypes) {
      const inDatabase = dbCounts[type];
      const indexed = indexedCounts[type] || 0;
      byType[type] = {
        inDatabase,
        indexed,
        coverage: inDatabase > 0 ? Math.round((indexed / inDatabase) * 100) : 100,
      };
    }

    // Calculate overall stats
    const totalEntities = Object.values(dbCounts).reduce((a, b) => a + b, 0);
    const totalIndexed = Object.values(indexedCounts).reduce((a, b) => a + b, 0);

    return {
      overall: {
        totalEntities,
        totalIndexed,
        coverage: totalEntities > 0 ? Math.round((totalIndexed / totalEntities) * 100) : 100,
      },
      byType,
    };
  },
});

/**
 * Clear all search index entries (use with caution)
 * Useful for completely rebuilding the index from scratch
 */
export const clearIndex = mutation({
  args: {
    entityType: v.optional(
      v.union(
        // 1st page
        v.literal("budgetItem"),
        v.literal("twentyPercentDF"),
        v.literal("trustFund"),
        v.literal("specialEducationFund"),
        v.literal("specialHealthFund"),
        v.literal("department"),
        v.literal("agency"),
        v.literal("user"),
        // 2nd page
        v.literal("projectItem"),
        v.literal("twentyPercentDFItem"),
        v.literal("trustFundItem"),
        v.literal("specialEducationFundItem"),
        v.literal("specialHealthFundItem"),
        // 3rd page
        v.literal("projectBreakdown")
      )
    ),
  },
  handler: async (ctx, args): Promise<{ deletedCount: number }> => {
    let entries;

    if (args.entityType) {
      // Clear specific entity type
      entries = await ctx.db
        .query("searchIndex")
        .withIndex("entityType", (q) => q.eq("entityType", args.entityType!))
        .collect();
    } else {
      // Clear all
      entries = await ctx.db.query("searchIndex").collect();
    }

    for (const entry of entries) {
      await ctx.db.delete(entry._id);
    }

    return { deletedCount: entries.length };
  },
});
