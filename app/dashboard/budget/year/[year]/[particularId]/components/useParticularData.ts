import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function useParticularData(particular: string) {
  const looksLikeId = particular.includes(":");

  const budgetItemById = useQuery(
    api.budgetItems.get,
    looksLikeId ? ({ id: particular } as { id: Id<"budgetItems"> }) : "skip"
  );

  const budgetItemByParticular = useQuery(
    api.budgetItems.getByParticulars,
    looksLikeId ? "skip" : { particulars: particular }
  );

  const budgetItem = looksLikeId ? budgetItemById : budgetItemByParticular;

  // Loading state while the budget item query resolves
  if (budgetItem === undefined) {
    return {
      budgetItem: undefined,
      breakdownStats: undefined,
      projects: [],
      isLoading: true,
    };
  }

  // When not found, short-circuit with empty data so UI can show a friendly message
  if (budgetItem === null) {
    return {
      budgetItem: null,
      breakdownStats: null,
      projects: [],
      isLoading: false,
    };
  }

  const budgetItemId = budgetItem._id;

  const breakdownStats = useQuery(
    api.govtProjects.getBreakdownStats,
    budgetItemId ? { budgetItemId } : "skip"
  );

  const projects = useQuery(
    api.projects.list,
    budgetItemId ? { budgetItemId } : "skip"
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
        projectsOngoing: project.projectsOnTrack,
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
    isLoading: projects === undefined,
  };
}
