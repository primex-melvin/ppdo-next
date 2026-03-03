// convex/userPin.ts
// PIN management and recovery for delete protection

import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";

const DEFAULT_PIN = "123456";
const MAX_RESET_REQUESTS_PER_DAY = 3;
const RESET_REQUEST_COOLDOWN_MS = 60 * 1000;
const PIN_RESET_REQUIRED_MESSAGE =
  "Your PIN was reset. Please create a new PIN in Account Settings before performing permanent delete.";

/**
 * Hash a PIN (simple hash for demo - use bcrypt in production)
 */
function hashPin(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

type UserPinCtx = QueryCtx | MutationCtx;

async function requireCurrentUser(ctx: UserPinCtx): Promise<{
  userId: Id<"users">;
  user: Doc<"users">;
}> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("User not found");
  }

  return { userId, user };
}

async function getPendingResetRequest(ctx: UserPinCtx, userId: Id<"users">) {
  return await ctx.db
    .query("pinResetRequests")
    .withIndex("requesterIdAndStatus", (q) =>
      q.eq("requesterId", userId).eq("status", "pending")
    )
    .first();
}

async function resetUserPinToRecoveryState(
  ctx: MutationCtx,
  targetUserId: Id<"users">,
  performedBy: Id<"users">,
  source: "admin_reset" | "approved_request",
  requestId?: Id<"pinResetRequests">
) {
  const now = Date.now();
  const hashedDefaultPin = hashPin(DEFAULT_PIN);
  const targetUser = await ctx.db.get(targetUserId);

  if (!targetUser) {
    throw new Error("Target user not found");
  }

  await ctx.db.patch(targetUserId, {
    deleteProtectionPin: hashedDefaultPin,
    hasCustomDeletePin: false,
    deletePinUpdatedAt: now,
    mustChangeDeletePin: true,
    deletePinResetAt: now,
    deletePinResetBy: performedBy,
  });

  await ctx.db.insert("userAuditLog", {
    performedBy,
    targetUserId,
    action: "user_updated",
    notes:
      source === "approved_request"
        ? "Delete protection PIN reset after approved reset request"
        : "Delete protection PIN reset by super admin",
    previousValues: JSON.stringify({
      hasCustomDeletePin: targetUser.hasCustomDeletePin ?? false,
      mustChangeDeletePin: targetUser.mustChangeDeletePin ?? false,
    }),
    newValues: JSON.stringify({
      hasCustomDeletePin: false,
      mustChangeDeletePin: true,
      requestId: requestId ?? null,
    }),
    timestamp: now,
  });
}

/**
 * Get the current user's delete protection PIN status
 */
export const getPinStatus = query({
  args: {},
  handler: async (ctx) => {
    const { userId, user } = await requireCurrentUser(ctx);

    const pendingResetRequest = await getPendingResetRequest(ctx, userId);
    const latestResetRequest = await ctx.db
      .query("pinResetRequests")
      .withIndex("requesterIdAndRequestedAt", (q) => q.eq("requesterId", userId))
      .order("desc")
      .first();

    return {
      hasCustomPin: user.hasCustomDeletePin ?? false,
      hasPinSet: !!user.deleteProtectionPin,
      mustChangeDeletePin: user.mustChangeDeletePin ?? false,
      deletePinUpdatedAt: user.deletePinUpdatedAt ?? null,
      deletePinResetAt: user.deletePinResetAt ?? null,
      hasPendingResetRequest: !!pendingResetRequest,
      pendingResetRequestedAt: pendingResetRequest?.requestedAt ?? null,
      latestResetRequestStatus: latestResetRequest?.status ?? null,
      latestResetReviewedAt: latestResetRequest?.reviewedAt ?? null,
    };
  },
});

/**
 * Verify a PIN for the current user
 */
export const verifyPin = query({
  args: {
    pin: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);

    if (user.mustChangeDeletePin) {
      throw new Error(PIN_RESET_REQUIRED_MESSAGE);
    }

    const hashedPin = hashPin(args.pin);
    const storedPin = user.deleteProtectionPin || hashPin(DEFAULT_PIN);

    return {
      valid: hashedPin === storedPin,
    };
  },
});

