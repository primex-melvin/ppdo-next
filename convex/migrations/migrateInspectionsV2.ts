// convex/migrations/migrateInspectionsV2.ts
// Migration: Inspection System Upgrade V2
// - Adds location fields (GPS, barangay, municipality, province, site markers)
// - Adds scheduling fields (datetime precision, reschedule tracking)
// - Migrates inspectionDate → inspectionDateTime

import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Migration: Migrate all inspections from v1 to v2 schema
 * 
 * This mutation:
 * 1. Copies inspectionDate → inspectionDateTime
 * 2. Sets isRescheduled: false for all existing inspections
 * 3. Leaves all location fields as undefined (to be filled later)
 * 
 * Run this once after deploying the new schema.
 */
export const migrateInspectionsV2 = mutation({
  args: {},
  handler: async (ctx) => {
    const inspections = await ctx.db.query("inspections").collect();
    
    let migratedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const inspection of inspections as any[]) {
      try {
        // Skip if already migrated (has inspectionDateTime field)
        if ("inspectionDateTime" in inspection) {
          skippedCount++;
          continue;
        }

        // Migrate: Copy inspectionDate to inspectionDateTime
        const updates = {
          inspectionDateTime: inspection.inspectionDate as number,
          isRescheduled: false,
        };

        // Apply migration
        await ctx.db.patch(inspection._id, updates);
        migratedCount++;

      } catch (error) {
        errors.push(`Failed to migrate inspection ${inspection._id}: ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      total: inspections.length,
      migrated: migratedCount,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});

/**
 * Check migration status
 * Returns count of inspections that still need migration
 */
export const getMigrationStatus = mutation({
  args: {},
  handler: async (ctx) => {
    const inspections = await ctx.db.query("inspections").collect();
    
    let needsMigration = 0;
    let alreadyMigrated = 0;

    for (const inspection of inspections as any[]) {
      if ("inspectionDateTime" in inspection) {
        alreadyMigrated++;
      } else {
        needsMigration++;
      }
    }

    return {
      total: inspections.length,
      needsMigration,
      alreadyMigrated,
      isComplete: needsMigration === 0,
    };
  },
});

/**
 * Migration: Backfill location from remarks (optional)
 * 
 * Attempts to extract location info from remarks field using common patterns.
 * This is a best-effort operation and should be reviewed manually.
 */
export const backfillLocationFromRemarks = mutation({
  args: {
    dryRun: v.optional(v.boolean()), // If true, only log what would be changed
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true;
    const inspections = await ctx.db.query("inspections").collect();
    
    let processedCount = 0;
    let updatedCount = 0;
    const log: string[] = [];

    // Common patterns for location extraction
    const municipalityPattern = /(?:municipality|mun\.?|city)\s*[:\-]?\s*([A-Za-z\s]+)/i;
    const barangayPattern = /(?:barangay|brgy\.?)\s*[:\-]?\s*([A-Za-z\s]+)/i;
    const kmPattern = /(?:km|kilometer)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i;

    for (const inspection of inspections as any[]) {
      const remarks = inspection.remarks || "";
      const updates: any = {};

      // Extract municipality
      const munMatch = remarks.match(municipalityPattern);
      if (munMatch && !inspection.municipality) {
        updates.municipality = munMatch[1].trim();
      }

      // Extract barangay
      const brgyMatch = remarks.match(barangayPattern);
      if (brgyMatch && !inspection.barangay) {
        updates.barangay = brgyMatch[1].trim();
      }

      // Extract KM marker
      const kmMatch = remarks.match(kmPattern);
      if (kmMatch && !inspection.siteMarkerKilometer) {
        updates.siteMarkerKilometer = parseFloat(kmMatch[1]);
      }

      // Apply updates if any found
      if (Object.keys(updates).length > 0) {
        processedCount++;
        log.push(`Inspection ${inspection._id}: ${JSON.stringify(updates)}`);

        if (!dryRun) {
          await ctx.db.patch(inspection._id, updates);
          updatedCount++;
        }
      }
    }

    return {
      dryRun,
      processedCount,
      updatedCount,
      log,
    };
  },
});
