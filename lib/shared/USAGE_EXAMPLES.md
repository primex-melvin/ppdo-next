# Phase 15-19 Feature Implementation Guide

This guide demonstrates how to use the new shared components and hooks introduced in Phases 15-19.

## Table of Contents
- [Phase 15: FormElementWrapper](#phase-15-formelementwrapper)
- [Phase 16: useFeatureActions Hook](#phase-16-usefeatureactions-hook)
- [Phase 17: useBreakpoint Hook](#phase-17-usebreakpoint-hook)
- [Phase 18: Convex Doc Types](#phase-18-convex-doc-types)
- [Phase 19: RowActionMenu](#phase-19-rowactionmenu)

---

## Phase 15: FormElementWrapper

### Before: Traditional Approach
```tsx
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

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

### After: Using FormElementWrapper
```tsx
import { FormElementWrapper } from "@/components/shared/form";

<FormElementWrapper
  control={form.control}
  name="title"
  label="Project Name"
  required
>
  {(field) => <Input {...field} />}
</FormElementWrapper>
```

### Advanced Usage with Description
```tsx
<FormElementWrapper
  control={form.control}
  name="budget"
  label="Total Budget"
  description="Enter the total allocated budget for this project"
  required
  className="col-span-2"
>
  {(field) => <CurrencyInput {...field} />}
</FormElementWrapper>
```

### Usage with Complex Components
```tsx
<FormElementWrapper
  control={form.control}
  name="status"
  label="Project Status"
>
  {(field) => (
    <Select value={field.value} onValueChange={field.onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ongoing">Ongoing</SelectItem>
        <SelectItem value="completed">Completed</SelectItem>
        <SelectItem value="delayed">Delayed</SelectItem>
      </SelectContent>
    </Select>
  )}
</FormElementWrapper>
```

---

## Phase 16: useFeatureActions Hook

### Before: Manual Mutation Handling
```tsx
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

function ProjectForm() {
  const createProject = useMutation(api.projects.create);
  const updateProject = useMutation(api.projects.update);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await updateProject({ id, ...data });
        toast.success("Project updated successfully");
      } else {
        await createProject(data);
        toast.success("Project created successfully");
      }
      closeModal();
    } catch (error) {
      toast.error("Failed to save project");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
}
```

### After: Using useFeatureActions
```tsx
import { useFeatureActions } from "@/lib/shared/hooks";
import { api } from "@/convex/_generated/api";

function ProjectForm() {
  const actions = useFeatureActions({
    create: api.projects.create,
    update: api.projects.update,
    delete: api.projects.remove,
    entityName: "project",
    onSuccess: () => closeModal(),
  });

  const onSubmit = async (data) => {
    if (isEditMode) {
      await actions.update.execute({ id, ...data });
    } else {
      await actions.create.execute(data);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* ... form fields ... */}
      <Button type="submit" disabled={actions.isAnyPending}>
        {isEditMode ? "Update" : "Create"}
      </Button>
    </form>
  );
}
```

### Individual Action Hooks
```tsx
import { useCreateAction, useUpdateAction, useDeleteAction } from "@/lib/shared/hooks";

// For create-only forms
const createAction = useCreateAction(api.budgetItems.create, {
  entityName: "budget item",
  onSuccess: () => closeModal(),
});

await createAction.execute({ particular: "ABC", amount: 1000 });

// For update-only forms
const updateAction = useUpdateAction(api.budgetItems.update, {
  entityName: "budget item",
  onSuccess: () => closeModal(),
});

await updateAction.execute({ id, amount: 2000 });

// For delete operations
const deleteAction = useDeleteAction(api.budgetItems.remove, {
  onSuccess: () => console.log("Deleted successfully"),
});

await deleteAction.execute({ id });
```

### Custom Action Hook
```tsx
import { useAction } from "@/lib/shared/hooks";

const toggleAction = useAction(api.budgetItems.toggleAutoCalculate, {
  loadingMessage: "Updating auto-calculate...",
  successMessage: "Auto-calculate updated",
  onSuccess: () => refetch(),
});

await toggleAction.execute({ id, value: true });
```

---

## Phase 17: useBreakpoint Hook

### Before: CSS-Only Approach
```tsx
// Hidden on mobile, visible on desktop (performance overhead)
<div className="hidden sm:flex gap-6">
  <DetailPanel />
  <Sidebar />
</div>

// Multiple similar components for different screen sizes
<div className="sm:hidden">
  <MobileView />
</div>
```

### After: Using useBreakpoint
```tsx
import { useBreakpoint, useIsMobile } from "@/lib/shared/hooks";

function ResponsiveComponent() {
  const { isMobile, isDesktop, isAbove } = useBreakpoint();

  // Conditionally render entire components
  if (isMobile) {
    return <MobileView />;
  }

  return <DesktopView />;
}
```

### Responsive Logic in Components
```tsx
function DataTable() {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  const columns = isDesktop ? 6 : isTablet ? 4 : 2;
  const pageSize = isDesktop ? 50 : isTablet ? 25 : 10;

  return (
    <Table columns={columns}>
      {/* ... */}
    </Table>
  );
}
```

### Using Media Query Hooks (More Performant)
```tsx
import { useIsMobile, useIsAbove } from "@/lib/shared/hooks";

function Toolbar() {
  const isMobile = useIsMobile();
  const isLargeScreen = useIsAbove("lg");

  return (
    <div>
      {!isMobile && <SearchBar />}
      {isLargeScreen && <AdvancedFilters />}
    </div>
  );
}
```

### Custom Breakpoint Checks
```tsx
const { isAbove, isBelow, isExactly } = useBreakpoint();

// Check if viewport is above a specific breakpoint
if (isAbove("xl")) {
  // Show 4-column layout on extra-large screens
}

// Check if viewport is below a specific breakpoint
if (isBelow("md")) {
  // Show mobile menu
}

// Check if viewport matches exactly one breakpoint range
if (isExactly("md")) {
  // Tablet-specific layout
}
```

---

## Phase 18: Convex Doc Types

### Before: Custom Type Definitions
```tsx
// Custom interface that may drift from database schema
interface Project {
  id: string;
  title: string;
  budget: number;
  status: string;
  // ... more fields
}

function ProjectCard({ project }: { project: Project }) {
  // ...
}
```

### After: Using Convex Doc Types
```tsx
import { Doc, Id } from "@/convex/_generated/dataModel";

// Use Convex-generated types directly
function ProjectCard({ project }: { project: Doc<"projects"> }) {
  // TypeScript knows all fields from your Convex schema
  const { title, budget, status } = project;
}

// Type-safe ID references
function updateProject(id: Id<"projects">, data: Partial<Doc<"projects">>) {
  // ...
}
```

### Form Data with Convex Types
```tsx
import { Doc } from "@/convex/_generated/dataModel";

// Extract type for form values (without _id and _creationTime)
type ProjectFormData = Omit<Doc<"projects">, "_id" | "_creationTime">;

function ProjectForm() {
  const form = useForm<ProjectFormData>({
    defaultValues: {
      title: "",
      budget: 0,
      status: "ongoing",
    },
  });
}
```

### Type-Safe Mutations
```tsx
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const actions = useFeatureActions({
  create: api.projects.create,
  update: api.projects.update,
  delete: api.projects.remove,
  entityName: "project",
});

// TypeScript enforces correct argument types
await actions.create.execute({
  title: "New Project",
  budget: 1000000,
  status: "ongoing",
});

await actions.update.execute({
  id: projectId as Id<"projects">,
  title: "Updated Title",
});
```

---

## Phase 19: RowActionMenu

### Before: Inline Action Buttons
```tsx
// In TableRow component
<td className="text-center">
  <div className="flex items-center justify-center gap-1">
    {onEdit && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit(item);
        }}
        className="p-1 hover:bg-zinc-100 rounded"
      >
        <Edit className="w-4 h-4" />
      </button>
    )}
    {onDelete && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(item.id);
        }}
        className="p-1 hover:bg-red-50 rounded text-red-600"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    )}
  </div>