/**
 * Verify PIN via mutation for one-time verification calls
 */
export const verifyPinMutation = mutation({
  args: {
    pin: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);

    if (user.mustChangeDeletePin) {
      throw new Error(PIN_RESET_REQUIRED_MESSAGE);
    }

    const hashedPin = hashPin(args.pin);
    const storedPin = user.deleteProtectionPin || hashPin(DEFAULT_PIN);

    return {
      valid: hashedPin === storedPin,
    };
  },
});

/**
 * Set or update the delete protection PIN
 */
export const setPin = mutation({
  args: {
    currentPin: v.optional(v.string()),
    newPin: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, user } = await requireCurrentUser(ctx);

    if (!/^\d{6}$/.test(args.newPin)) {
      throw new Error("PIN must be exactly 6 digits");
    }

    const requiresCurrentPin =
      user.hasCustomDeletePin === true && user.mustChangeDeletePin !== true;

    if (requiresCurrentPin) {
      if (!args.currentPin) {
        throw new Error("Current PIN is required");
      }

      const hashedCurrentPin = hashPin(args.currentPin);
      if (hashedCurrentPin !== user.deleteProtectionPin) {
        throw new Error("Current PIN is incorrect");
      }
    }

    const hashedNewPin = hashPin(args.newPin);
    const isDefaultPin = args.newPin === DEFAULT_PIN;
    const now = Date.now();

    await ctx.db.patch(userId, {
      deleteProtectionPin: hashedNewPin,
      hasCustomDeletePin: !isDefaultPin,
      deletePinUpdatedAt: now,
      mustChangeDeletePin: false,
    });

    return {
      success: true,
      message: user.mustChangeDeletePin
        ? "New PIN saved. Permanent delete access is restored."
        : isDefaultPin
          ? "PIN set to default. Consider changing for better security."
          : "PIN updated successfully",
    };
  },
});

/**
 * Submit a forgot-PIN recovery request for the current user
 */
export const requestPinReset = mutation({
  args: {
    message: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, user } = await requireCurrentUser(ctx);

    if (user.mustChangeDeletePin) {
      throw new Error("Your PIN has already been reset. Open Account Settings and create a new PIN.");
    }

    const pendingRequest = await getPendingResetRequest(ctx, userId);
    if (pendingRequest) {
      throw new Error("You already have a pending PIN reset request.");
    }

    const now = Date.now();
    const todayKey = new Date(now).toISOString().split("T")[0];

    const attemptRecord = await ctx.db
      .query("pinResetAttempts")
      .withIndex("requesterIdAndDate", (q) =>
        q.eq("requesterId", userId).eq("dateKey", todayKey)
      )
      .first();

    if (attemptRecord && attemptRecord.attemptCount >= MAX_RESET_REQUESTS_PER_DAY) {
      throw new Error("You have reached the maximum number of PIN reset requests for today.");
    }

    if (attemptRecord && (now - attemptRecord.lastAttemptAt) < RESET_REQUEST_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil(
        (RESET_REQUEST_COOLDOWN_MS - (now - attemptRecord.lastAttemptAt)) / 1000
      );
      throw new Error(`Please wait ${remainingSeconds} seconds before submitting another PIN reset request.`);
    }

    if (attemptRecord) {
      await ctx.db.patch(attemptRecord._id, {
        attemptCount: attemptRecord.attemptCount + 1,
        lastAttemptAt: now,
      });
    } else {
      await ctx.db.insert("pinResetAttempts", {
        requesterId: userId,
        dateKey: todayKey,
        attemptCount: 1,
        lastAttemptAt: now,
      });
    }

    const requestId = await ctx.db.insert("pinResetRequests", {
      requesterId: userId,
      email: user.email || "",
      message: args.message?.trim() || undefined,
      status: "pending",
      ipAddress: args.ipAddress?.trim() || undefined,
      userAgent: args.userAgent?.trim() || undefined,
      requestedAt: now,
    });

    await ctx.db.insert("userAuditLog", {
      performedBy: userId,
      targetUserId: userId,
      action: "user_updated",
      notes: "Delete protection PIN reset requested",
      newValues: JSON.stringify({
        requestId,
        status: "pending",
      }),
      timestamp: now,
    });

    return {
      success: true,
      message: "PIN reset request submitted. A super admin must approve it before your PIN can be reset.",
    };
  },
});

