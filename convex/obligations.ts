// convex/obligations.ts

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Create a new obligation entry
 */
export const create = mutation({
  args: {
    projectId: v.id("projects"),
    amount: v.number(),
    name: v.string(),
    email: v.string(),
    type: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();

    const obligationId = await ctx.db.insert("obligations", {
      projectId: args.projectId,
      amount: args.amount,
      name: args.name,
      email: args.email,
      type: args.type,
      description: args.description,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    return obligationId;
  },
});

/**
 * Get recent obligations for a project (for Overview page)
 */
export const getRecentByProject = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const limit = args.limit || 4;

    const obligations = await ctx.db
      .query("obligations")
      .withIndex("projectId", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(limit);

    return obligations;
  },
});

/**
 * Get all obligations for a project
 */
export const listByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const obligations = await ctx.db
      .query("obligations")
      .withIndex("projectId", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();

    return obligations;
  },
});

/**
 * Update an obligation
 */
export const update = mutation({
  args: {
    id: v.id("obligations"),
    amount: v.number(),
    name: v.string(),
    email: v.string(),
    type: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Obligation not found");
    }

    const now = Date.now();

    await ctx.db.patch(args.id, {
      amount: args.amount,
      name: args.name,
      email: args.email,
      type: args.type,
      description: args.description,
      updatedAt: now,
    });

    return args.id;
  },
});

/**
 * Delete an obligation
 */
export const remove = mutation({
  args: {
    id: v.id("obligations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Obligation not found");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});