
// ============================================================================
// RE-EXPORTS FROM CENTRALIZED LIBRARY
// These components work with both Budget Projects and 20% DF
// ============================================================================

export { 
    ProjectForm,
    ProjectSummaryStats,
    ProjectLoadingState,
    StatusInfoCard,
    ParticularPageHeader,
    ProjectExpandModal,
} from "@/components/ppdo/projects";

// ============================================================================
// 20% DF SPECIFIC COMPONENTS
// These have 20% DF specific logic or branding
// ============================================================================

export { TwentyPercentDFTable } from "./components/TwentyPercentDFTable";
export { TwentyPercentDFForm } from "./components/TwentyPercentDFForm";
export { TwentyPercentDFStatistics } from "./components/TwentyPercentDFStatistics";

// ============================================================================
// 20% DF HOOKS
// ============================================================================

export { useTwentyPercentDFData } from "./hooks/useTwentyPercentDFData";
export { useTwentyPercentDFMutations } from "./hooks/useTwentyPercentDFMutations";
export { useParticularAccess } from "@/components/ppdo/projects/hooks/useParticularAccess";

// ============================================================================
// ADAPTER UTILITIES
// ============================================================================

export { 
    TWENTY_PERCENT_DF_CONFIG,
    twentyPercentDfApi,
} from "./adapter/config";

export { 
    toProject,
    toProjects,
    toProjectFormData,
    fromProjectFormData,
} from "./adapter/transformers";

// ============================================================================
// TYPES
// ============================================================================

export type { 
    TwentyPercentDF, 
    TwentyPercentDFFormData,
    TwentyPercentDFTableProps,
    TwentyPercentDFSortField,
    TwentyPercentDFSortState,
    TwentyPercentDFContextMenuState,
    TwentyPercentDFFilterState,
    GroupedTwentyPercentDF,
    TwentyPercentDFTotals,
    ProjectCategory,
} from "./types";

// ============================================================================
// UTILITIES
// ============================================================================

export {
    getParticularFullName,
    calculateTwentyPercentDFStats,
    createTwentyPercentDFSlug,
    filterProjectsBySearch,
    filterProjectsByStatus,
    filterProjectsByOffice,
    filterProjectsByYear,
    sortProjects,
    groupTwentyPercentDFByCategory,
    calculateTwentyPercentDFTotals,
    extractUniqueOffices,
    extractUniqueStatuses,
    extractUniqueYears,
    generateProjectsCSV,
} from "./utils";
