// convex/govtProjects.ts

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const logProjectReport = mutation({
  args: {
    // Identity
    projectName: v.string(),
    departmentId: v.id("departments"),
    
    // NEW: Project Title
    projectTitle: v.string(),
    
    // Report Context (hidden from UI but kept for tracking)
    reportDate: v.number(),
    batchId: v.optional(v.string()),

    // Location Data
    district: v.string(),
    municipality: v.string(),
    barangay: v.optional(v.string()),

    // Data Points
    fundSource: v.optional(v.string()),
    appropriation: v.number(),
    accomplishmentRate: v.number(),
    remarksRaw: v.string(),
    statusCategory: v.union(
      v.literal("pre_procurement"),
      v.literal("procurement"),
      v.literal("implementation"),
      v.literal("completed"),
      v.literal("suspended"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();

    // 1. FIND OR CREATE THE PARENT PROJECT
    let projectId;
    const existingProject = await ctx.db
      .query("projects")
      .withIndex("projectName", (q) => q.eq("projectName", args.projectName))
      .first();

    if (existingProject) {
      projectId = existingProject._id;
      
      await ctx.db.patch(projectId, {
        projectAccomplishment: args.accomplishmentRate,
        allocatedBudget: args.appropriation,
        remarks: args.remarksRaw,
        updatedAt: now,
        updatedBy: userId
      });

    } else {
      let mainStatus = "on_track";
      if (args.statusCategory === "completed") mainStatus = "completed";
      if (args.statusCategory === "suspended") mainStatus = "on_hold";
      if (args.statusCategory === "cancelled") mainStatus = "cancelled";
      
      projectId = await ctx.db.insert("projects", {
        projectName: args.projectName,
        departmentId: args.departmentId,
        allocatedBudget: args.appropriation,
        totalBudgetUtilized: 0,
        utilizationRate: 0,
        balance: args.appropriation,
        dateStarted: args.reportDate,
        projectAccomplishment: args.accomplishmentRate,
        status: mainStatus as any,
        remarks: args.remarksRaw,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
        isPinned: false
      });
    }

    // 2. INSERT THE DETAILED BREAKDOWN WITH PROJECT TITLE
    const breakdownId = await ctx.db.insert("govtProjectBreakdowns", {
      projectId: projectId,
      projectTitle: args.projectTitle, // NEW FIELD
      reportDate: args.reportDate,
      batchId: args.batchId,
      
      district: args.district,
      municipality: args.municipality,
      barangay: args.barangay,
      
      fundSource: args.fundSource,
      
      appropriation: args.appropriation,
      accomplishmentRate: args.accomplishmentRate,
      
      remarksRaw: args.remarksRaw,
      statusCategory: args.statusCategory,
      
      createdBy: userId,
      createdAt: now,
    });

    return { projectId, breakdownId };
  },
});

export const getProjectHistory = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("govtProjectBreakdowns")
      .withIndex("projectId", (q) => q.eq("projectId", args.projectId))
      .collect();

    return history.sort((a, b) => a.reportDate - b.reportDate);
  },
});

export const getStatsByMunicipality = query({
  args: {},
  handler: async (ctx) => {
    const allBreakdowns = await ctx.db.query("govtProjectBreakdowns").collect();

    const latestByProject = new Map();
    
    for (const record of allBreakdowns) {
      const existing = latestByProject.get(record.projectId);
      if (!existing || record.reportDate > existing.reportDate) {
        latestByProject.set(record.projectId, record);
      }
    }

    const stats: Record<string, { count: number, totalBudget: number }> = {};
    
    latestByProject.forEach((record) => {
      const muni = record.municipality;
      if (!stats[muni]) {
        stats[muni] = { count: 0, totalBudget: 0 };
      }
      stats[muni].count += 1;
      stats[muni].totalBudget += record.appropriation;
    });

    return stats;
  }
});