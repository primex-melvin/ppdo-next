// convex/implementingAgencies.ts
import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { indexEntity, removeFromIndex } from "./search/index";

/**
 * ============================================================================
 * QUERIES
 * ============================================================================
 */

/**
 * Get all implementing agencies with optional filtering
 */
export const list = query({
  args: {
    includeInactive: v.optional(v.boolean()),
    type: v.optional(v.union(v.literal("department"), v.literal("external"))),
    usageContext: v.optional(v.union(v.literal("project"), v.literal("breakdown"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    let agencies = await ctx.db
      .query("implementingAgencies")
      .collect();

    // Filter by active status if requested
    if (!args.includeInactive) {
      agencies = agencies.filter(a => a.isActive);
    }

    // Filter by type if requested
    if (args.type) {
      agencies = agencies.filter(a => a.type === args.type);
    }

    // Sort by displayOrder, then by code
    agencies.sort((a, b) => {
      const orderA = a.displayOrder ?? 9999;
      const orderB = b.displayOrder ?? 9999;
      if (orderA !== orderB) return orderA - orderB;
      return a.code.localeCompare(b.code);
    });

    // Enrich with department information and runtime stats
    const enrichedAgencies = await Promise.all(
      agencies.map(async (agency) => {
        let departmentInfo = null;
        if (agency.departmentId) {
          const dept = await ctx.db.get(agency.departmentId);
          if (dept) {
            departmentInfo = {
              id: dept._id,
              name: dept.name,
              code: dept.code,
            };
          }
        }

        // Calculate stats on-the-fly
        // 1. Get Projects
        const projects = await ctx.db
          .query("projects")
          .withIndex("implementingOffice", (q) => q.eq("implementingOffice", agency.code))
          .collect();

        // 2. Get Govt Project Breakdowns
        const govtBreakdowns = await ctx.db
          .query("govtProjectBreakdowns")
          .withIndex("implementingOffice", (q) => q.eq("implementingOffice", agency.code))
          .collect();

        // 3. Get 20% DF Breakdowns
        const twentyPercentDFBreakdowns = await ctx.db
          .query("twentyPercentDFBreakdowns")
          .withIndex("implementingOffice", (q) => q.eq("implementingOffice", agency.code))
          .collect();

        // 4. Get Trust Fund Breakdowns
        const trustFundBreakdowns = await ctx.db
          .query("trustFundBreakdowns")
          .withIndex("implementingOffice", (q) => q.eq("implementingOffice", agency.code))
          .collect();

        // 5. Get Special Health Fund Breakdowns
        const specialHealthBreakdowns = await ctx.db
          .query("specialHealthFundBreakdowns")
          .withIndex("implementingOffice", (q) => q.eq("implementingOffice", agency.code))
          .collect();

        // 6. Get Special Education Fund Breakdowns
        const specialEducationBreakdowns = await ctx.db
          .query("specialEducationFundBreakdowns")
          .withIndex("implementingOffice", (q) => q.eq("implementingOffice", agency.code))
          .collect();

        // Filter out deleted items
        const activeProjects = projects.filter(p => !p.isDeleted);
        const activeGovtBreakdowns = govtBreakdowns.filter(b => !b.isDeleted);
        const active20DFBreakdowns = twentyPercentDFBreakdowns.filter(b => !b.isDeleted);
        const activeTrustFundBreakdowns = trustFundBreakdowns.filter(b => !b.isDeleted);
        const activeSpecialHealthBreakdowns = specialHealthBreakdowns.filter(b => !b.isDeleted);
        const activeSpecialEducationBreakdowns = specialEducationBreakdowns.filter(b => !b.isDeleted);

        // Total breakdowns count (all types except main projects)
        const totalBreakdownsCount = 
          activeGovtBreakdowns.length +
          active20DFBreakdowns.length +
          activeTrustFundBreakdowns.length +
          activeSpecialHealthBreakdowns.length +
          activeSpecialEducationBreakdowns.length;

        const totalProjectsCount = activeProjects.length + totalBreakdownsCount;

        // Count by status
        const countByStatus = <T extends { status?: string }>(items: T[], status: string) => 
          items.filter(item => item.status === status).length;
        
        const countByStatusMulti = <T extends { status?: string }>(items: T[], statuses: string[]) =>
          items.filter(item => item.status !== undefined && statuses.includes(item.status)).length;

        const completedProjectsCount =
          countByStatus(activeProjects, "completed") +
          countByStatus(activeGovtBreakdowns, "completed") +
          countByStatus(active20DFBreakdowns, "completed") +
          countByStatus(activeTrustFundBreakdowns, "completed") +
          countByStatus(activeSpecialHealthBreakdowns, "completed") +
          countByStatus(activeSpecialEducationBreakdowns, "completed");

        const ongoingProjectsCount =
          countByStatusMulti(activeProjects, ["ongoing", "delayed"]) +
          countByStatusMulti(activeGovtBreakdowns, ["ongoing", "delayed"]) +
          countByStatusMulti(active20DFBreakdowns, ["ongoing", "delayed"]) +
          countByStatusMulti(activeTrustFundBreakdowns, ["ongoing", "delayed"]) +
          countByStatusMulti(activeSpecialHealthBreakdowns, ["ongoing", "delayed"]) +
          countByStatusMulti(activeSpecialEducationBreakdowns, ["ongoing", "delayed"]);

        // Calculate budgets
        const sumBudget = <T extends Record<string, unknown>>(items: T[], field: keyof T) => 
          items.reduce((sum, item) => sum + (Number(item[field]) || 0), 0);

        const projectBudget = sumBudget(activeProjects, "totalBudgetAllocated");
        const breakdownBudget = 
          sumBudget(activeGovtBreakdowns, "allocatedBudget") +
          sumBudget(active20DFBreakdowns, "allocatedBudget") +
          sumBudget(activeTrustFundBreakdowns, "allocatedBudget") +
          sumBudget(activeSpecialHealthBreakdowns, "allocatedBudget") +
          sumBudget(activeSpecialEducationBreakdowns, "allocatedBudget");
        const totalBudget = projectBudget + breakdownBudget;

        const projectUtilized = sumBudget(activeProjects, "totalBudgetUtilized");
        const breakdownUtilized = 
          sumBudget(activeGovtBreakdowns, "budgetUtilized") +
          sumBudget(active20DFBreakdowns, "budgetUtilized") +
          sumBudget(activeTrustFundBreakdowns, "budgetUtilized") +
          sumBudget(activeSpecialHealthBreakdowns, "budgetUtilized") +
          sumBudget(activeSpecialEducationBreakdowns, "budgetUtilized");
        const utilizedBudget = projectUtilized + breakdownUtilized;

        return {
          ...agency,
          department: departmentInfo,
          // Runtime calculated stats
          totalProjects: totalProjectsCount,
          totalBreakdowns: totalBreakdownsCount,
          activeProjects: ongoingProjectsCount,
          completedProjects: completedProjectsCount,
          totalBudget: totalBudget,
          utilizedBudget: utilizedBudget,
          // Keep existing usageCount logic for backward compatibility (or UI dependency)
          usageCount: args.usageContext === "project"
            ? agency.projectUsageCount
            : args.usageContext === "breakdown"
              ? agency.breakdownUsageCount
              : (agency.projectUsageCount || 0) + (agency.breakdownUsageCount || 0),
        };
      })
    );

    return enrichedAgencies;
  },
});

/**
 * Get a single implementing agency by ID
 */
/**
 * Get a single implementing agency by ID with full details (stats + project list)
 */
export const get = query({
  args: { id: v.id("implementingAgencies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const agency = await ctx.db.get(args.id);
    if (!agency) throw new Error("Implementing agency not found");

    // Enrich with department information
    let departmentInfo = null;
    if (agency.departmentId) {
      const dept = await ctx.db.get(agency.departmentId);
      if (dept) {
        departmentInfo = {
          id: dept._id,
          name: dept.name,
          code: dept.code,
        };
      }
    }

    // 1. Get Projects (11 Plans / Budget Items)
    const projects = await ctx.db
      .query("projects")
      .withIndex("implementingOffice", (q) => q.eq("implementingOffice", agency.code))
      .collect();

    // 2. Get Govt Project Breakdowns (also Budget Items)
    const govtBreakdowns = await ctx.db
      .query("govtProjectBreakdowns")
      .withIndex("implementingOffice", (q) => q.eq("implementingOffice", agency.code))
      .collect();

    // 3. Get 20% DF Breakdowns
    const twentyPercentDFBreakdowns = await ctx.db
      .query("twentyPercentDFBreakdowns")
      .withIndex("implementingOffice", (q) => q.eq("implementingOffice", agency.code))
      .collect();

    // 4. Get Trust Fund Breakdowns
    const trustFundBreakdowns = await ctx.db
      .query("trustFundBreakdowns")
      .withIndex("implementingOffice", (q) => q.eq("implementingOffice", agency.code))
      .collect();

    // 5. Get Special Health Fund Breakdowns
    const specialHealthBreakdowns = await ctx.db
      .query("specialHealthFundBreakdowns")
      .withIndex("implementingOffice", (q) => q.eq("implementingOffice", agency.code))
      .collect();

    // 6. Get Special Education Fund Breakdowns
    const specialEducationBreakdowns = await ctx.db
      .query("specialEducationFundBreakdowns")
      .withIndex("implementingOffice", (q) => q.eq("implementingOffice", agency.code))
      .collect();

    // Filter out deleted items
    const activeProjects = projects.filter(p => !p.isDeleted);
    const activeGovtBreakdowns = govtBreakdowns.filter(b => !b.isDeleted);
    const active20DFBreakdowns = twentyPercentDFBreakdowns.filter(b => !b.isDeleted);
    const activeTrustFundBreakdowns = trustFundBreakdowns.filter(b => !b.isDeleted);
    const activeSpecialHealthBreakdowns = specialHealthBreakdowns.filter(b => !b.isDeleted);
    const activeSpecialEducationBreakdowns = specialEducationBreakdowns.filter(b => !b.isDeleted);

    // Calculate Stats - all types combined
    const totalProjectsCount = 
      activeProjects.length + 
      activeGovtBreakdowns.length + 
      active20DFBreakdowns.length +
      activeTrustFundBreakdowns.length +
      activeSpecialHealthBreakdowns.length +
      activeSpecialEducationBreakdowns.length;

    // Count by status across all types
    const countByStatus = <T extends { status?: string }>(items: T[], status: string) => 
      items.filter(item => item.status === status).length;
    
    const countByStatusMulti = <T extends { status?: string }>(items: T[], statuses: string[]) =>
      items.filter(item => item.status !== undefined && statuses.includes(item.status)).length;

    const completedProjectsCount =
      countByStatus(activeProjects, "completed") +
      countByStatus(activeGovtBreakdowns, "completed") +
      countByStatus(active20DFBreakdowns, "completed") +
      countByStatus(activeTrustFundBreakdowns, "completed") +
      countByStatus(activeSpecialHealthBreakdowns, "completed") +
      countByStatus(activeSpecialEducationBreakdowns, "completed");

    const ongoingProjectsCount =
      countByStatusMulti(activeProjects, ["ongoing", "delayed"]) +
      countByStatusMulti(activeGovtBreakdowns, ["ongoing", "delayed"]) +
      countByStatusMulti(active20DFBreakdowns, ["ongoing", "delayed"]) +
      countByStatusMulti(activeTrustFundBreakdowns, ["ongoing", "delayed"]) +
      countByStatusMulti(activeSpecialHealthBreakdowns, ["ongoing", "delayed"]) +
      countByStatusMulti(activeSpecialEducationBreakdowns, ["ongoing", "delayed"]);

    // Calculate budgets
    const sumBudget = <T extends Record<string, unknown>>(items: T[], field: keyof T) => 
      items.reduce((sum, item) => sum + (Number(item[field]) || 0), 0);

    const totalBudget = 
      sumBudget(activeProjects, "totalBudgetAllocated") +
      sumBudget(activeGovtBreakdowns, "allocatedBudget") +
      sumBudget(active20DFBreakdowns, "allocatedBudget") +
      sumBudget(activeTrustFundBreakdowns, "allocatedBudget") +
      sumBudget(activeSpecialHealthBreakdowns, "allocatedBudget") +
      sumBudget(activeSpecialEducationBreakdowns, "allocatedBudget");

    const utilizedBudget = 
      sumBudget(activeProjects, "totalBudgetUtilized") +
      sumBudget(activeGovtBreakdowns, "budgetUtilized") +
      sumBudget(active20DFBreakdowns, "budgetUtilized") +
      sumBudget(activeTrustFundBreakdowns, "budgetUtilized") +
      sumBudget(activeSpecialHealthBreakdowns, "budgetUtilized") +
      sumBudget(activeSpecialEducationBreakdowns, "budgetUtilized");

    // Normalize for Project Cards - by category
    const mapProject = (p: any) => ({
      id: p._id,
      name: p.particulars,
      description: p.remarks || "No description",
      status: p.status || "ongoing",
      budget: p.totalBudgetAllocated,
      utilized: p.totalBudgetUtilized,
      location: "Provincial",
      startDate: new Date(p.createdAt).toISOString(),
      endDate: p.targetDateCompletion ? new Date(p.targetDateCompletion).toISOString() : new Date().toISOString(),
      beneficiaries: 0,
      category: "project11Plans" as const,
    });

    const mapGovtBreakdown = (b: any) => ({
      id: b._id,
      name: b.projectName,
      description: b.remarks || "No description",
      status: b.status || "ongoing",
      budget: b.allocatedBudget || 0,
      utilized: b.budgetUtilized || 0,
      location: b.municipality || "Various",
      startDate: b.dateStarted ? new Date(b.dateStarted).toISOString() : new Date(b.createdAt).toISOString(),
      endDate: b.targetDate ? new Date(b.targetDate).toISOString() : new Date().toISOString(),
      beneficiaries: 0,
      category: "project11Plans" as const, // Govt breakdowns are also budget items
    });

    const map20DFBreakdown = (b: any) => ({
      id: b._id,
      name: b.projectName,
      description: b.remarks || "No description",
      status: b.status || "ongoing",
      budget: b.allocatedBudget || 0,
      utilized: b.budgetUtilized || 0,
      location: b.municipality || "Various",
      startDate: b.dateStarted ? new Date(b.dateStarted).toISOString() : new Date(b.createdAt).toISOString(),
      endDate: b.targetDate ? new Date(b.targetDate).toISOString() : new Date().toISOString(),
      beneficiaries: 0,
      category: "twentyPercentDF" as const,
    });

    const mapTrustFundBreakdown = (b: any) => ({
      id: b._id,
      name: b.projectName,
      description: b.remarks || "No description",
      status: b.status || "ongoing",
      budget: b.allocatedBudget || 0,
      utilized: b.budgetUtilized || 0,
      location: b.municipality || "Various",
      startDate: b.dateStarted ? new Date(b.dateStarted).toISOString() : new Date(b.createdAt).toISOString(),
      endDate: b.targetDate ? new Date(b.targetDate).toISOString() : new Date().toISOString(),
      beneficiaries: 0,
      category: "trustFund" as const,
    });

    const mapSpecialHealthBreakdown = (b: any) => ({
      id: b._id,
      name: b.projectName,
      description: b.remarks || "No description",
      status: b.status || "ongoing",
      budget: b.allocatedBudget || 0,
      utilized: b.budgetUtilized || 0,
      location: b.municipality || "Various",
      startDate: b.dateStarted ? new Date(b.dateStarted).toISOString() : new Date(b.createdAt).toISOString(),
      endDate: b.targetDate ? new Date(b.targetDate).toISOString() : new Date().toISOString(),
      beneficiaries: 0,
      category: "specialHealth" as const,
    });

    const mapSpecialEducationBreakdown = (b: any) => ({
      id: b._id,
      name: b.projectName,
      description: b.remarks || "No description",
      status: b.status || "ongoing",
      budget: b.allocatedBudget || 0,
      utilized: b.budgetUtilized || 0,
      location: b.municipality || "Various",
      startDate: b.dateStarted ? new Date(b.dateStarted).toISOString() : new Date(b.createdAt).toISOString(),
      endDate: b.targetDate ? new Date(b.targetDate).toISOString() : new Date().toISOString(),
      beneficiaries: 0,
      category: "specialEducation" as const,
    });

    // Categorized projects
    const project11Plans = [
      ...activeProjects.map(mapProject),
      ...activeGovtBreakdowns.map(mapGovtBreakdown),
    ];
    const twentyPercentDF = active20DFBreakdowns.map(map20DFBreakdown);
    const trustFund = activeTrustFundBreakdowns.map(mapTrustFundBreakdown);
    const specialHealth = activeSpecialHealthBreakdowns.map(mapSpecialHealthBreakdown);
    const specialEducation = activeSpecialEducationBreakdowns.map(mapSpecialEducationBreakdown);

    const allProjects = [
      ...project11Plans,
      ...twentyPercentDF,
      ...trustFund,
      ...specialHealth,
      ...specialEducation,
    ];

    return {
      ...agency,
      department: departmentInfo,
      // Stats
      totalProjects: totalProjectsCount,
      activeProjects: ongoingProjectsCount,
      completedProjects: completedProjectsCount,
      totalBudget: totalBudget,
      utilizedBudget: utilizedBudget,
      avgProjectBudget: totalProjectsCount > 0 ? totalBudget / totalProjectsCount : 0,
      // Categorized lists
      projects: allProjects,
      projectsByCategory: {
        project11Plans,
        twentyPercentDF,
        trustFund,
        specialHealth,
        specialEducation,
      },
      // Category counts for quick reference
      categoryCounts: {
        project11Plans: project11Plans.length,
        twentyPercentDF: twentyPercentDF.length,
        trustFund: trustFund.length,
        specialHealth: specialHealth.length,
        specialEducation: specialEducation.length,
      },
    };
  },
});

/**
 * Get an implementing agency by code
 */
export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const agency = await ctx.db
      .query("implementingAgencies")
      .withIndex("code", (q) => q.eq("code", args.code))
      .first();

    if (!agency) throw new Error("Implementing agency not found");

    // Enrich with department information
    let departmentInfo = null;
    if (agency.departmentId) {
      const dept = await ctx.db.get(agency.departmentId);
      if (dept) {
        departmentInfo = {
          id: dept._id,
          name: dept.name,
          code: dept.code,
        };
      }
    }

    return {
      ...agency,
      department: departmentInfo,
    };
  },
});

/**
 * Check if a code is available (not already in use)
 */
export const isCodeAvailable = query({
  args: {
    code: v.string(),
    excludeId: v.optional(v.id("implementingAgencies")), // For edit mode
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("implementingAgencies")
      .withIndex("code", (q) => q.eq("code", args.code))
      .first();

    // If no existing agency found, code is available
    if (!existing) return true;

    // If editing and it's the same agency, code is available
    if (args.excludeId && existing._id === args.excludeId) return true;

    // Otherwise, code is taken
    return false;
  },
});

/**
 * Get agencies by category
 */
export const getByCategory = query({
  args: {
    category: v.string(),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    let agencies = await ctx.db
      .query("implementingAgencies")
      .withIndex("category", (q) => q.eq("category", args.category))
      .collect();

    if (args.activeOnly) {
      agencies = agencies.filter(a => a.isActive);
    }

    return agencies.sort((a, b) => {
      const orderA = a.displayOrder ?? 9999;
      const orderB = b.displayOrder ?? 9999;
      return orderA - orderB;
    });
  },
});

/**
 * Get statistics about implementing agencies
 */
export const getStatistics = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const allAgencies = await ctx.db
      .query("implementingAgencies")
      .collect();

    const active = allAgencies.filter(a => a.isActive);
    const inactive = allAgencies.filter(a => !a.isActive);
    const departments = allAgencies.filter(a => a.type === "department");
    const external = allAgencies.filter(a => a.type === "external");
    const systemDefaults = allAgencies.filter(a => a.isSystemDefault);

    const totalProjectUsage = allAgencies.reduce((sum, a) =>
      sum + (a.projectUsageCount || 0), 0
    );

    const totalBreakdownUsage = allAgencies.reduce((sum, a) =>
      sum + (a.breakdownUsageCount || 0), 0
    );

    return {
      total: allAgencies.length,
      active: active.length,
      inactive: inactive.length,
      departments: departments.length,
      external: external.length,
      systemDefaults: systemDefaults.length,
      totalProjectUsage,
      totalBreakdownUsage,
    };
  },
});

