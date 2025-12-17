// convex/schema/govtProjectBreakdowns.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const govtProjectBreakdownTables = {
  govtProjectBreakdowns: defineTable({
    // --- LINK TO MAIN PROJECT ---
    projectId: v.id("projects"),

    // --- NEW: PROJECT TITLE (e.g., "Construction of Multi-Purpose Building") ---
    projectTitle: v.string(),

    // --- REPORT METADATA (keeping for backend, hidden from UI) ---
    reportDate: v.number(),
    batchId: v.optional(v.string()),

    // --- LOCATION BREAKDOWN ---
    district: v.string(),
    municipality: v.string(),
    barangay: v.optional(v.string()),
    
    // --- CLASSIFICATION ---
    fundSource: v.optional(v.string()),
    programType: v.optional(v.string()),
    implementingAgency: v.optional(v.string()),

    // --- FINANCIAL SNAPSHOT ---
    appropriation: v.number(),
    obligation: v.optional(v.number()),
    balance: v.optional(v.number()),

    // --- PHYSICAL STATUS SNAPSHOT ---
    accomplishmentRate: v.number(),
    
    // --- STATUS DETAILS ---
    remarksRaw: v.string(),
    statusCategory: v.union(
      v.literal("pre_procurement"),
      v.literal("procurement"),
      v.literal("implementation"),
      v.literal("completed"),
      v.literal("suspended"),
      v.literal("cancelled")
    ),

    // --- SYSTEM METADATA ---
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("projectId", ["projectId"])
    .index("reportDate", ["reportDate"])
    .index("municipality", ["municipality"])
    .index("statusCategory", ["statusCategory"])
    .index("projectIdAndDate", ["projectId", "reportDate"]),
};