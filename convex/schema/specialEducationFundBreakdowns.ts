/**
 * Special Education Fund Breakdowns Schema
 *
 * Defines the schema for Special Education Fund breakdown records.
 * Special Education Fund Breakdowns share the same base structure as Project Breakdowns
 * but link to Special Education Funds as their parent entity.
 *
 * Key Differences from Project Breakdowns:
 * - Parent is a Special Education Fund (not a Project)
 * - Status updates are manual (no auto-calculation from child breakdowns)
 * - No cascading status updates to parent Special Education Fund
 *
 * @module convex/schema/specialEducationFundBreakdowns
 */

import { defineTable } from "convex/server";
import { v } from "convex/values";
import { baseBreakdownSchema } from "./shared/baseBreakdown";

export const specialEducationFundBreakdownTables = {
  specialEducationFundBreakdowns: defineTable({
    // ============================================================================
    // PARENT REFERENCE (Special Education Fund specific)
    // ============================================================================

    /**
     * Parent Special Education Fund reference
     * Links this breakdown to a specific special education fund for tracking and reporting.
     *
     * When linked, this breakdown's data is associated with the parent special education fund
     * but does NOT automatically update the special education fund's status (manual updates only).
     */
    specialEducationFundId: v.id("specialEducationFunds"),

    // ============================================================================
    // SHARED BREAKDOWN FIELDS
    // ============================================================================
    ...baseBreakdownSchema,
  })
    // ============================================================================
    // INDEXES (matching Project Breakdown patterns)
    // ============================================================================

    // Parent relationship index (for efficient queries by special education fund)
    .index("specialEducationFundId", ["specialEducationFundId"])

    // Status-based queries
    .index("status", ["status"])
    .index("specialEducationFundIdAndStatus", ["specialEducationFundId", "status"])

    // Soft delete / trash system
    .index("isDeleted", ["isDeleted"])

    // Core field indexes
    .index("implementingOffice", ["implementingOffice"])
    .index("municipality", ["municipality"])
    .index("reportDate", ["reportDate"]),
};