/**
 * ============================================================================
 * MUTATIONS
 * ============================================================================
 */

/**
 * Create a new implementing agency
 */
export const create = mutation({
  args: {
    code: v.string(),
    fullName: v.string(),
    type: v.union(v.literal("department"), v.literal("external")),
    departmentId: v.optional(v.id("departments")),
    description: v.optional(v.string()),
    contactPerson: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    address: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
    category: v.optional(v.string()),
    colorCode: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    // Validate code format (uppercase alphanumeric, spaces, and underscores)
    const codeRegex = /^[A-Z0-9_ ]+$/;
    if (!codeRegex.test(args.code)) {
      throw new Error(
        "Code must contain only uppercase letters, numbers, spaces, and underscores"
      );
    }

    // Check if code already exists
    const existing = await ctx.db
      .query("implementingAgencies")
      .withIndex("code", (q) => q.eq("code", args.code))
      .first();

    if (existing) {
      throw new Error(`Implementing agency with code "${args.code}" already exists`);
    }

    // Validate type-specific requirements
    if (args.type === "department") {
      if (!args.departmentId) {
        throw new Error("Department ID is required when type is 'department'");
      }

      // Verify department exists
      const dept = await ctx.db.get(args.departmentId);
      if (!dept) {
        throw new Error("Department not found");
      }
    } else {
      // External agency - should not have departmentId
      if (args.departmentId) {
        throw new Error("External agencies should not have a department ID");
      }
    }

    // Validate color code if provided
    if (args.colorCode) {
      const colorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (!colorRegex.test(args.colorCode)) {
        throw new Error("Color code must be a valid hex color (e.g., #FF5733)");
      }
    }

    const now = Date.now();

    const agencyId = await ctx.db.insert("implementingAgencies", {
      code: args.code,
      fullName: args.fullName,
      type: args.type,
      departmentId: args.departmentId,
      description: args.description,
      contactPerson: args.contactPerson,
      contactEmail: args.contactEmail,
      contactPhone: args.contactPhone,
      address: args.address,
      displayOrder: args.displayOrder,
      isActive: true, // New agencies are active by default
      isSystemDefault: false,
      projectUsageCount: 0,
      breakdownUsageCount: 0,
      category: args.category,
      colorCode: args.colorCode,
      notes: args.notes,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Add to search index
    await indexEntity(ctx, {
      entityType: "agency",
      entityId: agencyId,
      primaryText: args.fullName,
      secondaryText: args.code,
      departmentId: args.departmentId,
      status: "active",
      isDeleted: false,
    });

    return agencyId;
  },
});

/**
 * Update an existing implementing agency
 */
export const update = mutation({
  args: {
    id: v.id("implementingAgencies"),
    code: v.optional(v.string()),
    fullName: v.optional(v.string()),
    type: v.optional(v.union(v.literal("department"), v.literal("external"))),
    departmentId: v.optional(v.id("departments")),
    description: v.optional(v.string()),
    contactPerson: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    address: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
    category: v.optional(v.string()),
    colorCode: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Implementing agency not found");

    // If trying to change code, validate
    if (args.code && args.code !== existing.code) {
      // Don't allow changing system default codes
      if (existing.isSystemDefault) {
        throw new Error("Cannot change code of system default agencies");
      }

      // Validate new code format
      const codeRegex = /^[A-Z0-9_ ]+$/;
      if (!codeRegex.test(args.code)) {
        throw new Error(
          "Code must contain only uppercase letters, numbers, spaces, and underscores"
        );
      }

      // Check if new code already exists
      const duplicate = await ctx.db
        .query("implementingAgencies")
        .withIndex("code", (q) => q.eq("code", args.code!))
        .first();

      if (duplicate && duplicate._id !== args.id) {
        throw new Error(`Implementing agency with code "${args.code}" already exists`);
      }
    }

    // Validate type changes
    const newType = args.type || existing.type;
    if (newType === "department" && args.departmentId) {
      // Verify department exists
      const dept = await ctx.db.get(args.departmentId);
      if (!dept) {
        throw new Error("Department not found");
      }
    }

    // Validate color code if provided
    if (args.colorCode) {
      const colorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (!colorRegex.test(args.colorCode)) {
        throw new Error("Color code must be a valid hex color (e.g., #FF5733)");
      }
    }

    const now = Date.now();

    await ctx.db.patch(args.id, {
      ...(args.code && { code: args.code }),
      ...(args.fullName && { fullName: args.fullName }),
      ...(args.type && { type: args.type }),
      ...(args.departmentId !== undefined && { departmentId: args.departmentId }),
      ...(args.description !== undefined && { description: args.description }),
      ...(args.contactPerson !== undefined && { contactPerson: args.contactPerson }),
      ...(args.contactEmail !== undefined && { contactEmail: args.contactEmail }),
      ...(args.contactPhone !== undefined && { contactPhone: args.contactPhone }),
      ...(args.address !== undefined && { address: args.address }),
      ...(args.displayOrder !== undefined && { displayOrder: args.displayOrder }),
      ...(args.category !== undefined && { category: args.category }),
      ...(args.colorCode !== undefined && { colorCode: args.colorCode }),
      ...(args.notes !== undefined && { notes: args.notes }),
      updatedAt: now,
      updatedBy: userId,
    });

    // Update search index
    await indexEntity(ctx, {
      entityType: "agency",
      entityId: args.id,
      primaryText: args.fullName || existing.fullName,
      secondaryText: args.code || existing.code,
      departmentId: args.departmentId !== undefined ? args.departmentId : existing.departmentId,
      status: existing.isActive ? "active" : "inactive",
      isDeleted: false,
    });

    return args.id;
  },
});

/**
 * Toggle active status of an implementing agency
 */
export const toggleActive = mutation({
  args: {
    id: v.id("implementingAgencies"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Implementing agency not found");

    // Check if this agency is in use before deactivating
    if (existing.isActive) {
      const projectUsage = existing.projectUsageCount || 0;
      const breakdownUsage = existing.breakdownUsageCount || 0;
      const totalUsage = projectUsage + breakdownUsage;

      if (totalUsage > 0) {
        const usageDetails = [];
        if (projectUsage > 0) usageDetails.push(`${projectUsage} project(s)`);
        if (breakdownUsage > 0) usageDetails.push(`${breakdownUsage} breakdown(s)`);

        throw new Error(
          `Cannot deactivate "${existing.code}" - it is currently used by ${usageDetails.join(' and ')}. ` +
          `Please remove all references before deactivating.`
        );
      }
    }

    const now = Date.now();

    await ctx.db.patch(args.id, {
      isActive: !existing.isActive,
      updatedAt: now,
      updatedBy: userId,
    });

    return args.id;
  },
});

/**
 * Delete an implementing agency (only if not in use and not system default)
 */
export const remove = mutation({
  args: {
    id: v.id("implementingAgencies"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Implementing agency not found");

    // Cannot delete system defaults
    if (existing.isSystemDefault) {
      throw new Error(
        `Cannot delete system default agency "${existing.code}". You can deactivate it instead.`
      );
    }

    // Cannot delete if in use
    const projectUsage = existing.projectUsageCount || 0;
    const breakdownUsage = existing.breakdownUsageCount || 0;
    const totalUsage = projectUsage + breakdownUsage;

    if (totalUsage > 0) {
      const usageDetails = [];
      if (projectUsage > 0) usageDetails.push(`${projectUsage} project(s)`);
      if (breakdownUsage > 0) usageDetails.push(`${breakdownUsage} breakdown(s)`);

      throw new Error(
        `Cannot delete "${existing.code}" - it is currently used by ${usageDetails.join(' and ')}. ` +
        `Please remove all references before deleting.`
      );
    }

    await ctx.db.delete(args.id);

    // Remove from search index
    await removeFromIndex(ctx, {
      entityId: args.id,
    });

    return { success: true };
  },
});

/**
 * Update usage counts (called internally when projects/breakdowns are created/deleted)
 * 🔒 INTERNAL ONLY - Not exposed to client, used by other mutations
 */
export const updateUsageCount = internalMutation({
  args: {
    code: v.string(),
    usageContext: v.union(v.literal("project"), v.literal("breakdown")),
    delta: v.number(), // +1 for create, -1 for delete
  },
  handler: async (ctx, args) => {
    const agency = await ctx.db
      .query("implementingAgencies")
      .withIndex("code", (q) => q.eq("code", args.code))
      .first();

    if (!agency) {
      // If agency doesn't exist, this might be from old data
      // Just log and return without error
      console.warn(`Implementing agency "${args.code}" not found for usage count update`);
      return;
    }

    const now = Date.now();

    if (args.usageContext === "project") {
      const newCount = Math.max(0, (agency.projectUsageCount || 0) + args.delta);
      await ctx.db.patch(agency._id, {
        projectUsageCount: newCount,
        updatedAt: now,
      });
    } else {
      const newCount = Math.max(0, (agency.breakdownUsageCount || 0) + args.delta);
      await ctx.db.patch(agency._id, {
        breakdownUsageCount: newCount,
        updatedAt: now,
      });
    }
  },
});

/**
 * Recalculate all usage counts (maintenance function)
 * Can be called by super_admin
 */
export const recalculateUsageCounts = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    // Only super_admin can run this
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "super_admin") {
      throw new Error("Only super_admin can recalculate usage counts");
    }

    const allAgencies = await ctx.db.query("implementingAgencies").collect();

    // Get all projects and breakdowns (exclude deleted ones)
    const projects = await ctx.db
      .query("projects")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    const breakdowns = await ctx.db
      .query("govtProjectBreakdowns")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    // Count usage for each agency
    const usageCounts: Record<string, { project: number; breakdown: number }> = {};

    for (const agency of allAgencies) {
      usageCounts[agency.code] = { project: 0, breakdown: 0 };
    }

    for (const project of projects) {
      if (usageCounts[project.implementingOffice]) {
        usageCounts[project.implementingOffice].project++;
      }
    }

    for (const breakdown of breakdowns) {
      if (usageCounts[breakdown.implementingOffice]) {
        usageCounts[breakdown.implementingOffice].breakdown++;
      }
    }

    // Update all agencies
    const now = Date.now();
    for (const agency of allAgencies) {
      const counts = usageCounts[agency.code] || { project: 0, breakdown: 0 };
      await ctx.db.patch(agency._id, {
        projectUsageCount: counts.project,
        breakdownUsageCount: counts.breakdown,
        updatedAt: now,
      });
    }

    return {
      success: true,
      agenciesUpdated: allAgencies.length,
      totalProjects: projects.length,
      totalBreakdowns: breakdowns.length,
    };
  },
});

