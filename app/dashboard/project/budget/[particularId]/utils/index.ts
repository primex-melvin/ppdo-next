// app/dashboard/project/budget/[particularId]/utils/index.ts

import { Project, ProjectSortField, SortDirection, ProjectTotals, GroupedProjects, ProjectCategory } from "../types";

// ============================================================================
// RE-EXPORT SHARED UTILITIES FROM BUDGET
// ============================================================================
// These are the same utilities used in budget table
export {
  getUtilizationColor,
  getProjectStatusColor,
  getStatusColor,
  formatCurrency,
  formatNumberWithCommas,
  parseFormattedNumber,
  formatNumberForDisplay,
} from "@/app/dashboard/project/budget/utils";

// ============================================================================
// PROJECT-SPECIFIC FORMATTING
// ============================================================================

/**
 * Formats percentage value
 * @param value - Number to format
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Creates project slug from particulars and ID
 * @param particulars - Project particulars
 * @param id - Project ID
 * @returns URL-safe slug
 */
export function createProjectSlug(particulars: string, id: string): string {
  return `${particulars
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${id}`;
}

// ============================================================================
// CATEGORY UTILITIES
// ============================================================================

/**
 * Gets header style for category
 * @param category - Project category or null
 * @returns Style object with backgroundColor and color
 */
export function getCategoryHeaderStyle(category?: ProjectCategory | null): {
  backgroundColor: string;
  color: string;
} {
  if (category?.colorCode) {
    return { backgroundColor: category.colorCode, color: "white" };
  }

  const colors = [
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
  ];

  const id = category?._id || "uncategorized";
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }

  const bg = id === "uncategorized" ? "#71717a" : colors[Math.abs(hash) % colors.length];
  return { backgroundColor: bg, color: "white" };
}

// ============================================================================
// FILTERING UTILITIES
// ============================================================================

/**
 * Filters projects by search query
 * @param projects - Array of projects
 * @param query - Search query string
 * @returns Filtered array of projects
 */
