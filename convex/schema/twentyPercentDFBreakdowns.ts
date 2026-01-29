// convex/schema/twentyPercentDFBreakdowns.ts
import { defineTable } from "convex/server";
import { v } from "convex/values";
import { baseBreakdownSchema } from "./shared/baseBreakdown";

export const twentyPercentDFBreakdownTables = {
    twentyPercentDFBreakdowns: defineTable({
        // ============================================================================
        // PARENT REFERENCE
        // ============================================================================

        // Links this breakdown to a specific 20% DF project for aggregation.
        twentyPercentDFId: v.optional(v.id("twentyPercentDF")),

        // ============================================================================
        // SHARED BREAKDOWN FIELDS
        // ============================================================================
        ...baseBreakdownSchema,
    })
        .index("projectName", ["projectName"])
        .index("implementingOffice", ["implementingOffice"])
        .index("status", ["status"])
        .index("projectNameAndOffice", ["projectName", "implementingOffice"])
        .index("reportDate", ["reportDate"])
        .index("municipality", ["municipality"])
        // 🆕 CRITICAL INDEXES FOR AGGREGATION
        .index("isDeleted", ["isDeleted"])
        .index("twentyPercentDFId", ["twentyPercentDFId"])
        .index("twentyPercentDFIdAndStatus", ["twentyPercentDFId", "status"]),
};
