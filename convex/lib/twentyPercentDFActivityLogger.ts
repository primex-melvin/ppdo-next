// convex/lib/twentyPercentDFActivityLogger.ts
import { GenericMutationCtx } from "convex/server";
import { DataModel, Id } from "../_generated/dataModel";

type MutationCtx = GenericMutationCtx<DataModel>;

export async function logTwentyPercentDFActivity(
    ctx: MutationCtx,
    userId: Id<"users">,
    activity: {
        action: string;
        twentyPercentDFId: Id<"twentyPercentDF">;
        previousValues?: any;
        newValues?: any;
        reason?: string;
    }
) {
    await ctx.db.insert("twentyPercentDFActivities", {
        userId,
        action: activity.action,
        twentyPercentDFId: activity.twentyPercentDFId,
        previousValues: activity.previousValues,
        newValues: activity.newValues,
        reason: activity.reason,
        timestamp: Date.now(),
    });
}

export async function logTwentyPercentDFBreakdownActivity(
    ctx: MutationCtx,
    userId: Id<"users">,
    activity: {
        action: string;
        breakdownId: Id<"twentyPercentDFBreakdowns">;
        projectName: string;
        implementingOffice: string;
        previousValues?: any;
        newValues?: any;
        source?: string;
        reason?: string;
        batchId?: string;
    }
) {
    await ctx.db.insert("twentyPercentDFBreakdownActivities", {
        userId,
        action: activity.action,
        breakdownId: activity.breakdownId,
        projectName: activity.projectName,
        implementingOffice: activity.implementingOffice,
        previousValues: activity.previousValues,
        newValues: activity.newValues,
        source: activity.source,
        reason: activity.reason,
        batchId: activity.batchId,
        timestamp: Date.now(),
    });
}
