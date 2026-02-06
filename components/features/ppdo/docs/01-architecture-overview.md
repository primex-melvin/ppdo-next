# Component Architecture Overview

> Understanding the PPDO component library structure

---

## Component Library Structure

```
components/ppdo/
â”‚
â”œâ”€â”€ Core Design Principles:
â”‚   â”œâ”€â”€ Modularity - Self-contained modules
â”‚   â”œâ”€â”€ Reusability - Shared components
â”‚   â”œâ”€â”€ Type Safety - Full TypeScript coverage
â”‚   â””â”€â”€ Consistency - Common patterns throughout
â”‚
â”œâ”€â”€ Module Organization:
â”‚   â”œâ”€â”€ Each module has index.ts (barrel exports)
â”‚   â”œâ”€â”€ Components grouped by functionality
â”‚   â”œâ”€â”€ Hooks co-located with components
â”‚   â””â”€â”€ Types shared across module
â”‚
â””â”€â”€ Import Pattern:
    â””â”€â”€ import { X } from "@/components/features/ppdo/module";
```

---

## Module Breakdown

### 1. Breakdown Module (`components/ppdo/breakdown`)
Manages project and fund breakdown items.

```
breakdown/
â”œâ”€â”€ form/                    # Form components
â”‚   â”œâ”€â”€ BreakdownForm.tsx   # Main form
â”‚   â”œâ”€â”€ *Field.tsx          # Individual fields
â”‚   â””â”€â”€ utils/              # Form validation
â”œâ”€â”€ table/                   # Table components
â”‚   â”œâ”€â”€ BreakdownHistoryTable.tsx
â”‚   â”œâ”€â”€ TableHeader.tsx
â”‚   â”œâ”€â”€ TableRow.tsx
â”‚   â””â”€â”€ TableTotalsRow.tsx
â”œâ”€â”€ kanban/                  # Kanban view
â”‚   â””â”€â”€ BreakdownKanban.tsx
â”œâ”€â”€ shared/                  # Shared UI
â”‚   â”œâ”€â”€ BreakdownHeader.tsx
â”‚   â”œâ”€â”€ EntityOverviewCards.tsx
â”‚   â””â”€â”€ BreakdownStatsAccordion.tsx
â”œâ”€â”€ hooks/                   # Custom hooks
â”‚   â”œâ”€â”€ useTableSettings.ts
â”‚   â”œâ”€â”€ useTableResize.ts
â”‚   â””â”€â”€ useColumnDragDrop.ts
â”œâ”€â”€ types/                   # TypeScript types
â”‚   â””â”€â”€ breakdown.types.ts
â”œâ”€â”€ utils/                   # Utilities
â”‚   â”œâ”€â”€ formatters.ts
â”‚   â”œâ”€â”€ helpers.ts
â”‚   â””â”€â”€ navigation.utils.ts
â”œâ”€â”€ constants/               # Constants
â”‚   â””â”€â”€ table.constants.ts
â””â”€â”€ lib/                     # Libraries
    â””â”€â”€ print-adapters/
        â””â”€â”€ BreakdownPrintAdapter.ts
```

### 2. Dashboard Module (`components/ppdo/dashboard`)
Dashboard landing and analytics components.

```
dashboard/
â”œâ”€â”€ charts/                  # Data visualization
â”‚   â”œâ”€â”€ BudgetStatusProgressList.tsx
â”‚   â”œâ”€â”€ DashboardChartCard.tsx
â”‚   â”œâ”€â”€ DepartmentUtilizationHorizontalBar.tsx
â”‚   â”œâ”€â”€ ProjectActivityTimeline.tsx
â”‚   â”œâ”€â”€ ProjectStatusVerticalBar.tsx
â”‚   â”œâ”€â”€ TabbedPieChart.tsx
â”‚   â””â”€â”€ TrustFundLineChart.tsx
â”œâ”€â”€ landing/                 # Fiscal year landing
â”‚   â”œâ”€â”€ DashboardFundSelection.tsx
â”‚   â”œâ”€â”€ FiscalYearLanding.tsx
â”‚   â””â”€â”€ FiscalYearLandingCard.tsx
â””â”€â”€ summary/                 # Dashboard summary
    â”œâ”€â”€ DashboardSummary.tsx
    â”œâ”€â”€ KPICardsRow.tsx
    â””â”€â”€ AnalyticsGrid.tsx
```

