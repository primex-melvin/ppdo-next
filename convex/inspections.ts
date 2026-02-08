// convex/inspections.ts

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Create a new inspection
 */
export const createInspection = mutation({
  args: {
    projectId: v.optional(v.id("projects")),
    budgetItemId: v.optional(v.id("budgetItems")),
    programNumber: v.string(),
    title: v.string(),
    category: v.string(),
    inspectionDateTime: v.number(), // REQUIRED - replaces inspectionDate
    remarks: v.string(),
    status: v.union(
      v.literal("completed"),
      v.literal("in_progress"),
      v.literal("pending"),
      v.literal("cancelled")
    ),
    uploadSessionId: v.optional(v.id("uploadSessions")),
    metadata: v.optional(v.string()),

    // NEW: Location fields (all optional)
    locationLatitude: v.optional(v.number()),
    locationLongitude: v.optional(v.number()),
    locationAccuracy: v.optional(v.number()),
    barangay: v.optional(v.string()),
    municipality: v.optional(v.string()),
    province: v.optional(v.string()),
    siteMarkerKilometer: v.optional(v.number()),
    siteMarkerDescription: v.optional(v.string()),
    mapUrl: v.optional(v.string()),

    // NEW: Scheduling fields (all optional)
    scheduledDate: v.optional(v.number()),
    isRescheduled: v.optional(v.boolean()),
    rescheduleReason: v.optional(v.string()),
    previousScheduledDate: v.optional(v.number()),
    inspectionStartTime: v.optional(v.number()),
    inspectionEndTime: v.optional(v.number()),
    durationMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();

    const inspectionId = await ctx.db.insert("inspections", {
      projectId: args.projectId,
      budgetItemId: args.budgetItemId,
      programNumber: args.programNumber,
      title: args.title,
      category: args.category,
      inspectionDateTime: args.inspectionDateTime,
      remarks: args.remarks,
      status: args.status,
      viewCount: 0,
      uploadSessionId: args.uploadSessionId,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      metadata: args.metadata,

      // NEW: Location fields
      locationLatitude: args.locationLatitude,
      locationLongitude: args.locationLongitude,
      locationAccuracy: args.locationAccuracy,
      barangay: args.barangay,
      municipality: args.municipality,
      province: args.province,
      siteMarkerKilometer: args.siteMarkerKilometer,
      siteMarkerDescription: args.siteMarkerDescription,
      mapUrl: args.mapUrl,

      // NEW: Scheduling fields
      scheduledDate: args.scheduledDate,
      isRescheduled: args.isRescheduled,
      rescheduleReason: args.rescheduleReason,
      previousScheduledDate: args.previousScheduledDate,
      inspectionStartTime: args.inspectionStartTime,
      inspectionEndTime: args.inspectionEndTime,
      durationMinutes: args.durationMinutes,
    });

    return inspectionId;
  },
});

/**
 * Update an existing inspection
 */
export const updateInspection = mutation({
  args: {
    inspectionId: v.id("inspections"),
    programNumber: v.optional(v.string()),
    title: v.optional(v.string()),
    category: v.optional(v.string()),
    inspectionDateTime: v.optional(v.number()), // Replaces inspectionDate
    remarks: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("completed"),
        v.literal("in_progress"),
        v.literal("pending"),
        v.literal("cancelled")
      )
    ),
    uploadSessionId: v.optional(v.id("uploadSessions")),
    metadata: v.optional(v.string()),

    // NEW: Location fields (all optional)
    locationLatitude: v.optional(v.number()),
    locationLongitude: v.optional(v.number()),
    locationAccuracy: v.optional(v.number()),
    barangay: v.optional(v.string()),
    municipality: v.optional(v.string()),
    province: v.optional(v.string()),
    siteMarkerKilometer: v.optional(v.number()),
    siteMarkerDescription: v.optional(v.string()),
    mapUrl: v.optional(v.string()),

    // NEW: Scheduling fields (all optional)
    scheduledDate: v.optional(v.number()),
    isRescheduled: v.optional(v.boolean()),
    rescheduleReason: v.optional(v.string()),
    previousScheduledDate: v.optional(v.number()),
    inspectionStartTime: v.optional(v.number()),
    inspectionEndTime: v.optional(v.number()),
    durationMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const { inspectionId, ...updates } = args;

    // Verify inspection exists
    const inspection = await ctx.db.get(inspectionId);
    if (!inspection) {
      throw new Error("Inspection not found");
    }

    await ctx.db.patch(inspectionId, {
      ...updates,
      updatedBy: userId,
      updatedAt: Date.now(),
    });

    return inspectionId;
  },
});

