/**
 * Clear development data for migration testing
 * USE ONLY IN DEV/LOCAL - NEVER IN PRODUCTION
 */

import { internalMutation } from "../_generated/server";

export const clearAllData = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all tables that need to be cleared
    const tables = [
      "accessRequests",
      "budgetItemActivities",
      "users",
      "projects",
      "budgetItems",
      "trustFunds",
      "specialHealthFunds",
      "specialEducationFunds",
      "twentyPercentDF",
      "departments",
      "implementingAgencies",
    ] as const;

    const results: Record<string, number> = {};

    for (const tableName of tables) {
      try {
        // @ts-ignore - Dynamic table access
        const docs = await ctx.db.query(tableName).collect();
        // @ts-ignore
        await Promise.all(docs.map((doc: any) => ctx.db.delete(doc._id)));
        results[tableName] = docs.length;
      } catch (error) {
        results[tableName] = 0;
      }
    }

    return {
      success: true,
      cleared: results,
      message: "All development data cleared. Ready for migration testing.",
    };
  },
});