### 3. Projects Module (`components/ppdo/projects`)
Project management components.

```
projects/
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ ProjectsTable.tsx           # Main projects table
â”‚   â”œâ”€â”€ ProjectsTable/              # Table subcomponents
â”‚   â”‚   â”œâ”€â”€ ColumnVisibilityMenu.tsx
â”‚   â”‚   â”œâ”€â”€ ProjectBulkActions.tsx
â”‚   â”‚   â”œâ”€â”€ ProjectCategoryFilter.tsx
â”‚   â”‚   â”œâ”€â”€ ProjectCategoryGroup.tsx
â”‚   â”‚   â”œâ”€â”€ ProjectContextMenu.tsx
â”‚   â”‚   â”œâ”€â”€ ProjectsTableBody.tsx
â”‚   â”‚   â”œâ”€â”€ ProjectsTableFooter.tsx
â”‚   â”‚   â”œâ”€â”€ ProjectsTableHeader.tsx
â”‚   â”‚   â”œâ”€â”€ ProjectsTableRow.tsx
â”‚   â”‚   â”œâ”€â”€ ProjectsTableToolbar.tsx
â”‚   â”‚   â””â”€â”€ SortIcon.tsx
â”‚   â”œâ”€â”€ ProjectForm.tsx             # Project form
â”‚   â”œâ”€â”€ ProjectSummaryStats.tsx     # Statistics display
â”‚   â”œâ”€â”€ ProjectLoadingState.tsx     # Loading skeleton
â”‚   â”œâ”€â”€ StatusInfoCard.tsx          # Status display
â”‚   â”œâ”€â”€ ParticularPageHeader.tsx    # Page header
â”‚   â”œâ”€â”€ ProjectExpandModal.tsx      # Expand modal
â”‚   â”œâ”€â”€ ProjectShareModal.tsx       # Share modal
â”‚   â”œâ”€â”€ ProjectBulkToggleDialog.tsx # Bulk toggle
â”‚   â”œâ”€â”€ ProjectCategoryCombobox.tsx # Category selector
â”‚   â””â”€â”€ ProjectParticularCombobox.tsx
â”œâ”€â”€ hooks/
â”‚   â”œâ”€â”€ useParticularAccess.ts
â”‚   â”œâ”€â”€ useParticularData.ts
â”‚   â””â”€â”€ useProjectMutations.ts
â”œâ”€â”€ types/
â”‚   â””â”€â”€ index.ts
â”œâ”€â”€ utils/
â”‚   â””â”€â”€ index.ts
â””â”€â”€ constants/
    â””â”€â”€ projectSpreadsheetConfig.ts
```

### 4. Funds Module (`components/ppdo/funds`)
Trust Funds, SEF, SHF components.