/**
 * Delete an inspection
 */
export const deleteInspection = mutation({
  args: {
    inspectionId: v.id("inspections"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify inspection exists
    const inspection = await ctx.db.get(args.inspectionId);
    if (!inspection) {
      throw new Error("Inspection not found");
    }

    await ctx.db.delete(args.inspectionId);

    return { success: true };
  },
});

/**
 * Get a single inspection by ID
 */
export const getInspection = query({
  args: {
    inspectionId: v.id("inspections"),
  },
  handler: async (ctx, args) => {
    const inspection = await ctx.db.get(args.inspectionId);
    if (!inspection) {
      return null;
    }

    // Get related data
    const project = inspection.projectId ? await ctx.db.get(inspection.projectId) : null;
    const budgetItem = inspection.budgetItemId
      ? await ctx.db.get(inspection.budgetItemId)
      : null;
    const creator = await ctx.db.get(inspection.createdBy);
    
    // Get images if uploadSessionId exists
    let images: any[] = [];
    if (inspection.uploadSessionId) {
      const mediaFiles = await ctx.db
        .query("media")
        .withIndex("sessionId", (q) => q.eq("sessionId", inspection.uploadSessionId!))
        .order("asc")
        .collect();
      
      // Get URLs for each media file
      images = await Promise.all(
        mediaFiles.map(async (media) => {
          const url = await ctx.storage.getUrl(media.storageId);
          return {
            ...media,
            url,
          };
        })
      );
    }

    return {
      ...inspection,
      project,
      budgetItem,
      creator,
      images,
    };
  },
});

/**
 * List all inspections for a project
 */
export const listInspectionsByProject = query({
  args: {
    projectId: v.id("projects"),
    status: v.optional(
      v.union(
        v.literal("completed"),
        v.literal("in_progress"),
        v.literal("pending"),
        v.literal("cancelled")
      )
    ),
  },
  handler: async (ctx, args) => {
    let inspectionsQuery = ctx.db
      .query("inspections")
      .withIndex("projectId", (q) => q.eq("projectId", args.projectId));

    const inspections = await inspectionsQuery.collect();

    // Filter by status if provided
    const filteredInspections = args.status
      ? inspections.filter((i) => i.status === args.status)
      : inspections;

    // Sort by inspection date (most recent first)
    const sortedInspections = filteredInspections.sort(
      (a, b) => b.inspectionDateTime - a.inspectionDateTime
    );

    // Enrich with creator info and image count + thumbnail URLs
    const enrichedInspections = await Promise.all(
      sortedInspections.map(async (inspection) => {
        const creator = await ctx.db.get(inspection.createdBy);
        
        let imageCount = 0;
        let thumbnails: string[] = [];
        
        if (inspection.uploadSessionId) {
          const session = await ctx.db.get(inspection.uploadSessionId);
          imageCount = session?.imageCount || 0;
          
          // Get first 4 image URLs for thumbnails
          const mediaFiles = await ctx.db
            .query("media")
            .withIndex("sessionId", (q) => q.eq("sessionId", inspection.uploadSessionId!))
            .order("asc")
            .take(4);
          
          thumbnails = await Promise.all(
            mediaFiles.map(async (media) => {
              const url = await ctx.storage.getUrl(media.storageId);
              return url || "";
            })
          );
        }

        return {
          ...inspection,
          creator,
          imageCount,
          thumbnails,
        };
      })
    );

    return enrichedInspections;
  },
});

/**
 * List all inspections for a budget item
 */
export const listInspectionsByBudgetItem = query({
  args: {
    budgetItemId: v.id("budgetItems"),
  },
  handler: async (ctx, args) => {
    const inspections = await ctx.db
      .query("inspections")
      .withIndex("budgetItemId", (q) => q.eq("budgetItemId", args.budgetItemId))
      .collect();

    // Sort by inspection date (most recent first)
    const sortedInspections = inspections.sort(
      (a, b) => b.inspectionDateTime - a.inspectionDateTime
    );

    // Enrich with creator info and project name
    const enrichedInspections = await Promise.all(
      sortedInspections.map(async (inspection) => {
        const creator = await ctx.db.get(inspection.createdBy);
        const project = inspection.projectId ? await ctx.db.get(inspection.projectId) : null;
        
        let imageCount = 0;
        if (inspection.uploadSessionId) {
          const session = await ctx.db.get(inspection.uploadSessionId);
          imageCount = session?.imageCount || 0;
        }

        return {
          ...inspection,
          creator,
          project,
          imageCount,
        };
      })
    );

    return enrichedInspections;
  },
});

/**
 * List all inspections by category
 */
export const listInspectionsByCategory = query({
  args: {
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const inspections = await ctx.db
      .query("inspections")
      .withIndex("category", (q) => q.eq("category", args.category))
      .collect();

    return inspections.sort((a, b) => b.inspectionDateTime - a.inspectionDateTime);
  },
});

/**
 * List all inspections (with pagination)
 */
export const listAllInspections = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("completed"),
        v.literal("in_progress"),
        v.literal("pending"),
        v.literal("cancelled")
      )
    ),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    let inspections;

    if (args.status) {
      inspections = await ctx.db
        .query("inspections")
        .withIndex("status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(limit);
    } else {
      inspections = await ctx.db
        .query("inspections")
        .order("desc")
        .take(limit);
    }

    // Enrich with related data
    const enrichedInspections = await Promise.all(
      inspections.map(async (inspection) => {
        const creator = await ctx.db.get(inspection.createdBy);
        const project = inspection.projectId ? await ctx.db.get(inspection.projectId) : null;
        
        let imageCount = 0;
        if (inspection.uploadSessionId) {
          const session = await ctx.db.get(inspection.uploadSessionId);
          imageCount = session?.imageCount || 0;
        }

        return {
          ...inspection,
          creator,
          project,
          imageCount,
        };
      })
    );

    return enrichedInspections;
  },
});

