# Inspection Page Reset - Implementation Plan

## Overview
Complete ground-up rebuild of the Inspection Page to follow the **Breakdown Page design pattern** and implement **DRY principles** using reusable components.

## Current State Analysis

### File Location
```
app/(private)/dashboard/(protected)/project/[year]/[particularId]/[projectbreakdownId]/[inspectionId]/
├── page.tsx          # 227 lines - needs complete rewrite
├── data.ts           # Mock data (to be removed/integrated)
├── utils.ts          # Utility functions
└── _types/
    └── inspection.ts # Inspection types
```

### Current Issues
1. **Inconsistent Design**: Uses custom `FinancialBreakdownCard`, `FinancialBreakdownHeader`, `FinancialBreakdownMain`
2. **No DRY**: Not using standardized `BreakdownHeader`, `EntityStatistics`, or reusable table components
3. **Inconsistent UX**: Different layout, different stats display, different table styling

---

## Reference: Breakdown Page Pattern

### Breakdown Page Structure (What We Follow)
```
breakdown/page.tsx uses:
├── BreakdownHeader      # Standardized header with back button, icon, actions
├── BreakdownStatistics  # Uses EntityStatistics (StandardStatisticsGrid)
└── BreakdownHistoryTable # Full-featured table with toolbar, filters, export
```

### Reusable Components to Use
| Component | Location | Purpose |
|-----------|----------|---------|
| `BreakdownHeader` | `table-pages/breakdown/shared/` | Page header with icon, back nav, actions |
| `EntityStatistics` | `utilities/shared/` | 3-column stats grid |
| `StandardStatisticsGrid` | `utilities/shared/` | Low-level stats layout |
| `GenericTableToolbar` | `components/shared/table/` | Table toolbar container |
| `TableSearchInput` | `components/shared/table/` | Search input |
| `ColumnVisibilityMenu` | `components/shared/table/` | Column toggle dropdown |
| `DataTable` pattern | `@tanstack/react-table` | Table logic |

---

## Implementation Structure

### New Directory Structure
```
app/(private)/dashboard/(protected)/project/[year]/[particularId]/[projectbreakdownId]/[inspectionId]/
├── page.tsx                    # Main page (lean, uses components)
├── _components/
│   ├── InspectionPageHeader.tsx    # Uses BreakdownHeader pattern
│   ├── InspectionStatistics.tsx    # Uses EntityStatistics
│   ├── InspectionTable.tsx         # Full-featured reusable table
│   └── InspectionFormModal.tsx     # Form for add/edit
├── _hooks/
│   └── useInspectionStats.ts       # Stats calculation hook
├── _types/
│   └── inspection.ts               # (existing - update as needed)
└── _utils/
    └── inspection-utils.ts         # Helper functions

components/features/ppdo/inspection/  # (existing - refactor)
├── index.ts                    # Update exports
├── _components/
│   ├── InspectionPageHeader.tsx    # NEW - Standardized header
│   ├── InspectionStatistics.tsx    # NEW - Standardized stats
│   ├── InspectionTable.tsx         # REFACTOR - Full-featured table
│   └── InspectionTableToolbar.tsx  # NEW - Reusable toolbar
├── _hooks/
│   └── useInspectionStats.ts       # NEW - Stats calculation
└── _types/
    └── index.ts                # Consolidated types
```

---

## Component Specifications

### 1. InspectionPageHeader (New)
**Pattern**: Clone of `BreakdownHeader`, adapted for inspections

```typescript
interface InspectionPageHeaderProps {
  backUrl: string;
  backLabel: string;
  breakdownName: string;
  projectName: string;
  implementingOffice?: string;
  year: string;
  showDetails: boolean;
  setShowDetails: (show: boolean) => void;
}
```

**Features**:
- Back button with URL
- Icon box (clipboard-check or similar)
- Title with breakdown name
- Subtitle showing "Inspections for {projectName}"
- "Show/Hide Details" toggle button
- Activity Log integration

---

### 2. InspectionStatistics (New)
**Pattern**: Similar to `BreakdownStatistics`, uses `EntityStatistics`

```typescript
interface InspectionStatisticsProps {
  totalInspections: number;
  totalImages: number;
  totalViews: number;
  statusCounts: {
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  showDetails?: boolean;
}
```

