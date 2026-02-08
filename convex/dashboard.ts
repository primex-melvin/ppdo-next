// convex/dashboard.ts
/**
 * Advanced Analytics Dashboard
 * 
 * Comprehensive filtering and aggregation for PPDO Dashboard
 * - Multi-department/office filtering
 * - Date range and time period filtering  
 * - Search across all entities
 * - Pagination and sorting
 * - Optimized for performance with proper indexes
 */

import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

// ============================================================================
// SUMMARY DATA (Fiscal Year Landing)
// ============================================================================

export const getSummaryData = query({
    args: {
        includeInactive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return { yearStats: {} };
        }

        // Fetch all necessary data (excluding trashed items)
        // Note: In a production environment with massive data, this should be optimized
        // to use indexes or pre-calculated aggregations. For now, fetching all is acceptable.
        const projects = await ctx.db
            .query("projects")
            .filter((q) => q.neq(q.field("isDeleted"), true))
            .collect();
        const budgetItems = await ctx.db
            .query("budgetItems")
            .filter((q) => q.neq(q.field("isDeleted"), true))
            .collect();
        const breakdowns = await ctx.db
            .query("govtProjectBreakdowns")
            .filter((q) => q.neq(q.field("isDeleted"), true))
            .collect();

        // Aggregate by year
        const yearStats: Record<string, any> = {};

        // Helper to init year
        const getYearStats = (year: number) => {
            const yKey = year.toString();
            if (!yearStats[yKey]) {
                yearStats[yKey] = {
                    projectCount: 0,
                    ongoingCount: 0,
                    completedCount: 0,
                    delayedCount: 0,
                    totalBudgetAllocated: 0,
                    totalBudgetUtilized: 0,
                    utilizationRate: 0,
                    breakdownCount: 0,
                };
            }
            return yearStats[yKey];
        };

        // Process Projects
        const projectMap = new Map<string, number>(); // projectId -> year
        for (const p of projects) {
            if (!p.year) continue;
            projectMap.set(p._id, p.year);

            const stats = getYearStats(p.year);
            stats.projectCount++;

            // Normalize status check
            const status = p.status?.toLowerCase();
            if (status === 'ongoing') stats.ongoingCount++;
            else if (status === 'completed') stats.completedCount++;
            else if (status === 'delayed') stats.delayedCount++;
        }

        // Process Budget Items
        for (const b of budgetItems) {
            if (!b.year) continue;
            const stats = getYearStats(b.year);
            stats.totalBudgetAllocated += (b.totalBudgetAllocated || 0);
            stats.totalBudgetUtilized += (b.totalBudgetUtilized || 0);
        }

        // Process Breakdowns - link to project year
        for (const b of breakdowns) {
            if (b.projectId && projectMap.has(b.projectId)) {
                const year = projectMap.get(b.projectId);
                if (year) {
                    const stats = getYearStats(year);
                    stats.breakdownCount++;
                }
            }
        }

        // Calculate derived metrics
        for (const key in yearStats) {
            const stats = yearStats[key];
            if (stats.totalBudgetAllocated > 0) {
                stats.utilizationRate = (stats.totalBudgetUtilized / stats.totalBudgetAllocated) * 100;
            } else {
                stats.utilizationRate = 0;
            }
        }

        return { yearStats };
    }
});

// ============================================================================
// MAIN ANALYTICS
// ============================================================================

// Filter argument schema
const filterArgs = {
    // Fiscal filters
    fiscalYearId: v.optional(v.id("fiscalYears")),

    // Department/Office filters (multi-select)
    departmentIds: v.optional(v.array(v.id("departments"))),
    officeIds: v.optional(v.array(v.string())), // Implementing office codes

    // Time filters
    dateRange: v.optional(v.object({
        start: v.number(),
        end: v.number(),
    })),
    month: v.optional(v.number()), // 1-12
    quarter: v.optional(v.number()), // 1-4

    // Status filters
    projectStatus: v.optional(v.array(v.string())),
    budgetStatus: v.optional(v.array(v.string())),

    // Pagination & sorting
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    sortBy: v.optional(v.string()),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),

    // Fund Source
    fundType: v.optional(v.union(
        v.literal("budget"),
        v.literal("trust"),
        v.literal("twenty-percent-df"),
        v.literal("education"),
        v.literal("health")
    )),

    // Search
    searchTerm: v.optional(v.string()),
};

// Data Normalization Interfaces
interface NormalizedProject {
    _id: string;
    createdAt: number;
    year?: number;
    departmentId?: Id<"departments">;
    implementingOffice?: string;
    particulars: string; // Name/Title
    status?: string;
    totalBudgetAllocated: number;
    obligatedBudget: number;
    totalBudgetUtilized: number;
}

