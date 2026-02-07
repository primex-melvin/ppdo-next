// convex/tableSettings.ts

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Get user-specific table settings
 */
export const getSettings = query({
  args: { tableIdentifier: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const result = await ctx.db
      .query("userTableSettings")
      .withIndex("by_user_and_table", (q) =>
        q.eq("userId", userId).eq("tableIdentifier", args.tableIdentifier)
      )
      .first();
    console.log(`[Convex] getSettings | table: ${args.tableIdentifier} | user: ${userId} | found: ${!!result} | columns: ${result?.columns.length || 0}`);
    return result;
  },
});

/**
 * Get default column widths for a table type
 * Used when user has no custom settings
 */
export const getDefaultWidths = query({
  args: { tableIdentifier: v.string() },
  handler: async (ctx, args) => {
    const defaults = await ctx.db
      .query("tableColumnDefaults")
      .withIndex("by_table", (q) => q.eq("tableIdentifier", args.tableIdentifier))
      .collect();

    return defaults.reduce((acc, def) => {
      acc[def.columnKey] = {
        width: def.defaultWidth,
        minWidth: def.minWidth,
        maxWidth: def.maxWidth,
        flex: def.flex,
      };
      return acc;
    }, {} as Record<string, { width: number; minWidth: number; maxWidth?: number; flex: number }>);
  },
});

/**
 * Save full table settings (columns with widths, row heights)
 */
export const saveSettings = mutation({
  args: {
    tableIdentifier: v.string(),
    columns: v.array(
      v.object({
        fieldKey: v.string(),
        width: v.number(), // ACTUAL PIXEL WIDTH - NOW REQUIRED AND USED
        isVisible: v.boolean(),
        pinned: v.optional(v.union(v.literal("left"), v.literal("right"), v.null())),
        flex: v.optional(v.number()),
      })
    ),
    defaultRowHeight: v.optional(v.number()),
    customRowHeights: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("userTableSettings")
      .withIndex("by_user_and_table", (q) =>
        q.eq("userId", userId).eq("tableIdentifier", args.tableIdentifier)
      )
      .first();

    console.log(`[Convex] saveSettings | table: ${args.tableIdentifier} | columns: ${args.columns.length} | user: ${userId} | operation: ${existing ? 'UPDATE' : 'INSERT'}`);

    const now = Date.now();
    const patchData = {
      columns: args.columns,
      defaultRowHeight: args.defaultRowHeight,
      customRowHeights: args.customRowHeights,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, patchData);
    } else {
      await ctx.db.insert("userTableSettings", {
        ...patchData,
        userId,
        tableIdentifier: args.tableIdentifier,
        createdAt: now,
      });
    }
  },
});

/**
 * Update single column width (for resize operations)
 * More efficient than saving full settings on every drag
 */