/**
 * Internal version for system use (no auth required)
 */
export const recalculateUsageCountsInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allAgencies = await ctx.db.query("implementingAgencies").collect();

    // Get all projects and breakdowns (exclude deleted ones)
    const projects = await ctx.db
      .query("projects")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    const breakdowns = await ctx.db
      .query("govtProjectBreakdowns")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    // Count usage for each agency
    const usageCounts: Record<string, { project: number; breakdown: number }> = {};

    for (const agency of allAgencies) {
      usageCounts[agency.code] = { project: 0, breakdown: 0 };
    }

    for (const project of projects) {
      if (usageCounts[project.implementingOffice]) {
        usageCounts[project.implementingOffice].project++;
      }
    }

    for (const breakdown of breakdowns) {
      if (usageCounts[breakdown.implementingOffice]) {
        usageCounts[breakdown.implementingOffice].breakdown++;
      }
    }

    // Update all agencies
    const now = Date.now();
    for (const agency of allAgencies) {
      const counts = usageCounts[agency.code] || { project: 0, breakdown: 0 };
      await ctx.db.patch(agency._id, {
        projectUsageCount: counts.project,
        breakdownUsageCount: counts.breakdown,
        updatedAt: now,
      });
    }

    return {
      success: true,
      agenciesUpdated: allAgencies.length,
      totalProjects: projects.length,
      totalBreakdowns: breakdowns.length,
    };
  },
});