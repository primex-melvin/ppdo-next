// convex/schema/trustFundRemarks.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const trustFundRemarkTables = {
  /**
   * Trust Fund Remarks
   * Stores remarks/comments for trust funds with optional inspection linkage
   */
  trustFundRemarks: defineTable({
    /**
     * Parent trust fund reference
     */
    trustFundId: v.id("trustFunds"),

    /**
     * Optional inspection reference (child inspection ID)
     * When set, this remark is linked to a specific inspection
     */
    inspectionId: v.optional(v.id("inspections")),

    /**
     * Remark content
     */
    content: v.string(),

    /**
     * Optional categorization
     */
    category: v.optional(v.string()),

    /**
     * Priority level
     */
    priority: v.optional(
      v.union(
        v.literal("high"),
        v.literal("medium"),
        v.literal("low")
      )
    ),

    /**
     * Tags for filtering/organization
     */
    tags: v.optional(v.string()),

    /**
     * Pin status for important remarks
     */
    isPinned: v.optional(v.boolean()),

    /**
     * Attachments (JSON string or file IDs)
     */
    attachments: v.optional(v.string()),

    /**
     * Audit fields
     */
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.id("users"),
  })
    .index("trustFundId", ["trustFundId"])
    .index("inspectionId", ["inspectionId"])
    .index("createdBy", ["createdBy"])
    .index("createdAt", ["createdAt"])
    .index("updatedAt", ["updatedAt"])
    .index("category", ["category"])
    .index("priority", ["priority"])
    .index("fundAndInspection", ["trustFundId", "inspectionId"])
    .index("fundAndCategory", ["trustFundId", "category"])
    .index("fundAndCreatedAt", ["trustFundId", "createdAt"])
    .index("inspectionAndCreatedAt", ["inspectionId", "createdAt"])
    .index("isPinned", ["isPinned"])
    .index("createdByAndFund", ["createdBy", "trustFundId"]),
};