/**
 * Increment view count for an inspection
 */
export const incrementViewCount = mutation({
  args: {
    inspectionId: v.id("inspections"),
  },
  handler: async (ctx, args) => {
    const inspection = await ctx.db.get(args.inspectionId);
    if (!inspection) {
      throw new Error("Inspection not found");
    }

    await ctx.db.patch(args.inspectionId, {
      viewCount: inspection.viewCount + 1,
    });

    return inspection.viewCount + 1;
  },
});

/**
 * Get inspection statistics for a project
 */
export const getProjectInspectionStats = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const inspections = await ctx.db
      .query("inspections")
      .withIndex("projectId", (q) => q.eq("projectId", args.projectId))
      .collect();

    const stats = {
      total: inspections.length,
      completed: inspections.filter((i) => i.status === "completed").length,
      inProgress: inspections.filter((i) => i.status === "in_progress").length,
      pending: inspections.filter((i) => i.status === "pending").length,
      cancelled: inspections.filter((i) => i.status === "cancelled").length,
      totalViews: inspections.reduce((sum, i) => sum + i.viewCount, 0),
    };

    return stats;
  },
});

/**
 * Search inspections by title or remarks
 */
export const searchInspections = query({
  args: {
    searchTerm: v.string(),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const searchLower = args.searchTerm.toLowerCase();

    let inspections;
    if (args.projectId) {
      inspections = await ctx.db
        .query("inspections")
        .withIndex("projectId", (q) => q.eq("projectId", args.projectId!))
        .collect();
    } else {
      inspections = await ctx.db.query("inspections").collect();
    }

    // Filter by search term in title or remarks
    const filtered = inspections.filter(
      (inspection) =>
        inspection.title.toLowerCase().includes(searchLower) ||
        inspection.remarks.toLowerCase().includes(searchLower) ||
        inspection.programNumber.toLowerCase().includes(searchLower)
    );

    // Sort by relevance (title matches first, then by date)
    const sorted = filtered.sort((a, b) => {
      const aTitle = a.title.toLowerCase().includes(searchLower);
      const bTitle = b.title.toLowerCase().includes(searchLower);
      if (aTitle && !bTitle) return -1;
      if (!aTitle && bTitle) return 1;
      return b.inspectionDateTime - a.inspectionDateTime;
    });

    return sorted;
  },
});

