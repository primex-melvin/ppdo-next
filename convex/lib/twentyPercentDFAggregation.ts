// convex/lib/twentyPercentDFAggregation.ts
import { GenericMutationCtx } from "convex/server";
import { DataModel, Id } from "../_generated/dataModel";

type MutationCtx = GenericMutationCtx<DataModel>;

/**
 * Calculate and update 20% DF metrics based on child breakdowns
 * 
 * 1. Checks `autoCalculateBudgetUtilized` flag
 * 2. When TRUE (default): Aggregates from breakdowns
 * 3. When FALSE: Preserves manual value
 * 4. Always calculates obligatedBudget, status counts, and status
 * 5. Excludes soft-deleted breakdowns
 */
export async function recalculateTwentyPercentDFMetrics(
    ctx: MutationCtx,
    fundId: Id<"twentyPercentDF">,
    userId: Id<"users">
) {
    // Get all ACTIVE breakdowns (not in trash)
    const breakdowns = await ctx.db
        .query("twentyPercentDFBreakdowns")
        .withIndex("twentyPercentDFId", (q) => q.eq("twentyPercentDFId", fundId))
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .collect();

    const fundRecord = await ctx.db.get(fundId);
    if (!fundRecord) throw new Error(`20% DF Record ${fundId} not found`);

    // Check auto-calculation flag (defaults to TRUE for backward compatibility if undefined)
    const shouldAutoCalculate = fundRecord.autoCalculateBudgetUtilized !== false;

    // Initialize Aggregators
    let totalObligated = 0;
    let totalUtilized = 0;
    const statusCounts = { completed: 0, delayed: 0, onTrack: 0 };

    // Aggregate Data from Breakdowns
    for (const breakdown of breakdowns) {
        // Sum Obligated Budget (always calculated)
        totalObligated += (breakdown.obligatedBudget || 0);

        // Sum Utilized Budget (only if we're auto-calculating in context of breakdowns)
        // Note: If we are summing, we sum ALL active breakdowns
        totalUtilized += (breakdown.budgetUtilized || 0);

        // Count Statuses (always calculated)
        const status = breakdown.status;
        if (status === "completed") statusCounts.completed++;
        else if (status === "delayed") statusCounts.delayed++;
        else if (status === "ongoing") statusCounts.onTrack++;
    }

    // Prepare update object
    const updateData: any = {
        obligatedBudget: totalObligated,
        projectCompleted: statusCounts.completed,
        projectDelayed: statusCounts.delayed,
        projectsOngoing: statusCounts.onTrack,
        updatedAt: Date.now(),
        updatedBy: userId,
    };

    // Only update totalBudgetUtilized and utilizationRate if auto-calculating
    if (shouldAutoCalculate) {
        // Calculate Dynamic Utilization Rate
        // Formula: (Total Utilized from Breakdowns / Total Allocated) * 100
        const utilizationRate = fundRecord.totalBudgetAllocated > 0
            ? (totalUtilized / fundRecord.totalBudgetAllocated) * 100
            : 0;

        updateData.totalBudgetUtilized = totalUtilized;
        updateData.utilizationRate = utilizationRate;
    } else {
        // Manual mode: Recalculate utilizationRate based on existing manual value
        const manualUtilized = fundRecord.totalBudgetUtilized || 0;
        const utilizationRate = fundRecord.totalBudgetAllocated > 0
            ? (manualUtilized / fundRecord.totalBudgetAllocated) * 100
            : 0;

        updateData.utilizationRate = utilizationRate;
        // totalBudgetUtilized is NOT updated
    }

    // Auto-calculate Status (always calculated based on children)
    let status: "completed" | "delayed" | "ongoing";
    if (breakdowns.length === 0) {
        status = "ongoing"; // Default if no breakdowns
    } else {
        if (statusCounts.onTrack > 0) status = "ongoing";
        else if (statusCounts.delayed > 0) status = "delayed";
        else if (statusCounts.completed > 0) status = "completed";
        else status = "ongoing";
    }
    updateData.status = status;

    // Update Record
    await ctx.db.patch(fundId, updateData);

    return {
        breakdownsCount: breakdowns.length,
        ...statusCounts,
        totalObligated,
        totalUtilized: shouldAutoCalculate ? totalUtilized : fundRecord.totalBudgetUtilized,
        utilizationRate: updateData.utilizationRate,
        status,
        autoCalculated: shouldAutoCalculate,
        mode: shouldAutoCalculate ? "auto" : "manual",
    };
}

/**
 * Recalculate metrics for multiple 20% DF records
 */
export async function recalculateMultipleTwentyPercentDF(
    ctx: MutationCtx,
    ids: Id<"twentyPercentDF">[],
    userId: Id<"users">
) {
    const results = [];
    for (const id of ids) {
        const result = await recalculateTwentyPercentDFMetrics(ctx, id, userId);
        results.push({
            id,
            ...result,
        });
    }
    return results;
}

/**
 * Recalculate ALL 20% DF records (system-wide)
 */
export async function recalculateAllTwentyPercentDF(
    ctx: MutationCtx,
    userId: Id<"users">
) {
    const allRecords = await ctx.db.query("twentyPercentDF").collect();
    const ids = allRecords.map((r) => r._id);
    return await recalculateMultipleTwentyPercentDF(ctx, ids, userId);
}
