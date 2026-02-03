// convex/passwordResetManagement.ts

import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Scrypt } from "./lib/scrypt";

/**
 * Update password reset request status (admin only)
 * Used for rejection
 */
export const updateRequestStatus = mutation({
  args: {
    requestId: v.id("passwordResetRequests"),
    status: v.union(
      v.literal("approved"),
      v.literal("rejected")
    ),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Authentication required");
    }

    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser) {
      throw new Error("User not found");
    }

    // Only super_admin and admin can update status
    if (currentUser.role !== "super_admin" && currentUser.role !== "admin") {
      throw new Error("Not authorized - administrator access required");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Password reset request not found");
    }

    if (request.status !== "pending") {
      throw new Error("Only pending requests can be updated");
    }

    const now = Date.now();

    // Update the request
    await ctx.db.patch(args.requestId, {
      status: args.status,
      reviewedBy: currentUserId,
      reviewedAt: now,
      adminNotes: args.adminNotes,
    });

    // Log the action in audit log
    await ctx.db.insert("userAuditLog", {
      performedBy: currentUserId,
      targetUserId: request.userId,
      action: "user_updated",
      notes: `Password reset request ${args.status}`,
      previousValues: JSON.stringify({ status: request.status }),
      newValues: JSON.stringify({ 
        status: args.status,
        adminNotes: args.adminNotes 
      }),
      timestamp: now,
    });

    return { success: true };
  },
});

/**
 * Set new password for user (admin only)
 * This approves the request and sets the new password
 * 
 * SECURITY NOTE: 
 * - The new password is ONLY hashed, never stored in plain text
 * - The old password is NEVER accessible to admins - it remains encrypted
 * - The password hash is generated using Convex Auth's secure hashing
 * - We DO NOT store the plain text password anywhere in the database
 * - The newPasswordHash field in the request table stores ONLY the hash
 */
export const setNewPassword = mutation({
  args: {
    requestId: v.id("passwordResetRequests"),
    newPassword: v.string(),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Authentication required");
    }

    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser) {
      throw new Error("User not found");
    }

    // Only super_admin and admin can set passwords
    if (currentUser.role !== "super_admin" && currentUser.role !== "admin") {
      throw new Error("Not authorized - administrator access required");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Password reset request not found");
    }

    if (request.status !== "pending") {
      throw new Error("Only pending requests can be processed");
    }

    if (!request.userId) {
      throw new Error("User not found for this request");
    }

    const targetUser = await ctx.db.get(request.userId);
    if (!targetUser) {
      throw new Error("Target user not found");
    }

    // Validate password strength
    if (args.newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    const hasUppercase = /[A-Z]/.test(args.newPassword);
    const hasLowercase = /[a-z]/.test(args.newPassword);
    const hasNumber = /[0-9]/.test(args.newPassword);
    const hasSymbol = /[!@#$%^&*]/.test(args.newPassword);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSymbol) {
      throw new Error(
        "Password must contain at least one uppercase letter, lowercase letter, number, and symbol (!@#$%^&*)"
      );
    }

    const now = Date.now();

    // CRITICAL SECURITY: Hash the password using crypto
    // This ensures the plain text password is NEVER stored anywhere
    // The old password remains securely encrypted and is NEVER accessible
    // We use SHA-256 with bcrypt-style salting for maximum security
    const hashedPassword = await hashPassword(args.newPassword);

    // Find the user's account
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => 
        q.eq("userId", request.userId!).eq("provider", "password")
      )
      .first();

    if (!account) {
      throw new Error("Password account not found for this user");
    }

    // SECURITY: We are replacing the old encrypted password hash 
    // with the new encrypted password hash
    // At no point does any admin have access to either the old or new password in plain text
    // The old password hash is permanently replaced and cannot be recovered
    await ctx.db.patch(account._id, {
      secret: hashedPassword,
    });

    // Update the password reset request to "approved" status
    // SECURITY NOTE: We store ONLY the hash, not the plain text password
    await ctx.db.patch(args.requestId, {
      status: "approved",
      reviewedBy: currentUserId,
      reviewedAt: now,
      adminNotes: args.adminNotes,
      newPasswordHash: hashedPassword, // ONLY the hash is stored, never plain text
      passwordChangedAt: now,
      passwordChangedBy: currentUserId,
    });

    // Reset failed login attempts and unlock account if locked
    await ctx.db.patch(request.userId, {
      failedLoginAttempts: 0,
      isLocked: false,
      lockReason: undefined,
      lockedAt: undefined,
      updatedAt: now,
    });

    // Log the action in audit log
    // SECURITY: No password information (old or new) is logged
    await ctx.db.insert("userAuditLog", {
      performedBy: currentUserId,
      targetUserId: request.userId,
      action: "user_updated",
      notes: "Password reset approved by administrator - old password permanently replaced",
      previousValues: JSON.stringify({ 
        status: request.status,
        // We do NOT log password hashes for security
      }),
      newValues: JSON.stringify({ 
        status: "approved",
        passwordChanged: true,
        // We do NOT log password hashes for security
      }),
      timestamp: now,
    });

    // Create security alert for the user
    await ctx.db.insert("securityAlerts", {
      type: "suspicious_login",
      severity: "medium",
      userId: request.userId,
      title: "Password Reset Completed",
      description: `Your password has been reset by an administrator. You can now log in with your new password. Your old password has been permanently replaced and is no longer accessible.`,
      metadata: JSON.stringify({
        resetBy: currentUser.email,
        resetByName: currentUser.name,
        resetAt: now,
        // We do NOT store password information in metadata
      }),
      status: "open",
      createdAt: now,
    });

    return { 
      success: true,
      message: "Password reset completed successfully. The old password has been permanently replaced." 
    };
  },
});

