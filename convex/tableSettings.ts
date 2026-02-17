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
 * Falls back to projectsTable_default for project tables with particular-specific IDs
 */
export const getDefaultWidths = query({
  args: { tableIdentifier: v.string() },
  handler: async (ctx, args) => {
    let defaults = await ctx.db
      .query("tableColumnDefaults")
      .withIndex("by_table", (q) => q.eq("tableIdentifier", args.tableIdentifier))
      .collect();

    // Fallback for project tables with particular-specific IDs (e.g., projectsTable_LDRRMF)
    if (defaults.length === 0 && args.tableIdentifier.startsWith('projectsTable_') && args.tableIdentifier !== 'projectsTable_default') {
      defaults = await ctx.db
        .query("tableColumnDefaults")
        .withIndex("by_table", (q) => q.eq("tableIdentifier", "projectsTable_default"))
        .collect();
    }

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
      // Get defaults to create initial settings - with fallback for project tables
      let defaults = await ctx.db
        .query("tableColumnDefaults")
        .withIndex("by_table", (q) => q.eq("tableIdentifier", args.tableIdentifier))
        .collect();

      // Fallback for project tables with particular-specific IDs
      if (defaults.length === 0 && args.tableIdentifier.startsWith('projectsTable_') && args.tableIdentifier !== 'projectsTable_default') {
        defaults = await ctx.db
          .query("tableColumnDefaults")
          .withIndex("by_table", (q) => q.eq("tableIdentifier", "projectsTable_default"))
          .collect();
      }

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
    } else if (existing.columns.length === 0) {
      // Settings exist but columns array is empty - populate from defaults with fallback
      let defaults = await ctx.db
        .query("tableColumnDefaults")
        .withIndex("by_table", (q) => q.eq("tableIdentifier", args.tableIdentifier))
        .collect();

      // Fallback for project tables with particular-specific IDs
      if (defaults.length === 0 && args.tableIdentifier.startsWith('projectsTable_') && args.tableIdentifier !== 'projectsTable_default') {
        defaults = await ctx.db
          .query("tableColumnDefaults")
          .withIndex("by_table", (q) => q.eq("tableIdentifier", "projectsTable_default"))
          .collect();
      }

      const columns = defaults.map((def) => ({
        fieldKey: def.columnKey,
        width: def.columnKey === args.columnKey ? args.width : def.defaultWidth,
        isVisible: true,
        flex: def.flex,
        pinned: null as "left" | "right" | null,
      }));

      await ctx.db.patch(existing._id, {
        columns,
        updatedAt: Date.now(),
      });
      console.log(`[Convex] updateColumnWidth | POPULATE empty settings with ${columns.length} columns`);
    } else {
      // Update existing column width
      const existingColumn = existing.columns.find((c) => c.fieldKey === args.columnKey);
      
      let columns;
      if (existingColumn) {
        // Column exists - update its width
        columns = existing.columns.map((c) =>
          c.fieldKey === args.columnKey ? { ...c, width: args.width } : c
        );
      } else {
        // Column doesn't exist in saved settings - add it
        // Get default values from tableColumnDefaults with fallback for project tables
        let columnDefault = await ctx.db
          .query("tableColumnDefaults")
          .withIndex("by_table_column", (q) =>
            q.eq("tableIdentifier", args.tableIdentifier).eq("columnKey", args.columnKey)
          )
          .first();

        // Fallback for project tables with particular-specific IDs
        if (!columnDefault && args.tableIdentifier.startsWith('projectsTable_') && args.tableIdentifier !== 'projectsTable_default') {
          columnDefault = await ctx.db
            .query("tableColumnDefaults")
            .withIndex("by_table_column", (q) =>
              q.eq("tableIdentifier", "projectsTable_default").eq("columnKey", args.columnKey)
            )
            .first();
        }
        
        columns = [
          ...existing.columns,
          {
            fieldKey: args.columnKey,
            width: args.width,
            isVisible: true,
            flex: columnDefault?.flex ?? 1,
            pinned: null as "left" | "right" | null,
          },
        ];
      }

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
// SYSTEM-WIDE CUSTOM COLUMN NAMES
// ============================================================================

/**
 * Get system-wide custom column display names for a table
 */
export const getColumnCustomNames = query({
  args: { tableIdentifier: v.string() },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("tableColumnCustomNames")
      .withIndex("by_table", (q) =>
        q.eq("tableIdentifier", args.tableIdentifier)
      )
      .first();
    return result;
  },
});

/**
 * Update a custom column display name (system-wide)
 * Only admin/super_admin can rename columns.
 * Empty customLabel removes the override (reverts to original).
 */
export const updateColumnCustomName = mutation({
  args: {
    tableIdentifier: v.string(),
    columnKey: v.string(),
    customLabel: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Check user role
    const user = await ctx.db.get(userId);
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      throw new Error("Only admins can rename column headers");
    }

    const existing = await ctx.db
      .query("tableColumnCustomNames")
      .withIndex("by_table", (q) =>
        q.eq("tableIdentifier", args.tableIdentifier)
      )
      .first();

    const trimmed = args.customLabel.trim();
    const now = Date.now();

    if (!existing) {
      // No custom names doc yet — create one (only if non-empty label)
      if (trimmed) {
        await ctx.db.insert("tableColumnCustomNames", {
          tableIdentifier: args.tableIdentifier,
          customLabels: [{ columnKey: args.columnKey, label: trimmed }],
          updatedBy: userId,
          updatedAt: now,
        });
      }
      return;
    }

    // Update existing document
    let labels = existing.customLabels.filter(
      (l) => l.columnKey !== args.columnKey
    );

    // Only add entry if non-empty (empty = reset to default)
    if (trimmed) {
      labels.push({ columnKey: args.columnKey, label: trimmed });
    }

    await ctx.db.patch(existing._id, {
      customLabels: labels,
      updatedBy: userId,
      updatedAt: now,
    });
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
      // === BUDGET ITEMS TABLE (main list page) ===
      // Frontend: tableIdentifier: "budgetItemsTable_v2"
      { tableId: "budgetItemsTable_v2", col: "particular", width: 280, flex: 2.8, minW: 180, maxW: 600 },
      { tableId: "budgetItemsTable_v2", col: "year", width: 80, flex: 0.8, minW: 60, maxW: 120 },
      { tableId: "budgetItemsTable_v2", col: "status", width: 130, flex: 1.3, minW: 90, maxW: 200 },
      { tableId: "budgetItemsTable_v2", col: "totalBudgetAllocated", width: 140, flex: 1.5, minW: 100, maxW: 220 },
      { tableId: "budgetItemsTable_v2", col: "obligatedBudget", width: 140, flex: 1.5, minW: 100, maxW: 220 },
      { tableId: "budgetItemsTable_v2", col: "totalBudgetUtilized", width: 140, flex: 1.5, minW: 100, maxW: 220 },
      { tableId: "budgetItemsTable_v2", col: "utilizationRate", width: 110, flex: 1, minW: 80, maxW: 160 },
      { tableId: "budgetItemsTable_v2", col: "projectCompleted", width: 100, flex: 1, minW: 70, maxW: 150 },
      { tableId: "budgetItemsTable_v2", col: "projectDelayed", width: 100, flex: 1, minW: 70, maxW: 150 },
      { tableId: "budgetItemsTable_v2", col: "projectsOngoing", width: 100, flex: 1, minW: 70, maxW: 150 },

      // === 20% DF TABLE ===
      // Frontend: tableIdentifier: "twentyPercentDFTable_v2"
      { tableId: "twentyPercentDFTable_v2", col: "particulars", width: 300, flex: 3, minW: 180, maxW: 600 },
      { tableId: "twentyPercentDFTable_v2", col: "year", width: 80, flex: 0.8, minW: 60, maxW: 120 },
      { tableId: "twentyPercentDFTable_v2", col: "status", width: 130, flex: 1.3, minW: 90, maxW: 200 },
      { tableId: "twentyPercentDFTable_v2", col: "totalBudgetAllocated", width: 140, flex: 1.5, minW: 100, maxW: 220 },
      { tableId: "twentyPercentDFTable_v2", col: "totalBudgetUtilized", width: 140, flex: 1.5, minW: 100, maxW: 220 },
      { tableId: "twentyPercentDFTable_v2", col: "utilizationRate", width: 110, flex: 1, minW: 80, maxW: 160 },
      { tableId: "twentyPercentDFTable_v2", col: "implementingOffice", width: 180, flex: 1.8, minW: 120, maxW: 300 },
      { tableId: "twentyPercentDFTable_v2", col: "remarks", width: 200, flex: 2, minW: 120, maxW: 400 },

      // === PROJECTS TABLE (breakdown) ===
      // Frontend: tableIdentifier: `projectsTable_${particularId || 'default'}`
      { tableId: "projectsTable_default", col: "aipRefCode", width: 140, flex: 2, minW: 100, maxW: 250 },
      { tableId: "projectsTable_default", col: "particulars", width: 320, flex: 3, minW: 180, maxW: 600 },
      { tableId: "projectsTable_default", col: "year", width: 80, flex: 0.8, minW: 60, maxW: 120 },
      { tableId: "projectsTable_default", col: "status", width: 130, flex: 1.3, minW: 90, maxW: 200 },
      { tableId: "projectsTable_default", col: "implementingOffice", width: 200, flex: 2, minW: 120, maxW: 300 },
      { tableId: "projectsTable_default", col: "totalBudgetAllocated", width: 140, flex: 1.5, minW: 100, maxW: 220 },
      { tableId: "projectsTable_default", col: "obligatedBudget", width: 140, flex: 1.5, minW: 100, maxW: 220 },
      { tableId: "projectsTable_default", col: "totalBudgetUtilized", width: 140, flex: 1.5, minW: 100, maxW: 220 },
      { tableId: "projectsTable_default", col: "utilizationRate", width: 110, flex: 1, minW: 80, maxW: 160 },
      { tableId: "projectsTable_default", col: "remarks", width: 200, flex: 2, minW: 120, maxW: 400 },

      // === FUNDS TABLES (Trust Funds, SEF, SHF) ===
      // Frontend: tableIdentifier: `${fundType}Table` (e.g., "trustFundsTable", "sefTable", "shfTable")
      { tableId: "trustFundsTable", col: "aipRefCode", width: 140, flex: 2, minW: 100, maxW: 250 },
      { tableId: "trustFundsTable", col: "projectTitle", width: 300, flex: 3, minW: 180, maxW: 600 },
      { tableId: "trustFundsTable", col: "status", width: 130, flex: 1.3, minW: 90, maxW: 200 },
      { tableId: "trustFundsTable", col: "received", width: 140, flex: 1.5, minW: 100, maxW: 220 },
      { tableId: "trustFundsTable", col: "obligatedPR", width: 140, flex: 1.5, minW: 100, maxW: 220 },
      { tableId: "trustFundsTable", col: "utilized", width: 140, flex: 1.5, minW: 100, maxW: 220 },
      { tableId: "trustFundsTable", col: "balance", width: 140, flex: 1.5, minW: 100, maxW: 220 },
      { tableId: "trustFundsTable", col: "utilizationRate", width: 110, flex: 1, minW: 80, maxW: 160 },
      { tableId: "trustFundsTable", col: "dateReceived", width: 120, flex: 1.2, minW: 90, maxW: 180 },
      { tableId: "trustFundsTable", col: "officeInCharge", width: 180, flex: 1.8, minW: 120, maxW: 300 },
      { tableId: "trustFundsTable", col: "remarks", width: 200, flex: 2, minW: 120, maxW: 400 },

      { tableId: "sefTable", col: "aipRefCode", width: 140, flex: 2, minW: 100, maxW: 250 },
      { tableId: "sefTable", col: "projectTitle", width: 300, flex: 3, minW: 180, maxW: 600 },
      { tableId: "sefTable", col: "status", width: 130, flex: 1.3, minW: 90, maxW: 200 },
      { tableId: "sefTable", col: "received", width: 140, flex: 1.5, minW: 100, maxW: 220 },
      { tableId: "sefTable", col: "obligatedPR", width: 140, flex: 1.5, minW: 100, maxW: 220 },
      { tableId: "sefTable", col: "utilized", width: 140, flex: 1.5, minW: 100, maxW: 220 },
      { tableId: "sefTable", col: "balance", width: 140, flex: 1.5, minW: 100, maxW: 220 },
      { tableId: "sefTable", col: "utilizationRate", width: 110, flex: 1, minW: 80, maxW: 160 },
      { tableId: "sefTable", col: "dateReceived", width: 120, flex: 1.2, minW: 90, maxW: 180 },
      { tableId: "sefTable", col: "officeInCharge", width: 180, flex: 1.8, minW: 120, maxW: 300 },
      { tableId: "sefTable", col: "remarks", width: 200, flex: 2, minW: 120, maxW: 400 },

      { tableId: "shfTable", col: "aipRefCode", width: 140, flex: 2, minW: 100, maxW: 250 },
      { tableId: "shfTable", col: "projectTitle", width: 300, flex: 3, minW: 180, maxW: 600 },
      { tableId: "shfTable", col: "status", width: 130, flex: 1.3, minW: 90, maxW: 200 },
      { tableId: "shfTable", col: "received", width: 140, flex: 1.5, minW: 100, maxW: 220 },
      { tableId: "shfTable", col: "obligatedPR", width: 140, flex: 1.5, minW: 100, maxW: 220 },
      { tableId: "shfTable", col: "utilized", width: 140, flex: 1.5, minW: 100, maxW: 220 },
      { tableId: "shfTable", col: "balance", width: 140, flex: 1.5, minW: 100, maxW: 220 },
      { tableId: "shfTable", col: "utilizationRate", width: 110, flex: 1, minW: 80, maxW: 160 },
      { tableId: "shfTable", col: "dateReceived", width: 120, flex: 1.2, minW: 90, maxW: 180 },
      { tableId: "shfTable", col: "officeInCharge", width: 180, flex: 1.8, minW: 120, maxW: 300 },
      { tableId: "shfTable", col: "remarks", width: 200, flex: 2, minW: 120, maxW: 400 },

      // === BREAKDOWN TABLE (legacy identifier) ===
      { tableId: "breakdown", col: "projectTitle", width: 280, flex: 2.8, minW: 180, maxW: 600 },
      { tableId: "breakdown", col: "implementingOffice", width: 180, flex: 1.8, minW: 120, maxW: 300 },
      { tableId: "breakdown", col: "allocatedBudget", width: 140, flex: 1.5, minW: 100, maxW: 220 },
      { tableId: "breakdown", col: "obligatedBudget", width: 140, flex: 1.5, minW: 100, maxW: 220 },
      { tableId: "breakdown", col: "budgetUtilized", width: 140, flex: 1.5, minW: 100, maxW: 220 },
      { tableId: "breakdown", col: "utilizationRate", width: 100, flex: 1, minW: 80, maxW: 160 },
      { tableId: "breakdown", col: "balance", width: 140, flex: 1.5, minW: 100, maxW: 220 },
      { tableId: "breakdown", col: "status", width: 120, flex: 1.2, minW: 90, maxW: 200 },
      { tableId: "breakdown", col: "remarks", width: 250, flex: 2.5, minW: 150, maxW: 400 },

      // === GOVT PROJECT BREAKDOWNS (grandchildren breakdown table) ===
      // Frontend: tableIdentifier: "govtProjectBreakdowns"
      { tableId: "govtProjectBreakdowns", col: "projectTitle", width: 280, flex: 2.8, minW: 180, maxW: 600 },
      { tableId: "govtProjectBreakdowns", col: "implementingOffice", width: 180, flex: 1.8, minW: 120, maxW: 300 },
      { tableId: "govtProjectBreakdowns", col: "allocatedBudget", width: 150, flex: 1.5, minW: 110, maxW: 220 },
      { tableId: "govtProjectBreakdowns", col: "obligatedBudget", width: 150, flex: 1.5, minW: 110, maxW: 220 },
      { tableId: "govtProjectBreakdowns", col: "budgetUtilized", width: 150, flex: 1.5, minW: 110, maxW: 220 },
      { tableId: "govtProjectBreakdowns", col: "utilizationRate", width: 120, flex: 1.2, minW: 100, maxW: 180 },
      { tableId: "govtProjectBreakdowns", col: "balance", width: 150, flex: 1.5, minW: 110, maxW: 220 },
      { tableId: "govtProjectBreakdowns", col: "dateStarted", width: 120, flex: 1.2, minW: 100, maxW: 180 },
      { tableId: "govtProjectBreakdowns", col: "targetDate", width: 120, flex: 1.2, minW: 100, maxW: 180 },
      { tableId: "govtProjectBreakdowns", col: "completionDate", width: 120, flex: 1.2, minW: 100, maxW: 180 },
      { tableId: "govtProjectBreakdowns", col: "projectAccomplishment", width: 100, flex: 1, minW: 80, maxW: 160 },
      { tableId: "govtProjectBreakdowns", col: "status", width: 120, flex: 1.2, minW: 90, maxW: 200 },
      { tableId: "govtProjectBreakdowns", col: "remarks", width: 250, flex: 2.5, minW: 150, maxW: 400 },

      // === TRUST FUND BREAKDOWNS ===
      { tableId: "trustFundBreakdowns", col: "projectTitle", width: 280, flex: 2.8, minW: 180, maxW: 600 },
      { tableId: "trustFundBreakdowns", col: "implementingOffice", width: 180, flex: 1.8, minW: 120, maxW: 300 },
      { tableId: "trustFundBreakdowns", col: "allocatedBudget", width: 150, flex: 1.5, minW: 110, maxW: 220 },
      { tableId: "trustFundBreakdowns", col: "obligatedBudget", width: 150, flex: 1.5, minW: 110, maxW: 220 },
      { tableId: "trustFundBreakdowns", col: "budgetUtilized", width: 150, flex: 1.5, minW: 110, maxW: 220 },
      { tableId: "trustFundBreakdowns", col: "utilizationRate", width: 120, flex: 1.2, minW: 100, maxW: 180 },
      { tableId: "trustFundBreakdowns", col: "balance", width: 150, flex: 1.5, minW: 110, maxW: 220 },
      { tableId: "trustFundBreakdowns", col: "dateStarted", width: 120, flex: 1.2, minW: 100, maxW: 180 },
      { tableId: "trustFundBreakdowns", col: "targetDate", width: 120, flex: 1.2, minW: 100, maxW: 180 },
      { tableId: "trustFundBreakdowns", col: "completionDate", width: 120, flex: 1.2, minW: 100, maxW: 180 },
      { tableId: "trustFundBreakdowns", col: "projectAccomplishment", width: 100, flex: 1, minW: 80, maxW: 160 },
      { tableId: "trustFundBreakdowns", col: "status", width: 120, flex: 1.2, minW: 90, maxW: 200 },
      { tableId: "trustFundBreakdowns", col: "remarks", width: 250, flex: 2.5, minW: 150, maxW: 400 },

      // === SPECIAL EDUCATION FUND BREAKDOWNS ===
      { tableId: "specialEducationFundBreakdowns", col: "projectTitle", width: 280, flex: 2.8, minW: 180, maxW: 600 },
      { tableId: "specialEducationFundBreakdowns", col: "implementingOffice", width: 180, flex: 1.8, minW: 120, maxW: 300 },
      { tableId: "specialEducationFundBreakdowns", col: "allocatedBudget", width: 150, flex: 1.5, minW: 110, maxW: 220 },
      { tableId: "specialEducationFundBreakdowns", col: "obligatedBudget", width: 150, flex: 1.5, minW: 110, maxW: 220 },
      { tableId: "specialEducationFundBreakdowns", col: "budgetUtilized", width: 150, flex: 1.5, minW: 110, maxW: 220 },
      { tableId: "specialEducationFundBreakdowns", col: "utilizationRate", width: 120, flex: 1.2, minW: 100, maxW: 180 },
      { tableId: "specialEducationFundBreakdowns", col: "balance", width: 150, flex: 1.5, minW: 110, maxW: 220 },
      { tableId: "specialEducationFundBreakdowns", col: "dateStarted", width: 120, flex: 1.2, minW: 100, maxW: 180 },
      { tableId: "specialEducationFundBreakdowns", col: "targetDate", width: 120, flex: 1.2, minW: 100, maxW: 180 },
      { tableId: "specialEducationFundBreakdowns", col: "completionDate", width: 120, flex: 1.2, minW: 100, maxW: 180 },
      { tableId: "specialEducationFundBreakdowns", col: "projectAccomplishment", width: 100, flex: 1, minW: 80, maxW: 160 },
      { tableId: "specialEducationFundBreakdowns", col: "status", width: 120, flex: 1.2, minW: 90, maxW: 200 },
      { tableId: "specialEducationFundBreakdowns", col: "remarks", width: 250, flex: 2.5, minW: 150, maxW: 400 },

      // === SPECIAL HEALTH FUND BREAKDOWNS ===
      { tableId: "specialHealthFundBreakdowns", col: "projectTitle", width: 280, flex: 2.8, minW: 180, maxW: 600 },
      { tableId: "specialHealthFundBreakdowns", col: "implementingOffice", width: 180, flex: 1.8, minW: 120, maxW: 300 },
      { tableId: "specialHealthFundBreakdowns", col: "allocatedBudget", width: 150, flex: 1.5, minW: 110, maxW: 220 },
      { tableId: "specialHealthFundBreakdowns", col: "obligatedBudget", width: 150, flex: 1.5, minW: 110, maxW: 220 },
      { tableId: "specialHealthFundBreakdowns", col: "budgetUtilized", width: 150, flex: 1.5, minW: 110, maxW: 220 },
      { tableId: "specialHealthFundBreakdowns", col: "utilizationRate", width: 120, flex: 1.2, minW: 100, maxW: 180 },
      { tableId: "specialHealthFundBreakdowns", col: "balance", width: 150, flex: 1.5, minW: 110, maxW: 220 },
      { tableId: "specialHealthFundBreakdowns", col: "dateStarted", width: 120, flex: 1.2, minW: 100, maxW: 180 },
      { tableId: "specialHealthFundBreakdowns", col: "targetDate", width: 120, flex: 1.2, minW: 100, maxW: 180 },
      { tableId: "specialHealthFundBreakdowns", col: "completionDate", width: 120, flex: 1.2, minW: 100, maxW: 180 },
      { tableId: "specialHealthFundBreakdowns", col: "projectAccomplishment", width: 100, flex: 1, minW: 80, maxW: 160 },
      { tableId: "specialHealthFundBreakdowns", col: "status", width: 120, flex: 1.2, minW: 90, maxW: 200 },
      { tableId: "specialHealthFundBreakdowns", col: "remarks", width: 250, flex: 2.5, minW: 150, maxW: 400 },

      // === IMPLEMENTING AGENCIES TABLE ===
      // Frontend: tableIdentifier: "implementing-agencies-table"
      { tableId: "implementing-agencies-table", col: "code", width: 100, flex: 1, minW: 70, maxW: 180 },
      { tableId: "implementing-agencies-table", col: "fullName", width: 250, flex: 2.5, minW: 180, maxW: 500 },
      { tableId: "implementing-agencies-table", col: "type", width: 120, flex: 1, minW: 90, maxW: 180 },
      { tableId: "implementing-agencies-table", col: "category", width: 140, flex: 1.2, minW: 100, maxW: 220 },
      { tableId: "implementing-agencies-table", col: "department", width: 180, flex: 1.8, minW: 120, maxW: 300 },
      { tableId: "implementing-agencies-table", col: "contactPerson", width: 160, flex: 1.5, minW: 120, maxW: 280 },
      { tableId: "implementing-agencies-table", col: "contactEmail", width: 180, flex: 1.5, minW: 120, maxW: 300 },
      { tableId: "implementing-agencies-table", col: "contactPhone", width: 130, flex: 1, minW: 100, maxW: 200 },
      { tableId: "implementing-agencies-table", col: "address", width: 200, flex: 2, minW: 140, maxW: 400 },
      { tableId: "implementing-agencies-table", col: "totalProjects", width: 100, flex: 0.8, minW: 70, maxW: 150 },
      { tableId: "implementing-agencies-table", col: "totalBreakdowns", width: 110, flex: 0.8, minW: 80, maxW: 160 },
      { tableId: "implementing-agencies-table", col: "isActive", width: 100, flex: 0.8, minW: 80, maxW: 150 },
      { tableId: "implementing-agencies-table", col: "createdAt", width: 120, flex: 1, minW: 100, maxW: 180 },
      { tableId: "implementing-agencies-table", col: "updatedAt", width: 120, flex: 1, minW: 100, maxW: 180 },

      // === TWENTY PERCENT DF BREAKDOWNS ===
      { tableId: "twentyPercentDFBreakdowns", col: "projectTitle", width: 280, flex: 2.8, minW: 180, maxW: 600 },
      { tableId: "twentyPercentDFBreakdowns", col: "implementingOffice", width: 180, flex: 1.8, minW: 120, maxW: 300 },
      { tableId: "twentyPercentDFBreakdowns", col: "allocatedBudget", width: 150, flex: 1.5, minW: 110, maxW: 220 },
      { tableId: "twentyPercentDFBreakdowns", col: "obligatedBudget", width: 150, flex: 1.5, minW: 110, maxW: 220 },
      { tableId: "twentyPercentDFBreakdowns", col: "budgetUtilized", width: 150, flex: 1.5, minW: 110, maxW: 220 },
      { tableId: "twentyPercentDFBreakdowns", col: "utilizationRate", width: 120, flex: 1.2, minW: 100, maxW: 180 },
      { tableId: "twentyPercentDFBreakdowns", col: "balance", width: 150, flex: 1.5, minW: 110, maxW: 220 },
      { tableId: "twentyPercentDFBreakdowns", col: "dateStarted", width: 120, flex: 1.2, minW: 100, maxW: 180 },
      { tableId: "twentyPercentDFBreakdowns", col: "targetDate", width: 120, flex: 1.2, minW: 100, maxW: 180 },
      { tableId: "twentyPercentDFBreakdowns", col: "completionDate", width: 120, flex: 1.2, minW: 100, maxW: 180 },
      { tableId: "twentyPercentDFBreakdowns", col: "projectAccomplishment", width: 100, flex: 1, minW: 80, maxW: 160 },
      { tableId: "twentyPercentDFBreakdowns", col: "status", width: 120, flex: 1.2, minW: 90, maxW: 200 },
      { tableId: "twentyPercentDFBreakdowns", col: "remarks", width: 250, flex: 2.5, minW: 150, maxW: 400 },
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
        maxWidth: def.maxW ?? Math.floor(def.width * 2),
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

/**
 * Clear corrupted user settings that have zero-width columns
 * Run this to fix settings that were saved with width: 0
 */
export const clearCorruptedSettings = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allSettings = await ctx.db.query("userTableSettings").collect();
    let deleted = 0;

    for (const settings of allSettings) {
      // Check if any column has zero width
      const hasZeroWidth = settings.columns?.some(col => col.width === 0);
      if (hasZeroWidth) {
        await ctx.db.delete(settings._id);
        deleted++;
        console.log(`[Convex] Deleted corrupted settings: ${settings.tableIdentifier} for user ${settings.userId}`);
      }
    }

    return { deleted, total: allSettings.length };
  },
});
