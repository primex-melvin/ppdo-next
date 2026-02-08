// convex/schema/inspections.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const inspectionTables = {
  /**
   * Inspections.
   */
  inspections: defineTable({
    // ============================================================================
    // FUND TYPE IDENTIFICATION (One required)
    // ============================================================================
    projectId: v.optional(v.id("projects")),
    trustFundId: v.optional(v.id("trustFunds")),
    specialEducationFundId: v.optional(v.id("specialEducationFunds")),
    specialHealthFundId: v.optional(v.id("specialHealthFunds")),
    twentyPercentDFId: v.optional(v.id("twentyPercentDF")),

    // ============================================================================
    // CORE FIELDS
    // ============================================================================
    budgetItemId: v.optional(v.id("budgetItems")),
    programNumber: v.string(),
    title: v.string(),
    category: v.string(),
    remarks: v.string(),
    status: v.union(
      v.literal("completed"),
      v.literal("in_progress"),
      v.literal("pending"),
      v.literal("cancelled")
    ),
    viewCount: v.number(),
    uploadSessionId: v.optional(v.id("uploadSessions")),

    // ============================================================================
    // CHANGED: inspectionDate → inspectionDateTime (more precise)
    // ============================================================================
    inspectionDateTime: v.number(), // REQUIRED - replaces inspectionDate

    // ============================================================================
    // NEW: LOCATION FIELDS (All Optional)
    // ============================================================================
    locationLatitude: v.optional(v.number()),
    locationLongitude: v.optional(v.number()),
    locationAccuracy: v.optional(v.number()), // GPS accuracy in meters
    barangay: v.optional(v.string()),
    municipality: v.optional(v.string()),
    province: v.optional(v.string()),
    siteMarkerKilometer: v.optional(v.number()), // KM marker for roads/highways
    siteMarkerDescription: v.optional(v.string()), // Landmark reference
    mapUrl: v.optional(v.string()), // Auto-generated Google Maps link

    // ============================================================================
    // NEW: SCHEDULING FIELDS (All Optional)
    // ============================================================================
    scheduledDate: v.optional(v.number()), // Originally scheduled for this date
    isRescheduled: v.optional(v.boolean()),
    rescheduleReason: v.optional(v.string()),
    previousScheduledDate: v.optional(v.number()),
    inspectionStartTime: v.optional(v.number()),
    inspectionEndTime: v.optional(v.number()),
    durationMinutes: v.optional(v.number()),

    // ============================================================================
    // AUDIT FIELDS (Unchanged)
    // ============================================================================
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
    metadata: v.optional(v.string()),
  })
    // ============================================================================
    // INDEXES
    // ============================================================================
    // Fund type indexes
    .index("projectId", ["projectId"])
    .index("trustFundId", ["trustFundId"])
    .index("specialEducationFundId", ["specialEducationFundId"])
    .index("specialHealthFundId", ["specialHealthFundId"])
    .index("twentyPercentDFId", ["twentyPercentDFId"])
    .index("budgetItemId", ["budgetItemId"])
    .index("status", ["status"])
    .index("category", ["category"])
    // Location-based indexes
    .index("municipality", ["municipality"])
    .index("barangay", ["barangay"])
    .index("locationLatLng", ["locationLatitude", "locationLongitude"])
    // Time-based indexes
    .index("inspectionDateTime", ["inspectionDateTime"])
    .index("scheduledDate", ["scheduledDate"])
    .index("isRescheduled", ["isRescheduled"])
    .index("createdBy", ["createdBy"])
    .index("createdAt", ["createdAt"])
    .index("programNumber", ["programNumber"])
    // Compound indexes
    .index("projectAndStatus", ["projectId", "status"])
    .index("projectAndDate", ["projectId", "inspectionDateTime"])
    .index("trustFundAndStatus", ["trustFundId", "status"])
    .index("trustFundAndDate", ["trustFundId", "inspectionDateTime"])
    .index("categoryAndStatus", ["category", "status"]),
};
