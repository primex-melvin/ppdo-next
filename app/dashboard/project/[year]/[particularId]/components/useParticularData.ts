// app/dashboard/project/budget/[particularId]/components/useParticularData.ts

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function useParticularData(particular: string) {
  const budgetItem = useQuery(api.budgetItems.getByParticulars, {
    particulars: particular,
  });

  const breakdownStats = useQuery(api.govtProjects.getBreakdownStats, {
    budgetItemId: budgetItem?._id,
  });

  const projects = useQuery(
    api.projects.list,
    budgetItem ? { budgetItemId: budgetItem._id } : "skip"
  );

  const transformedProjects =
    projects
      ?.map((project) => ({
        id: project._id,
        particulars: project.particulars,
        implementingOffice: project.implementingOffice,
        totalBudgetAllocated: project.totalBudgetAllocated,
        obligatedBudget: project.obligatedBudget,
        totalBudgetUtilized: project.totalBudgetUtilized,
        utilizationRate: project.utilizationRate,
        projectCompleted: project.projectCompleted,
        projectDelayed: project.projectDelayed,
        projectsOngoing: project.projectsOngoing,
        remarks: project.remarks ?? "",
        year: project.year,
        status: project.status,
        targetDateCompletion: project.targetDateCompletion,
        isPinned: project.isPinned,
        pinnedAt: project.pinnedAt,
        pinnedBy: project.pinnedBy,
        budgetItemId: project.budgetItemId,
        categoryId: project.categoryId,
        _creationTime: project._creationTime, // Include creation time for sorting
      }))
      .sort((a, b) => b._creationTime - a._creationTime) ?? []; // Sort newest first

  return {
    budgetItem,
    breakdownStats,
    projects: transformedProjects,
    isLoading: projects === undefined || budgetItem === undefined,
  };
}