interface NormalizedBudgetItem {
    _id: string;
    createdAt: number;
    year?: number;
    departmentId?: Id<"departments">; // Some funds might not have this, optional
    particulars: string;
    totalBudgetAllocated: number;
    obligatedBudget: number;
    totalBudgetUtilized: number;
}

// Breakdown normalization interface
interface NormalizedBreakdown {
    _id: string;
    createdAt: number;
    projectId: string;
    description: string;
    allocatedBudget: number;
    inspections?: any[];
}

// Enhanced Time Series Types
interface TimeSeriesMetrics {
    budget: {
        allocated: number;
        obligated: number;
        utilized: number;
    };
    projects: {
        total: number;
        ongoing: number;
        completed: number;
        delayed: number;
        draft: number;
    };
    breakdowns: {
        total: number;
        withInspections: number;
        pending: number;
        totalBudget: number;
    };
}

interface TimeSeriesDetails {
    budgetItems: Array<{
        _id: string;
        particulars: string;
        allocated: number;
        obligated: number;
        utilized: number;
    }>;
    projects: Array<{
        _id: string;
        particulars: string;
        status?: string;
        implementingOffice?: string;
        totalBudgetAllocated: number;
    }>;
    breakdowns: Array<{
        _id: string;
        projectId: string;
        description: string;
        hasInspection: boolean;
    }>;
}

interface TimeSeriesPoint {
    month?: number;
    quarter?: number;
    label: string;
    metrics: TimeSeriesMetrics;
    details: TimeSeriesDetails;
}

interface EnhancedTimeSeriesData {
    monthly: TimeSeriesPoint[];
    quarterly: TimeSeriesPoint[];
}

/**
 * Main Analytics Dashboard Query
 * Returns filtered and aggregated data for dashboard display
 */