**Stats Grid Layout**:
```
┌─────────────────┬─────────────────┬─────────────────────────────┐
│ Total Inspection│ Total Views     │ Completed (12)              │
│ 45              │ 1,234           │ In Progress (8)             │
│                 │                 │ Pending (20)                │
├─────────────────┤                 │ Cancelled (5)               │
│ Avg Images per  │                 │ ─────────────────           │
│ Inspection      │                 │ Total: 45                   │
│ 5.2             │                 │                             │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

---

### 3. InspectionTable (Refactored)
**Pattern**: Similar to `BreakdownHistoryTable`, uses `@tanstack/react-table`

**Features** (matching BreakdownHistoryTable):
- ✅ Search/filter
- ✅ Column visibility toggle
- ✅ Sorting
- ✅ Pagination
- ✅ Export CSV
- ✅ Print functionality
- ✅ Bulk selection (future)
- ✅ Row actions (view, edit, delete)
- ✅ Context menu
- ✅ Responsive design

**Columns**:
| Column | Sortable | Filterable | Type |
|--------|----------|------------|------|
| Program No. | ✅ | ✅ | text |
| Title | ✅ | ✅ | text |
| Category | ✅ | ✅ | text |
| Date | ✅ | ✅ | date |
| Status | ✅ | ✅ | badge |
| Views | ✅ | - | number |
| Images | - | - | gallery |
| Actions | - | - | buttons |

---

### 4. useInspectionStats (New Hook)
**Pattern**: Similar to `useEntityStats`

```typescript
function useInspectionStats(inspections: Inspection[] | undefined) {
  return {
    totalInspections: number;
    totalImages: number;
    totalViews: number;
    averageImagesPerInspection: number;
    statusCounts: { pending, in_progress, completed, cancelled };
  };
}
```

---

## Page Layout (New page.tsx)

```tsx
export default function InspectionPage() {
  // Extract params
  // Fetch data (breakdown, project, inspections)
  // useInspectionStats hook
  // useDashboardBreadcrumbs hook
  
  return (
    <>
      <InspectionPageHeader 
        /* props */
      />
      
      <InspectionStatistics 
        /* props */
      />
      
      <InspectionTable 
        inspections={inspections}
        onAdd={() => setShowAddModal(true)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
      />
      
      {/* Modals */}
      <InspectionFormModal ... />
      <InspectionDetailsModal ... />
    </>
  );
}
```

---

## Migration Steps

### Phase 1: Create New Components (No Breaking Changes)
1. Create `InspectionPageHeader.tsx` in `inspection/_components/`
2. Create `InspectionStatistics.tsx` in `inspection/_components/`
3. Create `useInspectionStats.ts` hook
4. Refactor `InspectionTable.tsx` with full features

### Phase 2: Update Page
1. Rewrite `page.tsx` using new components
2. Remove old `FinancialBreakdown*` component usage
3. Clean up unused imports

### Phase 3: Cleanup
1. Remove deprecated components if no longer used elsewhere
2. Update `inspection/index.ts` exports
3. Test all functionality

---

## Design Tokens to Maintain

### Colors
- Primary accent: `#4FBA76` (green)
- Background: `bg-gray-50 dark:bg-gray-950`
- Card: `bg-white dark:bg-zinc-900`
- Border: `border-zinc-200 dark:border-zinc-800`

### Typography
- Page Title: `text-4xl font-bold`, font-family: "Cinzel, serif"
- Section headers: `text-2xl font-bold`
- Body: `text-sm`

### Spacing
- Page padding: `p-6`
- Card padding: `p-4`
- Grid gap: `gap-4`

---

## API Requirements

Existing Convex queries to use:
```typescript
// Get breakdown details
api.govtProjects.getProjectBreakdown

// Get parent project
api.projects.get

// Get inspections
api.inspections.listInspectionsByProject

// Mutations
api.inspections.createInspection
api.inspections.updateInspection
api.inspections.deleteInspection
api.inspections.incrementViewCount
```

---

## Testing Checklist

- [ ] Page loads without errors
- [ ] Header displays correctly with back navigation
- [ ] Statistics update when inspections change
- [ ] Table displays all columns correctly
- [ ] Search filters rows
- [ ] Column visibility toggle works
- [ ] Sorting works on all sortable columns
- [ ] Pagination works
- [ ] Export CSV works
- [ ] Print preview works
- [ ] Add inspection modal works
- [ ] Edit inspection works
- [ ] Delete inspection works
- [ ] View details works
- [ ] Image gallery displays correctly
- [ ] Dark mode works correctly
- [ ] Mobile responsive
- [ ] Breadcrumbs update correctly

---

## Benefits of This Approach

1. **Consistency**: Inspection page now matches breakdown page design
2. **DRY**: Reuses standardized components (BreakdownHeader pattern, EntityStatistics)
3. **Maintainability**: Single source of truth for table/statistics patterns
4. **Feature Parity**: Gets all table features (export, print, column visibility)
5. **Type Safety**: Proper TypeScript interfaces
6. **Testability**: Smaller, focused components

---

## Files to Create/Modify

### Create New:
- `components/features/ppdo/inspection/_components/InspectionPageHeader.tsx`
- `components/features/ppdo/inspection/_components/InspectionStatistics.tsx`
- `components/features/ppdo/inspection/_components/InspectionTableToolbar.tsx`
- `components/features/ppdo/inspection/_hooks/useInspectionStats.ts`

### Refactor:
- `components/features/ppdo/inspection/_components/inspection/InspectionsDataTable.tsx` → `InspectionTable.tsx`
- `app/(private)/dashboard/(protected)/project/[year]/[particularId]/[projectbreakdownId]/[inspectionId]/page.tsx`

### Update:
- `components/features/ppdo/inspection/index.ts`

---

**Ready for Implementation** ✅
