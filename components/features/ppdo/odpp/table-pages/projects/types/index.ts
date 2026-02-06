
import { Id } from "@/convex/_generated/dataModel";
import { SortState, ContextMenuState } from "@/lib/shared/types/table.types";

// Re-export API types
export type { ProjectApiConfig, ProjectComponentConfig, WithApiConfigProps } from "./api.types";

// ============================================================================
// PROJECT TYPES - Generic interface for all project-like entities
// Works for Budget Projects, 20% DF, and potentially other fund types
// ============================================================================

export interface Project {
    id: string;
    particulars: string;
    implementingOffice: string;
    categoryId?: string | Id<"projectCategories">;
    departmentId?: string | Id<"departments">;
    totalBudgetAllocated: number;
    obligatedBudget?: number;
    totalBudgetUtilized: number;
    utilizationRate: number;
    projectCompleted: number;
    projectDelayed: number;
    projectsOngoing?: number;
    remarks?: string;
    year?: number;
    status?: "completed" | "ongoing" | "delayed";
    targetDateCompletion?: number;
    isPinned?: boolean;
    pinnedAt?: number;
    pinnedBy?: string | Id<"users">;
    // Budget Projects specific
    budgetItemId?: string | Id<"budgetItems">;
    // 20% DF specific
    twentyPercentDFId?: string | Id<"twentyPercentDF">;
    // Shared
    projectManagerId?: string | Id<"users">;
    _creationTime?: number;
    autoCalculateBudgetUtilized?: boolean;
}

// ============================================================================
// PROJECT FORM DATA - For creating/updating projects
// ============================================================================

export interface ProjectFormData {
    particulars: string;
    implementingOffice: string;
    categoryId?: string | Id<"projectCategories">;
    departmentId?: string | Id<"departments">;
    totalBudgetAllocated: number;
    obligatedBudget?: number;
    totalBudgetUtilized: number;
    remarks?: string;
    year?: number;
    targetDateCompletion?: number;
    isPinned?: boolean;
    pinnedAt?: number;
    pinnedBy?: string | Id<"users">;
    // Budget Projects specific
    budgetItemId?: string | Id<"budgetItems">;
    // 20% DF specific  
    twentyPercentDFId?: string | Id<"twentyPercentDF">;
    // Shared
    projectManagerId?: string | Id<"users">;
    _creationTime?: number;
    autoCalculateBudgetUtilized?: boolean;
}

// ============================================================================
// SORTING & FILTERING TYPES (using shared types)
// ============================================================================

export type ProjectSortField = keyof Project;

// Use shared SortState
export type ProjectSortState = SortState<ProjectSortField>;

// Use shared ContextMenuState
export type ProjectContextMenuState = ContextMenuState<Project>;

// Legacy support - remove in future
export type SortDirection = "asc" | "desc" | null;

export interface ProjectFilterState {
    searchQuery: string;
    statusFilter: string[];
    officeFilter: string[];
    yearFilter: number[];
    sortField: ProjectSortField | null;
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

export interface GroupedProjects {
    category: ProjectCategory | null;
    projects: Project[];
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

export interface ProjectTotals {
    totalBudgetAllocated: number;
    obligatedBudget: number;
    totalBudgetUtilized: number;
    utilizationRate: number;
    projectCompleted: number;
    projectDelayed: number;
    projectsOngoing: number;
}

// ============================================================================
// BULK OPERATION RESPONSE TYPES
// ============================================================================

export interface BulkOperationResponse {
    success: boolean;
    message?: string;
    data?: {
        processed?: number;
        failed?: number;
        details?: Record<string, any>;
    };
    error?: {
        message: string;
        code?: string;
    };
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

export interface ProjectsTableProps {
    projects: Project[];
    particularId: string;
    budgetItemId?: string;
    budgetItemYear?: number;
    onAdd?: (project: ProjectFormData) => void | Promise<void>;
    onEdit?: (id: string, project: ProjectFormData) => void;
    onDelete?: (id: string) => void;
    onOpenTrash?: () => void;
    newlyAddedProjectId?: string | null;
    expandButton?: React.ReactNode;
}

// ============================================================================
// FORM PROPS TYPES
// ============================================================================

export interface ProjectFormProps {
    project?: Project | null;
    budgetItemId?: string;
    budgetItemYear?: number;
    draftKey?: string;  // Optional: defaults to "project_form_draft"
    onSave: (data: ProjectFormData) => void | Promise<void>;
    onCancel: () => void;
}
