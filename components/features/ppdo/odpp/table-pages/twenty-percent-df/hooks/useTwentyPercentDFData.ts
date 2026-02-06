"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { TwentyPercentDF } from "../types";

interface UseTwentyPercentDFDataOptions {
    fundId?: string;
}

export function useTwentyPercentDFData({ fundId }: UseTwentyPercentDFDataOptions) {
    const fund = useQuery(
        api.twentyPercentDF.get,
        fundId ? { id: fundId as Id<"twentyPercentDF"> } : "skip"
    );

    const projects = useQuery(
        api.twentyPercentDF.list,
        fundId ? { budgetItemId: fundId as Id<"budgetItems"> } : "skip"
    );

    const transformedProjects: TwentyPercentDF[] =
        projects
            ?.map((p) => ({
                id: p._id,
                particulars: p.particulars,
                implementingOffice: p.implementingOffice,
                categoryId: p.categoryId,
                departmentId: p.departmentId,
                totalBudgetAllocated: p.totalBudgetAllocated,
                obligatedBudget: p.obligatedBudget,
                totalBudgetUtilized: p.totalBudgetUtilized,
                utilizationRate: p.utilizationRate || 0,
                projectCompleted: p.projectCompleted || 0,
                projectDelayed: p.projectDelayed || 0,
                projectsOngoing: (p as any).projectsOngoing || 0,
                remarks: p.remarks,
                year: p.year,
                status: p.status,
                targetDateCompletion: p.targetDateCompletion,
                isPinned: p.isPinned,
                pinnedAt: p.pinnedAt,
                pinnedBy: p.pinnedBy,
                projectManagerId: p.projectManagerId,
                _creationTime: p._creationTime,
                autoCalculateBudgetUtilized: p.autoCalculateBudgetUtilized,
            }))
            .sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0)) ?? [];

    return {
        fund,
        projects: transformedProjects,
        isLoading: projects === undefined || fund === undefined,
    };
}