export const getDashboardAnalytics = query({
    args: filterArgs,
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // Get fiscal year context
        let targetYear: number | undefined;
        if (args.fiscalYearId) {
            const fy = await ctx.db.get(args.fiscalYearId);
            if (fy) targetYear = fy.year;
        }

        // Fetch all base data
        let rawProjects: any[] = [];
        let rawBudgetItems: any[] = [];
        let allBreakdowns: any[] = [];

        const fundType = args.fundType || "budget";

        if (fundType === "trust") {
            // Trust Funds -> Treat as "Projects"
            const trustFunds = await ctx.db
                .query("trustFunds")
                .filter((q) => q.neq(q.field("isDeleted"), true))
                .collect();
            // Trust funds don't have separate "budget items" table usually, 
            // the fund itself acts as both project and budget source.
            // We map it to both or just projects? 
            // The dashboard expects `budgetItems` for financial aggregation and `projects` for counts.
            // We will map trust funds to both normalized arrays to satisfy metrics.

            rawProjects = trustFunds;
            rawBudgetItems = trustFunds; // Double mapping for calculation compatibility

            // Adjust mappings for specific fields later if needed
        } else if (fundType === "twenty-percent-df") {
            const dfProjects = await ctx.db
                .query("twentyPercentDF")
                .filter((q) => q.neq(q.field("isDeleted"), true))
                .collect();
            rawProjects = dfProjects;
            rawBudgetItems = dfProjects;
        } else if (fundType === "education") {
            const sefProjects = await ctx.db
                .query("specialEducationFunds")
                .filter((q) => q.neq(q.field("isDeleted"), true))
                .collect();
            rawProjects = sefProjects;
            rawBudgetItems = sefProjects;
        } else if (fundType === "health") {
            const shfProjects = await ctx.db
                .query("specialHealthFunds")
                .filter((q) => q.neq(q.field("isDeleted"), true))
                .collect();
            rawProjects = shfProjects;
            rawBudgetItems = shfProjects;
        } else {
            // Default "budget"
            rawProjects = await ctx.db
                .query("projects")
                .filter((q) => q.neq(q.field("isDeleted"), true))
                .collect();
            rawBudgetItems = await ctx.db
                .query("budgetItems")
                .filter((q) => q.neq(q.field("isDeleted"), true))
                .collect();
        }

        const allDepartments = await ctx.db.query("departments").collect();
        const allCategories = await ctx.db.query("projectCategories").collect();
        // Breakdowns might not exist for all types yet
        allBreakdowns = await ctx.db
            .query("govtProjectBreakdowns")
            .filter((q) => q.neq(q.field("isDeleted"), true))
            .collect();

        // NORMALIZE DATA
        let allProjects: NormalizedProject[] = [];
        let allBudgetItems: NormalizedBudgetItem[] = [];

        if (fundType === "budget") {
            allProjects = (rawProjects as any[]).map(p => ({
                _id: p._id,
                createdAt: p.createdAt,
                year: p.year,
                departmentId: p.departmentId,
                implementingOffice: p.implementingOffice,
                particulars: p.particulars,
                status: p.status,
                totalBudgetAllocated: p.totalBudgetAllocated || 0,
                obligatedBudget: p.obligatedBudget || 0,
                totalBudgetUtilized: p.totalBudgetUtilized || 0,
            }));

            allBudgetItems = (rawBudgetItems as any[]).map(b => ({
                _id: b._id,
                createdAt: b.createdAt,
                year: b.year,
                departmentId: b.departmentId,
                particulars: b.particulars,
                totalBudgetAllocated: b.totalBudgetAllocated || 0,
                obligatedBudget: b.obligatedBudget || 0,
                totalBudgetUtilized: b.totalBudgetUtilized || 0,
            }));
        } else if (fundType === "trust") {
            // Map Trust Funds
            allProjects = (rawProjects as any[]).map(t => ({
                _id: t._id,
                createdAt: t.createdAt,
                year: t.year || t.fiscalYear, // Trust funds use 'year' or 'fiscalYear'? Schema says both optional?
                departmentId: t.departmentId,
                implementingOffice: t.officeInCharge, // Map officeInCharge -> implementingOffice
                particulars: t.projectTitle, // Map projectTitle -> particulars
                status: t.status,
                totalBudgetAllocated: t.received || 0, // Map received -> allocated
                obligatedBudget: t.obligatedPR || 0,
                totalBudgetUtilized: t.utilized || 0,
            }));

            // For other funds, the project IS the budget item
            allBudgetItems = allProjects;
        } else {
            // Generic mapping for other funds (20% DF, SEF, SHF)
            // Assumption: They share similar structure to Trust Funds or Projects
            // Check Schema or use 'any' if unsure, but strict mapping is better.
            // Based on recent files, they likely use 'officeInCharge' and 'projectTitle' too?
            // twentyPercentDF uses 'projectTitle', 'implementingOffice'.
            // sef uses 'projectTitle', 'implementingOffice'.
            // shf uses 'projectTitle', 'implementingOffice'.

            allProjects = (rawProjects as any[]).map(p => ({
                _id: p._id,
                createdAt: p.createdAt,
                year: p.year || p.fiscalYear,
                departmentId: p.departmentId,
                implementingOffice: p.officeInCharge || p.implementingOffice, // Try both
                particulars: p.projectTitle || p.programTitle || p.particulars || "Unnamed Project",
                status: p.status,
                totalBudgetAllocated: p.totalBudgetAllocated || p.received || p.allocated || 0,
                obligatedBudget: p.obligatedBudget || p.obligatedPR || p.obligated || 0,
                totalBudgetUtilized: p.totalBudgetUtilized || p.utilized || 0,
            }));
            allBudgetItems = allProjects;
        }

        // Apply filters
        const filters = buildFilters(args, targetYear);

        allProjects = applyProjectFilters(allProjects, filters, allDepartments);
        allBudgetItems = applyBudgetFilters(allBudgetItems, filters, allDepartments);

        // Apply search if provided
        if (args.searchTerm && args.searchTerm.trim().length > 0) {
            const searchLower = args.searchTerm.toLowerCase().trim();

            allProjects = allProjects.filter(p =>
                p.particulars.toLowerCase().includes(searchLower) ||
                (p.implementingOffice && p.implementingOffice.toLowerCase().includes(searchLower))
            );

            allBudgetItems = allBudgetItems.filter(b =>
                b.particulars.toLowerCase().includes(searchLower)
            );
        }

        // Calculate aggregated metrics
        const metrics = calculateMetrics(allProjects, allBudgetItems, allBreakdowns, allProjects);

        // Calculate breakdown by department
        const departmentBreakdown = calculateDepartmentBreakdown(
            allBudgetItems,
            allProjects,
            allDepartments
        );

        // Calculate breakdown by office (implementing agency)
        const officeBreakdown = calculateOfficeBreakdown(allProjects);

        // Calculate time-series data (legacy)
        const timeSeriesData = calculateTimeSeries(
            allProjects,
            allBudgetItems,
            filters
        );

        // Normalize breakdowns for enhanced time series
        const normalizedBreakdowns: NormalizedBreakdown[] = allBreakdowns.map(b => ({
            _id: b._id,
            createdAt: b.createdAt,
            projectId: b.projectId,
            description: b.description || b.workDescription || "Unnamed Breakdown",
            allocatedBudget: b.allocatedBudget || 0,
            inspections: b.inspections || [],
        }));

        // Calculate enhanced time-series data with full details
        const enhancedTimeSeriesData = calculateEnhancedTimeSeries(
            allProjects,
            allBudgetItems,
            normalizedBreakdowns,
            filters
        );

        // Get recent activities
        const recentActivities = getRecentActivities(allProjects, allBudgetItems);

        // Build chart data
        const chartData = buildChartData(
            allProjects,
            allBudgetItems,
            allCategories,
            allDepartments
        );

        // Top spending categories
        const topCategories = calculateTopCategories(allBudgetItems, 5);

        return {
            metrics,
            departmentBreakdown,
            officeBreakdown,
            timeSeriesData,
            enhancedTimeSeriesData,
            recentActivities,
            chartData,
            topCategories,
            filters: {
                appliedFilters: args,
                resultCount: {
                    projects: allProjects.length,
                    budgetItems: allBudgetItems.length,
                }
            }
        };
    }
});