/**
 * List PIN reset requests for admin review
 */
export const listPinResetRequests = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected")
      )
    ),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);

    if (user.role !== "super_admin" && user.role !== "admin") {
      throw new Error("Not authorized - administrator access required");
    }

    const requests = args.status
      ? await ctx.db
          .query("pinResetRequests")
          .withIndex("status", (q) => q.eq("status", args.status!))
          .order("desc")
          .collect()
      : await ctx.db.query("pinResetRequests").order("desc").collect();

    return await Promise.all(
      requests.map(async (request) => {
        const requester = await ctx.db.get(request.requesterId);
        const reviewedBy = request.reviewedBy
          ? await ctx.db.get(request.reviewedBy)
          : null;

        return {
          ...request,
          requesterName: requester?.name,
          requesterRole: requester?.role,
          requesterStatus: requester?.status,
          reviewedByName: reviewedBy?.name,
          reviewedByEmail: reviewedBy?.email,
        };
      })
    );
  },
});

/**
 * Approve a PIN reset request and place the user into forced PIN-change mode
 */
export const approvePinReset = mutation({
  args: {
    requestId: v.id("pinResetRequests"),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, user } = await requireCurrentUser(ctx);

    if (user.role !== "super_admin") {
      throw new Error("Only super admins can approve PIN reset requests");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("PIN reset request not found");
    }

    if (request.status !== "pending") {
      throw new Error("Only pending PIN reset requests can be approved");
    }

    const now = Date.now();

    await ctx.db.patch(args.requestId, {
      status: "approved",
      reviewedBy: userId,
      reviewedAt: now,
      adminNotes: args.adminNotes?.trim() || undefined,
      resolvedAt: now,
    });

    await ctx.db.insert("userAuditLog", {
      performedBy: userId,
      targetUserId: request.requesterId,
      action: "user_updated",
      notes: "Delete protection PIN reset request approved",
      previousValues: JSON.stringify({ status: request.status }),
      newValues: JSON.stringify({
        status: "approved",
        requestId: request._id,
      }),
      timestamp: now,
    });

    await resetUserPinToRecoveryState(
      ctx,
      request.requesterId,
      userId,
      "approved_request",
      request._id
    );

    return {
      success: true,
      message: "PIN reset approved. The user must set a new PIN before permanent delete is allowed.",
    };
  },
});

/**
 * Reject a PIN reset request
 */
export const rejectPinReset = mutation({
  args: {
    requestId: v.id("pinResetRequests"),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, user } = await requireCurrentUser(ctx);

    if (user.role !== "super_admin") {
      throw new Error("Only super admins can reject PIN reset requests");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("PIN reset request not found");
    }

    if (request.status !== "pending") {
      throw new Error("Only pending PIN reset requests can be rejected");
    }

    const now = Date.now();

    await ctx.db.patch(args.requestId, {
      status: "rejected",
      reviewedBy: userId,
      reviewedAt: now,
      adminNotes: args.adminNotes?.trim() || undefined,
      resolvedAt: now,
    });

    await ctx.db.insert("userAuditLog", {
      performedBy: userId,
      targetUserId: request.requesterId,
      action: "user_updated",
      notes: "Delete protection PIN reset request rejected",
      previousValues: JSON.stringify({ status: request.status }),
      newValues: JSON.stringify({
        status: "rejected",
        requestId: request._id,
      }),
      timestamp: now,
    });

    return {
      success: true,
      message: "PIN reset request rejected",
    };
  },
});

/**
 * Reset PIN to recovery state (super admin only)
 */
export const resetPin = mutation({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { userId: currentUserId, user: currentUser } = await requireCurrentUser(ctx);

    if (currentUser.role !== "super_admin") {
      throw new Error("Only super admins can reset PINs");
    }

    const targetUserId = args.userId || currentUserId;

    await resetUserPinToRecoveryState(
      ctx,
      targetUserId,
      currentUserId,
      "admin_reset"
    );

    return {
      success: true,
      message: "PIN reset completed. The user must create a new PIN before permanent delete is allowed.",
    };
  },
});
