// convex/breakdownSharedAccess.ts

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

/**
 * Grant access to a user for a specific breakdown entity
 */
export const grantAccess = mutation({
  args: {
    userId: v.id("users"),
    entityType: v.union(
      v.literal("project"),
      v.literal("trustfund"),
      v.literal("specialeducationfund"),
      v.literal("specialhealthfund"),
      v.literal("twentyPercentDF")
    ),
    entityId: v.string(),
    accessLevel: v.union(
      v.literal("viewer"),
      v.literal("editor"),
      v.literal("admin")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser) {
      throw new Error("User not found");
    }

    // Only super_admin and admin can grant access
    if (currentUser.role !== "super_admin" && currentUser.role !== "admin") {
      throw new Error("Not authorized - administrator access required");
    }

    // Check if user already has access for this entity
    const existingAccess = await ctx.db
      .query("breakdownSharedAccess")
      .withIndex("userIdAndEntity", (q) => 
        q.eq("userId", args.userId)
          .eq("entityId", args.entityId)
          .eq("entityType", args.entityType)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    const now = Date.now();

    if (existingAccess) {
      // Update existing access
      await ctx.db.patch(existingAccess._id, {
        accessLevel: args.accessLevel,
        grantedBy: currentUserId,
        grantedAt: now,
        notes: args.notes,
      });
      return existingAccess._id;
    } else {
      // Create new access
      const accessId = await ctx.db.insert("breakdownSharedAccess", {
        userId: args.userId,
        entityType: args.entityType,
        entityId: args.entityId,
        accessLevel: args.accessLevel,
        grantedBy: currentUserId,
        grantedAt: now,
        isActive: true,
        notes: args.notes,
      });
      return accessId;
    }
  },
});

/**
 * Revoke access from a user for a specific breakdown entity
 */
export const revokeAccess = mutation({
  args: {
    userId: v.id("users"),
    entityId: v.string(),
    entityType: v.union(
      v.literal("project"),
      v.literal("trustfund"),
      v.literal("specialeducationfund"),
      v.literal("specialhealthfund"),
      v.literal("twentyPercentDF")
    ),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser) {
      throw new Error("User not found");
    }

    // Only super_admin and admin can revoke access
    if (currentUser.role !== "super_admin" && currentUser.role !== "admin") {
      throw new Error("Not authorized - administrator access required");
    }

    const existingAccess = await ctx.db
      .query("breakdownSharedAccess")
      .withIndex("userIdAndEntity", (q) => 
        q.eq("userId", args.userId)
          .eq("entityId", args.entityId)
          .eq("entityType", args.entityType)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!existingAccess) {
      throw new Error("No active access found for this user");
    }

    await ctx.db.patch(existingAccess._id, {
      isActive: false,
    });

    return { success: true };
  },
});

/**
 * List all users with access for a specific breakdown entity
 */
export const listUsersWithAccess = query({
  args: {
    entityId: v.string(),
    entityType: v.union(
      v.literal("project"),
      v.literal("trustfund"),
      v.literal("specialeducationfund"),
      v.literal("specialhealthfund"),
      v.literal("twentyPercentDF")
    ),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      return [];
    }

    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser) {
      return [];
    }

    // Only super_admin and admin can view access list
    if (currentUser.role !== "super_admin" && currentUser.role !== "admin") {
      return [];
    }

    const accessRecords = await ctx.db
      .query("breakdownSharedAccess")
      .withIndex("entityId", (q) => q.eq("entityId", args.entityId))
      .filter((q) => q.eq(q.field("entityType"), args.entityType))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Enrich with user details
    const enrichedRecords = await Promise.all(
      accessRecords.map(async (record) => {
        const user = await ctx.db.get(record.userId);
        const grantedByUser = await ctx.db.get(record.grantedBy);
        
        let department = null;
        if (user?.departmentId) {
          department = await ctx.db.get(user.departmentId);
        }

        return {
          ...record,
          userName: user?.name || "Unknown",
          userEmail: user?.email || "",
          departmentName: (department as any)?.name ?? (department as any)?.fullName,
          grantedByName: grantedByUser?.name || "Unknown",
          grantedByEmail: grantedByUser?.email || "",
        };
      })
    );

    return enrichedRecords;
  },
});

/**
 * Check if current user has access to a breakdown entity
 */
export const checkAccess = query({
  args: {
    entityId: v.string(),
    entityType: v.union(
      v.literal("project"),
      v.literal("trustfund"),
      v.literal("specialeducationfund"),
      v.literal("specialhealthfund"),
      v.literal("twentyPercentDF")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { hasAccess: false, accessLevel: null };
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return { hasAccess: false, accessLevel: null };
    }

    // Super admins always have access
    if (user.role === "super_admin") {
      return { hasAccess: true, accessLevel: "admin" };
    }

    // Check for explicit access
    const accessRecord = await ctx.db
      .query("breakdownSharedAccess")
      .withIndex("userIdAndEntity", (q) => 
        q.eq("userId", userId)
          .eq("entityId", args.entityId)
          .eq("entityType", args.entityType)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (accessRecord) {
      return { hasAccess: true, accessLevel: accessRecord.accessLevel };
    }

    return { hasAccess: false, accessLevel: null };
  },
});

/**
 * Get pending access requests count for breakdown entities
 */
export const getPendingCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return 0;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return 0;
    }

    // Only super_admin and admin can see pending counts
    if (user.role !== "super_admin" && user.role !== "admin") {
      return 0;
    }

    // Get all access requests with breakdown-related access types
    const requests = await ctx.db
      .query("accessRequests")
      .withIndex("status", (q) => q.eq("status", "pending"))
      .collect();

    // Filter for breakdown-related requests
    const breakdownRequests = requests.filter(
      (req) => req.accessType === "breakdown" || 
               req.pageRequested?.includes("breakdown") ||
               req.pageRequested?.includes("projectbreakdown")
    );

    return breakdownRequests.length;
  },
});