/**
 * Department/Office Hierarchy Query
 * Returns departments with nested offices and budget totals
 */
export const getDepartmentHierarchy = query({
    args: {
        fiscalYearId: v.optional(v.id("fiscalYears")),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const departments = await ctx.db
            .query("departments")
            .withIndex("isActive", q => q.eq("isActive", true))
            .collect();

        const implementingAgencies = await ctx.db
            .query("implementingAgencies")
            .filter(q => q.eq(q.field("isActive"), true))
            .collect();

        // Get budget data for totals (excluding trashed items)
        let budgetItems = await ctx.db
            .query("budgetItems")
            .filter((q) => q.neq(q.field("isDeleted"), true))
            .collect();

        if (args.fiscalYearId) {
            const fy = await ctx.db.get(args.fiscalYearId);
            if (fy) {
                budgetItems = budgetItems.filter(b => b.year === fy.year);
            }
        }

        // Build hierarchy
        const hierarchy = departments.map(dept => {
            // Get offices linked to this department
            const offices = implementingAgencies.filter(
                agency => agency.departmentId === dept._id
            );

            // Calculate department totals
            const deptBudgets = budgetItems.filter(b => b.departmentId === dept._id);
            const totalAllocated = deptBudgets.reduce((sum, b) => sum + (b.totalBudgetAllocated || 0), 0);
            const totalUtilized = deptBudgets.reduce((sum, b) => sum + (b.totalBudgetUtilized || 0), 0);

            return {
                id: dept._id,
                name: dept.name,
                code: dept.code,
                offices: offices.map(office => ({
                    id: office._id,
                    name: office.fullName,
                    code: office.code,
                    type: office.type,
                })),
                budget: {
                    allocated: totalAllocated,
                    utilized: totalUtilized,
                    utilizationRate: totalAllocated > 0 ? (totalUtilized / totalAllocated) * 100 : 0,
                }
            };
        });

        return hierarchy;
    }
});

function calculateOfficeBreakdown(projects: any[]) {
    const officeMap = new Map<string, {
        name: string;
        allocated: number;
        obligated: number;
        utilized: number;
        projectCount: number;
    }>();

    projects.forEach(p => {
        if (p.implementingOffice) {
            const office = p.implementingOffice;
            if (!officeMap.has(office)) {
                officeMap.set(office, {
                    name: office,
                    allocated: 0,
                    obligated: 0,
                    utilized: 0,
                    projectCount: 0,
                });
            }
            const entry = officeMap.get(office)!;
            entry.allocated += p.totalBudgetAllocated || 0;
            entry.obligated += p.obligatedBudget || 0;
            entry.utilized += p.totalBudgetUtilized || 0;
            entry.projectCount++;
        }
    });

    return Array.from(officeMap.values())
        .map(d => ({
            ...d,
            utilizationRate: d.allocated > 0 ? (d.utilized / d.allocated) * 100 : 0,
        }))
        .sort((a, b) => b.allocated - a.allocated)
        .slice(0, 10);
}

/**
 * Time-Series Data Query
 * Returns aggregated data over time for charts
 */
