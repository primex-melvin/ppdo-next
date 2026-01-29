// convex/schema/twentyPercentDFActivities.ts
import { defineTable } from "convex/server";
import { v } from "convex/values";

// Activity for the main 20% DF Parent Records
export const twentyPercentDFActivityTables = {
    twentyPercentDFActivities: defineTable({
        userId: v.id("users"),
        action: v.string(), // "created", "updated", "deleted", "restored"
        twentyPercentDFId: v.id("twentyPercentDF"),

        // Snapshot of values
        previousValues: v.optional(v.any()),
        newValues: v.optional(v.any()),

        reason: v.optional(v.string()),

        timestamp: v.number(),
    })
        .index("twentyPercentDFId", ["twentyPercentDFId"])
        .index("userId", ["userId"])
        .index("timestamp", ["timestamp"]),

    // Activity for the Breakdown Records
    twentyPercentDFBreakdownActivities: defineTable({
        userId: v.id("users"),
        action: v.string(),
        breakdownId: v.id("twentyPercentDFBreakdowns"),

        // Contextual snapshots from the breakdown (for quick filtering without joins)
        projectName: v.string(),
        implementingOffice: v.string(),

        // Common fields
        previousValues: v.optional(v.any()), // Store full object snapshot
        newValues: v.optional(v.any()),      // Store full object snapshot

        source: v.optional(v.string()), // "web_ui", "import", "api", "system"
        reason: v.optional(v.string()),
        batchId: v.optional(v.string()), // For grouping bulk operations

        timestamp: v.number(),
    })
        .index("breakdownId", ["breakdownId"])
        .index("userId", ["userId"])
        .index("timestamp", ["timestamp"])
        .index("batchId", ["batchId"])
        .index("projectName", ["projectName"])
        .index("implementingOffice", ["implementingOffice"])
        .index("projectNameAndOffice", ["projectName", "implementingOffice"]),
};
