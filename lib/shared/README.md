# Shared Utilities & Components (DRY Architecture)

This directory contains reusable utilities, hooks, schemas, and patterns that eliminate code duplication across the application.

## 📁 Directory Structure

```
lib/shared/
├── hooks/              # Reusable React hooks
├── schemas/            # Shared Zod validation schemas
└── utils/              # Utility functions and helpers
```

## 🎣 Hooks

### useFeatureActions (Phase 16) ⭐ NEW

Factory hook that creates a unified interface for Create/Update/Delete operations with automatic lifecycle management.

**Usage:**
```tsx
import { useFeatureActions } from '@/lib/shared/hooks';
import { api } from '@/convex/_generated/api';

function ProjectForm({ project, onClose }) {
  const actions = useFeatureActions({
    create: api.projects.create,
    update: api.projects.update,
    delete: api.projects.remove,
    entityName: "project",
    onSuccess: () => onClose(),
  });

  const onSubmit = async (data) => {
    if (project) {
      await actions.update.execute({ id: project._id, ...data });
    } else {
      await actions.create.execute(data);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* form fields */}
      <Button type="submit" disabled={actions.isAnyPending}>
        {project ? "Update" : "Create"}
      </Button>
    </form>
  );
}
```

**Individual Action Hooks:**
- `useCreateAction` - For create-only operations
- `useUpdateAction` - For update-only operations
- `useDeleteAction` - For delete-only operations
- `useAction` - For custom operations

### useBreakpoint (Phase 17) ⭐ NEW

Centralized viewport detection for responsive behavior in JavaScript.

**Usage:**
```tsx
import { useBreakpoint, useIsMobile } from '@/lib/shared/hooks';

function ResponsiveTable() {
  const { isMobile, isDesktop, isAbove } = useBreakpoint();

  // Conditionally render based on screen size
  if (isMobile) {
    return <MobileTableView />;
  }

  const columns = isDesktop ? 6 : 4;
  return <TableView columns={columns} />;
}

// Or use predefined hooks
function Toolbar() {
  const isMobile = useIsMobile();

  return (
    <div>
      {!isMobile && <AdvancedFilters />}
    </div>
  );
}
```

**Available Hooks:**
- `useBreakpoint()` - Full breakpoint state with helpers
- `useIsMobile()` - Returns true if < 640px
- `useIsTablet()` - Returns true if 640px - 1024px
- `useIsDesktop()` - Returns true if >= 1024px
- `useMediaQuery(query)` - Custom media query hook

### useFilteredQuery

Standardizes data fetching and filtering for Convex queries.

**Usage:**
```tsx
import { useFilteredQuery } from '@/lib/shared/hooks';
import { api } from '@/convex/_generated/api';

function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, isEmpty } = useFilteredQuery(
    api.projects.list,
    {},
    'name',  // field to search
    searchTerm
  );

  if (isLoading) return <LoadingState />;
  if (isEmpty) return <EmptyState />;

  return <ProjectList projects={data} />;
}
```

### useMultipleQueries

Aggregates loading states from multiple queries.

**Usage:**
```tsx
import { useMultipleQueries } from '@/lib/shared/hooks';

function DashboardPage() {
  const fiscalYears = useQuery(api.fiscalYears.list, {});
  const budgetItems = useQuery(api.budgetItems.list, {});
  const projects = useQuery(api.projects.list, {});

  const { isLoading, allLoaded } = useMultipleQueries({
    fiscalYears,
    budgetItems,
    projects
  });

  if (isLoading) return <LoadingState />;

  return <Dashboard data={{ fiscalYears, budgetItems, projects }} />;
}
```

### useFormDraft

Auto-saves and restores form drafts (already existing).

**Usage:**
```tsx
import { useFormDraft } from '@/lib/shared/hooks';

function BudgetForm() {
  const { loadDraft, saveDraft, clearDraft } = useFormDraft('budget_form');

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) form.reset(draft);
  }, []);

  // Auto-save on change
  useEffect(() => {
    const timer = setTimeout(() => saveDraft(formValues), 500);
    return () => clearTimeout(timer);
  }, [formValues]);
}
```

## 🔧 Utilities

### Mutation Wrapper

Standardizes mutation handling with automatic toast notifications.

**Basic Usage:**
```tsx
import { executeMutation, MUTATION_MESSAGES } from '@/lib/shared/utils/mutation-wrapper';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

function CreateBudgetButton() {
  const createBudget = useMutation(api.budgetItems.create);

  const handleCreate = async (data) => {
    try {
      const result = await executeMutation(
        createBudget(data),
        MUTATION_MESSAGES.CREATE.loading("budget item"),
        MUTATION_MESSAGES.CREATE.success("Budget item"),
        MUTATION_MESSAGES.CREATE.error("budget item")
      );
      console.log('Created:', result);
    } catch (error) {
      // Error is already shown via toast
    }
  };
}
```