export const updateColumnWidth = mutation({
  args: {
    tableIdentifier: v.string(),
    columnKey: v.string(),
    width: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("userTableSettings")
      .withIndex("by_user_and_table", (q) =>
        q.eq("userId", userId).eq("tableIdentifier", args.tableIdentifier)
      )
      .first();

    console.log(`[Convex] updateColumnWidth | table: ${args.tableIdentifier} | column: ${args.columnKey} | width: ${args.width}px | user: ${userId}`);

    if (!existing) {
      // Get defaults to create initial settings
      const defaults = await ctx.db
        .query("tableColumnDefaults")
        .withIndex("by_table", (q) => q.eq("tableIdentifier", args.tableIdentifier))
        .collect();

      const columns = defaults.map((def) => ({
        fieldKey: def.columnKey,
        width: def.columnKey === args.columnKey ? args.width : def.defaultWidth,
        isVisible: true,
        flex: def.flex,
        pinned: null as "left" | "right" | null,
      }));

      await ctx.db.insert("userTableSettings", {
        userId,
        tableIdentifier: args.tableIdentifier,
        columns,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      console.log(`[Convex] updateColumnWidth | INSERT new settings with ${columns.length} columns`);
    } else {
      // Update existing column width
      const columns = existing.columns.map((c) =>
        c.fieldKey === args.columnKey ? { ...c, width: args.width } : c
      );

      await ctx.db.patch(existing._id, {
        columns,
        updatedAt: Date.now(),
      });
      console.log(`[Convex] updateColumnWidth | UPDATE existing settings`);
    }
  },
});

/**
 * Reset user settings to defaults (delete custom settings)
 */
export const resetSettings = mutation({
  args: { tableIdentifier: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("userTableSettings")
      .withIndex("by_user_and_table", (q) =>
        q.eq("userId", userId).eq("tableIdentifier", args.tableIdentifier)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

// ============================================================================
// INTERNAL MUTATIONS (for seeding/migrations)
// ============================================================================

/**
 * Seed default column widths for all tables
 * Run once during deployment
 */
export const seedDefaultWidths = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allDefaults = [
      // === PROJECTS TABLE ===
      { tableId: "projects", col: "particular", width: 320, flex: 3, minW: 180 },
      { tableId: "projects", col: "particularCategoryId", width: 160, flex: 1.5, minW: 100 },
      { tableId: "projects", col: "implementingOffice", width: 200, flex: 2, minW: 120 },
      { tableId: "projects", col: "allocatedBudget", width: 140, flex: 1.5, minW: 100 },
      { tableId: "projects", col: "obligatedBudget", width: 140, flex: 1.5, minW: 100 },
      { tableId: "projects", col: "budgetUtilized", width: 140, flex: 1.5, minW: 100 },
      { tableId: "projects", col: "utilizationRate", width: 100, flex: 1, minW: 80 },
      { tableId: "projects", col: "balance", width: 140, flex: 1.5, minW: 100 },
      { tableId: "projects", col: "year", width: 80, flex: 0.8, minW: 60 },
      { tableId: "projects", col: "remarks", width: 250, flex: 2.5, minW: 150 },
      { tableId: "projects", col: "status", width: 120, flex: 1.2, minW: 90 },
      { tableId: "projects", col: "actions", width: 64, flex: 0.5, minW: 64 },
      { tableId: "projects", col: "rowNumber", width: 48, flex: 0.4, minW: 48 },

      // === 20% DF TABLE ===
      { tableId: "twentyPercentDF", col: "fundTitle", width: 300, flex: 3, minW: 180 },
      { tableId: "twentyPercentDF", col: "fundCategoryId", width: 160, flex: 1.5, minW: 100 },
      { tableId: "twentyPercentDF", col: "sourceOfFund", width: 180, flex: 1.8, minW: 120 },
      { tableId: "twentyPercentDF", col: "allocatedFund", width: 140, flex: 1.5, minW: 100 },
      { tableId: "twentyPercentDF", col: "obligatedFund", width: 140, flex: 1.5, minW: 100 },
      { tableId: "twentyPercentDF", col: "utilizedFund", width: 140, flex: 1.5, minW: 100 },
      { tableId: "twentyPercentDF", col: "utilizationRate", width: 100, flex: 1, minW: 80 },
      { tableId: "twentyPercentDF", col: "balance", width: 140, flex: 1.5, minW: 100 },
      { tableId: "twentyPercentDF", col: "completed", width: 110, flex: 1.1, minW: 80 },
      { tableId: "twentyPercentDF", col: "ongoing", width: 110, flex: 1.1, minW: 80 },
      { tableId: "twentyPercentDF", col: "delayed", width: 110, flex: 1.1, minW: 80 },
      { tableId: "twentyPercentDF", col: "year", width: 80, flex: 0.8, minW: 60 },
      { tableId: "twentyPercentDF", col: "remarks", width: 250, flex: 2.5, minW: 150 },
      { tableId: "twentyPercentDF", col: "actions", width: 64, flex: 0.5, minW: 64 },
      { tableId: "twentyPercentDF", col: "rowNumber", width: 48, flex: 0.4, minW: 48 },

      // === BUDGET TABLE ===
      { tableId: "budget", col: "particular", width: 280, flex: 2.8, minW: 180 },
      { tableId: "budget", col: "particularType", width: 140, flex: 1.4, minW: 100 },
      { tableId: "budget", col: "year", width: 80, flex: 0.8, minW: 60 },
      { tableId: "budget", col: "annualBudget", width: 140, flex: 1.5, minW: 100 },
      { tableId: "budget", col: "cumulativeAllotment", width: 150, flex: 1.5, minW: 100 },
      { tableId: "budget", col: "totalObligation", width: 150, flex: 1.5, minW: 100 },
      { tableId: "budget", col: "totalExpenditure", width: 150, flex: 1.5, minW: 100 },
      { tableId: "budget", col: "unobligatedBalance", width: 160, flex: 1.6, minW: 110 },
      { tableId: "budget", col: "fundStatus", width: 130, flex: 1.3, minW: 90 },
      { tableId: "budget", col: "remarks", width: 250, flex: 2.5, minW: 150 },
      { tableId: "budget", col: "actions", width: 64, flex: 0.5, minW: 64 },
      { tableId: "budget", col: "rowNumber", width: 48, flex: 0.4, minW: 48 },

      // === FUNDS TABLE (Trust/SEF/SHF) ===
      { tableId: "funds", col: "fundTitle", width: 300, flex: 3, minW: 180 },
      { tableId: "funds", col: "sourceOfFund", width: 180, flex: 1.8, minW: 120 },
      { tableId: "funds", col: "implementingOffice", width: 180, flex: 1.8, minW: 120 },
      { tableId: "funds", col: "allocatedFund", width: 140, flex: 1.5, minW: 100 },
      { tableId: "funds", col: "obligatedFund", width: 140, flex: 1.5, minW: 100 },
      { tableId: "funds", col: "utilizedFund", width: 140, flex: 1.5, minW: 100 },
      { tableId: "funds", col: "balance", width: 140, flex: 1.5, minW: 100 },
      { tableId: "funds", col: "utilizationRate", width: 100, flex: 1, minW: 80 },
      { tableId: "funds", col: "dateStarted", width: 120, flex: 1.2, minW: 90 },
      { tableId: "funds", col: "targetDate", width: 120, flex: 1.2, minW: 90 },
      { tableId: "funds", col: "completionDate", width: 120, flex: 1.2, minW: 90 },
      { tableId: "funds", col: "projectAccomplishment", width: 130, flex: 1.3, minW: 90 },
      { tableId: "funds", col: "status", width: 120, flex: 1.2, minW: 90 },
      { tableId: "funds", col: "remarks", width: 250, flex: 2.5, minW: 150 },
      { tableId: "funds", col: "actions", width: 64, flex: 0.5, minW: 64 },
      { tableId: "funds", col: "rowNumber", width: 48, flex: 0.4, minW: 48 },

      // === BREAKDOWN TABLE ===
      { tableId: "breakdown", col: "projectTitle", width: 280, flex: 2.8, minW: 180 },
      { tableId: "breakdown", col: "implementingOffice", width: 180, flex: 1.8, minW: 120 },
      { tableId: "breakdown", col: "allocatedBudget", width: 140, flex: 1.5, minW: 100 },
      { tableId: "breakdown", col: "obligatedBudget", width: 140, flex: 1.5, minW: 100 },
      { tableId: "breakdown", col: "budgetUtilized", width: 140, flex: 1.5, minW: 100 },
      { tableId: "breakdown", col: "utilizationRate", width: 100, flex: 1, minW: 80 },
      { tableId: "breakdown", col: "balance", width: 140, flex: 1.5, minW: 100 },
      { tableId: "breakdown", col: "dateStarted", width: 120, flex: 1.2, minW: 90 },
      { tableId: "breakdown", col: "targetDate", width: 120, flex: 1.2, minW: 90 },
      { tableId: "breakdown", col: "completionDate", width: 120, flex: 1.2, minW: 90 },
      { tableId: "breakdown", col: "projectAccomplishment", width: 130, flex: 1.3, minW: 90 },
      { tableId: "breakdown", col: "status", width: 120, flex: 1.2, minW: 90 },
      { tableId: "breakdown", col: "remarks", width: 250, flex: 2.5, minW: 150 },
      { tableId: "breakdown", col: "actions", width: 64, flex: 0.5, minW: 64 },
      { tableId: "breakdown", col: "rowNumber", width: 48, flex: 0.4, minW: 48 },
    ];

    // Clear existing defaults first (idempotent)
    const existing = await ctx.db.query("tableColumnDefaults").collect();
    for (const e of existing) {
      await ctx.db.delete(e._id);
    }

    // Insert new defaults
    const inserted: string[] = [];
    for (const def of allDefaults) {
      const id = await ctx.db.insert("tableColumnDefaults", {
        tableIdentifier: def.tableId,
        columnKey: def.col,
        defaultWidth: def.width,
        minWidth: def.minW,
        maxWidth: Math.floor(def.width * 2),
        flex: def.flex,
        updatedAt: Date.now(),
      });
      inserted.push(id);
    }

    return { 
      inserted: inserted.length,
      tables: [...new Set(allDefaults.map(d => d.tableId))],
    };
  },
});

/**
 * Clear all default widths (for reset/debug)
 */
export const clearDefaultWidths = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("tableColumnDefaults").collect();
    for (const e of existing) {
      await ctx.db.delete(e._id);
    }
    return { deleted: existing.length };
  },
});
