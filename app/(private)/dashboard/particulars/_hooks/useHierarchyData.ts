// app/dashboard/particulars/_hooks/useHierarchyData.ts

import { useMemo } from "react";
import { Doc } from "@/convex/_generated/dataModel";

type SortOrder = "asc" | "desc";

interface UseHierarchyDataProps {
  budgetParticulars: Doc<"budgetParticulars">[] | undefined;
  projectParticulars: Doc<"projectParticulars">[] | undefined;
  budgetItems: Doc<"budgetItems">[] | undefined;
  projects: Doc<"projects">[] | undefined;
  breakdowns: Doc<"govtProjectBreakdowns">[] | undefined;
  selectedYear: string;
  sortOrder: SortOrder;
}

export function useHierarchyData({
  budgetParticulars,
  projectParticulars,
  budgetItems,
  projects,
  breakdowns,
  selectedYear,
  sortOrder,
}: UseHierarchyDataProps) {
  const hierarchyData = useMemo(() => {
    if (!budgetParticulars || !projectParticulars || !budgetItems || !projects || !breakdowns) {
      return [];
    }

    let data = budgetParticulars.map((budgetParticular) => {
      const relatedBudgetItems = budgetItems.filter(
        (bi) => bi.particulars === budgetParticular.code && !bi.isDeleted
      );

      const budgetItemsWithProjects = relatedBudgetItems.map((budgetItem) => {
        let relatedProjects = projects.filter(
          (p) => p.budgetItemId === budgetItem._id && !p.isDeleted
        );

        // Filter by year if not "all"
        if (selectedYear !== "all") {
          relatedProjects = relatedProjects.filter(
            (p) => p.year?.toString() === selectedYear
          );
        }

        const projectsWithBreakdowns = relatedProjects.map((project) => {
          const relatedBreakdowns = breakdowns.filter(
            (b) => b.projectId === project._id && !b.isDeleted
          );

          return {
            ...project,
            breakdowns: relatedBreakdowns,
          };
        });

        return {
          ...budgetItem,
          projects: projectsWithBreakdowns,
        };
      });

      const totalProjects = budgetItemsWithProjects.reduce(
        (sum, bi) => sum + bi.projects.length,
        0
      );
      const totalBreakdowns = budgetItemsWithProjects.reduce(
        (sum, bi) =>
          sum +
          bi.projects.reduce((s, p) => s + (p.breakdowns?.length || 0), 0),
        0
      );

      return {
        particular: budgetParticular,
        budgetItems: budgetItemsWithProjects,
        totalProjects,
        totalBreakdowns,
      };
    });

    // Sort alphabetically by fullName
    data.sort((a, b) => {
      const comparison = a.particular.fullName.localeCompare(b.particular.fullName);
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return data;
  }, [budgetParticulars, projectParticulars, budgetItems, projects, breakdowns, selectedYear, sortOrder]);

  // Group data by year when "All Years" is selected
  const groupedByYear = useMemo(() => {
    if (selectedYear !== "all" || hierarchyData.length === 0) {
      return null;
    }

    // Collect all years from the data
    const yearsMap = new Map<number, typeof hierarchyData>();

    hierarchyData.forEach((item) => {
      item.budgetItems.forEach((bi) => {
        bi.projects.forEach((project) => {
          if (project.year) {
            if (!yearsMap.has(project.year)) {
              yearsMap.set(project.year, []);
            }
            
            // Find or create the particular entry for this year
            const yearData = yearsMap.get(project.year)!;
            let particularEntry = yearData.find(
              (d) => d.particular._id === item.particular._id
            );

            if (!particularEntry) {
              particularEntry = {
                particular: item.particular,
                budgetItems: [],
                totalProjects: 0,
                totalBreakdowns: 0,
              };
              yearData.push(particularEntry);
            }

            // Find or create the budget item entry
            let budgetItemEntry = particularEntry.budgetItems.find(
              (b) => b._id === bi._id
            );

            if (!budgetItemEntry) {
              budgetItemEntry = {
                ...bi,
                projects: [],
              };
              particularEntry.budgetItems.push(budgetItemEntry);
            }

            // Add the project with its breakdowns
            budgetItemEntry.projects.push(project);
            particularEntry.totalProjects += 1;
            particularEntry.totalBreakdowns += project.breakdowns?.length || 0;
          }
        });
      });
    });

    // Convert to sorted array
    const yearGroups = Array.from(yearsMap.entries())
      .sort(([a], [b]) => b - a) // Sort years descending
      .map(([year, data]) => ({
        year,
        data: data.sort((a, b) => {
          const comparison = a.particular.fullName.localeCompare(b.particular.fullName);
          return sortOrder === "asc" ? comparison : -comparison;
        }),
      }));

    return yearGroups;
  }, [hierarchyData, selectedYear, sortOrder]);

  const totals = useMemo(() => {
    const totalBudgetItems = hierarchyData.reduce(
      (sum, item) => sum + item.budgetItems.length,
      0
    );
    const totalProjects = hierarchyData.reduce(
      (sum, item) => sum + item.totalProjects,
      0
    );
    const totalBreakdowns = hierarchyData.reduce(
      (sum, item) => sum + item.totalBreakdowns,
      0
    );

    return {
      budgetItems: totalBudgetItems,
      projects: totalProjects,
      breakdowns: totalBreakdowns,
    };
  }, [hierarchyData]);

  return { hierarchyData, groupedByYear, totals };
}