/**
 * Get recent inspections (last 10)
 */
export const getRecentInspections = query({
  args: {},
  handler: async (ctx) => {
    const inspections = await ctx.db
      .query("inspections")
      .withIndex("createdAt")
      .order("desc")
      .take(10);

    // Enrich with project info
    const enrichedInspections = await Promise.all(
      inspections.map(async (inspection) => {
        const project = inspection.projectId ? await ctx.db.get(inspection.projectId) : null;
        const creator = await ctx.db.get(inspection.createdBy);

        return {
          ...inspection,
          project,
          creator,
        };
      })
    );

    return enrichedInspections;
  },
});

/**
 * ============================================================================
 * FUND-SPECIFIC INSPECTION QUERIES AND MUTATIONS
 * ============================================================================
 */

/**
 * List inspections for a Trust Fund
 */
export const listInspectionsByTrustFund = query({
  args: {
    trustFundId: v.id("trustFunds"),
    status: v.optional(
      v.union(
        v.literal("completed"),
        v.literal("in_progress"),
        v.literal("pending"),
        v.literal("cancelled")
      )
    ),
  },
  handler: async (ctx, args) => {
    let inspectionsQuery = ctx.db
      .query("inspections")
      .withIndex("trustFundId", (q) => q.eq("trustFundId", args.trustFundId));

    const inspections = await inspectionsQuery.collect();

    // Filter by status if provided
    const filteredInspections = args.status
      ? inspections.filter((i) => i.status === args.status)
      : inspections;

    // Sort by inspection date descending
    const sortedInspections = filteredInspections.sort(
      (a, b) => b.inspectionDateTime - a.inspectionDateTime
    );

    // Enrich with creator and images
    const enrichedInspections = await Promise.all(
      sortedInspections.map(async (inspection) => {
        const creator = await ctx.db.get(inspection.createdBy);

        // Get images if uploadSessionId exists
        let imageCount = 0;
        let thumbnails: string[] = [];

        if (inspection.uploadSessionId) {
          const images = await ctx.db
            .query("media")
            .withIndex("sessionId", (q) =>
              q.eq("sessionId", inspection.uploadSessionId!)
            )
            .collect();

          imageCount = images.length;

          // Get first 4 image URLs for thumbnails
          const imageUrls = await Promise.all(
            images.slice(0, 4).map(async (img) => {
              const url = await ctx.storage.getUrl(img.storageId);
              return url || "";
            })
          );
          thumbnails = imageUrls.filter((url) => url !== "");
        }

        return {
          ...inspection,
          creator,
          imageCount,
          thumbnails,
        };
      })
    );

    return enrichedInspections;
  },
});

/**
 * List inspections for a Special Education Fund
 */
export const listInspectionsBySpecialEducationFund = query({
  args: {
    specialEducationFundId: v.id("specialEducationFunds"),
    status: v.optional(
      v.union(
        v.literal("completed"),
        v.literal("in_progress"),
        v.literal("pending"),
        v.literal("cancelled")
      )
    ),
  },
  handler: async (ctx, args) => {
    let inspectionsQuery = ctx.db
      .query("inspections")
      .withIndex("specialEducationFundId", (q) =>
        q.eq("specialEducationFundId", args.specialEducationFundId)
      );

    const inspections = await inspectionsQuery.collect();

    // Filter by status if provided
    const filteredInspections = args.status
      ? inspections.filter((i) => i.status === args.status)
      : inspections;

    // Sort by inspection date descending
    const sortedInspections = filteredInspections.sort(
      (a, b) => b.inspectionDateTime - a.inspectionDateTime
    );

    // Enrich with creator and images
    const enrichedInspections = await Promise.all(
      sortedInspections.map(async (inspection) => {
        const creator = await ctx.db.get(inspection.createdBy);

        let imageCount = 0;
        let thumbnails: string[] = [];

        if (inspection.uploadSessionId) {
          const images = await ctx.db
            .query("media")
            .withIndex("sessionId", (q) =>
              q.eq("sessionId", inspection.uploadSessionId!)
            )
            .collect();

          imageCount = images.length;

          const imageUrls = await Promise.all(
            images.slice(0, 4).map(async (img) => {
              const url = await ctx.storage.getUrl(img.storageId);
              return url || "";
            })
          );
          thumbnails = imageUrls.filter((url) => url !== "");
        }

        return {
          ...inspection,
          creator,
          imageCount,
          thumbnails,
        };
      })
    );

    return enrichedInspections;
  },
});

