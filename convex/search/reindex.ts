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
// PROJECT REINDEXING
// ============================================================================

async function reindexProjects(ctx: MutationCtx): Promise<ReindexStats> {
  const stats: ReindexStats = {
    entityType: "project",
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
      await indexEntity(ctx, {
        entityType: "project",
        entityId: project._id,
        primaryText: project.particulars,
        secondaryText: project.implementingOffice,
        departmentId: project.departmentId,
        status: project.status,
        year: project.year,
        isDeleted: false,
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
// 20% DF REINDEXING
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
// TRUST FUNDS REINDEXING
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
// SPECIAL EDUCATION FUNDS REINDEXING
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
// SPECIAL HEALTH FUNDS REINDEXING
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
      v.literal("project"),
      v.literal("twentyPercentDF"),
      v.literal("trustFund"),
      v.literal("specialEducationFund"),
      v.literal("specialHealthFund"),
      v.literal("department"),
      v.literal("agency"),
      v.literal("user")
    ),
  },
  handler: async (ctx, args): Promise<ReindexStats> => {
    switch (args.entityType) {
      case "project":
        return await reindexProjects(ctx);
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
    allStats.push(await reindexProjects(ctx));
    allStats.push(await reindexTwentyPercentDF(ctx));
    allStats.push(await reindexTrustFunds(ctx));
    allStats.push(await reindexSpecialEducationFunds(ctx));
    allStats.push(await reindexSpecialHealthFunds(ctx));
    allStats.push(await reindexDepartments(ctx));
    allStats.push(await reindexAgencies(ctx));
    allStats.push(await reindexUsers(ctx));

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
      projects,
      twentyPercentDF,
      trustFunds,
      specialEducationFunds,
      specialHealthFunds,
      departments,
      agencies,
      users,
    ] = await Promise.all([
      ctx.db
        .query("projects")
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .collect(),
      ctx.db
        .query("twentyPercentDF")
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .collect(),
      ctx.db
        .query("trustFunds")
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .collect(),
      ctx.db
        .query("specialEducationFunds")
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .collect(),
      ctx.db
        .query("specialHealthFunds")
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
      project: projects.length,
      twentyPercentDF: twentyPercentDF.length,
      trustFund: trustFunds.length,
      specialEducationFund: specialEducationFunds.length,
      specialHealthFund: specialHealthFunds.length,
      department: departments.length,
      agency: agencies.length,
      user: users.length,
    };

    // Build stats by type
    const byType = {} as Record<
      EntityType,
      { inDatabase: number; indexed: number; coverage: number }
    >;

    const entityTypes: EntityType[] = [
      "project",
      "twentyPercentDF",
      "trustFund",
      "specialEducationFund",
      "specialHealthFund",
      "department",
      "agency",
      "user",
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
        v.literal("project"),
        v.literal("twentyPercentDF"),
        v.literal("trustFund"),
        v.literal("specialEducationFund"),
        v.literal("specialHealthFund"),
        v.literal("department"),
        v.literal("agency"),
        v.literal("user")
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
