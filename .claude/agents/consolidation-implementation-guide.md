# Consolidation Implementation Guide

## For: Frontend/React Specialist Agent

## Quick Start

This guide provides step-by-step instructions for implementing the component consolidation plan.

---

## Phase 1: Create API Configuration Files

### Step 1.1: Create API Config Types

**File**: `components/ppdo/projects/types/api.types.ts`

```typescript
import { Project, ProjectFormData } from "./project.types";

/**
 * Configuration for API endpoints used by project components
 */
export interface ProjectApiConfig {
  queries: {
    list: any;
    get: any;
    getByParticulars?: any;
  };
  mutations: {
    create: any;
    update: any;
    moveToTrash: any;
    togglePin: any;
    bulkMoveToTrash: any;
    bulkUpdateCategory: any;
    toggleAutoCalculate: any;
    bulkToggleAutoCalculate: any;
  };
}

/**
 * Configuration options for project components
 */
export interface ProjectComponentConfig {
  api: ProjectApiConfig;
  draftKey: string;
  entityType: string;
  entityLabel: string;
  entityLabelPlural: string;
  routes: {
    base: string;
    detail?: (id: string) => string;
  };
}

/**
 * Props that accept API configuration
 */
export interface WithApiConfigProps {
  apiConfig: ProjectApiConfig;
}
```

### Step 1.2: Create Budget Project API Config

**File**: `components/ppdo/projects/api/budgetProjectApi.ts`

```typescript
import { api } from "@/convex/_generated/api";
import { ProjectApiConfig } from "../types/api.types";

export const budgetProjectApi: ProjectApiConfig = {
  queries: {
    list: api.projects.list,
    get: api.projects.get,
    getByParticulars: api.budgetItems.getByParticulars,
  },
  mutations: {
    create: api.projects.create,
    update: api.projects.update,
    moveToTrash: api.projects.moveToTrash,
    togglePin: api.projects.togglePin,
    bulkMoveToTrash: api.projects.bulkMoveToTrash,
    bulkUpdateCategory: api.projects.bulkUpdateCategory,
    toggleAutoCalculate: api.projects.toggleAutoCalculate,
    bulkToggleAutoCalculate: api.projects.bulkToggleAutoCalculate,
  },
};
```

### Step 1.3: Create 20% DF API Config

**File**: `components/ppdo/projects/api/twentyPercentDfApi.ts`

```typescript
import { api } from "@/convex/_generated/api";
import { ProjectApiConfig } from "../types/api.types";

export const twentyPercentDfApi: ProjectApiConfig = {
  queries: {
    list: api.twentyPercentDF.list,
    get: api.twentyPercentDF.get,
    // Note: 20% DF uses different parent reference pattern
    getByParticulars: undefined,
  },
  mutations: {
    create: api.twentyPercentDF.create,
    update: api.twentyPercentDF.update,
    moveToTrash: api.twentyPercentDF.moveToTrash,
    togglePin: api.twentyPercentDF.togglePin,
    bulkMoveToTrash: api.twentyPercentDF.bulkMoveToTrash,
    bulkUpdateCategory: api.twentyPercentDF.bulkUpdateCategory,
    toggleAutoCalculate: api.twentyPercentDF.toggleAutoCalculateFinancials,
    bulkToggleAutoCalculate: api.twentyPercentDF.bulkToggleAutoCalculate,
  },
};
```

---

## Phase 2: Update Types

### Step 2.1: Extend Project Type

**File**: `components/ppdo/projects/types/project.types.ts`

Update the existing Project type to be more generic:

```typescript
import { Id } from "@/convex/_generated/dataModel";

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
  budgetItemId?: string | Id<"budgetItems">;
  twentyPercentDFId?: string | Id<"twentyPercentDF">;
  projectManagerId?: string | Id<"users">;
  _creationTime?: number;
  autoCalculateBudgetUtilized?: boolean;
}

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
  budgetItemId?: string | Id<"budgetItems">;
  twentyPercentDFId?: string | Id<"twentyPercentDF">;
  projectManagerId?: string | Id<"users">;
  _creationTime?: number;
  autoCalculateBudgetUtilized?: boolean;
}
```

---

## Phase 3: Refactor Hooks

### Step 3.1: Update useParticularData

**File**: `components/ppdo/projects/hooks/useParticularData.ts`

```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Project } from "../types";

interface UseParticularDataOptions {
  particular: string;
}

export function useParticularData({ particular }: UseParticularDataOptions) {
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

  const transformedProjects: Project[] =
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
        projectManagerId: project.projectManagerId,
        _creationTime: project._creationTime,
        autoCalculateBudgetUtilized: project.autoCalculateBudgetUtilized,
      }))
      .sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0)) ?? [];

  return {
    budgetItem,
    breakdownStats,
    projects: transformedProjects,
    isLoading: projects === undefined || budgetItem === undefined,
  };
}
```

### Step 3.2: Create Generic useProjectData Hook

**File**: `components/ppdo/projects/hooks/useProjectData.ts`

