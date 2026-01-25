# Shared Library Migration Guide

## Overview

This guide documents the standardized components and utilities created to reduce code duplication across the PPDO Next application.

## What Was Created

### Phase 10: Standardized Table Column Definitions

**Location:** `lib/shared/table/column-definitions.tsx`

**Purpose:** Eliminate repetitive cell formatting code in tables.

**Files Created:**
- `lib/shared/table/column-definitions.tsx` - Cell renderer functions
- `lib/shared/table/index.ts` - Exports
- `lib/shared/table/README.md` - Documentation

**Available Renderers:**
- `currencyCell` - PHP currency formatting
- `dateCell` - Date formatting
- `statusBadgeCell` - Colored status badges
- `percentageCell` - Percentage formatting
- `utilizationCell` - Color-coded utilization
- `textCell` - Basic text
- `numberCell` - Number formatting

**Migration Example:**
```tsx
// Before:
<td className="text-right">
  {new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0
  }).format(value)}
</td>

// After:
import { currencyCell } from '@/lib/shared/table';

<td className={currencyCell.className}>
  {currencyCell.render({ value })}
</td>
```

---

### Phase 11: Unified Modal & Dialog Management

**Location:** `lib/shared/hooks/useModal.ts` & `components/shared/modals/`

**Purpose:** Reduce modal state management boilerplate by 70%.

**Files Created:**
- `lib/shared/hooks/useModal.ts` - Modal state hook
- `components/shared/modals/ControlledModal.tsx` - Modal wrappers
- `components/shared/modals/index.ts` - Exports
- `components/shared/modals/README.md` - Documentation

**Available Components:**
- `useModal()` - Hook for modal state with create/edit/view modes
- `useSimpleModal()` - Simple open/close hook
- `ControlledModal` - Full modal with header/footer
- `ViewModal` - Read-only modal
- `ConfirmModal` - Confirmation dialog

**Migration Example:**
```tsx
// Before: ~20 lines
const [isOpen, setIsOpen] = useState(false);
const [editData, setEditData] = useState(null);

<ResizableModal open={isOpen} onOpenChange={setIsOpen}>
  <ResizableModalContent>
    <ResizableModalHeader>...</ResizableModalHeader>
    <ResizableModalBody>...</ResizableModalBody>
    <ResizableModalFooter>...</ResizableModalFooter>
  </ResizableModalContent>
</ResizableModal>

// After: ~6 lines
import { useModal } from '@/lib/shared/hooks';
import { ControlledModal } from '@/components/shared/modals';

const modal = useModal();

<ControlledModal
  isOpen={modal.isOpen}
  onClose={modal.closeModal}
  title="Create Item"
  showDefaultFooter
  onSubmit={handleSubmit}
>
  {children}
</ControlledModal>
```

---

### Phase 12: Standardized Skeleton & Loading States

**Location:** `components/shared/loaders/`

**Purpose:** Replace generic loading spinners with skeleton screens for better UX.

**Files Created:**
- `components/shared/loaders/TableSkeleton.tsx` - Table skeletons
- `components/shared/loaders/FormSkeleton.tsx` - Form skeletons
- `components/shared/loaders/index.ts` - Exports

**Available Components:**

**Table Skeletons:**
- `TableSkeleton` - Standard data table
- `DataTableSkeleton` - Table with toolbar
- `CompactTableSkeleton` - Small tables
- `CardTableSkeleton` - Card grids

**Form Skeletons:**
- `FormSkeleton` - Standard forms
- `SectionedFormSkeleton` - Multi-section forms
- `CompactFormSkeleton` - Inline forms
- `CardFormSkeleton` - Wizard forms
- `InlineFormSkeleton` - Small inline forms

**Migration Example:**
```tsx
// Before:
{isLoading && <LoadingSpinner />}
{!isLoading && <Table data={data} />}

// After:
import { TableSkeleton } from '@/components/shared/loaders';

{isLoading ? <TableSkeleton rows={8} columns={6} /> : <Table data={data} />}
```

---

