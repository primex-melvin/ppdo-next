// convex/schema/tableSettings.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const tableSettingsTables = {
  // User-specific table settings (order, visibility, custom widths)
  userTableSettings: defineTable({
    userId: v.id("users"),
    tableIdentifier: v.string(),
    columns: v.array(
      v.object({
        fieldKey: v.string(),
        width: v.number(), // Pixel width - NOW ACTUALLY USED
        isVisible: v.boolean(),
        pinned: v.optional(v.union(v.literal("left"), v.literal("right"), v.null())),
        flex: v.optional(v.number()), // For proportional resize calculations
      })
    ),
    defaultRowHeight: v.optional(v.number()),
    customRowHeights: v.optional(v.string()), 
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_and_table", ["userId", "tableIdentifier"]),

  // System-wide default column widths for each table type
  tableColumnDefaults: defineTable({
    tableIdentifier: v.string(), // e.g., "projects", "twentyPercentDF"
    columnKey: v.string(),       // e.g., "particular", "allocatedBudget"
    defaultWidth: v.number(),    // Default pixel width
    minWidth: v.number(),        // Minimum allowed width
    maxWidth: v.optional(v.number()), // Maximum allowed width
    flex: v.number(),            // Flex weight for proportional calculations
    updatedAt: v.number(),
  })
    .index("by_table", ["tableIdentifier"])
    .index("by_table_column", ["tableIdentifier", "columnKey"]),

  // System-wide custom column display names (shared across all users)
  tableColumnCustomNames: defineTable({
    tableIdentifier: v.string(),
    customLabels: v.array(
      v.object({
        columnKey: v.string(),
        label: v.string(),
      })
    ),
    updatedBy: v.id("users"),
    updatedAt: v.number(),
  }).index("by_table", ["tableIdentifier"]),
};