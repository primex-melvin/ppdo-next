// convex/schema/twentyPercentDF.ts
import { defineTable } from "convex/server";
import { v } from "convex/values";

export const twentyPercentDFTables = {
    /**
     * 20% Development Fund (20% DF)
     * Tracks projects funded by the 20% Development Fund
     * Enhanced to match projects structure
     */
    twentyPercentDF: defineTable({
        // ============================================================================
        // PROJECT IDENTIFICATION
        // ============================================================================
        /**
         * Project particulars/name
         * Note: Backend uses "particulars" to match budgetItems terminology
         */
        particulars: v.string(),

        /**
         * Implementing Office (Department name as string for display)
         */
        implementingOffice: v.string(),

        /**
         * Department ID reference (optional for filtering/grouping)
         */
        departmentId: v.optional(v.id("departments")),


        /**
         * 🆕 CATEGORY (OPTIONAL)
         * Links this project to a category for better organization
         */
        categoryId: v.optional(v.id("projectCategories")),

        /**
         * 🆕 PARENT BUDGET ITEM (OPTIONAL)
         * Links this project to a specific budget item for aggregation.
         */
        budgetItemId: v.optional(v.id("budgetItems")),

        // ============================================================================
        // FINANCIAL DATA (matches budgetItems)
        // ============================================================================
        totalBudgetAllocated: v.number(),
        obligatedBudget: v.optional(v.number()),
        totalBudgetUtilized: v.number(),
        utilizationRate: v.number(),

        /**
         * 🆕 AUTO-CALCULATION FLAG
         * When TRUE (default): totalBudgetUtilized is auto-calculated from child breakdowns
         * When FALSE: totalBudgetUtilized can be manually set and won't be overridden
         */
        autoCalculateBudgetUtilized: v.optional(v.boolean()),

        // ============================================================================
        // METRICS
        // ============================================================================
        projectCompleted: v.number(),
        projectDelayed: v.number(),
        projectsOngoing: v.number(),

        // ============================================================================
        // ADDITIONAL FIELDS
        // ============================================================================
        remarks: v.optional(v.string()), // Kept for backward compatibility or simple remarks
        year: v.optional(v.number()),

        /**
         * Status - determines how it's counted
         * STRICT 3 OPTIONS: completed, delayed, ongoing
         */
        status: v.optional(
            v.union(
                v.literal("completed"),
                v.literal("delayed"),
                v.literal("ongoing")
            )
        ),
        targetDateCompletion: v.optional(v.number()),

        /**
         * Project manager/lead
         */
        projectManagerId: v.optional(v.id("users")),

        // ============================================================================
        // PIN FUNCTIONALITY
        // ============================================================================
        isPinned: v.optional(v.boolean()),
        pinnedAt: v.optional(v.number()),
        pinnedBy: v.optional(v.id("users")),

        // ============================================================================
        // TRASH SYSTEM
        // ============================================================================
        isDeleted: v.optional(v.boolean()),
        deletedAt: v.optional(v.number()),
        deletedBy: v.optional(v.id("users")),

        // ============================================================================
        // SYSTEM FIELDS
        // ============================================================================
        createdBy: v.id("users"),
        createdAt: v.number(),
        updatedAt: v.number(),
        updatedBy: v.optional(v.id("users")),
    })
        .index("particulars", ["particulars"])
        .index("implementingOffice", ["implementingOffice"])
        .index("departmentId", ["departmentId"])
        .index("categoryId", ["categoryId"])
        .index("categoryAndStatus", ["categoryId", "status"])

        .index("isDeleted", ["isDeleted"])
        .index("budgetItemId", ["budgetItemId"])
        .index("budgetItemAndStatus", ["budgetItemId", "status"])
        .index("status", ["status"])
        .index("year", ["year"])
        .index("departmentAndStatus", ["departmentId", "status"])
        .index("autoCalculate", ["autoCalculateBudgetUtilized"]),

    /**
     * 20% DF Remarks.
     */
    twentyPercentDFRemarks: defineTable({
        twentyPercentDFId: v.id("twentyPercentDF"),
        inspectionId: v.optional(v.id("inspections")),
        content: v.string(),
        category: v.optional(v.string()),
        priority: v.optional(
            v.union(
                v.literal("high"),
                v.literal("medium"),
                v.literal("low")
            )
        ),
        createdBy: v.id("users"),
        createdAt: v.number(),
        updatedAt: v.number(),
        updatedBy: v.id("users"),
        tags: v.optional(v.string()),
        isPinned: v.optional(v.boolean()),
        attachments: v.optional(v.string()),
    })
        .index("twentyPercentDFId", ["twentyPercentDFId"])
        .index("inspectionId", ["inspectionId"])
        .index("createdBy", ["createdBy"])
        .index("createdAt", ["createdAt"])
        .index("updatedAt", ["updatedAt"])
        .index("category", ["category"])
        .index("priority", ["priority"])
        .index("twentyPercentDFAndInspection", ["twentyPercentDFId", "inspectionId"])
        .index("twentyPercentDFAndCategory", ["twentyPercentDFId", "category"])
        .index("twentyPercentDFAndCreatedAt", ["twentyPercentDFId", "createdAt"])
        .index("inspectionAndCreatedAt", ["inspectionId", "createdAt"])
        .index("isPinned", ["isPinned"])
        .index("createdByAndTwentyPercentDF", ["createdBy", "twentyPercentDFId"]),
};
