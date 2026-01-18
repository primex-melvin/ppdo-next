// app/dashboard/project/budget/[particularId]/utils.ts

import { 
  Project, 
  ProjectSortField, 
  SortDirection, 
  ProjectTotals, 
  GroupedProjects, 
  ProjectCategory,
  TableColumn 
} from "./types";
import { DEFAULT_CATEGORY_COLORS, UNCATEGORIZED_COLOR } from "./constants";

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Formats a number as currency (Philippine Peso)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Formats a number as percentage
 */
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

/**
 * Formats number with commas for input fields
 */
export const formatNumberWithCommas = (value: string): string => {
  const cleaned = value.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (parts.length > 1) return parts[0] + '.' + parts[1].slice(0, 2);
  return parts[0];
};

/**
 * Parses formatted number string to number
 */
export const parseFormattedNumber = (value: string): number => {
  const cleaned = value.replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Formats number for display in input
 */
export const formatNumberForDisplay = (value: number): string => {
  if (value === 0) return '';
  return new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Creates URL-safe slug from project particulars and ID
 */
export const createProjectSlug = (particulars: string, id: string): string => {
  return `${particulars
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${id}`;
};

// ============================================================================
// COLOR UTILITIES
// ============================================================================

/**
 * Gets color class based on utilization rate
 */
export const getUtilizationColor = (rate: number): string => {
  if (rate >= 80) return "text-red-600 dark:text-red-400";
  if (rate >= 60) return "text-orange-600 dark:text-orange-400";
  return "text-green-600 dark:text-green-400";
};

/**
 * Gets color class based on project status
 */
export const getStatusColor = (status?: string): string => {
  if (!status) return "text-zinc-600 dark:text-zinc-400";
  if (status === "completed") return "text-green-600 dark:text-green-400";
  if (status === "ongoing") return "text-blue-600 dark:text-blue-400";
  if (status === "delayed") return "text-red-600 dark:text-red-400";
  return "text-zinc-600 dark:text-zinc-400";
};

/**
 * Gets header style for category
 */
export const getCategoryHeaderStyle = (category?: ProjectCategory | null): {
  backgroundColor: string;
  color: string;
} => {
  if (category?.colorCode) {
    return { backgroundColor: category.colorCode, color: "white" };
  }

  const id = category?._id || "uncategorized";
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }

  const bg = id === "uncategorized" 
    ? UNCATEGORIZED_COLOR 
    : DEFAULT_CATEGORY_COLORS[Math.abs(hash) % DEFAULT_CATEGORY_COLORS.length];
  
  return { backgroundColor: bg, color: "white" };
};

// ============================================================================
// FILTERING UTILITIES
// ============================================================================

/**
 * Filters projects by search query
 */
export const filterProjectsBySearch = (
  projects: Project[],
  query: string
): Project[] => {
  if (!query.trim()) return projects;

  const lowerQuery = query.toLowerCase();
  return projects.filter((project) => {
    return (
      project.particulars.toLowerCase().includes(lowerQuery) ||
      project.implementingOffice.toLowerCase().includes(lowerQuery) ||
      project.status?.toLowerCase().includes(lowerQuery)
    );
  });
};

/**
 * Filters projects by status
 */
export const filterProjectsByStatus = (
  projects: Project[],
  statuses: string[]
): Project[] => {
  if (statuses.length === 0) return projects;
  return projects.filter(
    (project) => project.status && statuses.includes(project.status)
  );
};

/**
 * Filters projects by implementing office
 */
export const filterProjectsByOffice = (
  projects: Project[],
  offices: string[]
): Project[] => {
  if (offices.length === 0) return projects;
  return projects.filter((project) =>
    offices.includes(project.implementingOffice)
  );
};

/**
 * Filters projects by year
 */
export const filterProjectsByYear = (
  projects: Project[],
  years: number[]
): Project[] => {
  if (years.length === 0) return projects;
  return projects.filter((project) => project.year && years.includes(project.year));
};

// ============================================================================
// SORTING UTILITIES
// ============================================================================

/**
 * Sorts projects by field and direction
 */
export const sortProjects = (
  projects: Project[],
  field: ProjectSortField,
  direction: SortDirection
): Project[] => {
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
};

/**
 * Sorts projects with pinned items first
 */
export const sortWithPinnedFirst = (projects: Project[]): Project[] => {
  return [...projects].sort((a, b) => {
    const aIsPinned = a.isPinned || false;
    const bIsPinned = b.isPinned || false;
    if (aIsPinned && !bIsPinned) return -1;
    if (!aIsPinned && bIsPinned) return 1;
    return 0;
  });
};

// ============================================================================
// GROUPING UTILITIES
// ============================================================================

/**
 * Groups projects by category
 */
export const groupProjectsByCategory = (
  projects: Project[],
  categories: ProjectCategory[] | undefined
): [string, GroupedProjects][] => {
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
};

// ============================================================================
// CALCULATION UTILITIES
// ============================================================================

/**
 * Calculates totals from projects
 */
export const calculateProjectTotals = (projects: Project[]): ProjectTotals => {
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
};

/**
 * Counts visible label columns (particulars, implementingOffice, year, status)
 */
export const countVisibleLabelColumns = (hiddenColumns: Set<string>): number => {
  const labels = ["particulars", "implementingOffice", "year", "status"];
  return labels.filter((id) => !hiddenColumns.has(id)).length;
};

// ============================================================================
// EXTRACTION UTILITIES
// ============================================================================

/**
 * Extracts unique implementing offices from projects
 */
export const extractUniqueOffices = (projects: Project[]): string[] => {
  const offices = new Set<string>();
  projects.forEach((project) => {
    if (project.implementingOffice) offices.add(project.implementingOffice);
  });
  return Array.from(offices).sort();
};

/**
 * Extracts unique statuses from projects
 */
export const extractUniqueStatuses = (projects: Project[]): string[] => {
  const statuses = new Set<string>();
  projects.forEach((project) => {
    if (project.status) statuses.add(project.status);
  });
  return Array.from(statuses).sort();
};

/**
 * Extracts unique years from projects
 */
export const extractUniqueYears = (projects: Project[]): number[] => {
  const years = new Set<number>();
  projects.forEach((project) => {
    if (project.year) years.add(project.year);
  });
  return Array.from(years).sort((a, b) => b - a);
};

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

/**
 * Generates CSV content from projects
 */
export const generateProjectsCSV = (
  projects: Project[],
  columns: TableColumn[],
  hiddenColumns: Set<string>
): string => {
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
};

/**
 * Downloads CSV file
 */
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Gets particular full name from mapping
 */
export const getParticularFullName = (particular: string): string => {
  const mapping: { [key: string]: string } = {
    GAD: "Gender and Development (GAD)",
    LDRRMP: "Local Disaster Risk Reduction and Management Plan",
    LCCAP: "Local Climate Change Action Plan",
    LCPC: "Local Council for the Protection of Children",
    SCPD: "Sectoral Committee for Persons with Disabilities",
    POPS: "Provincial Operations",
    CAIDS: "Community Affairs and Information Development Services",
    LNP: "Local Nutrition Program",
    PID: "Provincial Information Department",
    ACDP: "Agricultural Competitiveness Development Program",
    LYDP: "Local Youth Development Program",
    "20%_DF": "20% Development Fund",
  };
  return mapping[particular] || particular;
};

/**
 * Calculates project stats for summary
 */
export const calculateProjectStats = (projects: any[]) => {
  const totalAllocated = projects.reduce(
    (sum, project) => sum + project.totalBudgetAllocated,
    0
  );
  const totalUtilized = projects.reduce(
    (sum, project) => sum + project.totalBudgetUtilized,
    0
  );
  const avgUtilizationRate =
    projects.length > 0
      ? projects.reduce((sum, project) => sum + project.utilizationRate, 0) /
        projects.length
      : 0;

  return {
    totalAllocated,
    totalUtilized,
    avgUtilizationRate,
  };
};