export const getTimeSeriesData = query({
    args: {
        fiscalYearId: v.id("fiscalYears"),
        departmentId: v.optional(v.id("departments")),
        metric: v.union(
            v.literal("budget"),
            v.literal("projects"),
            v.literal("obligations"),
            v.literal("disbursements")
        ),
        granularity: v.union(
            v.literal("daily"),
            v.literal("weekly"),
            v.literal("monthly"),
            v.literal("quarterly")
        ),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const fiscalYear = await ctx.db.get(args.fiscalYearId);
        if (!fiscalYear) throw new Error("Year not found");

        // Fetch relevant data (excluding trashed items)
        let projects = await ctx.db
            .query("projects")
            .withIndex("year", q => q.eq("year", fiscalYear.year))
            .filter((q) => q.neq(q.field("isDeleted"), true))
            .collect();

        let budgetItems = await ctx.db
            .query("budgetItems")
            .withIndex("year", q => q.eq("year", fiscalYear.year))
            .filter((q) => q.neq(q.field("isDeleted"), true))
            .collect();

        // Apply department filter if provided
        if (args.departmentId) {
            projects = projects.filter(p => p.departmentId === args.departmentId);
            budgetItems = budgetItems.filter(b => b.departmentId === args.departmentId);
        }

        // Generate time series based on metric and granularity
        const timePoints = generateTimePoints(fiscalYear.year, args.granularity);

        const series = timePoints.map(point => {
            let value = 0;

            switch (args.metric) {
                case "projects":
                    value = projects.filter(p =>
                        isInTimeRange(p.createdAt, point.start, point.end)
                    ).length;
                    break;

                case "budget":
                    value = budgetItems
                        .filter(b => isInTimeRange(b.createdAt, point.start, point.end))
                        .reduce((sum, b) => sum + (b.totalBudgetAllocated || 0), 0);
                    break;

                case "obligations":
                    value = budgetItems
                        .filter(b => isInTimeRange(b.createdAt, point.start, point.end))
                        .reduce((sum, b) => sum + (b.obligatedBudget || 0), 0);
                    break;

                case "disbursements":
                    value = budgetItems
                        .filter(b => isInTimeRange(b.createdAt, point.start, point.end))
                        .reduce((sum, b) => sum + (b.totalBudgetUtilized || 0), 0);
                    break;
            }

            return {
                label: point.label,
                value,
                timestamp: point.start,
            };
        });

        return series;
    }
});

// Note: searchAutocomplete query removed - new search system in development

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface FilterCriteria {
    year?: number;
    departmentIds?: Id<"departments">[];
    officeIds?: string[];
    dateRange?: { start: number; end: number };
    month?: number;
    quarter?: number;
    projectStatus?: string[];
    budgetStatus?: string[];
}

function buildFilters(args: any, targetYear?: number): FilterCriteria {
    return {
        year: targetYear,
        departmentIds: args.departmentIds,
        officeIds: args.officeIds,
        dateRange: args.dateRange,
        month: args.month,
        quarter: args.quarter,
        projectStatus: args.projectStatus,
        budgetStatus: args.budgetStatus,
    };
}

function applyProjectFilters(projects: any[], filters: FilterCriteria, departments: any[]) {
    let filtered = projects;

    // Year filter
    if (filters.year) {
        filtered = filtered.filter(p => p.year === filters.year);
    }

    // Department filter
    if (filters.departmentIds && filters.departmentIds.length > 0) {
        filtered = filtered.filter(p =>
            p.departmentId && filters.departmentIds!.includes(p.departmentId)
        );
    }

    // Office filter
    if (filters.officeIds && filters.officeIds.length > 0) {
        filtered = filtered.filter(p =>
            p.implementingOffice && filters.officeIds!.includes(p.implementingOffice)
        );
    }

    // Date range filter
    if (filters.dateRange) {
        filtered = filtered.filter(p =>
            p.createdAt >= filters.dateRange!.start &&
            p.createdAt <= filters.dateRange!.end
        );
    }

    // Month filter
    if (filters.month) {
        filtered = filtered.filter(p => {
            const date = new Date(p.createdAt);
            return date.getMonth() + 1 === filters.month;
        });
    }

    // Quarter filter
    if (filters.quarter) {
        filtered = filtered.filter(p => {
            const date = new Date(p.createdAt);
            const month = date.getMonth() + 1;
            const projectQuarter = Math.ceil(month / 3);
            return projectQuarter === filters.quarter;
        });
    }

    // Status filter
    if (filters.projectStatus && filters.projectStatus.length > 0) {
        filtered = filtered.filter(p =>
            p.status && filters.projectStatus!.includes(p.status)
        );
    }

    return filtered;
}

function applyBudgetFilters(budgets: any[], filters: FilterCriteria, departments: any[]) {
    let filtered = budgets;

    // Year filter
    if (filters.year) {
        filtered = filtered.filter(b => b.year === filters.year);
    }

    // Department filter
    if (filters.departmentIds && filters.departmentIds.length > 0) {
        filtered = filtered.filter(b =>
            b.departmentId && filters.departmentIds!.includes(b.departmentId)
        );
    }

    // Date range filter
    if (filters.dateRange) {
        filtered = filtered.filter(b =>
            b.createdAt >= filters.dateRange!.start &&
            b.createdAt <= filters.dateRange!.end
        );
    }

    return filtered;
}