```typescript
"use client";

import { useQuery } from "convex/react";
import { Project } from "../types";

interface UseProjectDataOptions<T = Project> {
  parentId?: string;
  listQuery: any;
  transform: (raw: any) => T;
  skip?: boolean;
}

export function useProjectData<T = Project>({
  parentId,
  listQuery,
  transform,
  skip = false,
}: UseProjectDataOptions<T>) {
  const items = useQuery(
    listQuery,
    !skip && parentId ? { budgetItemId: parentId } : "skip"
  );

  const transformedItems: T[] =
    items?.map(transform).sort((a: T, b: T) => {
      const aTime = (a as any)._creationTime ?? 0;
      const bTime = (b as any)._creationTime ?? 0;
      return bTime - aTime;
    }) ?? [];

  return {
    items: transformedItems,
    isLoading: items === undefined,
  };
}
```

---

## Phase 4: Update Components

### Step 4.1: Update ProjectForm Props

**File**: `components/ppdo/projects/components/ProjectForm.tsx`

Add optional `draftKey` prop:

```typescript
interface ProjectFormProps {
  project?: Project | null;
  budgetItemId?: string;
  budgetItemYear?: number;
  draftKey?: string;  // NEW: Optional draft key
  onSave: (data: ProjectFormData) => void | Promise<void>;
  onCancel: () => void;
}

// In component, use with fallback:
const { loadDraft, saveDraft, clearDraft } = useFormDraft(
  draftKey || "project_form_draft"
);
```

### Step 4.2: Update ProjectsTable Props

**File**: `components/ppdo/projects/components/ProjectsTable.tsx`

```typescript
interface ProjectsTableProps {
  projects: Project[];
  particularId: string;
  budgetItemId?: string;
  budgetItemYear?: number;
  // ... existing props
  // Note: No API config needed at table level - handled by parent page
}
```

---

## Phase 5: Create 20% DF Adapter

### Step 5.1: Create Adapter Config

**File**: `components/ppdo/twenty-percent-df/adapter/config.ts`

```typescript
import { twentyPercentDfApi } from "@/components/ppdo/projects/api/twentyPercentDfApi";

export const TWENTY_PERCENT_DF_CONFIG = {
  api: twentyPercentDfApi,
  draftKey: "twenty_percent_df_form_draft",
  entityType: "twentyPercentDF" as const,
  entityLabel: "20% Development Fund",
  entityLabelPlural: "20% Development Fund Items",
  routes: {
    base: "/dashboard/20_percent_df",
    detail: (year: string, slug: string) => `/dashboard/20_percent_df/${year}/${slug}`,
  },
};
```

### Step 5.2: Create Type Transformer

**File**: `components/ppdo/twenty-percent-df/adapter/transformers.ts`

```typescript
import { Project, ProjectFormData } from "@/components/ppdo/projects/types";
import { TwentyPercentDF, TwentyPercentDFFormData } from "../types";

export function toProject(twentyPercentDF: TwentyPercentDF): Project {
  return {
    id: twentyPercentDF.id,
    particulars: twentyPercentDF.particulars,
    implementingOffice: twentyPercentDF.implementingOffice,
    categoryId: twentyPercentDF.categoryId,
    departmentId: twentyPercentDF.departmentId,
    totalBudgetAllocated: twentyPercentDF.totalBudgetAllocated,
    obligatedBudget: twentyPercentDF.obligatedBudget,
    totalBudgetUtilized: twentyPercentDF.totalBudgetUtilized,
    utilizationRate: twentyPercentDF.utilizationRate,
    projectCompleted: twentyPercentDF.projectCompleted,
    projectDelayed: twentyPercentDF.projectDelayed,
    projectsOngoing: twentyPercentDF.projectsOngoing,
    remarks: twentyPercentDF.remarks,
    year: twentyPercentDF.year,
    status: twentyPercentDF.status,
    targetDateCompletion: twentyPercentDF.targetDateCompletion,
    isPinned: twentyPercentDF.isPinned,
    pinnedAt: twentyPercentDF.pinnedAt,
    pinnedBy: twentyPercentDF.pinnedBy,
    projectManagerId: twentyPercentDF.projectManagerId,
    _creationTime: twentyPercentDF._creationTime,
    autoCalculateBudgetUtilized: twentyPercentDF.autoCalculateBudgetUtilized,
    twentyPercentDFId: twentyPercentDF.id,
  };
}

export function toTwentyPercentDFFormData(
  formData: ProjectFormData
): TwentyPercentDFFormData {
  return {
    particulars: formData.particulars,
    implementingOffice: formData.implementingOffice,
    categoryId: formData.categoryId as any,
    departmentId: formData.departmentId as any,
    totalBudgetAllocated: formData.totalBudgetAllocated,
    obligatedBudget: formData.obligatedBudget,
    totalBudgetUtilized: formData.totalBudgetUtilized,
    remarks: formData.remarks,
    year: formData.year,
    targetDateCompletion: formData.targetDateCompletion,
    isPinned: formData.isPinned,
    pinnedAt: formData.pinnedAt,
    pinnedBy: formData.pinnedBy as any,
    projectManagerId: formData.projectManagerId as any,
    _creationTime: formData._creationTime,
    autoCalculateBudgetUtilized: formData.autoCalculateBudgetUtilized,
  };
}
```

