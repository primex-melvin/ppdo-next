// convex/schema/specialEducationFundActivities.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const specialEducationFundActivityTables = {
  /**
   * Special Education Fund Activity Log
   * Tracks all changes to special education funds
   */
  specialEducationFundActivities: defineTable({
    action: v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("deleted"),
      v.literal("restored")
    ),

    // Target Record
    specialEducationFundId: v.optional(v.id("specialEducationFunds")),

    // Contextual Data (Snapshot)
    projectTitle: v.string(),
    officeInCharge: v.string(),

    // Change Tracking
    previousValues: v.optional(v.string()), // JSON string
    newValues: v.optional(v.string()), // JSON string
    changedFields: v.optional(v.string()), // JSON array of field names

    changeSummary: v.optional(v.object({
      receivedChanged: v.optional(v.boolean()),
      utilizedChanged: v.optional(v.boolean()),
      statusChanged: v.optional(v.boolean()),
      officeChanged: v.optional(v.boolean()),
      oldReceived: v.optional(v.number()),
      newReceived: v.optional(v.number()),
      oldUtilized: v.optional(v.number()),
      newUtilized: v.optional(v.number()),
      oldStatus: v.optional(v.string()),
      newStatus: v.optional(v.string()),
    })),

    // User Metadata
    performedBy: v.id("users"),
    performedByName: v.string(),
    performedByEmail: v.string(),
    performedByRole: v.optional(v.string()),

    // Meta
    timestamp: v.number(),
    reason: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("specialEducationFundId", ["specialEducationFundId"])
    .index("performedBy", ["performedBy"])
    .index("timestamp", ["timestamp"])
    .index("action", ["action"]),
};
