// convex/schema/searchIndex.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const searchIndexTables = {
  /**
   * Search Index - Polymorphic search index for all entity types
   * Supports full-text search across projects, funds, departments, agencies, and users.
   *
   * Design Principles:
   * - Polymorphic: Single table indexes multiple entity types
   * - Normalized: Text is tokenized and normalized for efficient searching
   * - Filipino Support: Handles both English and Filipino text
   * - Performance: Indexed for fast lookup and filtering
   */
  searchIndex: defineTable({
    // ============================================================================
    // ENTITY REFERENCE
    // ============================================================================

    /**
     * Entity type being indexed
     * Determines which table this entry references
     */
    entityType: v.union(
      v.literal("project"),
      v.literal("twentyPercentDF"),
      v.literal("trustFund"),
      v.literal("specialEducationFund"),
      v.literal("specialHealthFund"),
      v.literal("department"),
      v.literal("agency"),
      v.literal("user")
    ),

    /**
     * ID of the referenced entity (stored as string for polymorphic reference)
     * Cast to appropriate type based on entityType when querying
     */
    entityId: v.string(),

    // ============================================================================
    // SEARCHABLE CONTENT
    // ============================================================================

    /**
     * Primary text content (e.g., project name, fund title, department name)
     * Stored in original form for display purposes
     */
    primaryText: v.string(),

    /**
     * Normalized primary text (lowercase, no diacritics)
     * Used for case-insensitive matching
     */
    normalizedPrimaryText: v.string(),

    /**
     * Secondary text content (e.g., implementing office, description)
     * Optional additional searchable text
     */
    secondaryText: v.optional(v.string()),

    /**
     * Normalized secondary text
     */
    normalizedSecondaryText: v.optional(v.string()),

    /**
     * Search tokens - Array of keywords extracted from text
     * Used for efficient keyword matching
     * Example: "Road Infrastructure Project" -> ["road", "infrastructure", "project"]
     */
    tokens: v.array(v.string()),

    // ============================================================================
    // METADATA FOR FILTERING & RANKING
    // ============================================================================

    /**
     * Department ID (if applicable)
     * Enables department-scoped searches
     */
    departmentId: v.optional(v.string()),

    /**
     * Status of the entity (if applicable)
     * Enables filtering by status (active, completed, etc.)
     */
    status: v.optional(v.string()),

    /**
     * Fiscal year (if applicable)
     * Enables year-based filtering
     */
    year: v.optional(v.number()),

    /**
     * Entity creation timestamp
     * Used for recency-based ranking
     */
    createdAt: v.number(),

    /**
     * Last update timestamp
     * Used for freshness ranking
     */
    updatedAt: v.number(),

    /**
     * Soft delete flag
     * Deleted entities should not appear in search results
     */
    isDeleted: v.optional(v.boolean()),

    // ============================================================================
    // SEARCH RANKING FACTORS
    // ============================================================================

    /**
     * Search relevance score (0-100)
     * Higher score = more relevant
     * Factors: text match quality, recency, status
     */
    relevanceScore: v.optional(v.number()),

    /**
     * View/access count
     * Popular entities can be ranked higher
     */
    accessCount: v.optional(v.number()),

    // ============================================================================
    // AUDIT TRAIL
    // ============================================================================

    /**
     * When this index entry was created
     */
    indexedAt: v.number(),

    /**
     * When this index entry was last updated
     */
    lastReindexedAt: v.number(),
  })
    // Primary lookup indexes
    .index("entityType", ["entityType"])
    .index("entityTypeAndId", ["entityType", "entityId"])

    // Text search indexes
    .index("normalizedPrimaryText", ["normalizedPrimaryText"])
    .index("normalizedSecondaryText", ["normalizedSecondaryText"])

    // Filter indexes
    .index("departmentId", ["departmentId"])
    .index("status", ["status"])
    .index("year", ["year"])
    .index("isDeleted", ["isDeleted"])

    // Composite indexes for common queries
    .index("entityTypeAndDeleted", ["entityType", "isDeleted"])
    .index("entityTypeAndDepartment", ["entityType", "departmentId"])
    .index("entityTypeAndStatus", ["entityType", "status"])
    .index("entityTypeAndYear", ["entityType", "year"])

    // Ranking indexes
    .index("relevanceScore", ["relevanceScore"])
    .index("accessCount", ["accessCount"])
    .index("createdAt", ["createdAt"])
    .index("updatedAt", ["updatedAt"])

    // Complex filters
    .index("typeAndDepartmentAndYear", ["entityType", "departmentId", "year"])
    .index("typeAndStatusAndYear", ["entityType", "status", "year"]),
};