### Phase 13: Themed UI Components (Accent Color)

**Location:** `components/shared/themed/`

**Purpose:** Automatic accent color integration without manual `useAccentColor()` calls.

**Files Created:**
- `components/shared/themed/ThemedButton.tsx` - Themed button components
- `components/shared/themed/index.ts` - Exports

**Available Components:**
- `ThemedButton` - Standard button with accent color
- `ThemedIconButton` - Icon-only button
- `ThemedActionButton` - Compact toolbar button

**Migration Example:**
```tsx
// Before:
const { accentColorValue } = useAccentColor();

<Button
  style={{ backgroundColor: accentColorValue }}
  className="text-white hover:opacity-90"
>
  Save
</Button>

// After:
import { ThemedButton } from '@/components/shared/themed';

<ThemedButton variant="primary">
  Save
</ThemedButton>
```

---

### Phase 14: Generic "Empty State" Component

**Location:** `components/shared/ui/`

**Purpose:** Consistent empty state UI across all tables, lists, and search results.

**Files Created:**
- `components/shared/ui/EmptyState.tsx` - Empty state components
- `components/shared/ui/index.ts` - Exports

**Available Components:**
- `EmptyState` - Generic empty state with icon/title/description/actions
- `SearchEmptyState` - No search results
- `CollectionEmptyState` - Empty collection with create action
- `ErrorEmptyState` - Error state with retry
- `TableEmptyState` - Empty table row
- `InlineEmptyState` - Compact version

**Migration Example:**
```tsx
// Before:
{data.length === 0 && (
  <div className="flex flex-col items-center justify-center h-64">
    <FileX className="w-12 h-12 text-zinc-300" />
    <p className="text-sm text-zinc-500">No data found</p>
  </div>
)}

// After:
import { EmptyState } from '@/components/shared/ui';

{data.length === 0 && (
  <EmptyState
    title="No data found"
    description="Try adjusting your filters"
  />
)}
```

---

## Complete File Structure

```
lib/shared/
├── hooks/
│   ├── useModal.ts                     # NEW: Modal state management
│   ├── useFormattedNumber.ts
│   ├── useTableState.ts
│   ├── useAutoSave.ts
│   ├── useURLParams.ts
│   ├── useFilteredQuery.ts
│   └── index.ts                        # UPDATED: Added useModal exports
├── table/
│   ├── column-definitions.tsx          # NEW: Cell renderers
│   ├── index.ts                        # NEW: Exports
│   └── README.md                       # NEW: Documentation
├── schemas/
│   └── (existing schemas)
├── utils/
│   ├── colors.ts
│   ├── validation.ts
│   ├── form-helpers.ts
│   └── mutation-wrapper.ts
└── README.md                           # NEW: Comprehensive guide

components/shared/
├── form/
│   └── (existing form components)
├── loaders/
│   ├── TableSkeleton.tsx               # NEW: Table skeletons
│   ├── FormSkeleton.tsx                # NEW: Form skeletons
│   └── index.ts                        # NEW: Exports
├── modals/
│   ├── ControlledModal.tsx             # NEW: Modal wrappers
│   ├── index.ts                        # NEW: Exports
│   └── README.md                       # NEW: Documentation
├── table/
│   └── (existing table components)
├── themed/
│   ├── ThemedButton.tsx                # NEW: Themed buttons
│   └── index.ts                        # NEW: Exports
├── ui/
│   ├── EmptyState.tsx                  # NEW: Empty states
│   └── index.ts                        # NEW: Exports
└── README.md                           # NEW: Component library guide
```

---

## Migration Priority

### High Priority (Use Immediately)

1. **Empty States** - Replace all custom empty states
2. **Loading States** - Replace LoadingSpinner with skeletons
3. **Themed Buttons** - Use for all primary actions

### Medium Priority (Next Sprint)

4. **Modal Management** - Refactor existing modals
5. **Column Definitions** - Use in new tables

### Low Priority (Gradual Migration)

6. **Existing Tables** - Refactor when touching the code

---

## Benefits Summary

