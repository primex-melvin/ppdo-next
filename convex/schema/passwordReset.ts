// convex/schema/passwordReset.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const passwordResetTables = {
  /**
   * Password Reset Requests.
   * Tracks user requests for password resets.
   * Only admins and super_admins can approve and set new passwords.
   */
  passwordResetRequests: defineTable({
    /**
     * Email address requesting reset
     */
    email: v.string(),
    
    /**
     * User ID (if user exists)
     */
    userId: v.optional(v.id("users")),
    
    /**
     * Optional message/remarks from user
     */
    message: v.optional(v.string()),
    
    /**
     * Request status
     * - pending: awaiting admin review
     * - approved: admin has set new password
     * - rejected: admin has rejected the request
     */
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    
    /**
     * IP address of requester
     */
    ipAddress: v.string(),
    
    /**
     * User agent of requester
     */
    userAgent: v.optional(v.string()),
    
    /**
     * Geographic location (JSON string)
     */
    geoLocation: v.optional(v.string()),
    
    /**
     * Timestamp when requested
     */
    requestedAt: v.number(),
    
    /**
     * Admin who reviewed the request
     */
    reviewedBy: v.optional(v.id("users")),
    
    /**
     * Timestamp when reviewed
     */
    reviewedAt: v.optional(v.number()),
    
    /**
     * Admin notes on the decision
     */
    adminNotes: v.optional(v.string()),
    
    /**
     * New password set by admin (hashed)
     */
    newPasswordHash: v.optional(v.string()),
    
    /**
     * Timestamp when password was changed
     */
    passwordChangedAt: v.optional(v.number()),
    
    /**
     * Admin who changed the password
     */
    passwordChangedBy: v.optional(v.id("users")),
  })
    .index("email", ["email"])
    .index("userId", ["userId"])
    .index("status", ["status"])
    .index("requestedAt", ["requestedAt"])
    .index("emailAndStatus", ["email", "status"])
    .index("reviewedBy", ["reviewedBy"]),

  /**
   * Password Reset Attempts Tracker.
   * Tracks daily attempts per email to enforce 3-attempt limit.
   */
  passwordResetAttempts: defineTable({
    /**
     * Email address attempting reset
     */
    email: v.string(),
    
    /**
     * Date key (YYYY-MM-DD format)
     */
    dateKey: v.string(),
    
    /**
     * Number of attempts made today
     */
    attemptCount: v.number(),
    
    /**
     * Last attempt timestamp
     */
    lastAttemptAt: v.number(),
    
    /**
     * IP addresses used (JSON array)
     */
    ipAddresses: v.optional(v.string()),
  })
    .index("emailAndDate", ["email", "dateKey"])
    .index("email", ["email"])
    .index("dateKey", ["dateKey"]),
};