export function filterProjectsBySearch(
  projects: Project[],
  query: string
): Project[] {
  if (!query.trim()) return projects;

  const lowerQuery = query.toLowerCase();
  return projects.filter((project) => {
    return (
      project.particulars.toLowerCase().includes(lowerQuery) ||
      project.implementingOffice.toLowerCase().includes(lowerQuery) ||
      project.status?.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * Filters projects by status
 * @param projects - Array of projects
 * @param statuses - Array of status strings
 * @returns Filtered array of projects
 */
export function filterProjectsByStatus(
  projects: Project[],
  statuses: string[]
): Project[] {
  if (statuses.length === 0) return projects;
  return projects.filter(
    (project) => project.status && statuses.includes(project.status)
  );
}

/**
 * Filters projects by implementing office
 * @param projects - Array of projects
 * @param offices - Array of office strings
 * @returns Filtered array of projects
 */
export function filterProjectsByOffice(
  projects: Project[],
  offices: string[]
): Project[] {
  if (offices.length === 0) return projects;
  return projects.filter((project) =>
    offices.includes(project.implementingOffice)
  );
}

/**
 * Filters projects by year
 * @param projects - Array of projects
 * @param years - Array of years
 * @returns Filtered array of projects
 */
export function filterProjectsByYear(
  projects: Project[],
  years: number[]
): Project[] {
  if (years.length === 0) return projects;
  return projects.filter((project) => project.year && years.includes(project.year));
}

// ============================================================================
// SORTING UTILITIES
// ============================================================================

/**
 * Sorts projects by field and direction
 * @param projects - Array of projects
 * @param field - Field to sort by
 * @param direction - Sort direction
 * @returns Sorted array of projects
 */
export function sortProjects(
  projects: Project[],
  field: ProjectSortField,
  direction: SortDirection
): Project[] {
  if (!field || !direction) return projects;

  return [...projects].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];

    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;

    if (typeof aVal === "string" && typeof bVal === "string") {
      return direction === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    if (typeof aVal === "number" && typeof bVal === "number") {
      return direction === "asc" ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });
}

/**
 * Sorts projects with pinned items first
 * @param projects - Array of projects
 * @returns Sorted array with pinned items first
 */
export function sortWithPinnedFirst(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });
}

// ============================================================================
// GROUPING UTILITIES
// ============================================================================

/**
 * Groups projects by category
 * @param projects - Array of projects
 * @param categories - Array of available categories
 * @returns Array of grouped projects
 */
export function groupProjectsByCategory(
  projects: Project[],
  categories: ProjectCategory[] | undefined
): [string, GroupedProjects][] {
  const groups: Record<string, GroupedProjects> = {};
  groups["uncategorized"] = { category: null, projects: [] };

  projects.forEach((project) => {
    if (project.categoryId) {
      if (!groups[project.categoryId]) {
        const cat = categories?.find((c) => c._id === project.categoryId);
        groups[project.categoryId] = { category: cat || null, projects: [] };
      }
      groups[project.categoryId].projects.push(project);
    } else {
      groups["uncategorized"].projects.push(project);
    }
  });

  return Object.entries(groups)
    .filter(([_, group]) => group.projects.length > 0)
    .sort((a, b) => {
      if (a[0] === "uncategorized") return 1;
      if (b[0] === "uncategorized") return -1;
      const orderA = a[1].category?.displayOrder || 999;
      const orderB = b[1].category?.displayOrder || 999;
      return orderA - orderB;
    });
}

// ============================================================================
// CALCULATION UTILITIES
// ============================================================================

/**
 * Calculates totals from projects
 * @param projects - Array of projects
 * @returns Object containing all totals
 */
export function calculateProjectTotals(projects: Project[]): ProjectTotals {
  return projects.reduce(
    (acc, project) => ({
      totalBudgetAllocated: acc.totalBudgetAllocated + project.totalBudgetAllocated,
      obligatedBudget: acc.obligatedBudget + (project.obligatedBudget || 0),
      totalBudgetUtilized: acc.totalBudgetUtilized + project.totalBudgetUtilized,
      utilizationRate:
        acc.utilizationRate + project.utilizationRate / (projects.length || 1),
      projectCompleted: acc.projectCompleted + project.projectCompleted,
      projectDelayed: acc.projectDelayed + (project.projectDelayed || 0),
      projectsOngoing: acc.projectsOngoing + project.projectsOngoing,
    }),
    {
      totalBudgetAllocated: 0,
      obligatedBudget: 0,
      totalBudgetUtilized: 0,
      utilizationRate: 0,
      projectCompleted: 0,
      projectDelayed: 0,
      projectsOngoing: 0,
    }
  );
}

/**
 * Counts visible label columns
 * @param hiddenColumns - Set of hidden column IDs
 * @returns Number of visible label columns
 */
export function countVisibleLabelColumns(hiddenColumns: Set<string>): number {
  const labels = ["particulars", "implementingOffice", "year", "status"];
  return labels.filter((id) => !hiddenColumns.has(id)).length;
}

// ============================================================================
// EXTRACTION UTILITIES
// ============================================================================

/**
 * Extracts unique implementing offices
 * @param projects - Array of projects
 * @returns Sorted array of unique offices
 */
export function extractUniqueOffices(projects: Project[]): string[] {
  const offices = new Set<string>();
  projects.forEach((project) => {
    if (project.implementingOffice) offices.add(project.implementingOffice);
  });
  return Array.from(offices).sort();
}

/**
 * Extracts unique statuses from projects
 * @param projects - Array of projects
 * @returns Sorted array of unique statuses
 */
export function extractUniqueStatuses(projects: Project[]): string[] {
  const statuses = new Set<string>();
  projects.forEach((project) => {
    if (project.status) statuses.add(project.status);
  });
  return Array.from(statuses).sort();
}

/**
 * Extracts unique years from projects
 * @param projects - Array of projects
 * @returns Sorted array of unique years (descending)
 */
export function extractUniqueYears(projects: Project[]): number[] {
  const years = new Set<number>();
  projects.forEach((project) => {
    if (project.year) years.add(project.year);
  });
  return Array.from(years).sort((a, b) => b - a);
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

/**
 * Generates CSV content from projects
 * @param projects - Array of projects
 * @param columns - Array of column configurations
 * @param hiddenColumns - Set of hidden column IDs
 * @returns CSV content string
 */
export function generateProjectsCSV(
  projects: Project[],
  columns: Array<{ id: string; label: string }>,
  hiddenColumns: Set<string>
): string {
  const visibleCols = columns.filter((col) => !hiddenColumns.has(col.id));

  if (visibleCols.length === 0) {
    throw new Error("No columns are visible to export");
  }

  const headers = visibleCols.map((c) => c.label).join(",");
  const rows = projects.map((project) => {
    return visibleCols
      .map((col) => {
        let val = (project as any)[col.id];
        if (val === undefined || val === null) return "";
        if (col.id === "utilizationRate") return (val as number).toFixed(2);
        if (typeof val === "string") {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      })
      .join(",");
  });

  return [headers, ...rows].join("\n");
}

/**
 * Downloads CSV file
 * @param csvContent - CSV content string
 * @param filename - Filename for download
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}