### Step 5.3: Create Hook Wrapper

**File**: `components/ppdo/twenty-percent-df/hooks/useTwentyPercentDFData.ts`

```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { TwentyPercentDF } from "../types";

interface UseTwentyPercentDFDataOptions {
  fundId?: string;
}

export function useTwentyPercentDFData({ fundId }: UseTwentyPercentDFDataOptions) {
  const fund = useQuery(
    api.twentyPercentDF.get,
    fundId ? { id: fundId as Id<"twentyPercentDF"> } : "skip"
  );

  const projects = useQuery(
    api.twentyPercentDF.list,
    fundId ? { budgetItemId: fundId as Id<"budgetItems"> } : "skip"
  );

  const transformedProjects: TwentyPercentDF[] =
    projects
      ?.map((p) => ({
        id: p._id,
        particulars: p.particulars,
        implementingOffice: p.implementingOffice,
        categoryId: p.categoryId,
        departmentId: p.departmentId,
        totalBudgetAllocated: p.totalBudgetAllocated,
        obligatedBudget: p.obligatedBudget,
        totalBudgetUtilized: p.totalBudgetUtilized,
        utilizationRate: p.utilizationRate || 0,
        projectCompleted: p.projectCompleted || 0,
        projectDelayed: p.projectDelayed || 0,
        projectsOngoing: (p as any).projectsOngoing || 0,
        remarks: p.remarks,
        year: p.year,
        status: p.status,
        targetDateCompletion: p.targetDateCompletion,
        isPinned: p.isPinned,
        pinnedAt: p.pinnedAt,
        pinnedBy: p.pinnedBy,
        projectManagerId: p.projectManagerId,
        _creationTime: p._creationTime,
        autoCalculateBudgetUtilized: p.autoCalculateBudgetUtilized,
      }))
      .sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0)) ?? [];

  return {
    fund,
    projects: transformedProjects,
    isLoading: projects === undefined || fund === undefined,
  };
}
```

---

## Phase 6: Update Index Exports

### Step 6.1: Update projects/index.ts

**File**: `components/ppdo/projects/index.ts`

```typescript
// Components
export { ProjectsTable } from "./components/ProjectsTable";
export { ProjectForm } from "./components/ProjectForm";
export { ProjectSummaryStats } from "./components/ProjectSummaryStats";
export { ProjectLoadingState } from "./components/ProjectLoadingState";
export { StatusInfoCard } from "./components/StatusInfoCard";
export { ParticularPageHeader } from "./components/ParticularPageHeader";
export { ProjectExpandModal } from "./components/ProjectExpandModal";

// Hooks
export { useParticularAccess } from "./hooks/useParticularAccess";
export { useParticularData } from "./hooks/useParticularData";
export { useProjectMutations } from "./hooks/useProjectMutations";

// API Configs
export { budgetProjectApi } from "./api/budgetProjectApi";
export { twentyPercentDfApi } from "./api/twentyPercentDfApi";

// Types
export type { 
  Project, 
  ProjectFormData, 
  ProjectApiConfig,
  ProjectComponentConfig 
} from "./types";

// Utils
export { getParticularFullName, calculateProjectStats } from "./utils";
```

### Step 6.2: Update twenty-percent-df/index.ts

**File**: `components/ppdo/twenty-percent-df/index.ts`

```typescript
// Re-export from centralized library with 20% DF types
export { 
  ProjectForm,
  ProjectSummaryStats,
  ProjectLoadingState,
  StatusInfoCard,
  ParticularPageHeader,
  ProjectExpandModal,
} from "@/components/ppdo/projects";

// 20% DF specific exports
export { TwentyPercentDFTable } from "./components/TwentyPercentDFTable";
export { TwentyPercentDFForm } from "./components/TwentyPercentDFForm";

// Hooks
export { useTwentyPercentDFData } from "./hooks/useTwentyPercentDFData";

// Config
export { TWENTY_PERCENT_DF_CONFIG } from "./adapter/config";

// Types
export type { 
  TwentyPercentDF, 
  TwentyPercentDFFormData,
  TwentyPercentDFTableProps 
} from "./types";
```

---

## Testing Checklist

After each phase, verify:

- [ ] TypeScript compilation passes: `npx tsc --noEmit`
- [ ] No runtime errors in browser console
- [ ] All existing functionality works
- [ ] No visual regressions
- [ ] Performance is maintained

## Rollback Commands

If issues occur:

```bash
# Restore from backup
git checkout backup/pre-consolidation

# Or revert specific phase
git revert HEAD~{n}
```

---

*Document Version: 1.0*
*For: Frontend/React Specialist Agent*