```
funds/
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ FundsTable.tsx
â”‚   â”œâ”€â”€ FundsPageHeader.tsx
â”‚   â”œâ”€â”€ FundsStatistics.tsx
â”‚   â”œâ”€â”€ FundsKanban.tsx
â”‚   â”œâ”€â”€ context-menu/
â”‚   â”‚   â””â”€â”€ FundsContextMenu.tsx
â”‚   â”œâ”€â”€ modals/
â”‚   â”‚   â””â”€â”€ PrintOrientationModal.tsx
â”‚   â”œâ”€â”€ table/
â”‚   â”‚   â”œâ”€â”€ FundsTableBody.tsx
â”‚   â”‚   â”œâ”€â”€ FundsTableHeader.tsx
â”‚   â”‚   â”œâ”€â”€ FundsTableRow.tsx
â”‚   â”‚   â””â”€â”€ FundsTableTotalRow.tsx
â”‚   â””â”€â”€ toolbar/
â”‚       â””â”€â”€ FundsTableToolbar.tsx
â”œâ”€â”€ form/
â”‚   â””â”€â”€ FundForm.tsx
â”œâ”€â”€ hooks/
â”‚   â”œâ”€â”€ useFundsData.ts
â”‚   â”œâ”€â”€ useFundsMutations.ts
â”‚   â”œâ”€â”€ useFundsPrintDraft.ts
â”‚   â”œâ”€â”€ useTableFilter.ts
â”‚   â”œâ”€â”€ useTableSelection.ts
â”‚   â”œâ”€â”€ useTableSort.ts
â”‚   â”œâ”€â”€ useColumnResize.ts
â”‚   â””â”€â”€ useColumnWidths.ts
â”œâ”€â”€ types/
â”‚   â””â”€â”€ index.ts
â”œâ”€â”€ utils/
â”‚   â””â”€â”€ index.ts
â”œâ”€â”€ constants/
â”‚   â””â”€â”€ index.ts
â””â”€â”€ lib/
    â””â”€â”€ print-adapters/
        â””â”€â”€ FundsPrintAdapter.ts
```

### 5. Table Module (`components/ppdo/table`)
Reusable table system components.

```
table/
â”œâ”€â”€ implementing-office/     # Office selector
â”‚   â”œâ”€â”€ ImplementingOfficeSelector.tsx
â”‚   â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ hooks/
â”‚   â”œâ”€â”€ types.ts
â”‚   â”œâ”€â”€ utils.ts
â”‚   â””â”€â”€ constants.ts
â”œâ”€â”€ print-preview/           # Print system
â”‚   â”œâ”€â”€ PrintPreviewModal.tsx
â”‚   â”œâ”€â”€ PrintPreviewToolbar.tsx
â”‚   â”œâ”€â”€ ColumnVisibilityPanel.tsx
â”‚   â”œâ”€â”€ DocumentTitleEditor.tsx
â”‚   â”œâ”€â”€ PageOrientationTab.tsx
â”‚   â”œâ”€â”€ TemplateSelector.tsx
â”‚   â”œâ”€â”€ TemplateApplicationModal.tsx
â”‚   â”œâ”€â”€ table-borders/
â”‚   â”‚   â””â”€â”€ TableBorderOverlay.tsx
â”‚   â””â”€â”€ table-resize/        # Resize system
â”‚       â”œâ”€â”€ TableResizeHandle.tsx
â”‚       â”œâ”€â”€ TableResizeOverlay.tsx
â”‚       â”œâ”€â”€ DimensionTooltip.tsx
â”‚       â””â”€â”€ types.ts
â””â”€â”€ toolbar/                 # Toolbar system
    â”œâ”€â”€ TableToolbar.tsx
    â”œâ”€â”€ BudgetTableToolbar.tsx
    â”œâ”€â”€ BudgetColumnVisibilityMenu.tsx
    â”œâ”€â”€ TableToolbarBulkActions.tsx
    â”œâ”€â”€ adapters/
    â”‚   â”œâ”€â”€ BudgetTableToolbar.tsx
    â”‚   â”œâ”€â”€ FundsTableToolbar.tsx
    â”‚   â””â”€â”€ ProjectsTableToolbar.tsx
    â””â”€â”€ types.ts
```

### 6. Shared Module (`components/ppdo/shared`)
Cross-module reusable components.

```
shared/
â”œâ”€â”€ kanban/                  # Reusable kanban
â”‚   â”œâ”€â”€ KanbanBoard.tsx
â”‚   â”œâ”€â”€ KanbanColumn.tsx
â”‚   â”œâ”€â”€ KanbanCard.tsx
â”‚   â”œâ”€â”€ SortableKanbanCard.tsx
â”‚   â””â”€â”€ KanbanFieldVisibilityMenu.tsx
â””â”€â”€ toolbar/
    â””â”€â”€ StatusVisibilityMenu.tsx
```

### 7. Static Module (`components/ppdo/static`)
Landing page (marketing) components.

