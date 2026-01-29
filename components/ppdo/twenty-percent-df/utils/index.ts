
// ============================================================================
// RE-EXPORT SHARED UTILITIES
// ============================================================================

export {
    formatNumberWithCommas,
    parseFormattedNumber,
    formatNumberForDisplay,
    formatCurrency,
    formatPercentage,
} from "@/lib/shared/utils/formatting";

export {
    getUtilizationColor,
    getProjectStatusColor,
    getStatusColor,
} from "@/lib/shared/utils/colors";

export {
    sortItems,
    sortWithPinnedFirst,
} from "@/lib/shared/utils/sorting";

export {
    filterBySearchQuery,
    filterByStatus,
    filterByYear,
    extractUniqueValues,
} from "@/lib/shared/utils/filtering";

export {
    generateCSV,
    downloadCSV,
} from "@/lib/shared/utils/csv";


// ============================================================================
// PROJECT-SPECIFIC UTILITIES
// ============================================================================

import {
    TwentyPercentDF,
    TwentyPercentDFSortField,
    SortDirection,
    TwentyPercentDFTotals,
    GroupedTwentyPercentDF,
    ProjectCategory,
    TableColumn
} from "../types";
import { DEFAULT_CATEGORY_COLORS, UNCATEGORIZED_COLOR } from "../constants";
import { sortItems } from "@/lib/shared/utils/sorting";
import { filterBySearchQuery as genericFilterBySearch } from "@/lib/shared/utils/filtering";

/**
 * Creates URL-safe slug from project particulars and ID
 */
export const createTwentyPercentDFSlug = (particulars: string, id: string): string => {
    return `${particulars
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}-${id}`;
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

/**
 * Filters projects by search query
 */
export const filterProjectsBySearch = (
    projects: TwentyPercentDF[],
    query: string
): TwentyPercentDF[] => {
    return genericFilterBySearch(projects, query, [
        "particulars",
        "implementingOffice",
        "status",
    ] as (keyof TwentyPercentDF)[]);
};

/**
 * Filters projects by status
 */
export const filterProjectsByStatus = (
    projects: TwentyPercentDF[],
    statuses: string[]
): TwentyPercentDF[] => {
    if (statuses.length === 0) return projects;
    return projects.filter(
        (project) => project.status && statuses.includes(project.status)
    );
};

/**
 * Filters projects by implementing office
 */
export const filterProjectsByOffice = (
    projects: TwentyPercentDF[],
    offices: string[]
): TwentyPercentDF[] => {
    if (offices.length === 0) return projects;
    return projects.filter((project) =>
        offices.includes(project.implementingOffice)
    );
};

/**
 * Filters projects by year
 */
export const filterProjectsByYear = (
    projects: TwentyPercentDF[],
    years: number[]
): TwentyPercentDF[] => {
    if (years.length === 0) return projects;
    return projects.filter((project) => project.year && years.includes(project.year));
};

/**
 * Sorts projects by field and direction
 */
export const sortProjects = (
    projects: TwentyPercentDF[],
    field: TwentyPercentDFSortField | null,
    direction: SortDirection
): TwentyPercentDF[] => {
    return sortItems(projects, field, direction);
};

/**
 * Groups projects by category
 */
export const groupTwentyPercentDFByCategory = (
    projects: TwentyPercentDF[],
    categories: ProjectCategory[] | undefined
): [string, GroupedTwentyPercentDF][] => {
    const groups: Record<string, GroupedTwentyPercentDF> = {};
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

/**
 * Calculates totals from projects
 */
export const calculateTwentyPercentDFTotals = (projects: TwentyPercentDF[]): TwentyPercentDFTotals => {
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

/**
 * Extracts unique implementing offices from projects
 */
export const extractUniqueOffices = (projects: TwentyPercentDF[]): string[] => {
    const offices = new Set<string>();
    projects.forEach((project) => {
        if (project.implementingOffice) offices.add(project.implementingOffice);
    });
    return Array.from(offices).sort();
};

/**
 * Extracts unique statuses from projects
 */
export const extractUniqueStatuses = (projects: TwentyPercentDF[]): string[] => {
    const statuses = new Set<string>();
    projects.forEach((project) => {
        if (project.status) statuses.add(project.status);
    });
    return Array.from(statuses).sort();
};

/**
 * Extracts unique years from projects
 */
export const extractUniqueYears = (projects: TwentyPercentDF[]): number[] => {
    const years = new Set<number>();
    projects.forEach((project) => {
        if (project.year) years.add(project.year);
    });
    return Array.from(years).sort((a, b) => b - a);
};

/**
 * Generates CSV content from projects
 */
export const generateProjectsCSV = (
    projects: TwentyPercentDF[],
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
export const calculateTwentyPercentDFStats = (projects: any[]) => {
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
