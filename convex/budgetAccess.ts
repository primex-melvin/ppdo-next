// convex/budgetAccess.ts

import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Check if current user can access budget page
 * ROBUST CHECK: Checks admin role OR shared access
 */
export const canAccess = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { 
        canAccess: false, 
        user: null,
        department: null,
        accessLevel: null,
        reason: "Not authenticated",
      };
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return { 
        canAccess: false, 
        user: null,
        department: null,
        accessLevel: null,
        reason: "User not found",
      };
    }

    let canAccess = false;
    let accessLevel = null;
    let accessSource = null; // Track where access comes from

    // FIRST: Check if user is super_admin or admin (highest priority)
    if (user.role === "super_admin" || user.role === "admin") {
      canAccess = true;
      accessLevel = "admin";
      accessSource = "role";
    } 
    // SECOND: Check for shared access (if not admin)
    else {
      const sharedAccess = await ctx.db
        .query("budgetSharedAccess")
        .withIndex("userIdAndActive", (q) => 
          q.eq("userId", userId).eq("isActive", true)
        )
        .first();

      if (sharedAccess) {
        // Check if access has expired
        if (!sharedAccess.expiresAt || sharedAccess.expiresAt > Date.now()) {
          canAccess = true;
          accessLevel = sharedAccess.accessLevel;
          accessSource = "shared";
        } else {
          // Access expired - just don't grant access
          // (cleanup can be done by a separate mutation/cron job)
          canAccess = false;
          accessLevel = null;
          accessSource = "expired";
        }
      }
    }

    // Get department info if available
    let department = null;
    if (user.departmentId) {
      department = await ctx.db.get(user.departmentId);
    }

    return {
      canAccess,
      user: {
        id: user._id,
        name: user.name || "",
        email: user.email || "",
        role: user.role || "user",
        departmentId: user.departmentId,
      },
      department: department ? {
        id: department._id,
        name: (department as any).name ?? (department as any).fullName,
        code: department.code,
      } : null,
      accessLevel,
      accessSource, // "role" or "shared" or "expired"
      reason: !canAccess ? "No access granted" : undefined,
    };
  },
});