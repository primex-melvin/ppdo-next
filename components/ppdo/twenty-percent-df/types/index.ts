
import { Id } from "@/convex/_generated/dataModel";
import { SortState, ContextMenuState } from "@/lib/shared/types/table.types";

// ============================================================================
// 20% DF TYPES
// ============================================================================

export interface TwentyPercentDF {
    id: string;
    particulars: string;
    implementingOffice: string;
    categoryId?: string;
    totalBudgetAllocated: number;
    obligatedBudget?: number;
    totalBudgetUtilized: number;
    utilizationRate: number;
    projectCompleted: number;
    projectDelayed: number;
    projectsOngoing: number;
    remarks?: string;
    year?: number;
    status?: "completed" | "ongoing" | "delayed";
    targetDateCompletion?: number;
    isPinned?: boolean;
    pinnedAt?: number;
    pinnedBy?: string;
    projectManagerId?: string;
    _creationTime?: number;
    autoCalculateBudgetUtilized?: boolean;
}

export interface TwentyPercentDFFormData {
    particulars: string;
    implementingOffice: string;
    categoryId?: string;
    totalBudgetAllocated: number;
    obligatedBudget?: number;
    totalBudgetUtilized: number;
    remarks?: string;
    year?: number;
    targetDateCompletion?: number;
    isPinned?: boolean;
    pinnedAt?: number;
    pinnedBy?: string;
    projectManagerId?: string;
    _creationTime?: number;
    autoCalculateBudgetUtilized?: boolean;
}

// ============================================================================
// SORTING & FILTERING TYPES
// ============================================================================

export type TwentyPercentDFSortField = keyof TwentyPercentDF;

export type TwentyPercentDFSortState = SortState<TwentyPercentDFSortField>;

export type TwentyPercentDFContextMenuState = ContextMenuState<TwentyPercentDF>;

export type SortDirection = "asc" | "desc" | null;

export interface TwentyPercentDFFilterState {
    searchQuery: string;
    statusFilter: string[];
    officeFilter: string[];
    yearFilter: number[];
    sortField: TwentyPercentDFSortField | null;
    sortDirection: SortDirection;
}

// ============================================================================
// CATEGORY TYPES
// ============================================================================

export interface ProjectCategory {
    _id: Id<"projectCategories">;
    code: string;
    fullName: string;
    description?: string;
    colorCode?: string;
    iconName?: string;
    displayOrder?: number;
    isSystemDefault?: boolean;
    usageCount?: number;
}

export interface GroupedTwentyPercentDF {
    category: ProjectCategory | null;
    projects: TwentyPercentDF[]; // Using 'projects' generic name or 'items'
}

// ============================================================================
// TABLE COLUMN TYPES
// ============================================================================

export interface TableColumn {
    id: string;
    label: string;
    sortable?: boolean;
    filterable?: boolean;
    align?: "left" | "center" | "right";
}

// ============================================================================
// TOTALS TYPES
// ============================================================================

export interface TwentyPercentDFTotals {
    totalBudgetAllocated: number;
    obligatedBudget: number;
    totalBudgetUtilized: number;
    utilizationRate: number;
    projectCompleted: number;
    projectDelayed: number;
    projectsOngoing: number;
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

export interface TwentyPercentDFTableProps {
    data: TwentyPercentDF[]; // Renamed from projects
    particularId?: string; // Optional/Different context
    year?: number;
    onAdd?: (data: TwentyPercentDFFormData) => void | Promise<void>;
    onEdit?: (id: string, data: TwentyPercentDFFormData) => void;
    onDelete?: (id: string) => void;
    onOpenTrash?: () => void;
    newlyAddedId?: string | null;
    expandButton?: React.ReactNode;
}
