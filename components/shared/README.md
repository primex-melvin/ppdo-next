# Shared Components Library

This directory contains reusable UI components that are used across multiple features in the application.

## Directory Structure

```
components/shared/
├── form/           # Reusable form components
├── loaders/        # Skeleton loaders and loading states
├── modals/         # Modal wrapper components
├── table/          # Table-related components
├── themed/         # Theme-aware components
└── ui/             # Generic UI components
```

## Component Categories

### Form Components

**Location:** `components/shared/form/`

Standardized form field components with consistent validation and styling.

- `FormActions` - Standard form footer with submit/cancel buttons
- `FormField` - Wrapped form field with label and error handling

### Loaders

**Location:** `components/shared/loaders/`

Skeleton loading components that prevent layout shift.

**Table Skeletons:**
- `TableSkeleton` - Standard data table
- `DataTableSkeleton` - Table with toolbar
- `CompactTableSkeleton` - Smaller tables
- `CardTableSkeleton` - Grid of cards

**Form Skeletons:**
- `FormSkeleton` - Standard form
- `SectionedFormSkeleton` - Multi-section forms
- `CompactFormSkeleton` - Inline forms
- `CardFormSkeleton` - Wizard-style forms

See [loaders/README.md](./loaders/) for detailed usage.

### Modals

**Location:** `components/shared/modals/`

Modal wrapper components that reduce boilerplate.

- `ControlledModal` - Full modal with header/body/footer
- `ViewModal` - Read-only content modal
- `ConfirmModal` - Confirmation dialog

Usage:
```tsx
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
  {/* Content */}
</ControlledModal>
```

### Table Components

**Location:** `components/shared/table/`

Reusable table components for consistent data display.

- `GenericTableToolbar` - Table toolbar with search and actions
- `TableSearchInput` - Standardized search input
- `TableActionButton` - Compact action buttons

### Themed Components

**Location:** `components/shared/themed/`

Components that automatically integrate with the accent color theme.

- `ThemedButton` - Button with automatic accent color
- `ThemedIconButton` - Icon-only button
- `ThemedActionButton` - Compact toolbar button

**Example:**
```tsx
import { ThemedButton } from '@/components/shared/themed';

// Automatically uses accent color:
<ThemedButton variant="primary">
  Save Changes
</ThemedButton>

// Other variants:
<ThemedButton variant="destructive">Delete</ThemedButton>
<ThemedButton variant="outline">Cancel</ThemedButton>
```

### UI Components

**Location:** `components/shared/ui/`

Generic UI components for common patterns.

**Empty States:**
- `EmptyState` - Generic empty state with icon/title/description/actions
- `SearchEmptyState` - No search results
- `CollectionEmptyState` - Empty collection with create action
- `ErrorEmptyState` - Error state with retry
- `TableEmptyState` - Empty table row
- `InlineEmptyState` - Compact inline version

**Example:**
```tsx
import { EmptyState } from '@/components/shared/ui';

<EmptyState
  title="No projects found"
  description="Get started by creating your first project"
  action={{
    label: "Create Project",
    onClick: handleCreate,
    variant: "primary"
  }}
/>
```

## Design Principles

### Consistency
All shared components follow the same design patterns:
- Dark mode support via Tailwind `dark:` classes
- Responsive design with `sm:`, `md:`, `lg:` breakpoints
- Zinc color palette for neutrals
- 6px border radius standard
- Consistent spacing scale

### Accessibility
- Proper ARIA labels
- Keyboard navigation support
- Focus visible states
- Screen reader friendly

### Performance
- Memoized where appropriate
- Minimal re-renders
- Optimized for production builds

### Type Safety
- Full TypeScript support
- Exported prop types
- Generic type support where applicable

## Usage Guidelines

### When to Create a Shared Component

Create a shared component when:
1. The component is used in 3+ places
2. The component implements a common UI pattern
3. Consistency across the app is important
4. The component has reusable logic

### When NOT to Create a Shared Component

Don't create a shared component when:
1. The component is feature-specific
2. It's only used once or twice
3. Making it generic adds unnecessary complexity
4. The component has high coupling to a specific feature

### Component Documentation

Every shared component should include:
- JSDoc comments with description
- Props documentation with types
- Usage examples in comments
- README in the component directory (if applicable)

## Migration Strategy

When migrating existing code to use shared components:

1. **Identify Patterns**: Look for repeated UI patterns
2. **Extract Gradually**: Don't refactor everything at once
3. **Test Thoroughly**: Ensure shared component works in all contexts
4. **Update Documentation**: Keep README files current
5. **Remove Old Code**: Clean up duplicated code after migration

## Contributing

When adding new shared components:

1. Place in appropriate directory
2. Add TypeScript types/interfaces
3. Include JSDoc with examples
4. Export from index.ts
5. Update this README
6. Test in multiple contexts
7. Ensure dark mode support
8. Add accessibility features

## Examples by Use Case

### Data Tables
```tsx
import { DataTableSkeleton } from '@/components/shared/loaders';
import { TableEmptyState } from '@/components/shared/ui';
import { GenericTableToolbar, TableSearchInput } from '@/components/shared/table';

{isLoading ? (
  <DataTableSkeleton rows={10} columns={6} />
) : data.length === 0 ? (
  <table>
    <tbody>
      <TableEmptyState colSpan={6} message="No data found" />
    </tbody>
  </table>
) : (
  <table>...</table>
)}
```

### Forms
```tsx
import { useModal } from '@/lib/shared/hooks';
import { ControlledModal } from '@/components/shared/modals';
import { FormSkeleton } from '@/components/shared/loaders';
import { ThemedButton } from '@/components/shared/themed';

const modal = useModal<FormData>();

{isLoading ? (
  <FormSkeleton fields={6} twoColumn />
) : (
  <ControlledModal
    isOpen={modal.isOpen}
    onClose={modal.closeModal}
    title={modal.mode === "edit" ? "Edit" : "Create"}
    showDefaultFooter
    onSubmit={handleSubmit}
  >
    <form>...</form>
  </ControlledModal>
)}
```

### Action Buttons
```tsx
import { ThemedActionButton } from '@/components/shared/themed';
import { Plus, Trash2 } from 'lucide-react';

<GenericTableToolbar>
  <TableSearchInput value={search} onChange={setSearch} />
  <ThemedActionButton
    variant="primary"
    icon={Plus}
    label="Add New"
    onClick={handleAdd}
  />
  <ThemedActionButton
    icon={Trash2}
    label="Delete"
    onClick={handleDelete}
  />
</GenericTableToolbar>
```
