// convex/userPin.ts
// PIN management for delete protection

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const DEFAULT_PIN = "123456";

/**
 * Hash a PIN (simple hash for demo - use bcrypt in production)
 */
function hashPin(pin: string): string {
  // In production, use a proper hashing algorithm like bcrypt
  // This is a simple hash for demonstration
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

/**
 * Get the current user's delete protection PIN
 * Returns whether they have a custom PIN set
 */
export const getPinStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      hasCustomPin: user.hasCustomDeletePin ?? false,
      hasPinSet: !!user.deleteProtectionPin,
    };
  },
});

/**
 * Verify a PIN for the current user
 * Used by the PIN modal before permanent delete
 */
export const verifyPin = query({
  args: {
    pin: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Hash the provided PIN and compare
    const hashedPin = hashPin(args.pin);
    const storedPin = user.deleteProtectionPin || hashPin(DEFAULT_PIN);

    return {
      valid: hashedPin === storedPin,
    };
  },
});

/**
 * Verify PIN via mutation (for one-time verification calls)
 * Use this when you need to verify a PIN from a component and get immediate result
 */
export const verifyPinMutation = mutation({
  args: {
    pin: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Hash the provided PIN and compare
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
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Validate PIN format (6 digits)
    if (!/^\d{6}$/.test(args.newPin)) {
      throw new Error("PIN must be exactly 6 digits");
    }

    // If user already has a custom PIN set, verify current PIN
    // Users with default PIN (hasCustomDeletePin !== true) can set new PIN without current PIN
    if (user.hasCustomDeletePin) {
      if (!args.currentPin) {
        throw new Error("Current PIN is required");
      }
      
      const hashedCurrentPin = hashPin(args.currentPin);
      if (hashedCurrentPin !== user.deleteProtectionPin) {
        throw new Error("Current PIN is incorrect");
      }
    }

    // Hash and store new PIN
    const hashedNewPin = hashPin(args.newPin);
    const isDefaultPin = args.newPin === DEFAULT_PIN;

    await ctx.db.patch(userId, {
      deleteProtectionPin: hashedNewPin,
      hasCustomDeletePin: !isDefaultPin,
      deletePinUpdatedAt: Date.now(),
    });

    return {
      success: true,
      message: isDefaultPin 
        ? "PIN set to default. Consider changing for better security." 
        : "PIN updated successfully",
    };
  },
});

/**
 * Reset PIN to default (admin only or for password reset flow)
 */
export const resetPin = mutation({
  args: {
    userId: v.optional(v.id("users")),
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

    // Determine which user's PIN to reset
    const targetUserId = args.userId || currentUserId;

    // If resetting another user's PIN, require super_admin
    if (targetUserId !== currentUserId) {
      if (currentUser.role !== "super_admin") {
        throw new Error("Only super admins can reset other users' PINs");
      }
    }

    const hashedDefaultPin = hashPin(DEFAULT_PIN);

    await ctx.db.patch(targetUserId, {
      deleteProtectionPin: hashedDefaultPin,
      hasCustomDeletePin: false,
      deletePinUpdatedAt: Date.now(),
    });

    return {
      success: true,
      message: "PIN reset to default (123456)",
    };
  },
});
