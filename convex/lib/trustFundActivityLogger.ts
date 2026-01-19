// convex/lib/trustFundActivityLogger.ts

import { GenericMutationCtx } from "convex/server";
import { DataModel, Id } from "../_generated/dataModel";

type MutationCtx = GenericMutationCtx<DataModel>;

export interface TrustFundLogConfig {
  action: "created" | "updated" | "deleted" | "restored";
  trustFundId?: Id<"trustFunds">;
  trustFund?: any;
  previousValues?: any;
  newValues?: any;
  reason?: string;
}

/**
 * Log trust fund activity with comprehensive tracking
 */
export async function logTrustFundActivity(
  ctx: MutationCtx,
  userId: Id<"users">,
  config: TrustFundLogConfig
): Promise<void> {
  try {
    const user = await ctx.db.get(userId);
    if (!user) {
      console.error("User not found for logging:", userId);
      return; // Don't throw - logging should not break operations
    }

    // Snapshot Data
    const trustFundData = config.trustFund || config.newValues || config.previousValues || {};
    
    // Calculate Diff
    let changedFields: string[] = [];
    let changeSummary: any = {};

    if (config.action === "updated" && config.previousValues && config.newValues) {
      const allKeys = new Set([
        ...Object.keys(config.previousValues), 
        ...Object.keys(config.newValues)
      ]);
      
      for (const key of allKeys) {
        // Skip system fields
        if (["_id", "_creationTime", "updatedAt", "updatedBy", "createdAt", "createdBy"].includes(key)) {
          continue;
        }
        
        const pVal = config.previousValues[key];
        const nVal = config.newValues[key];

        if (JSON.stringify(pVal) !== JSON.stringify(nVal)) {
          changedFields.push(key);
        }
      }

      // Build Smart Summaries
      if (changedFields.includes("received")) {
        changeSummary.receivedChanged = true;
        changeSummary.oldReceived = config.previousValues.received;
        changeSummary.newReceived = config.newValues.received;
      }
      
      if (changedFields.includes("utilized")) {
        changeSummary.utilizedChanged = true;
        changeSummary.oldUtilized = config.previousValues.utilized;
        changeSummary.newUtilized = config.newValues.utilized;
      }
      
      if (changedFields.includes("status")) {
        changeSummary.statusChanged = true;
        changeSummary.oldStatus = config.previousValues.status;
        changeSummary.newStatus = config.newValues.status;
      }
      
      if (changedFields.includes("officeInCharge")) {
        changeSummary.officeChanged = true;
      }
    }

    await ctx.db.insert("trustFundActivities", {
      action: config.action,
      trustFundId: config.trustFundId,
      projectTitle: trustFundData.projectTitle || "Unknown Trust Fund",
      officeInCharge: trustFundData.officeInCharge || "Unknown Office",
      
      previousValues: config.previousValues ? JSON.stringify(config.previousValues) : undefined,
      newValues: config.newValues ? JSON.stringify(config.newValues) : undefined,
      changedFields: changedFields.length > 0 ? JSON.stringify(changedFields) : undefined,
      changeSummary: Object.keys(changeSummary).length > 0 ? changeSummary : undefined,

      performedBy: userId,
      performedByName: user.name || "Unknown",
      performedByEmail: user.email || "",
      performedByRole: user.role || "user",
      
      timestamp: Date.now(),
      reason: config.reason,
    });
  } catch (error) {
    // Log error but don't throw - activity logging should not break operations
    console.error("Failed to log trust fund activity:", error);
  }
}