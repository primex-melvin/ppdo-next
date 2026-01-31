
// ============================================================================
// COMPONENTS
// ============================================================================

export { ProjectsTable } from "./components/ProjectsTable";
export { ProjectForm } from "./components/ProjectForm";
export { ProjectSummaryStats } from "./components/ProjectSummaryStats";
export { ProjectLoadingState } from "./components/ProjectLoadingState";
export { StatusInfoCard } from "./components/StatusInfoCard";
export { ParticularPageHeader } from "./components/ParticularPageHeader";
export { ProjectExpandModal } from "./components/ProjectExpandModal";

// ============================================================================
// HOOKS
// ============================================================================

export { useParticularAccess } from "./hooks/useParticularAccess";
export { useParticularData } from "./hooks/useParticularData";
export { useProjectMutations } from "./hooks/useProjectMutations";

// ============================================================================
// API CONFIGURATIONS
// ============================================================================

export { budgetProjectApi, BUDGET_PROJECT_CONFIG } from "./api/budgetProjectApi";
export { twentyPercentDfApi, TWENTY_PERCENT_DF_CONFIG } from "./api/twentyPercentDfApi";

// ============================================================================
// TYPES
// ============================================================================

export type { 
    Project, 
    ProjectFormData,
    ProjectApiConfig,
    ProjectComponentConfig,
    WithApiConfigProps,
    ProjectsTableProps,
    ProjectFormProps,
    ProjectSortField,
    ProjectSortState,
    ProjectContextMenuState,
    SortDirection,
    ProjectFilterState,
    ProjectCategory,
    GroupedProjects,
    TableColumn,
    ProjectTotals,
    BulkOperationResponse,
} from "./types";

// ============================================================================
// UTILS
// ============================================================================

export { 
    getParticularFullName, 
    calculateProjectStats,
    createProjectSlug,
    getCategoryHeaderStyle,
    filterProjectsBySearch,
    filterProjectsByStatus,
    filterProjectsByOffice,
    filterProjectsByYear,
    sortProjects,
    groupProjectsByCategory,
    calculateProjectTotals,
    countVisibleLabelColumns,
    extractUniqueOffices,
    extractUniqueStatuses,
    extractUniqueYears,
    generateProjectsCSV,
} from "./utils";