```
static/
â”œâ”€â”€ PPDOBanner.tsx          # Hero banner
â”œâ”€â”€ PPDOAbout.tsx           # About section
â”œâ”€â”€ PPDOFeatures.tsx        # Features grid
â””â”€â”€ PPDOActivities.tsx      # Activities showcase
```

### 8. Fiscal Years Module (`components/ppdo/fiscal-years`)
Shared fiscal year components.

```
fiscal-years/
â”œâ”€â”€ FiscalYearCard.tsx
â”œâ”€â”€ FiscalYearHeader.tsx
â”œâ”€â”€ FiscalYearEmptyState.tsx
â”œâ”€â”€ FiscalYearModal.tsx
â””â”€â”€ FiscalYearDeleteDialog.tsx
```

### 9. Twenty Percent DF Module (`components/ppdo/twenty-percent-df`)
20% Development Fund components (similar to projects).

---

## Component Composition Pattern

### Example: Building a Breakdown Page

```tsx
// Page composition using PPDO components
import {
  BreakdownHeader,
  EntityOverviewCards,
  BreakdownStatsAccordion,
  BreakdownHistoryTable,
  BreakdownForm,
  useTableSettings,
} from "@/components/features/ppdo/breakdown";

export default function BreakdownPage() {
  const tableSettings = useTableSettings();
  
  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <BreakdownHeader
        title="Project Breakdowns"
        breadcrumbs={[...]}
      />
      
      {/* Overview cards */}
      <EntityOverviewCards
        entity={projectData}
        stats={calculateStats()}
      />
      
      {/* Stats accordion */}
      <BreakdownStatsAccordion
        budgetAllocated={1000000}
        budgetUtilized={750000}
        breakdownsCount={15}
      />
      
      {/* Data table */}
      <BreakdownHistoryTable
        breakdowns={breakdowns}
        settings={tableSettings}
      />
      
      {/* Add/Edit form */}
      <BreakdownForm
        onSubmit={handleSubmit}
        budgetLimit={remainingBudget}
      />
    </div>
  );
}
```

---

## Design Patterns

### 1. Container/Presentational
```tsx
// Container (handles data)
export function BudgetContainer() {
  const data = useQuery(api.budgetItems.list, {});
  return <BudgetTable data={data} />;
}

// Presentational (pure UI)
export function BudgetTable({ data }: BudgetTableProps) {
  return <table>...</table>;
}
```

### 2. Compound Components
```tsx
// Table with related components
<ProjectsTable>
  <ProjectsTable.Header />
  <ProjectsTable.Body />
  <ProjectsTable.Footer />
</ProjectsTable>
```

### 3. Render Props
```tsx
<KanbanBoard
  renderCard={(item) => <KanbanCard item={item} />}
  renderColumn={(column) => <KanbanColumn column={column} />}
/>
```

### 4. Custom Hooks
```tsx
// Logic extraction into hooks
function useBudgetData(year: number) {
  const data = useQuery(api.budgetItems.getByYear, { year });
  const mutations = useBudgetMutations();
  return { data, ...mutations };
}
```

---

## Type Definitions

### Common Types Pattern
```typescript
// types/index.ts
export interface BaseEntity {
  _id: string;
  _creationTime: number;
  isActive: boolean;
}

export interface WithBudget {
  budgetAllocated: number;
  budgetUtilized: number;
  budgetBalance: number;
}

export interface WithStatus {
  status: StatusType;
  statusHistory: StatusChange[];
}
```

---

## Export Patterns

### Barrel Export (index.ts)
```typescript
// Good: Organized barrel exports
// components/ppdo/breakdown/index.ts

// Components
export { BreakdownForm } from "./form/BreakdownForm";
export { BreakdownHistoryTable } from "./table/BreakdownHistoryTable";

// Hooks
export { useTableSettings } from "./hooks/useTableSettings";

// Types
export type { Breakdown, BreakdownFormValues } from "./types";

// Utils
export { formatCurrency, formatDate } from "./utils";
```

---

## Related Documentation

- [Breakdown Components](./02-breakdown-components.md)
- [Dashboard Components](./03-dashboard-components.md)
- [Component Patterns](./09-component-patterns.md)