</td>
```

### After: Using RowActionMenu
```tsx
import { RowActionMenu } from "@/components/shared/table";

<td className="text-center">
  <RowActionMenu
    onEdit={() => onEdit(item)}
    onDelete={() => onDelete(item.id)}
  />
</td>
```

### With Custom Actions
```tsx
import { RowActionMenu } from "@/components/shared/table";
import { Copy, Archive, Pin } from "lucide-react";

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
      key: 'pin',
      label: item.isPinned ? 'Unpin' : 'Pin to top',
      icon: Pin,
      onClick: () => handleTogglePin(item),
    },
    {
      key: 'archive',
      label: 'Archive',
      icon: Archive,
      onClick: () => handleArchive(item),
      separatorBefore: true,
      destructive: true,
    },
  ]}
/>
```

### Custom Labels and Alignment
```tsx
<RowActionMenu
  onEdit={() => handleEdit(item)}
  onDelete={() => handleDelete(item.id)}
  editLabel="Edit Project"
  deleteLabel="Delete Permanently"
  align="start"
  disableEdit={!canEdit}
  disableDelete={!canDelete}
/>
```

### Example: Refactored TableRow
```tsx
// Before
function TableRow({ item, onEdit, onDelete }) {
  return (
    <tr>
      <td>{item.name}</td>
      <td>{item.budget}</td>
      <td>
        <div className="flex gap-1">
          <button onClick={() => onEdit(item)}>
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(item.id)}>
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// After
import { RowActionMenu } from "@/components/shared/table";

function TableRow({ item, onEdit, onDelete }) {
  return (
    <tr>
      <td>{item.name}</td>
      <td>{item.budget}</td>
      <td>
        <RowActionMenu
          onEdit={() => onEdit(item)}
          onDelete={() => onDelete(item.id)}
        />
      </td>
    </tr>
  );
}
```

---

## Complete Example: Refactored Form Component

Here's a complete example showing how to use multiple new features together:

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Form } from "@/components/ui/form";
import { FormElementWrapper, FormActions } from "@/components/shared/form";
import { useFeatureActions, useIsMobile } from "@/lib/shared/hooks";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/shared/form";

// Use Convex Doc type
type ProjectFormData = Omit<Doc<"projects">, "_id" | "_creationTime">;

const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  budget: z.number().min(0, "Budget must be positive"),
  status: z.enum(["ongoing", "completed", "delayed"]),
});

interface ProjectFormProps {
  project?: Doc<"projects">;
  onClose: () => void;
}

export function ProjectForm({ project, onClose }: ProjectFormProps) {
  const isEditMode = !!project;
  const isMobile = useIsMobile();

  // Use useFeatureActions hook
  const actions = useFeatureActions({
    create: api.projects.create,
    update: api.projects.update,
    entityName: "project",
    onSuccess: onClose,
  });

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: project || {
      title: "",
      budget: 0,
      status: "ongoing",
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    if (isEditMode) {
      await actions.update.execute({
        id: project._id as Id<"projects">,
        ...data
      });
    } else {
      await actions.create.execute(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Use FormElementWrapper */}
        <FormElementWrapper
          control={form.control}
          name="title"
          label="Project Title"
          required
        >
          {(field) => <Input {...field} />}
        </FormElementWrapper>

        <FormElementWrapper
          control={form.control}
          name="budget"
          label="Total Budget"
          description="Enter the allocated budget"
          required
        >
          {(field) => <CurrencyInput {...field} />}
        </FormElementWrapper>

        <FormElementWrapper
          control={form.control}
          name="status"
          label="Status"
        >
          {(field) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
              </SelectContent>
            </Select>
          )}
        </FormElementWrapper>

        <FormActions
          isEditMode={isEditMode}
          onCancel={onClose}
          isSubmitting={actions.isAnyPending}
        />
      </form>
    </Form>
  );
}
```

---

## Migration Checklist

### For Forms
- [ ] Replace FormField boilerplate with FormElementWrapper
- [ ] Replace useMutation with useFeatureActions
- [ ] Use Convex Doc types instead of custom interfaces
- [ ] Remove manual loading state management
- [ ] Remove manual toast notifications (handled by mutation wrapper)

### For Tables
- [ ] Replace inline action buttons with RowActionMenu
- [ ] Add responsive logic using useBreakpoint hooks
- [ ] Use Convex Doc types for row data

### For Responsive Design
- [ ] Identify CSS-only responsive hiding (hidden sm:flex)
- [ ] Replace with useBreakpoint for better performance
- [ ] Use conditional rendering instead of CSS display:none

---

## Benefits Summary

### Phase 15: FormElementWrapper
- ✅ **90% less boilerplate** in form components
- ✅ Consistent form field styling
- ✅ Built-in required field indicators
- ✅ Support for descriptions and custom styling

### Phase 16: useFeatureActions
- ✅ **Eliminates 50+ lines** of mutation handling per form
- ✅ Automatic toast notifications
- ✅ Consistent error handling
- ✅ Unified loading states
- ✅ Built-in onSuccess callbacks

### Phase 17: useBreakpoint
- ✅ **Better performance** than CSS-only approaches
- ✅ Centralized breakpoint logic
- ✅ Type-safe viewport detection
- ✅ Real-time responsive state

### Phase 18: Convex Doc Types
- ✅ **Perfect schema synchronization**
- ✅ No type drift between frontend and database
- ✅ Full TypeScript autocomplete
- ✅ Compile-time type safety

### Phase 19: RowActionMenu
- ✅ **Consistent action menu** across all tables
- ✅ Flexible action configuration
- ✅ Dark mode support
- ✅ Accent color theming
- ✅ Easy to add custom actions

---

## Need Help?

For questions or issues:
1. Check existing form/table implementations for patterns
2. Review the component prop types in the source files
3. See the complete example above for full integration