**Using Helper Functions:**
```tsx
import { executeMutationCreate, executeMutationUpdate } from '@/lib/shared/utils/mutation-wrapper';

// CREATE with auto-generated messages
const result = await executeMutationCreate(
  createBudget(data),
  "budget item"  // Entity name
);

// UPDATE with auto-generated messages
const result = await executeMutationUpdate(
  updateBudget(data),
  "budget item"
);

// With callbacks
const result = await executeMutationCreate(
  createBudget(data),
  "budget item",
  {
    onSuccess: (data) => {
      console.log('Success!', data);
      router.push(`/budgets/${data.id}`);
    },
    onError: (error) => {
      console.error('Failed:', error);
    }
  }
);
```

### Form Helpers

Number formatting, currency, and date utilities (already existing).

**Usage:**
```tsx
import { formatNumberForDisplay, parseDisplayNumber } from '@/lib/shared/utils/form-helpers';

// Format for display
const display = formatNumberForDisplay(1234567.89);
// Output: "1,234,567.89"

// Parse back to number
const value = parseDisplayNumber("1,234,567.89");
// Output: 1234567.89
```

## ✅ Validation

### Centralized Validation Messages

**Usage:**
```tsx
import { z } from 'zod';
import { VALIDATION_MESSAGES, VALIDATION_LIMITS, VALIDATION_PATTERNS } from '@/lib/shared/utils/validation';

const schema = z.object({
  name: z
    .string()
    .min(1, { message: VALIDATION_MESSAGES.REQUIRED })
    .max(255, { message: VALIDATION_MESSAGES.TOO_LONG(255) }),

  email: z
    .string()
    .email({ message: VALIDATION_MESSAGES.INVALID_EMAIL }),

  year: z
    .number()
    .int()
    .min(VALIDATION_LIMITS.MIN_YEAR, { message: VALIDATION_MESSAGES.YEAR_MIN })
    .max(VALIDATION_LIMITS.MAX_YEAR, { message: VALIDATION_MESSAGES.YEAR_MAX }),

  code: z
    .string()
    .regex(VALIDATION_PATTERNS.CODE, { message: VALIDATION_MESSAGES.INVALID_FORMAT }),

  budget: z
    .number()
    .min(0, { message: VALIDATION_MESSAGES.MIN_ZERO }),
});
```

**Available Messages:**
- `VALIDATION_MESSAGES.REQUIRED` - "This field is required."
- `VALIDATION_MESSAGES.REQUIRED_FIELD(name)` - "{name} is required."
- `VALIDATION_MESSAGES.MIN_VALUE(n)` - "Must be {n} or greater."
- `VALIDATION_MESSAGES.MAX_VALUE(n)` - "Must be {n} or less."
- `VALIDATION_MESSAGES.TOO_LONG(max)` - "Maximum {max} characters allowed."
- `VALIDATION_MESSAGES.INVALID_EMAIL` - "Please enter a valid email address."
- And many more...

### Shared Budget Schemas

**Usage:**
```tsx
import {
  particularCodeString,
  yearField,
  budgetAmount
} from '@/lib/shared/schemas/budget-schema';

const mySchema = z.object({
  particular: particularCodeString,
  year: yearField,
  allocatedBudget: budgetAmount,
  obligatedBudget: budgetAmount,
});
```

## 🎨 Components

### FormElementWrapper (Phase 15) ⭐ NEW

High-order component that eliminates the 5-layer nesting required for every Shadcn form field.

**Before:**
```tsx
<FormField
  control={form.control}
  name="title"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Project Name</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

**After:**
```tsx
import { FormElementWrapper } from '@/components/shared/form';

<FormElementWrapper
  control={form.control}
  name="title"
  label="Project Name"
  required
>
  {(field) => <Input {...field} />}
</FormElementWrapper>
```

**With Description:**
```tsx
<FormElementWrapper
  control={form.control}
  name="budget"
  label="Total Budget"
  description="Enter the total allocated budget"
  required
>
  {(field) => <CurrencyInput {...field} />}
</FormElementWrapper>
```

### RowActionMenu (Phase 19) ⭐ NEW

Unified "Three Dots" dropdown menu for table row actions with consistent styling.

**Basic Usage:**
```tsx
import { RowActionMenu } from '@/components/shared/table';

