# Shared Modal Components

This directory contains reusable modal wrapper components that reduce boilerplate for modal state management.

## Components

### ControlledModal
A comprehensive modal wrapper with automatic header/footer structure.

**Features:**
- Automatic ResizableModal setup
- Built-in header with title and description
- Optional default footer with submit/cancel buttons
- Custom footer support
- Loading state handling

**Usage:**
```tsx
import { useModal } from '@/lib/shared/hooks';
import { ControlledModal } from '@/components/shared/modals';

function MyComponent() {
  const modal = useModal<MyData>();

  const handleSubmit = () => {
    // Submit logic
    modal.closeModal();
  };

  return (
    <>
      <button onClick={modal.openCreateModal}>Add New</button>

      <ControlledModal
        isOpen={modal.isOpen}
        onClose={modal.closeModal}
        title={modal.mode === "edit" ? "Edit Item" : "Create Item"}
        description="Fill in the details below"
        showDefaultFooter
        submitLabel={modal.mode === "edit" ? "Update" : "Create"}
        onSubmit={handleSubmit}
        isSubmitting={false}
      >
        <form>
          {/* Form fields */}
        </form>
      </ControlledModal>
    </>
  );
}
```

### ViewModal
Simplified modal for view-only content without footer.

**Usage:**
```tsx
import { useSimpleModal } from '@/lib/shared/hooks';
import { ViewModal } from '@/components/shared/modals';

function MyComponent() {
  const { isOpen, open, close } = useSimpleModal();

  return (
    <>
      <button onClick={open}>View Details</button>

      <ViewModal
        isOpen={isOpen}
        onClose={close}
        title="Project Details"
        description="Detailed information about the project"
      >
        <div>
          {/* Read-only content */}
        </div>
      </ViewModal>
    </>
  );
}
```

### ConfirmModal
Confirmation dialog for destructive actions.

**Usage:**
```tsx
import { useSimpleModal } from '@/lib/shared/hooks';
import { ConfirmModal } from '@/components/shared/modals';

function MyComponent() {
  const { isOpen, open, close } = useSimpleModal();

  const handleDelete = () => {
    // Delete logic
    close();
  };

  return (
    <>
      <button onClick={open}>Delete</button>

      <ConfirmModal
        isOpen={isOpen}
        onClose={close}
        title="Delete Project?"
        description="This action cannot be undone. Are you sure?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
        isLoading={false}
      />
    </>
  );
}
```

## Props Reference

### ControlledModal Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| isOpen | boolean | required | Modal open state |
| onClose | () => void | required | Close handler |
| title | string | required | Modal title |
| description | string | optional | Modal description |
| children | ReactNode | required | Modal content |
| footer | ReactNode | optional | Custom footer |
| showDefaultFooter | boolean | false | Show default submit/cancel footer |
| submitLabel | string | "Save" | Submit button label |
| cancelLabel | string | "Cancel" | Cancel button label |
| onSubmit | () => void | optional | Submit handler |
| isSubmitting | boolean | false | Loading state |
| width | string\|number | "600px" | Modal width |
| height | string\|number | "auto" | Modal height |
| maxWidth | string\|number | "95vw" | Max width |
| maxHeight | string\|number | "90vh" | Max height |
| allowOverflow | boolean | false | Allow content overflow |
| preventOutsideClick | boolean | false | Prevent closing on outside click |

## Migration Example

**Before:**
```tsx
const [isOpen, setIsOpen] = useState(false);
const [editData, setEditData] = useState<Breakdown | null>(null);

<ResizableModal open={isOpen} onOpenChange={setIsOpen}>
  <ResizableModalContent width="600px" height="auto">
    <ResizableModalHeader>
      <ResizableModalTitle>Create Breakdown</ResizableModalTitle>
      <ResizableModalDescription>Fill in the details</ResizableModalDescription>
    </ResizableModalHeader>
    <ResizableModalBody>
      <form>...</form>
    </ResizableModalBody>
    <ResizableModalFooter>
      <div className="flex items-center justify-end gap-3">
        <Button onClick={() => setIsOpen(false)}>Cancel</Button>
        <Button onClick={handleSubmit}>Save</Button>
      </div>
    </ResizableModalFooter>
  </ResizableModalContent>
</ResizableModal>
```

**After:**
```tsx
const modal = useModal<Breakdown>();

<ControlledModal
  isOpen={modal.isOpen}
  onClose={modal.closeModal}
  title="Create Breakdown"
  description="Fill in the details"
  showDefaultFooter
  onSubmit={handleSubmit}
>
  <form>...</form>
</ControlledModal>
```

## Benefits

- **Reduced Boilerplate**: 70% less code for modal setup
- **Consistent UX**: All modals have the same structure
- **Type Safety**: Full TypeScript support
- **State Management**: Built-in with useModal hook
- **Maintainability**: Update modal behavior in one place