/**
 * List inspections for a Special Health Fund
 */
export const listInspectionsBySpecialHealthFund = query({
  args: {
    specialHealthFundId: v.id("specialHealthFunds"),
    status: v.optional(
      v.union(
        v.literal("completed"),
        v.literal("in_progress"),
        v.literal("pending"),
        v.literal("cancelled")
      )
    ),
  },
  handler: async (ctx, args) => {
    let inspectionsQuery = ctx.db
      .query("inspections")
      .withIndex("specialHealthFundId", (q) =>
        q.eq("specialHealthFundId", args.specialHealthFundId)
      );

    const inspections = await inspectionsQuery.collect();

    // Filter by status if provided
    const filteredInspections = args.status
      ? inspections.filter((i) => i.status === args.status)
      : inspections;

    // Sort by inspection date descending
    const sortedInspections = filteredInspections.sort(
      (a, b) => b.inspectionDateTime - a.inspectionDateTime
    );

    // Enrich with creator and images
    const enrichedInspections = await Promise.all(
      sortedInspections.map(async (inspection) => {
        const creator = await ctx.db.get(inspection.createdBy);

        let imageCount = 0;
        let thumbnails: string[] = [];

        if (inspection.uploadSessionId) {
          const images = await ctx.db
            .query("media")
            .withIndex("sessionId", (q) =>
              q.eq("sessionId", inspection.uploadSessionId!)
            )
            .collect();

          imageCount = images.length;

          const imageUrls = await Promise.all(
            images.slice(0, 4).map(async (img) => {
              const url = await ctx.storage.getUrl(img.storageId);
              return url || "";
            })
          );
          thumbnails = imageUrls.filter((url) => url !== "");
        }

        return {
          ...inspection,
          creator,
          imageCount,
          thumbnails,
        };
      })
    );

    return enrichedInspections;
  },
});

/**
 * List inspections for a 20% Development Fund
 */
export const listInspectionsByTwentyPercentDF = query({
  args: {
    twentyPercentDFId: v.id("twentyPercentDF"),
    status: v.optional(
      v.union(
        v.literal("completed"),
        v.literal("in_progress"),
        v.literal("pending"),
        v.literal("cancelled")
      )
    ),
  },
  handler: async (ctx, args) => {
    let inspectionsQuery = ctx.db
      .query("inspections")
      .withIndex("twentyPercentDFId", (q) =>
        q.eq("twentyPercentDFId", args.twentyPercentDFId)
      );

    const inspections = await inspectionsQuery.collect();

    // Filter by status if provided
    const filteredInspections = args.status
      ? inspections.filter((i) => i.status === args.status)
      : inspections;

    // Sort by inspection date descending
    const sortedInspections = filteredInspections.sort(
      (a, b) => b.inspectionDateTime - a.inspectionDateTime
    );

    // Enrich with creator and images
    const enrichedInspections = await Promise.all(
      sortedInspections.map(async (inspection) => {
        const creator = await ctx.db.get(inspection.createdBy);

        let imageCount = 0;
        let thumbnails: string[] = [];

        if (inspection.uploadSessionId) {
          const images = await ctx.db
            .query("media")
            .withIndex("sessionId", (q) =>
              q.eq("sessionId", inspection.uploadSessionId!)
            )
            .collect();

          imageCount = images.length;

          const imageUrls = await Promise.all(
            images.slice(0, 4).map(async (img) => {
              const url = await ctx.storage.getUrl(img.storageId);
              return url || "";
            })
          );
          thumbnails = imageUrls.filter((url) => url !== "");
        }

        return {
          ...inspection,
          creator,
          imageCount,
          thumbnails,
        };
      })
    );

    return enrichedInspections;
  },
});

