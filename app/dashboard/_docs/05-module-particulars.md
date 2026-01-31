# Module: Particulars

> Documentation for Budget and Project Particulars management

---

## Overview

Particulars are classification categories used throughout the PPDO system:
- **Budget Particulars** - Categories for budget items
- **Project Particulars** - Categories for projects

This module provides a unified interface for managing both types.

---

## Features

- **Unified View**: See budget and project particulars together
- **Hierarchical Display**: Tree view of parent-child relationships
- **Year Filtering**: Filter particulars by fiscal year
- **Search**: Find particulars by name or code
- **CRUD Operations**: Create, read, update, delete particulars
- **Permission Control**: Role-based access (admin vs user)

---

## Route Structure

```
/dashboard/particulars              # Main particulars page
/dashboard/particulars?year=2025    # Filtered by year
```

---

## Page Structure

**File:** `app/dashboard/particulars/page.tsx`

### Components
```
particulars/
├── page.tsx                          # Main page
├── _components/                      # Private components
│   ├── ConsolidatedParticularsList.tsx   # Main list view
│   ├── BudgetParticularsList.tsx         # Budget particulars
│   ├── ProjectParticularsList.tsx        # Project particulars
│   ├── HierarchyHeader.tsx               # Tree header
│   ├── HierarchyFooter.tsx               # Tree footer
│   ├── TreeNode.tsx                      # Tree node component
│   ├── SearchResultsView.tsx             # Search results
│   ├── SearchResultCard.tsx              # Search result item
│   ├── YearSelector.tsx                  # Year filter dropdown
│   ├── ParticularTypeSelector.tsx        # Type filter
│   ├── InlineEdit.tsx                    # Inline editing
│   ├── ParticularDetailModal.tsx         # Detail view modal
│   ├── ParticularDetailView.tsx          # Detail content
│   ├── ParticularEditDialog.tsx          # Edit dialog
│   ├── ParticularDeleteDialog.tsx        # Delete confirmation
│   ├── SearchResultDetailModal.tsx       # Search detail
│   └── SearchResultDeleteDialog.tsx      # Search delete
├── _constants/
│   └── particularConstants.ts        # Constants
└── _hooks/
    ├── useHierarchyData.ts           # Tree data management
    ├── useSearchFilter.ts            # Search functionality
    ├── useUrlState.ts                # URL state sync
    └── useParticularPermissions.ts   # Permission checks
```

---

## Data Structure

### Budget Particular
```typescript
interface BudgetParticular {
  _id: Id<"budgetParticulars">;
  _creationTime: number;
  name: string;
  code: string;
  description?: string;
  parentId?: Id<"budgetParticulars">;
  isActive: boolean;
  createdBy: Id<"users">;
}
```

### Project Particular
```typescript
interface ProjectParticular {
  _id: Id<"projectParticulars">;
  _creationTime: number;
  name: string;
  code: string;
  description?: string;
  parentId?: Id<"projectParticulars">;
  isActive: boolean;
  createdBy: Id<"users">;
}
```

### Hierarchy Structure
```
Budget Particulars
├── Infrastructure (Parent)
│   ├── Roads (Child)
│   ├── Bridges (Child)
│   └── Buildings (Child)
├── Social Services (Parent)
│   ├── Education (Child)
│   └── Health (Child)
└── Economic (Parent)
    └── Agriculture (Child)

Project Particulars (similar hierarchy)
```

---

## Key Components

### ConsolidatedParticularsList
Main component displaying both budget and project particulars.

**Props:**
```typescript
interface ConsolidatedParticularsListProps {
  selectedYear: string;      // "all" or year number
  onYearChange: (year: string) => void;
}
```

### TreeNode
Recursive component for displaying hierarchical data.

**Features:**
- Expand/collapse children
- Inline editing
- Drag-drop reordering (future)
- Status indicators

### SearchResultsView
Displays flat search results when searching.

**Features:**
- Highlight matching text
- Show hierarchy path (breadcrumbs)
- Quick actions

---

## Hooks

### useHierarchyData
Manages tree structure and expand/collapse state.

```typescript
const {
  treeData,
  expandedNodes,
  toggleNode,
  expandAll,
  collapseAll,
  isLoading,
} = useHierarchyData(particulars, selectedYear);
```

### useSearchFilter
Handles search functionality.

```typescript
const {
  searchQuery,
  setSearchQuery,
  searchResults,
  isSearching,
  clearSearch,
} = useSearchFilter(particulars);
```

### useUrlState
Syncs filter state with URL query parameters.

```typescript
const {
  urlState,
  updateUrlState,
} = useUrlState();

// URL: /dashboard/particulars?year=2025
// urlState.year === "2025"
```

---

## Permissions

| Action | super_admin | admin | user | inspector |
|--------|-------------|-------|------|-----------|
| View List | ✅ | ✅ | ✅ | ❌ |
| Search | ✅ | ✅ | ✅ | ❌ |
| Create | ✅ | ✅ | ❌ | ❌ |
| Edit | ✅ | ✅ | ❌ | ❌ |
| Delete | ✅ | ✅ | ❌ | ❌ |
| Toggle Active | ✅ | ✅ | ❌ | ❌ |

**Note:** Inspectors are redirected away from this page.

---

## UI States

### 1. Loading State
```tsx
<div className="flex items-center justify-center min-h-[400px]">
  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
</div>
```

### 2. Empty State (No Particulars)
Shows message and CTA to create first particular.

### 3. Search Empty State
Shows "No results found" with clear search button.

### 4. Access Denied
Shows alert for unauthorized users.

---

## Constants

```typescript
// _constants/particularConstants.ts

export const UI_TIMING = {
  TOAST_DURATION: 2000,
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 300,
};

export const HIERARCHY_CONFIG = {
  MAX_DEPTH: 5,           // Maximum nesting level
  EXPAND_BY_DEFAULT: false,
  ANIMATE_EXPAND: true,
};
```

---

## Beta Status

The Particulars module is currently in **BETA**.

```typescript
// Beta banner shown on page
<BetaBanner
  featureName="Particulars Management"
  variant="danger"
  dismissible={false}
  message="We're actively refining the Particulars Management interface..."
/>
```

---

## Related Documentation

- [Data Flow & Convex](./08-data-flow.md) - Backend integration
- [Access Control & RBAC](./09-access-control.md) - Permissions
- [Module: Projects](./04-module-projects.md) - How particulars are used