function calculateMetrics(projects: any[], budgetItems: any[], breakdowns: any[], allProjects: any[]) {
    const totalProjects = projects.length;
    const ongoingProjects = projects.filter(p => p.status === "ongoing").length;
    const completedProjects = projects.filter(p => p.status === "completed").length;
    const delayedProjects = projects.filter(p => p.status === "delayed").length;

    const totalAllocated = budgetItems.reduce((sum, b) => sum + (b.totalBudgetAllocated || 0), 0);
    const totalObligated = budgetItems.reduce((sum, b) => sum + (b.obligatedBudget || 0), 0);
    const totalDisbursed = budgetItems.reduce((sum, b) => sum + (b.totalBudgetUtilized || 0), 0);
    const totalRemaining = totalAllocated - totalObligated;

    const utilizationRate = totalAllocated > 0 ? (totalDisbursed / totalAllocated) * 100 : 0;
    const obligationRate = totalAllocated > 0 ? (totalObligated / totalAllocated) * 100 : 0;
    const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

    // YTD calculations
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1).getTime();
    const ytdBudgets = budgetItems.filter(b => b.createdAt >= yearStart);
    const ytdObligations = ytdBudgets.reduce((sum, b) => sum + (b.obligatedBudget || 0), 0);
    const ytdDisbursements = ytdBudgets.reduce((sum, b) => sum + (b.totalBudgetUtilized || 0), 0);

    return {
        totalProjects,
        ongoingProjects,
        completedProjects,
        delayedProjects,
        totalAllocated,
        totalObligated,
        totalDisbursed,
        totalRemaining,
        utilizationRate,
        obligationRate,
        completionRate,
        ytdObligations,
        ytdDisbursements,
    };
}

function calculateDepartmentBreakdown(budgetItems: any[], projects: any[], departments: any[]) {
    const deptMap = new Map<string, {
        name: string;
        code: string;
        allocated: number;
        obligated: number;
        utilized: number;
        projectCount: number;
    }>();

    budgetItems.forEach(b => {
        if (b.departmentId) {
            const dept = departments.find(d => d._id === b.departmentId);
            if (dept) {
                const key = dept._id;
                if (!deptMap.has(key)) {
                    deptMap.set(key, {
                        name: dept.name,
                        code: dept.code,
                        allocated: 0,
                        obligated: 0,
                        utilized: 0,
                        projectCount: 0,
                    });
                }
                const entry = deptMap.get(key)!;
                entry.allocated += b.totalBudgetAllocated || 0;
                entry.obligated += b.obligatedBudget || 0;
                entry.utilized += b.totalBudgetUtilized || 0;
            }
        }
    });

    // Count projects per department
    projects.forEach(p => {
        if (p.departmentId) {
            const dept = departments.find(d => d._id === p.departmentId);
            if (dept && deptMap.has(dept._id)) {
                deptMap.get(dept._id)!.projectCount++;
            }
        }
    });

    return Array.from(deptMap.values())
        .map(d => ({
            ...d,
            utilizationRate: d.allocated > 0 ? (d.utilized / d.allocated) * 100 : 0,
        }))
        .sort((a, b) => b.allocated - a.allocated)
        .slice(0, 10);
}

function calculateTimeSeries(projects: any[], budgetItems: any[], filters: FilterCriteria) {
    const series = {
        monthly: Array(12).fill(0).map((_, i) => ({
            month: i + 1,
            projects: 0,
            budget: 0,
            obligations: 0,
            disbursements: 0,
        })),
        quarterly: Array(4).fill(0).map((_, i) => ({
            quarter: i + 1,
            projects: 0,
            budget: 0,
            obligations: 0,
            disbursements: 0,
        })),
    };

    projects.forEach(p => {
        const date = new Date(p.createdAt);
        const month = date.getMonth();
        const quarter = Math.floor(month / 3);

        series.monthly[month].projects++;
        series.quarterly[quarter].projects++;
    });

    budgetItems.forEach(b => {
        const date = new Date(b.createdAt);
        const month = date.getMonth();
        const quarter = Math.floor(month / 3);

        series.monthly[month].budget += b.totalBudgetAllocated || 0;
        series.monthly[month].obligations += b.obligatedBudget || 0;
        series.monthly[month].disbursements += b.totalBudgetUtilized || 0;

        series.quarterly[quarter].budget += b.totalBudgetAllocated || 0;
        series.quarterly[quarter].obligations += b.obligatedBudget || 0;
        series.quarterly[quarter].disbursements += b.totalBudgetUtilized || 0;
    });

    return series;
}