/**
 * Get password reset request details (admin only)
 */
export const getRequestDetails = mutation({
  args: {
    requestId: v.id("passwordResetRequests"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Authentication required");
    }

    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser) {
      throw new Error("User not found");
    }

    // Only super_admin and admin can view details
    if (currentUser.role !== "super_admin" && currentUser.role !== "admin") {
      throw new Error("Not authorized - administrator access required");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Password reset request not found");
    }

    // Enrich with user information
    let user = null;
    if (request.userId) {
      user = await ctx.db.get(request.userId);
    }

    let reviewedBy = null;
    if (request.reviewedBy) {
      reviewedBy = await ctx.db.get(request.reviewedBy);
    }

    let passwordChangedBy = null;
    if (request.passwordChangedBy) {
      passwordChangedBy = await ctx.db.get(request.passwordChangedBy);
    }

    // SECURITY: We do NOT return password hashes or any password-related data
    return {
      _id: request._id,
      userId: request.userId,
      email: request.email,
      message: request.message,
      status: request.status,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      geoLocation: request.geoLocation,
      requestedAt: request.requestedAt,
      reviewedAt: request.reviewedAt,
      adminNotes: request.adminNotes,
      passwordChangedAt: request.passwordChangedAt,
      userName: user?.name,
      userEmail: user?.email,
      userDepartment: user?.departmentId,
      reviewedByName: reviewedBy?.name,
      reviewedByEmail: reviewedBy?.email,
      passwordChangedByName: passwordChangedBy?.name,
      passwordChangedByEmail: passwordChangedBy?.email,
      // We explicitly do NOT return newPasswordHash or any password data
    };
  },
});

/**
 * Delete old password reset requests (admin only)
 * Useful for cleanup - delete requests older than 30 days
 */
export const cleanupOldRequests = mutation({
  args: {
    olderThanDays: v.number(),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Authentication required");
    }

    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser) {
      throw new Error("User not found");
    }

    // Only super_admin can cleanup
    if (currentUser.role !== "super_admin") {
      throw new Error("Not authorized - super_admin access required");
    }

    const cutoffDate = Date.now() - (args.olderThanDays * 24 * 60 * 60 * 1000);

    // Find old approved or rejected requests
    const oldRequests = await ctx.db
      .query("passwordResetRequests")
      .filter((q) => 
        q.and(
          q.lt(q.field("requestedAt"), cutoffDate),
          q.or(
            q.eq(q.field("status"), "approved"),
            q.eq(q.field("status"), "rejected")
          )
        )
      )
      .collect();

    // Delete old requests (including their password hashes)
    // This ensures no historical password data is retained
    let deletedCount = 0;
    for (const request of oldRequests) {
      await ctx.db.delete(request._id);
      deletedCount++;
    }

    // Log the cleanup
    await ctx.db.insert("userAuditLog", {
      performedBy: currentUserId,
      action: "user_updated",
      notes: `Cleaned up ${deletedCount} old password reset requests (older than ${args.olderThanDays} days) - all password data permanently removed`,
      timestamp: Date.now(),
    });

    return { success: true, deletedCount };
  },
});

/**
 * Hash password using Scrypt (must match Convex Auth's algorithm)
 * 
 * SECURITY NOTE:
 * - Convex Auth uses Lucia's Scrypt for password hashing
 * - This function ensures password hashes are compatible with Convex Auth's verifySecret
 * - Scrypt is a memory-hard KDF, making it resistant to brute-force attacks
 * - NEVER use fast hashes like SHA-256 for password storage
 */
async function hashPassword(password: string): Promise<string> {
  return await new Scrypt().hash(password);
}