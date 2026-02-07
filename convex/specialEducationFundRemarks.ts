// convex/specialEducationFundRemarks.ts

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Create a new special education fund remark
 */
export const createRemark = mutation({
  args: {
    specialEducationFundId: v.id("specialEducationFunds"),
    inspectionId: v.optional(v.id("inspections")),
    content: v.string(),
    category: v.optional(v.string()),
    priority: v.optional(
      v.union(
        v.literal("high"),
        v.literal("medium"),
        v.literal("low")
      )
    ),
    tags: v.optional(v.string()),
    isPinned: v.optional(v.boolean()),
    attachments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify special education fund exists
    const fund = await ctx.db.get(args.specialEducationFundId);
    if (!fund) {
      throw new Error("Special education fund not found");
    }

    // Verify inspection exists if provided
    if (args.inspectionId) {
      const inspection = await ctx.db.get(args.inspectionId);
      if (!inspection) {
        throw new Error("Inspection not found");
      }
    }

    const now = Date.now();

    const remarkId = await ctx.db.insert("specialEducationFundRemarks", {
      specialEducationFundId: args.specialEducationFundId,
      inspectionId: args.inspectionId,
      content: args.content,
      category: args.category,
      priority: args.priority,
      tags: args.tags,
      isPinned: args.isPinned || false,
      attachments: args.attachments,
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    return remarkId;
  },
});

/**
 * Update an existing remark
 */
export const updateRemark = mutation({
  args: {
    remarkId: v.id("specialEducationFundRemarks"),
    content: v.optional(v.string()),
    category: v.optional(v.string()),
    priority: v.optional(
      v.union(
        v.literal("high"),
        v.literal("medium"),
        v.literal("low")
      )
    ),
    tags: v.optional(v.string()),
    isPinned: v.optional(v.boolean()),
    attachments: v.optional(v.string()),
    inspectionId: v.optional(v.id("inspections")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const { remarkId, ...updates } = args;

    // Verify remark exists
    const remark = await ctx.db.get(remarkId);
    if (!remark) {
      throw new Error("Remark not found");
    }

    // Verify inspection exists if provided
    if (args.inspectionId) {
      const inspection = await ctx.db.get(args.inspectionId);
      if (!inspection) {
        throw new Error("Inspection not found");
      }
    }

    // Update the remark
    await ctx.db.patch(remarkId, {
      ...updates,
      updatedBy: userId,
      updatedAt: Date.now(),
    });

    return remarkId;
  },
});

/**
 * Delete a remark
 */
export const deleteRemark = mutation({
  args: {
    remarkId: v.id("specialEducationFundRemarks"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify remark exists
    const remark = await ctx.db.get(args.remarkId);
    if (!remark) {
      throw new Error("Remark not found");
    }

    await ctx.db.delete(args.remarkId);

    return { success: true };
  },
});

/**
 * Get a single remark by ID
 */
export const getRemark = query({
  args: {
    remarkId: v.id("specialEducationFundRemarks"),
  },
  handler: async (ctx, args) => {
    const remark = await ctx.db.get(args.remarkId);
    if (!remark) {
      return null;
    }

    // Get related data
    const fund = await ctx.db.get(remark.specialEducationFundId);
    const creator = await ctx.db.get(remark.createdBy);
    const updater = await ctx.db.get(remark.updatedBy);

    let inspection = null;
    if (remark.inspectionId) {
      inspection = await ctx.db.get(remark.inspectionId);
    }

    return {
      ...remark,
      fund,
      inspection,
      creator,
      updater,
    };
  },
});

/**
 * List all remarks for a special education fund
 */
export const listRemarksByFund = query({
  args: {
    specialEducationFundId: v.id("specialEducationFunds"),
    category: v.optional(v.string()),
    priority: v.optional(
      v.union(
        v.literal("high"),
        v.literal("medium"),
        v.literal("low")
      )
    ),
    isPinned: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let remarksQuery = ctx.db
      .query("specialEducationFundRemarks")
      .withIndex("specialEducationFundId", (q) =>
        q.eq("specialEducationFundId", args.specialEducationFundId)
      );

    let remarks = await remarksQuery.collect();

    // Filter by category if provided
    if (args.category) {
      remarks = remarks.filter((r) => r.category === args.category);
    }

    // Filter by priority if provided
    if (args.priority) {
      remarks = remarks.filter((r) => r.priority === args.priority);
    }

    // Filter by pinned status if provided
    if (args.isPinned !== undefined) {
      remarks = remarks.filter((r) => r.isPinned === args.isPinned);
    }

    // Sort by pinned first, then by creation date (most recent first)
    const sortedRemarks = remarks.sort((a, b) => {
      // Pinned remarks come first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Then sort by date (newest first)
      return b.createdAt - a.createdAt;
    });

    // Enrich with creator info
    const enrichedRemarks = await Promise.all(
      sortedRemarks.map(async (remark) => {
        const creator = await ctx.db.get(remark.createdBy);
        const updater = await ctx.db.get(remark.updatedBy);

        let inspection = null;
        if (remark.inspectionId) {
          inspection = await ctx.db.get(remark.inspectionId);
        }

        return {
          ...remark,
          creator,
          updater,
          inspection,
        };
      })
    );

    return enrichedRemarks;
  },
});

/**
 * List all remarks for a specific inspection
 */
export const listRemarksByInspection = query({
  args: {
    inspectionId: v.id("inspections"),
  },
  handler: async (ctx, args) => {
    const remarks = await ctx.db
      .query("specialEducationFundRemarks")
      .withIndex("inspectionId", (q) => q.eq("inspectionId", args.inspectionId))
      .collect();

    // Sort by creation date (most recent first)
    const sortedRemarks = remarks.sort((a, b) => b.createdAt - a.createdAt);

    // Enrich with creator info
    const enrichedRemarks = await Promise.all(
      sortedRemarks.map(async (remark) => {
        const creator = await ctx.db.get(remark.createdBy);
        const updater = await ctx.db.get(remark.updatedBy);
        const fund = await ctx.db.get(remark.specialEducationFundId);

        return {
          ...remark,
          creator,
          updater,
          fund,
        };
      })
    );

    return enrichedRemarks;
  },
});

/**
 * Toggle pin status of a remark
 */
export const togglePinRemark = mutation({
  args: {
    remarkId: v.id("specialEducationFundRemarks"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const remark = await ctx.db.get(args.remarkId);
    if (!remark) {
      throw new Error("Remark not found");
    }

    await ctx.db.patch(args.remarkId, {
      isPinned: !remark.isPinned,
      updatedBy: userId,
      updatedAt: Date.now(),
    });

    return { isPinned: !remark.isPinned };
  },
});

/**
 * Get remark statistics for a fund
 */
export const getFundRemarkStats = query({
  args: {
    specialEducationFundId: v.id("specialEducationFunds"),
  },
  handler: async (ctx, args) => {
    const remarks = await ctx.db
      .query("specialEducationFundRemarks")
      .withIndex("specialEducationFundId", (q) =>
        q.eq("specialEducationFundId", args.specialEducationFundId)
      )
      .collect();

    const stats = {
      total: remarks.length,
      pinned: remarks.filter((r) => r.isPinned === true).length,
      highPriority: remarks.filter((r) => r.priority === "high").length,
      mediumPriority: remarks.filter((r) => r.priority === "medium").length,
      lowPriority: remarks.filter((r) => r.priority === "low").length,
      withInspection: remarks.filter((r) => r.inspectionId !== undefined).length,
      general: remarks.filter((r) => r.inspectionId === undefined).length,
    };

    // Get categories count
    const categories: Record<string, number> = {};
    remarks.forEach((remark) => {
      if (remark.category) {
        categories[remark.category] = (categories[remark.category] || 0) + 1;
      }
    });

    return {
      ...stats,
      categories,
    };
  },
});

/**
 * Search remarks by content
 */
export const searchRemarks = query({
  args: {
    searchTerm: v.string(),
    specialEducationFundId: v.optional(v.id("specialEducationFunds")),
  },
  handler: async (ctx, args) => {
    const searchLower = args.searchTerm.toLowerCase();

    let remarks;
    if (args.specialEducationFundId !== undefined) {
      remarks = await ctx.db
        .query("specialEducationFundRemarks")
        .withIndex("specialEducationFundId", (q) =>
          q.eq("specialEducationFundId", args.specialEducationFundId!)
        )
        .collect();
    } else {
      remarks = await ctx.db.query("specialEducationFundRemarks").collect();
    }

    // Filter by search term in content or category
    const filtered = remarks.filter(
      (remark) =>
        remark.content.toLowerCase().includes(searchLower) ||
        (remark.category && remark.category.toLowerCase().includes(searchLower))
    );

    // Sort by relevance (content match comes first, then by date)
    const sorted = filtered.sort((a, b) => {
      const aContentMatch = a.content.toLowerCase().includes(searchLower);
      const bContentMatch = b.content.toLowerCase().includes(searchLower);
      if (aContentMatch && !bContentMatch) return -1;
      if (!aContentMatch && bContentMatch) return 1;
      return b.createdAt - a.createdAt;
    });

    // Enrich with creator and fund info
    const enrichedRemarks = await Promise.all(
      sorted.map(async (remark) => {
        const creator = await ctx.db.get(remark.createdBy);
        const updater = await ctx.db.get(remark.updatedBy);
        const fund = await ctx.db.get(remark.specialEducationFundId);

        return {
          ...remark,
          creator,
          updater,
          fund,
        };
      })
    );

    return enrichedRemarks;
  },
});