/**
 * Enhanced Time Series Calculation
 * Calculates comprehensive time series data including budget, projects, and breakdowns
 * with full detail information for rich tooltips
 */
function calculateEnhancedTimeSeries(
    projects: NormalizedProject[],
    budgetItems: NormalizedBudgetItem[],
    breakdowns: NormalizedBreakdown[],
    filters: FilterCriteria
): EnhancedTimeSeriesData {
    // Initialize 12 months and 4 quarters with full structure
    const series: EnhancedTimeSeriesData = {
        monthly: Array(12).fill(0).map((_, i) => ({
            month: i + 1,
            label: new Date(2024, i).toLocaleString("default", { month: "short" }),
            metrics: {
                budget: { allocated: 0, obligated: 0, utilized: 0 },
                projects: { total: 0, ongoing: 0, completed: 0, delayed: 0, draft: 0 },
                breakdowns: { total: 0, withInspections: 0, pending: 0, totalBudget: 0 },
            },
            details: {
                budgetItems: [],
                projects: [],
                breakdowns: [],
            },
        })),
        quarterly: Array(4).fill(0).map((_, i) => ({
            quarter: i + 1,
            label: `Q${i + 1}`,
            metrics: {
                budget: { allocated: 0, obligated: 0, utilized: 0 },
                projects: { total: 0, ongoing: 0, completed: 0, delayed: 0, draft: 0 },
                breakdowns: { total: 0, withInspections: 0, pending: 0, totalBudget: 0 },
            },
            details: {
                budgetItems: [],
                projects: [],
                breakdowns: [],
            },
        })),
    };

    // Aggregate budget items
    budgetItems.forEach(item => {
        const date = new Date(item.createdAt);
        const month = date.getMonth();           // 0-11
        const quarter = Math.floor(month / 3);   // 0-3

        // Monthly aggregation
        const m = series.monthly[month];
        m.metrics.budget.allocated += item.totalBudgetAllocated || 0;
        m.metrics.budget.obligated += item.obligatedBudget || 0;
        m.metrics.budget.utilized += item.totalBudgetUtilized || 0;
        m.details.budgetItems.push({
            _id: item._id,
            particulars: item.particulars,
            allocated: item.totalBudgetAllocated || 0,
            obligated: item.obligatedBudget || 0,
            utilized: item.totalBudgetUtilized || 0,
        });

        // Quarterly aggregation
        const q = series.quarterly[quarter];
        q.metrics.budget.allocated += item.totalBudgetAllocated || 0;
        q.metrics.budget.obligated += item.obligatedBudget || 0;
        q.metrics.budget.utilized += item.totalBudgetUtilized || 0;
    });

    // Aggregate projects with status breakdown
    projects.forEach(project => {
        const date = new Date(project.createdAt);
        const month = date.getMonth();
        const quarter = Math.floor(month / 3);

        const status = project.status?.toLowerCase();

        // Monthly
        const m = series.monthly[month];
        m.metrics.projects.total++;
        if (status === 'ongoing') m.metrics.projects.ongoing++;
        if (status === 'completed') m.metrics.projects.completed++;
        if (status === 'delayed') m.metrics.projects.delayed++;
        if (status === 'draft') m.metrics.projects.draft++;
        m.details.projects.push({
            _id: project._id,
            particulars: project.particulars,
            status: project.status,
            implementingOffice: project.implementingOffice,
            totalBudgetAllocated: project.totalBudgetAllocated,
        });

        // Quarterly
        const q = series.quarterly[quarter];
        q.metrics.projects.total++;
        if (status === 'ongoing') q.metrics.projects.ongoing++;
        if (status === 'completed') q.metrics.projects.completed++;
        if (status === 'delayed') q.metrics.projects.delayed++;
        if (status === 'draft') q.metrics.projects.draft++;
    });

    // Aggregate breakdowns with inspection status
    breakdowns.forEach(breakdown => {
        const date = new Date(breakdown.createdAt);
        const month = date.getMonth();
        const quarter = Math.floor(month / 3);

        const hasInspection = !!(breakdown.inspections && breakdown.inspections.length > 0);

        // Monthly
        const m = series.monthly[month];
        m.metrics.breakdowns.total++;
        if (hasInspection) m.metrics.breakdowns.withInspections++;
        else m.metrics.breakdowns.pending++;
        m.metrics.breakdowns.totalBudget += breakdown.allocatedBudget || 0;
        m.details.breakdowns.push({
            _id: breakdown._id,
            projectId: breakdown.projectId,
            description: breakdown.description,
            hasInspection: hasInspection,
        });

        // Quarterly
        const q = series.quarterly[quarter];
        q.metrics.breakdowns.total++;
        if (hasInspection) q.metrics.breakdowns.withInspections++;
        else q.metrics.breakdowns.pending++;
        q.metrics.breakdowns.totalBudget += breakdown.allocatedBudget || 0;
    });

    return series;
}