/**
 * Create inspection for Trust Fund
 */
export const createInspectionForTrustFund = mutation({
  args: {
    trustFundId: v.id("trustFunds"),
    programNumber: v.string(),
    title: v.string(),
    category: v.string(),
    inspectionDateTime: v.number(),
    remarks: v.string(),
    status: v.union(
      v.literal("completed"),
      v.literal("in_progress"),
      v.literal("pending"),
      v.literal("cancelled")
    ),
    uploadSessionId: v.optional(v.id("uploadSessions")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();

    const inspectionId = await ctx.db.insert("inspections", {
      trustFundId: args.trustFundId,
      programNumber: args.programNumber,
      title: args.title,
      category: args.category,
      inspectionDateTime: args.inspectionDateTime,
      remarks: args.remarks,
      status: args.status,
      viewCount: 0,
      uploadSessionId: args.uploadSessionId,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    return inspectionId;
  },
});

/**
 * Create inspection for Special Education Fund
 */
export const createInspectionForSpecialEducationFund = mutation({
  args: {
    specialEducationFundId: v.id("specialEducationFunds"),
    programNumber: v.string(),
    title: v.string(),
    category: v.string(),
    inspectionDateTime: v.number(),
    remarks: v.string(),
    status: v.union(
      v.literal("completed"),
      v.literal("in_progress"),
      v.literal("pending"),
      v.literal("cancelled")
    ),
    uploadSessionId: v.optional(v.id("uploadSessions")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();

    const inspectionId = await ctx.db.insert("inspections", {
      specialEducationFundId: args.specialEducationFundId,
      programNumber: args.programNumber,
      title: args.title,
      category: args.category,
      inspectionDateTime: args.inspectionDateTime,
      remarks: args.remarks,
      status: args.status,
      viewCount: 0,
      uploadSessionId: args.uploadSessionId,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    return inspectionId;
  },
});

/**
 * Create inspection for Special Health Fund
 */
export const createInspectionForSpecialHealthFund = mutation({
  args: {
    specialHealthFundId: v.id("specialHealthFunds"),
    programNumber: v.string(),
    title: v.string(),
    category: v.string(),
    inspectionDateTime: v.number(),
    remarks: v.string(),
    status: v.union(
      v.literal("completed"),
      v.literal("in_progress"),
      v.literal("pending"),
      v.literal("cancelled")
    ),
    uploadSessionId: v.optional(v.id("uploadSessions")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();

    const inspectionId = await ctx.db.insert("inspections", {
      specialHealthFundId: args.specialHealthFundId,
      programNumber: args.programNumber,
      title: args.title,
      category: args.category,
      inspectionDateTime: args.inspectionDateTime,
      remarks: args.remarks,
      status: args.status,
      viewCount: 0,
      uploadSessionId: args.uploadSessionId,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    return inspectionId;
  },
});

/**
 * Create inspection for 20% Development Fund
 */
export const createInspectionForTwentyPercentDF = mutation({
  args: {
    twentyPercentDFId: v.id("twentyPercentDF"),
    programNumber: v.string(),
    title: v.string(),
    category: v.string(),
    inspectionDateTime: v.number(),
    remarks: v.string(),
    status: v.union(
      v.literal("completed"),
      v.literal("in_progress"),
      v.literal("pending"),
      v.literal("cancelled")
    ),
    uploadSessionId: v.optional(v.id("uploadSessions")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();

    const inspectionId = await ctx.db.insert("inspections", {
      twentyPercentDFId: args.twentyPercentDFId,
      programNumber: args.programNumber,
      title: args.title,
      category: args.category,
      inspectionDateTime: args.inspectionDateTime,
      remarks: args.remarks,
      status: args.status,
      viewCount: 0,
      uploadSessionId: args.uploadSessionId,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    return inspectionId;
  },
});