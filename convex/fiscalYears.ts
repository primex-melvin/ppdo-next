// convex/fiscalYears.ts
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Get all fiscal years (active only by default)
 */
export const list = query({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let years;
    
    if (args.includeInactive) {
      years = await ctx.db
        .query("fiscalYears")
        .order("desc")
        .collect();
    } else {
      years = await ctx.db
        .query("fiscalYears")
        .withIndex("isActive", (q) => q.eq("isActive", true))
        .order("desc")
        .collect();
    }

    return years.sort((a, b) => b.year - a.year);
  },
});

/**
 * Get a single fiscal year by year number
 */
export const getByYear = query({
  args: { year: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("fiscalYears")
      .withIndex("year", (q) => q.eq("year", args.year))
      .first();
  },
});

/**
 * Get the current fiscal year
 */
export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("fiscalYears")
      .withIndex("isCurrent", (q) => q.eq("isCurrent", true))
      .first();
  },
});

/**
 * Create a new fiscal year (Admin only)
 */
export const create = mutation({
  args: {
    year: v.number(),
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    setAsCurrent: v.optional(v.boolean()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check admin permissions
    const user = await ctx.db.get(userId);
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      throw new Error("Only admins can create fiscal years");
    }

    // Validate year range (1 AD to 300 years from now)
    const currentYear = new Date().getFullYear();
    const maxYear = currentYear + 300;
    
    if (args.year < 1 || args.year > maxYear) {
      throw new Error(`Year must be between 1 and ${maxYear}`);
    }

    // Check if year already exists
    const existing = await ctx.db
      .query("fiscalYears")
      .withIndex("year", (q) => q.eq("year", args.year))
      .first();

    if (existing) {
      throw new Error(`Fiscal year ${args.year} already exists`);
    }

    const now = Date.now();

    // If setting as current, unset any existing current year
    if (args.setAsCurrent) {
      const currentYears = await ctx.db
        .query("fiscalYears")
        .withIndex("isCurrent", (q) => q.eq("isCurrent", true))
        .collect();

      for (const cy of currentYears) {
        await ctx.db.patch(cy._id, {
          isCurrent: false,
          updatedAt: now,
          updatedBy: userId,
        });
      }
    }

    // Create the fiscal year
    const yearId = await ctx.db.insert("fiscalYears", {
      year: args.year,
      label: args.label,
      description: args.description,
      isActive: true,
      isCurrent: args.setAsCurrent || false,
      budgetItemCount: 0,
      projectCount: 0,
      breakdownCount: 0,
      notes: args.notes,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, yearId };
  },
});

/**
 * Update a fiscal year (Admin only)
 */
export const update = mutation({
  args: {
    id: v.id("fiscalYears"),
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    setAsCurrent: v.optional(v.boolean()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check admin permissions
    const user = await ctx.db.get(userId);
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      throw new Error("Only admins can update fiscal years");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Fiscal year not found");

    const now = Date.now();

    // If setting as current, unset any existing current year
    if (args.setAsCurrent) {
      const currentYears = await ctx.db
        .query("fiscalYears")
        .withIndex("isCurrent", (q) => q.eq("isCurrent", true))
        .collect();

      for (const cy of currentYears) {
        if (cy._id !== args.id) {
          await ctx.db.patch(cy._id, {
            isCurrent: false,
            updatedAt: now,
            updatedBy: userId,
          });
        }
      }
    }

    // Update the fiscal year
    await ctx.db.patch(args.id, {
      ...(args.label !== undefined && { label: args.label }),
      ...(args.description !== undefined && { description: args.description }),
      ...(args.isActive !== undefined && { isActive: args.isActive }),
      ...(args.setAsCurrent !== undefined && { isCurrent: args.setAsCurrent }),
      ...(args.notes !== undefined && { notes: args.notes }),
      updatedAt: now,
      updatedBy: userId,
    });

    return { success: true };
  },
});

/**
 * Delete a fiscal year (Admin only)
 * NOTE: This does NOT cascade delete budgets/projects/breakdowns
 */
export const remove = mutation({
  args: {
    id: v.id("fiscalYears"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check admin permissions
    const user = await ctx.db.get(userId);
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      throw new Error("Only admins can delete fiscal years");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Fiscal year not found");

    // Delete the year (data remains intact)
    await ctx.db.delete(args.id);

    return { 
      success: true, 
      message: `Fiscal year ${existing.year} deleted. Associated data remains intact.` 
    };
  },
});

/**
 * Update usage counts for a fiscal year
 * This is called internally when budgets/projects/breakdowns are created/deleted
 */
export const updateUsageCounts = mutation({
  args: {
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const yearRecord = await ctx.db
      .query("fiscalYears")
      .withIndex("year", (q) => q.eq("year", args.year))
      .first();

    if (!yearRecord) return { success: false, message: "Year not found" };

    // Count budget items
    const budgetItems = await ctx.db
      .query("budgetItems")
      .withIndex("year", (q) => q.eq("year", args.year))
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    // Count projects
    const projects = await ctx.db
      .query("projects")
      .withIndex("year", (q) => q.eq("year", args.year))
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    // Count breakdowns (this is more complex - need to check via projects)
    let breakdownCount = 0;
    for (const project of projects) {
      const breakdowns = await ctx.db
        .query("govtProjectBreakdowns")
        .withIndex("projectId", (q) => q.eq("projectId", project._id))
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .collect();
      breakdownCount += breakdowns.length;
    }

    // Update counts
    await ctx.db.patch(yearRecord._id, {
      budgetItemCount: budgetItems.length,
      projectCount: projects.length,
      breakdownCount: breakdownCount,
      updatedAt: Date.now(),
      updatedBy: userId,
    });

    return { success: true };
  },
});