function getRecentActivities(projects: any[], budgetItems: any[]) {
    const activities: Array<{
        type: string;
        title: string;
        timestamp: number;
        metadata: any;
    }> = [];

    // Recent projects
    const recentProjects = projects
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5);

    recentProjects.forEach(p => {
        activities.push({
            type: "project",
            title: p.particulars || "Project Created",
            timestamp: p.createdAt,
            metadata: {
                status: p.status,
                office: p.implementingOffice,
            }
        });
    });

    // Recent budget items
    const recentBudgets = budgetItems
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5);

    recentBudgets.forEach(b => {
        activities.push({
            type: "budget",
            title: b.particulars || "Budget Item Created",
            timestamp: b.createdAt,
            metadata: {
                amount: b.totalBudgetAllocated,
                programCode: b.particulars,
            }
        });
    });

    return activities
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);
}

function buildChartData(projects: any[], budgetItems: any[], categories: any[], departments: any[]) {
    // Budget overview chart data
    const allocated = budgetItems.reduce((sum, b) => sum + (b.totalBudgetAllocated || 0), 0);
    const obligated = budgetItems.reduce((sum, b) => sum + (b.obligatedBudget || 0), 0);
    const disbursed = budgetItems.reduce((sum, b) => sum + (b.totalBudgetUtilized || 0), 0);

    const budgetOverview = {
        allocated,
        obligated,
        disbursed,
        remaining: allocated - obligated,
    };

    // Project status distribution
    const statusDistribution = {
        ongoing: projects.filter(p => p.status === "ongoing").length,
        completed: projects.filter(p => p.status === "completed").length,
        delayed: projects.filter(p => p.status === "delayed").length,
        draft: projects.filter(p => p.status === "draft").length,
    };

    // Category distribution
    const categoryMap = new Map<string, number>();
    projects.forEach(p => {
        if (p.categoryId) {
            const cat = categories.find(c => c._id === p.categoryId);
            const name = cat ? cat.fullName : "Uncategorized";
            categoryMap.set(name, (categoryMap.get(name) || 0) + 1);
        } else {
            categoryMap.set("Uncategorized", (categoryMap.get("Uncategorized") || 0) + 1);
        }
    });

    return {
        budgetOverview,
        statusDistribution,
        categoryDistribution: Array.from(categoryMap.entries()).map(([name, count]) => ({
            name,
            value: count,
        })),
    };
}

function calculateTopCategories(budgetItems: any[], limit: number) {
    const categoryMap = new Map<string, {
        category: string;
        allocated: number;
        utilized: number;
        count: number;
    }>();

    budgetItems.forEach(b => {
        const cat = b.particulars || "Uncategorized";
        if (!categoryMap.has(cat)) {
            categoryMap.set(cat, {
                category: cat,
                allocated: 0,
                utilized: 0,
                count: 0,
            });
        }
        const entry = categoryMap.get(cat)!;
        entry.allocated += b.totalBudgetAllocated || 0;
        entry.utilized += b.totalBudgetUtilized || 0;
        entry.count++;
    });

    return Array.from(categoryMap.values())
        .sort((a, b) => b.allocated - a.allocated)
        .slice(0, limit);
}

function generateTimePoints(year: number, granularity: string) {
    const points: Array<{ label: string; start: number; end: number }> = [];

    switch (granularity) {
        case "monthly":
            for (let month = 0; month < 12; month++) {
                const start = new Date(year, month, 1).getTime();
                const end = new Date(year, month + 1, 0, 23, 59, 59).getTime();
                points.push({
                    label: new Date(year, month).toLocaleString('default', { month: 'short' }),
                    start,
                    end,
                });
            }
            break;

        case "quarterly":
            for (let q = 0; q < 4; q++) {
                const startMonth = q * 3;
                const start = new Date(year, startMonth, 1).getTime();
                const end = new Date(year, startMonth + 3, 0, 23, 59, 59).getTime();
                points.push({
                    label: `Q${q + 1}`,
                    start,
                    end,
                });
            }
            break;

        default:
            // Daily not implemented for performance reasons
            break;
    }

    return points;
}

function isInTimeRange(timestamp: number, start: number, end: number): boolean {
    return timestamp >= start && timestamp <= end;
}