### Code Reduction
- **Modal Boilerplate**: 70% reduction (20 lines → 6 lines)
- **Cell Formatting**: 90% reduction (10 lines → 1 line)
- **Empty States**: 80% reduction (15 lines → 3 lines)
- **Themed Buttons**: 60% reduction (5 lines → 1 line)

### Consistency Improvements
- ✅ All currency values formatted identically
- ✅ All dates use same locale
- ✅ All status badges use same colors
- ✅ All modals have same structure
- ✅ All empty states follow same pattern
- ✅ All loading states prevent layout shift

### Maintainability
- Single source of truth for formatting
- Update styles in one place
- Type-safe with TypeScript
- Well-documented with examples
- Easy to test

---

## Usage Examples by Feature

### Budget Item Form
```tsx
import { useModal } from '@/lib/shared/hooks';
import { ControlledModal } from '@/components/shared/modals';
import { FormSkeleton } from '@/components/shared/loaders';
import { ThemedButton } from '@/components/shared/themed';

const modal = useModal<BudgetItem>();

{isLoading ? (
  <FormSkeleton fields={6} twoColumn />
) : (
  <ControlledModal
    isOpen={modal.isOpen}
    onClose={modal.closeModal}
    title={modal.mode === "edit" ? "Edit Budget" : "Create Budget"}
    showDefaultFooter
    submitLabel={modal.mode === "edit" ? "Update" : "Create"}
    onSubmit={handleSubmit}
    isSubmitting={isSubmitting}
  >
    <BudgetForm data={modal.data} />
  </ControlledModal>
)}
```

### Project Table
```tsx
import { currencyCell, dateCell, statusBadgeCell } from '@/lib/shared/table';
import { DataTableSkeleton } from '@/components/shared/loaders';
import { TableEmptyState } from '@/components/shared/ui';

{isLoading ? (
  <DataTableSkeleton rows={10} columns={8} />
) : (
  <table>
    <thead>...</thead>
    <tbody>
      {data.length === 0 ? (
        <TableEmptyState
          colSpan={8}
          message="No projects found"
          searchMode={!!searchQuery}
        />
      ) : (
        data.map(row => (
          <tr key={row.id}>
            <td className={currencyCell.className}>
              {currencyCell.render({ value: row.budget })}
            </td>
            <td className={dateCell.className}>
              {dateCell.render({ value: row.startDate })}
            </td>
            <td className={statusBadgeCell.className}>
              {statusBadgeCell.render({ value: row.status })}
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
)}
```

### Dashboard Cards
```tsx
import { ThemedButton } from '@/components/shared/themed';
import { CollectionEmptyState } from '@/components/shared/ui';
import { CardTableSkeleton } from '@/components/shared/loaders';
import { Plus } from 'lucide-react';

{isLoading ? (
  <CardTableSkeleton cards={6} />
) : data.length === 0 ? (
  <CollectionEmptyState
    title="No projects yet"
    description="Create your first project to get started"
    onAction={handleCreate}
    actionLabel="Create Project"
    icon={Plus}
  />
) : (
  <div className="grid grid-cols-3 gap-4">
    {data.map(item => <Card key={item.id} {...item} />)}
  </div>
)}
```

---

## Testing Checklist

When migrating to shared components:

- [ ] Visual regression test (screenshot comparison)
- [ ] Dark mode support verified
- [ ] Responsive design tested (mobile, tablet, desktop)
- [ ] Loading states prevent layout shift
- [ ] Empty states show correct icons/messages
- [ ] Modals close properly (ESC key, outside click)
- [ ] Buttons apply accent color correctly
- [ ] Table cells format data correctly
- [ ] All TypeScript types compile
- [ ] No console errors or warnings

---

## Support & Documentation

- **Component READMEs**: Each shared directory has detailed documentation
- **JSDoc Comments**: All functions include usage examples
- **Type Definitions**: Full TypeScript support with exported types
- **Migration Guide**: This document

For questions or issues, refer to:
1. Component README in the directory
2. JSDoc comments in the source files
3. Usage examples in this guide
