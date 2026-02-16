// convex/budgetParticularAccess.ts

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

/**
 * Check if current user can access a specific budget particular page
 */
export const canAccessParticular = query({
  args: { particularCode: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {
        canAccess: false,
        user: null,
        department: null,
        accessLevel: null,
        accessSource: null,
      };
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return {
        canAccess: false,
        user: null,
        department: null,
        accessLevel: null,
        accessSource: null,
      };
    }

    // Super admins and admins have access to everything
    if (user.role === "super_admin" || user.role === "admin") {
      return {
        canAccess: true,
        user,
        department: user.departmentId
          ? await ctx.db.get(user.departmentId)
          : null,
        accessLevel: "full",
        accessSource: "role",
      };
    }

    // Check if user has been granted specific access to this particular
    const particularAccess = await ctx.db
      .query("budgetParticularSharedAccess")
      .withIndex("particularAndUser", (q) =>
        q.eq("particularCode", args.particularCode).eq("userId", userId)
      )
      .first();

    if (particularAccess && particularAccess.isActive) {
      return {
        canAccess: true,
        user,
        department: user.departmentId
          ? await ctx.db.get(user.departmentId)
          : null,
        accessLevel: particularAccess.accessLevel || "viewer",
        accessSource: "particular_access",
      };
    }

    // No access
    return {
      canAccess: false,
      user,
      department: user.departmentId
        ? await ctx.db.get(user.departmentId)
        : null,
      accessLevel: null,
      accessSource: null,
    };
  },
});

/**
 * Get all users who have been granted access to a specific particular
 * Returns enriched access records with user information
 */
export const getSharedUsers = query({
  args: { particularCode: v.string() },
  handler: async (ctx, args): Promise<Array<{
    _id: Id<"budgetParticularSharedAccess">;
    userId: Id<"users">;
    userName: string;
    userEmail: string;
    departmentName?: string;
    accessLevel: "viewer" | "editor" | "admin";
    grantedAt: number;
    grantedBy: Id<"users">;
  }>> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const currentUser = await ctx.db.get(userId);
    if (!currentUser) return [];

    // Only admins can view shared users
    if (
      currentUser.role !== "admin" &&
      currentUser.role !== "super_admin"
    ) {
      return [];
    }

    // Get all active access records for this particular
    const accessRecords = await ctx.db
      .query("budgetParticularSharedAccess")
      .withIndex("particularAndActive", (q) =>
        q.eq("particularCode", args.particularCode).eq("isActive", true)
      )
      .collect();

    // Get user details for each access record and enrich the data
    const enrichedRecords: Array<{
      _id: Id<"budgetParticularSharedAccess">;
      userId: Id<"users">;
      userName: string;
      userEmail: string;
      departmentName?: string;
      accessLevel: "viewer" | "editor" | "admin";
      grantedAt: number;
      grantedBy: Id<"users">;
    }> = [];

    for (const record of accessRecords) {
      const user = await ctx.db.get(record.userId);
      if (!user) continue; // Skip if user not found

      let departmentName: string | undefined = undefined;
      if (user.departmentId) {
        const dept = await ctx.db.get(user.departmentId);
        departmentName = (dept as any)?.name ?? (dept as any)?.fullName;
      }

      enrichedRecords.push({
        _id: record._id,
        userId: record.userId,
        userName: user.name || 
                 (user.firstName && user.lastName 
                   ? `${user.firstName} ${user.lastName}`.trim() 
                   : "Unknown"),
        userEmail: user.email || "",
        departmentName,
        accessLevel: record.accessLevel,
        grantedAt: record.grantedAt,
        grantedBy: record.grantedBy,
      });
    }

    return enrichedRecords;
  },
});

/**
 * Grant access to a user for a specific particular
 */
export const grantAccess = mutation({
  args: {
    particularCode: v.string(),
    userId: v.id("users"),
    accessLevel: v.optional(
      v.union(v.literal("viewer"), v.literal("editor"), v.literal("admin"))
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

    // Only admins can grant access
    if (
      currentUser.role !== "admin" &&
      currentUser.role !== "super_admin"
    ) {
      throw new Error("Only admins can grant access");
    }

    // Check if access already exists
    const existingAccess = await ctx.db
      .query("budgetParticularSharedAccess")
      .withIndex("particularAndUser", (q) =>
        q.eq("particularCode", args.particularCode).eq("userId", args.userId)
      )
      .first();

    const now = Date.now();

    if (existingAccess) {
      // Update existing access
      await ctx.db.patch(existingAccess._id, {
        isActive: true,
        accessLevel: args.accessLevel || "viewer",
        grantedBy: currentUserId,
        grantedAt: now,
      });
      return existingAccess._id;
    } else {
      // Create new access record
      const accessId = await ctx.db.insert("budgetParticularSharedAccess", {
        particularCode: args.particularCode,
        userId: args.userId,
        accessLevel: args.accessLevel || "viewer",
        isActive: true,
        grantedBy: currentUserId,
        grantedAt: now,
      });
      return accessId;
    }
  },
});

/**
 * Revoke access from a user for a specific particular
 */
export const revokeAccess = mutation({
  args: {
    particularCode: v.string(),
    userId: v.id("users"),
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

    // Only admins can revoke access
    if (
      currentUser.role !== "admin" &&
      currentUser.role !== "super_admin"
    ) {
      throw new Error("Only admins can revoke access");
    }

    // Find and deactivate the access record
    const accessRecord = await ctx.db
      .query("budgetParticularSharedAccess")
      .withIndex("particularAndUser", (q) =>
        q.eq("particularCode", args.particularCode).eq("userId", args.userId)
      )
      .first();

    if (accessRecord) {
      await ctx.db.patch(accessRecord._id, {
        isActive: false,
        revokedBy: currentUserId,
        revokedAt: Date.now(),
      });
    }

    return { success: true };
  },
});