// convex/schema/budgetParticularSharedAccess.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const budgetParticularSharedAccessTables = {
  /**
   * Budget Particular Shared Access
   * Controls user access to specific budget particulars (e.g., GAD, NUTRITION, LDRRMP)
   */
  budgetParticularSharedAccess: defineTable({
    /**
     * The particular code (e.g., "GAD", "NUTRITION", "LDRRMP")
     */
    particularCode: v.string(),
    
    /**
     * User who has been granted access
     */
    userId: v.id("users"),
    
    /**
     * Access level granted
     */
    accessLevel: v.union(
      v.literal("viewer"),
      v.literal("editor"),
      v.literal("admin")
    ),
    
    /**
     * Whether access is currently active
     */
    isActive: v.boolean(),
    
    /**
     * Admin who granted access
     */
    grantedBy: v.id("users"),
    
    /**
     * Timestamp when access was granted
     */
    grantedAt: v.number(),
    
    /**
     * Admin who revoked access (if revoked)
     */
    revokedBy: v.optional(v.id("users")),
    
    /**
     * Timestamp when access was revoked (if revoked)
     */
    revokedAt: v.optional(v.number()),
    
    /**
     * Optional notes about the access grant
     */
    notes: v.optional(v.string()),
  })
    .index("particularCode", ["particularCode"])
    .index("userId", ["userId"])
    .index("particularAndUser", ["particularCode", "userId"])
    .index("particularAndActive", ["particularCode", "isActive"])
    .index("userAndActive", ["userId", "isActive"]),
};