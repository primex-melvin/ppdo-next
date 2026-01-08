# Budget Module - Refactored Structure

## Overview
This module has been refactored to follow best practices for maintainability, scalability, and code organization.

## Folder Structure

```
app/dashboard/project/budget/
├── components/
│   ├── useBudgetData.ts          # Custom hooks for data fetching
│   ├── useBudgetMutations.ts     # Custom hooks for mutations
│   ├── BudgetPageHeader.tsx      # Page header component
│   ├── BudgetStatistics.tsx      # Statistics cards component
│   ├── ExpandModal.tsx           # Full-screen spreadsheet modal
│   ├── LoadingState.tsx          # Reusable loading component
│   ├── BudgetTrackingTable.tsx   # Main table component (existing)
│   ├── TrashBinModal.tsx         # Trash bin modal (shared)
│   └── ... (other existing components)
├── types.ts                       # TypeScript type definitions
├── page.tsx                       # Main page (refactored)
└── README.md                      # This file
```

## Architecture Principles

### 1. **Separation of Concerns**
- **Data Layer**: Custom hooks (`useBudgetData`, `useBudgetMutations`, `useBudgetAccess`)
- **Presentation Layer**: Pure presentational components
- **Business Logic**: Isolated in hooks and utilities

### 2. **Custom Hooks**

#### `useBudgetData.ts`
Handles all data fetching logic:
- Fetches budget items from Convex
- Fetches statistics
- Transforms DB format to UI format
- Returns loading states

```typescript
const { budgetItems, statistics, isLoading } = useBudgetData();
```

#### `useBudgetMutations.ts`
Handles all data mutations:
- Create budget item with validation
- Update budget item
- Delete/trash budget item
- Includes error handling and toast notifications

```typescript
const { handleAdd, handleEdit, handleDelete } = useBudgetMutations();
```

#### `useBudgetAccess.ts` (in `useBudgetData.ts`)
Handles access control:
- Checks user permissions
- Returns user and department info
- Provides loading states

```typescript
const { accessCheck, isLoading, canAccess, user, department } = useBudgetAccess();
```

### 3. **Component Modularity**

Each component has a single responsibility:

- **BudgetPageHeader**: Displays page title and global activity log
- **BudgetStatistics**: Shows 4 summary cards (allocated, utilized, rate, total)
- **ExpandModal**: Full-screen spreadsheet view
- **LoadingState**: Reusable loading spinner with customizable message

### 4. **Type Safety**
All types are centralized in `types.ts`:
- `BudgetItem` - Frontend model
- `BudgetItemFromDB` - Backend model
- `ProjectStatus` - Status enum
- Helper functions for status display

## Benefits

### ✅ Maintainability
- Easy to locate and modify specific functionality
- Clear separation between data, logic, and UI
- Reduced code duplication

### ✅ Testability
- Hooks can be tested independently
- Components are pure and predictable
- Easy to mock data layer

### ✅ Scalability
- New features can be added without touching existing code
- Components are reusable across the application
- Easy to extend with new hooks or components

### ✅ Developer Experience
- Smaller, focused files (easier to understand)
- Clear imports show dependencies
- TypeScript autocomplete works better

## Usage Example

```tsx
// Before: All logic in one 320-line file
export default function BudgetTrackingPage() {
  const accessCheck = useQuery(api.budgetAccess.canAccess);
  const budgetItemsFromDB = useQuery(api.budgetItems.list);
  // ... 300+ lines of mixed logic
}

// After: Clean, modular, ~80 lines
export default function BudgetTrackingPage() {
  const { accessCheck, canAccess } = useBudgetAccess();
  const { budgetItems, statistics } = useBudgetData();
  const { handleAdd, handleEdit, handleDelete } = useBudgetMutations();
  
  // ... clean UI composition
}
```

## Migration Notes

- ✅ All original functionality preserved
- ✅ No breaking changes to external APIs
- ✅ Backward compatible with existing components
- ✅ Improved error handling with toast notifications

## Future Enhancements

Potential improvements:
1. Move hooks to dedicated `hooks/` folder (requires directory creation)
2. Extract statistics cards to individual components
3. Add unit tests for hooks
4. Create shared loading/error boundary components
5. Implement optimistic updates for better UX

## Related Files

- `../components/ActivityLogSheet.tsx` - Shared activity log component
- `../components/TrashBinModal.tsx` - Shared trash bin modal
- `../../components/AccessDeniedPage.tsx` - Access control component
- `@/convex/_generated/api` - Convex API endpoints