<RowActionMenu
  onEdit={() => handleEdit(item)}
  onDelete={() => handleDelete(item.id)}
/>
```

**With Custom Actions:**
```tsx
import { Copy, Archive } from 'lucide-react';

<RowActionMenu
  onEdit={() => handleEdit(item)}
  onDelete={() => handleDelete(item.id)}
  extraActions={[
    {
      key: 'duplicate',
      label: 'Duplicate',
      icon: Copy,
      onClick: () => handleDuplicate(item),
    },
    {
      key: 'archive',
      label: 'Archive',
      icon: Archive,
      onClick: () => handleArchive(item),
      separatorBefore: true,
    },
  ]}
/>
```

### PageHeader

Standardized page header component.

**Basic Usage:**
```tsx
import { PageHeader } from '@/components/shared/layouts';
import { Wallet } from 'lucide-react';

function BudgetPage() {
  return (
    <div>
      <PageHeader
        title="Budget Tracking"
        description="Monitor budget allocation and utilization"
        icon={Wallet}
        iconColor="blue"
        action={<ActivityLogSheet type="budgetItem" />}
      />
      {/* Page content */}
    </div>
  );
}
```

**With Breadcrumbs:**
```tsx
<PageHeader
  title="Project Details"
  description="Manage your project"
  icon={FolderOpen}
  iconColor="green"
  breadcrumbItems={[
    { label: 'Dashboard', href: '/dashboard' },
    { label: '2024', href: '/dashboard/2024' },
    { label: 'Projects' }
  ]}
  action={
    <div className="flex gap-2">
      <Button onClick={handleExport}>Export</Button>
      <Button onClick={handleAdd}>Add New</Button>
    </div>
  }
/>
```

**Simple Header (no icon):**
```tsx
import { SimplePageHeader } from '@/components/shared/layouts';

<SimplePageHeader
  title="Settings"
  description="Manage your preferences"
  action={<Button>Save Changes</Button>}
/>
```

## 🎯 Best Practices

### When to Use These Utilities

1. **useFeatureActions**: For ALL CRUD operations in forms and modals
2. **FormElementWrapper**: For ALL form fields to reduce boilerplate
3. **RowActionMenu**: For ALL table row actions (Edit, Delete, etc.)
4. **useBreakpoint**: When you need responsive logic in JavaScript
5. **Convex Doc Types (Phase 18)**: ALWAYS use `Doc<"tableName">` instead of custom interfaces
6. **useFilteredQuery**: When fetching and filtering list data
7. **Mutation Wrapper**: For custom mutations not covered by useFeatureActions
8. **Validation Messages**: For ALL Zod schemas
9. **PageHeader**: For ALL page-level headers
10. **Shared Schemas**: When validating budget/project data

### Using Convex Doc Types (Phase 18)

**Always prefer Convex-generated types:**
```tsx
import { Doc, Id } from '@/convex/_generated/dataModel';

// ✅ GOOD: Type stays in sync with database
function ProjectCard({ project }: { project: Doc<"projects"> }) {
  const { title, budget, status } = project;
}

// ❌ BAD: Custom interface may drift from schema
interface Project {
  id: string;
  title: string;
  budget: number;
}
```

**Type-safe IDs:**
```tsx
// ✅ GOOD: Type-safe ID
const projectId: Id<"projects"> = "...";

// ✅ GOOD: Type-safe mutation args
await updateProject({
  id: projectId,
  title: "New Title"
});
```

### Migration Guide

**Before (Repetitive):**
```tsx
// ❌ OLD WAY
const budgetItems = useQuery(api.budgetItems.list, {});
const isLoading = budgetItems === undefined;
const filtered = budgetItems?.filter(item =>
  item.name.toLowerCase().includes(search.toLowerCase())
) || [];

try {
  const toastId = toast.loading("Creating...");
  const result = await createItem(data);
  toast.dismiss(toastId);
  toast.success("Created successfully");
} catch (error) {
  toast.error("Failed to create");
}
```

**After (DRY):**
```tsx
// ✅ NEW WAY
const { data: filtered, isLoading } = useFilteredQuery(
  api.budgetItems.list,
  {},
  'name',
  search
);

const result = await executeMutationCreate(
  createItem(data),
  "item"
);
```

## 📚 Additional Resources

- See individual files for detailed JSDoc documentation
- Check component props using TypeScript IntelliSense
- All utilities are fully typed for better DX

## 🔄 Continuous Improvement

When you find repeated patterns in your code:
1. Extract them to this shared directory
2. Document them here
3. Update existing code to use the new abstraction
4. Celebrate reducing technical debt! 🎉
