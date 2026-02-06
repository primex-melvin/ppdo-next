// convex/tableSettings.ts

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getSettings = query({
  args: { tableIdentifier: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("userTableSettings")
      .withIndex("by_user_and_table", (q) =>
        q.eq("userId", userId).eq("tableIdentifier", args.tableIdentifier)
      )
      .first();
  },
});

export const saveSettings = mutation({
  args: {
    tableIdentifier: v.string(),
    columns: v.array(
      v.object({
        fieldKey: v.string(),
        width: v.number(), // CHANGED: Made width required (not optional)
        isVisible: v.boolean(),
        pinned: v.optional(v.union(v.literal("left"), v.literal("right"), v.null())),
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