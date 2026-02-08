// convex/schema/searchFacets.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const searchFacetTables = {
  /**
   * Search Facets - Pre-aggregated filter options for search UI
   * Supports faceted search/filtering across all entity types.
   *
   * Design Principles:
   * - Pre-aggregated: Counts are calculated and stored for performance
   * - Dynamic: Facets update as data changes
   * - Flexible: Supports multiple facet types (department, status, year, etc.)
   * - Scoped: Can be entity-type specific or global
   *
   * Use Cases:
   * - Show "Filter by Department (12)" in search UI
   * - Display "Status: Active (45), Completed (23)" options
   * - Enable year-based filtering "2024 (34), 2025 (28)"
   */
  searchFacets: defineTable({
    // ============================================================================
    // FACET IDENTIFICATION
    // ============================================================================

    /**
     * Facet type - What attribute is being faceted
     * Examples: "department", "status", "year", "entityType"
     */
    facetType: v.string(),

    /**
     * Facet value - The specific value for this facet
     * Examples: "PESO", "completed", "2024", "project"
     */
    facetValue: v.string(),

    /**
     * Display label for UI
     * Human-readable version of facetValue
     * Examples: "PESO Department", "Completed", "2024", "Projects"
     */
    displayLabel: v.string(),

    // ============================================================================
    // SCOPE & FILTERING
    // ============================================================================

    /**
     * Entity type this facet applies to (optional)
     * If null, facet applies globally across all types
     */
    entityType: v.optional(
      v.union(
        v.literal("project"),
        v.literal("twentyPercentDF"),
        v.literal("trustFund"),
        v.literal("specialEducationFund"),
        v.literal("specialHealthFund"),
        v.literal("department"),
        v.literal("agency"),
        v.literal("user")
      )
    ),

    // ============================================================================
    // AGGREGATED COUNTS
    // ============================================================================

    /**
     * Total count of entities matching this facet
     * Updated when entities are created/updated/deleted
     */
    count: v.number(),

    /**
     * Count of active (non-deleted) entities
     */
    activeCount: v.number(),

    /**
     * Count of deleted entities
     */
    deletedCount: v.optional(v.number()),

    // ============================================================================
    // METADATA
    // ============================================================================

    /**
     * Display order for UI (lower = first)
     * Allows custom ordering of facet values
     */
    displayOrder: v.optional(v.number()),

    /**
     * Whether this facet is currently active/visible in search
     */
    isActive: v.optional(v.boolean()),

    /**
     * Icon or color code for UI display (optional)
     */
    displayMetadata: v.optional(v.string()),

    // ============================================================================
    // AUDIT TRAIL
    // ============================================================================

    /**
     * When this facet was created
     */
    createdAt: v.number(),

    /**
     * Last time facet counts were updated
     */
    updatedAt: v.number(),

    /**
     * Last time facet was recalculated from source data
     */
    lastRecalculatedAt: v.optional(v.number()),
  })
    // Primary lookup indexes
    .index("facetType", ["facetType"])
    .index("facetValue", ["facetValue"])
    .index("facetTypeAndValue", ["facetType", "facetValue"])

    // Scoping indexes
    .index("entityType", ["entityType"])
    .index("entityTypeAndFacetType", ["entityType", "facetType"])

    // Filtering indexes
    .index("isActive", ["isActive"])
    .index("displayOrder", ["displayOrder"])

    // Common query patterns
    .index("facetTypeAndActive", ["facetType", "isActive"])
    .index("entityTypeAndActive", ["entityType", "isActive"])
    .index("typeAndFacetTypeAndActive", [
      "entityType",
      "facetType",
      "isActive",
    ])

    // Ordering
    .index("facetTypeAndOrder", ["facetType", "displayOrder"])
    .index("entityTypeAndFacetTypeAndOrder", [
      "entityType",
      "facetType",
      "displayOrder",
    ])

    // Count-based queries (for analytics)
    .index("count", ["count"])
    .index("activeCount", ["activeCount"]),
};
