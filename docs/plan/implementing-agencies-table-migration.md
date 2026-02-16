# Implementing Agencies Page - Table Migration Plan

## Executive Summary

Transform the current stub "Implementing Agencies" page from a card-based view to a dynamic, full-featured table view using the existing breakdown table architecture. The new table will support all existing toolbar features, column customization, and maintain design consistency with other table pages.

---

## Current State Analysis

### Existing Page Structure
| File | Purpose |
|------|---------|
| `app/(private)/dashboard/implementing-agencies/page.tsx` | Main page with card grid layout |
| `app/(private)/dashboard/implementing-agencies/components/AgencyCard.tsx` | Card component for agency display |
| `app/(private)/dashboard/implementing-agencies/[id]/page.tsx` | Agency detail page (KEEP AS-IS) |

### Current Data Fetching
```typescript
// Uses: useQuery(api.implementingAgencies.list, { includeInactive: false })
// Returns: Enriched agencies with runtime-calculated stats
```

### Existing Breakdown Table Reference
| Component | Path |
|-----------|------|
| Main Table | `components/features/ppdo/odpp/table-pages/breakdown/table/BreakdownHistoryTable.tsx` |
| Table Toolbar | `components/features/ppdo/odpp/utilities/table/toolbar/TableToolbar.tsx` |
| Hooks | `components/features/ppdo/odpp/utilities/data-tables/core/hooks/` |

---

## Target Architecture

### High-Level Design
```
ImplementingAgenciesPage
├── Statistics Section (4 cards - KEEP EXISTING)
├── ImplementingAgenciesTable (NEW)
│   ├── TableToolbar
│   │   ├── Sort Dropdown
│   │   ├── Search Input
│   │   ├── Column Visibility Menu
│   │   ├── Action Buttons (Trash, Export, Print, Add)
│   │   └── Share Button
│   ├── Table View
│   │   ├── Resizable Header (with editable labels)
│   │   ├── Data Rows (with selection)
│   │   └── Context Menus
│   └── Empty State
└── Modals (Add, Edit, Delete, Trash)
```

---

## Schema Analysis

### Implementing Agencies Table Schema
```typescript
// convex/schema/implementingAgencies.ts
{
  // Core Fields
  code: string;                    // e.g., "DPWH", "PEO"
  fullName: string;                // Full agency name
  type: "department" | "external";
  departmentId?: string;           // Link to departments (if type="department")
  
  // Contact Info
  description?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  
  // Display & Status
  displayOrder?: number;
  isActive: boolean;
  isSystemDefault?: boolean;
  category?: string;
  colorCode?: string;
  
  // Usage Stats
  projectUsageCount?: number;
  breakdownUsageCount?: number;
  
  // Audit
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  updatedBy?: string;
  notes?: string;
}
```

### Table Columns to Display
| Column Key | Label | Type | Resizable | Renamable |
|------------|-------|------|-----------|-----------|
| selection | (checkbox) | - | No | No |
| code | Code | text | Yes | Yes |
| fullName | Agency Name | text | Yes | Yes |
| type | Type | badge | Yes | Yes |
| category | Category | text | Yes | Yes |
| contactPerson | Contact Person | text | Yes | Yes |
| contactEmail | Email | text | Yes | Yes |
| contactPhone | Phone | text | Yes | Yes |
| address | Address | text | Yes | Yes |
| projectUsageCount | Projects | number | Yes | Yes |
| breakdownUsageCount | Breakdowns | number | Yes | Yes |
| isActive | Status | status | Yes | Yes |
| department | Department | text | Yes | Yes |
| createdAt | Created | date | Yes | Yes |
| updatedAt | Last Modified | date | Yes | Yes |
| actions | Actions | actions | No | No |

---

## Implementation Plan

### Phase 1: Core Table Component Structure

#### 1.1 Create Table Directory Structure
```
app/(private)/dashboard/implementing-agencies/
├── page.tsx                              # UPDATE: Replace cards with table
├── [id]/page.tsx                         # KEEP EXISTING
├── components/
│   ├── AgencyCard.tsx                    # DEPRECATE (or keep for alternate view)
│   └── table/                            # NEW DIRECTORY
│       ├── ImplementingAgenciesTable.tsx # Main table component
│       ├── AgencyTableHeader.tsx         # Header with resize/rename
│       ├── AgencyTableRow.tsx            # Individual row
│       ├── AgencyTableToolbar.tsx        # Toolbar wrapper
│       └── index.ts                      # Barrel export
├── hooks/
│   └── useAgencyTable.ts                 # Table-specific hooks
├── types/
│   └── agency-table.types.ts             # TypeScript definitions
└── constants/
    └── agency-table.constants.ts         # Default columns, config
```

#### 1.2 Create Types File
**File:** `app/(private)/dashboard/implementing-agencies/types/agency-table.types.ts`

```typescript
import { Doc } from "@/convex/_generated/dataModel";

// Extended agency with related data
export interface AgencyWithStats extends Doc<"implementingAgencies"> {
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
}

// Column configuration
export interface AgencyColumnConfig {
  key: string;
  label: string;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  align?: "left" | "center" | "right";
  type?: "text" | "badge" | "status" | "number" | "date" | "actions";
  sortable?: boolean;
  hidden?: boolean;
}

// Table props
export interface ImplementingAgenciesTableProps {
  agencies: AgencyWithStats[];
  isLoading?: boolean;
  onAdd?: () => void;
  onEdit?: (agency: AgencyWithStats) => void;
  onDelete?: (id: string) => void;
  onView?: (agency: AgencyWithStats) => void;
  onOpenTrash?: () => void;
}

// Sort options
export type AgencySortOption =
  | "default"
  | "nameAsc"
  | "nameDesc"
  | "codeAsc"
  | "codeDesc"
  | "projectsHigh"
  | "projectsLow"
  | "recent"
  | "oldest";
```

#### 1.3 Create Constants File
**File:** `app/(private)/dashboard/implementing-agencies/constants/agency-table.constants.ts`

```typescript
import { AgencyColumnConfig, AgencySortOption } from "../types/agency-table.types";

export const DEFAULT_AGENCY_COLUMNS: AgencyColumnConfig[] = [
  { key: "code", label: "Code", width: 100, minWidth: 80, align: "left", type: "text", sortable: true },
  { key: "fullName", label: "Agency Name", width: 250, minWidth: 150, align: "left", type: "text", sortable: true },
  { key: "type", label: "Type", width: 120, align: "center", type: "badge", sortable: true },
  { key: "category", label: "Category", width: 140, align: "left", type: "text", sortable: true },
  { key: "department", label: "Department", width: 150, align: "left", type: "text", sortable: true },
  { key: "contactPerson", label: "Contact Person", width: 150, align: "left", type: "text", sortable: true },
  { key: "contactEmail", label: "Email", width: 180, align: "left", type: "text", sortable: false },
  { key: "contactPhone", label: "Phone", width: 130, align: "left", type: "text", sortable: false },
  { key: "projectUsageCount", label: "Projects", width: 100, align: "center", type: "number", sortable: true },
  { key: "breakdownUsageCount", label: "Breakdowns", width: 100, align: "center", type: "number", sortable: true },
  { key: "isActive", label: "Status", width: 100, align: "center", type: "status", sortable: true },
  { key: "createdAt", label: "Created", width: 120, align: "center", type: "date", sortable: true },
  { key: "updatedAt", label: "Last Modified", width: 120, align: "center", type: "date", sortable: true },
  { key: "actions", label: "Actions", width: 100, align: "center", type: "actions", sortable: false },
];

export const AGENCY_SORT_OPTIONS: { value: AgencySortOption; label: string }[] = [
  { value: "default", label: "Default: Last Modified" },
  { value: "nameAsc", label: "Name: A-Z" },
  { value: "nameDesc", label: "Name: Z-A" },
  { value: "codeAsc", label: "Code: A-Z" },
  { value: "codeDesc", label: "Code: Z-A" },
  { value: "projectsHigh", label: "Projects: High to Low" },
  { value: "projectsLow", label: "Projects: Low to High" },
  { value: "recent", label: "Recently Created" },
  { value: "oldest", label: "Oldest First" },
];

export const TABLE_ID = "implementing-agencies-table";
```

### Phase 2: Table Settings Persistence

#### 2.1 Extend Table Settings Schema
**File:** `convex/tableSettings.ts` (UPDATE)

Add support for implementing agencies table settings:

```typescript
// Add to tableId validation
const validTableIds = [
  "breakdown-history",
  "project-list",
  "budget-table",
  "implementing-agencies-table", // NEW
  // ... existing tables
];
```

### Phase 3: Create Reusable Components

#### 3.1 Main Table Component
**File:** `app/(private)/dashboard/implementing-agencies/components/table/ImplementingAgenciesTable.tsx`

**Features:**
- Integration with `useTableSettings` hook for column persistence
- Integration with `useTableResize` for column resizing
- Integration with `useColumnDragDrop` for column reordering
- Column header renaming (double-click to edit)
- Row selection with checkboxes
- Context menus for row actions
- Sort functionality
- Search/filter functionality
- Export to CSV
- Print preview

**Props Interface:**
```typescript
interface ImplementingAgenciesTableProps {
  agencies: AgencyWithStats[];
  isLoading?: boolean;
  sortOption: AgencySortOption;
  onSortChange: (option: AgencySortOption) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedIds: Set<string>;
  onSelectId: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  hiddenColumns: Set<string>;
  onToggleColumn: (key: string) => void;
  onShowAllColumns: () => void;
  onHideAllColumns: () => void;
  onAdd?: () => void;
  onEdit?: (agency: AgencyWithStats) => void;
  onDelete?: (id: string) => void;
  onView?: (agency: AgencyWithStats) => void;
  onOpenTrash?: () => void;
  onExportCSV?: () => void;
  onPrint?: () => void;
}
```

#### 3.2 Table Toolbar Component
**File:** `app/(private)/dashboard/implementing-agencies/components/table/AgencyTableToolbar.tsx`

**Toolbar Layout (left to right):**
```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ [Sort: Default ▼] [Search...                    ]  │  [👁 Columns ▼] [🗑 Trash] [⬇ Export] [🔗 Share] [⛶] [+ Add] │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

**Toolbar Elements:**
1. **Sort Dropdown** - `AgencySortOption` values
2. **Search Input** - Real-time filtering on code, name, contact
3. **Column Visibility Menu** - Toggle column visibility
4. **Recycle Bin** - Access deleted items (if soft delete implemented)
5. **Export** - CSV export of visible data
6. **Share** - Share/manage access (admin only)
7. **Fullscreen** - Expand table to full viewport
8. **Add Button** - Primary CTA for new agency

**Reuse from existing:**
- `SortDropdown` from `components/shared/table/SortDropdown.tsx`
- `ColumnVisibilityMenu` from `components/shared/table/ColumnVisibilityMenu.tsx`
- `TableActionButton` from `components/shared/table/TableActionButton.tsx`

#### 3.3 Table Header Component
**File:** `app/(private)/dashboard/implementing-agencies/components/table/AgencyTableHeader.tsx`

**Features:**
- Drag-drop handles for column reordering
- Resize handles on column borders
- Editable column labels (double-click to rename)
- Select-all checkbox
- Sort indicators

**Reuse patterns from:**
- `components/features/ppdo/odpp/table-pages/breakdown/table/TableHeader.tsx`

#### 3.4 Table Row Component
**File:** `app/(private)/dashboard/implementing-agencies/components/table/AgencyTableRow.tsx`

**Features:**
- Row selection checkbox
- Context menu (right-click) with actions
- Cell rendering based on column type
- Hover effects
- Active row highlighting

**Cell Renderers:**
```typescript
const cellRenderers = {
  text: (value: string) => <span>{value}</span>,
  badge: (value: string) => <Badge variant={value === "department" ? "default" : "secondary"}>{value}</Badge>,
  status: (isActive: boolean) => <StatusBadge active={isActive} />,
  number: (value: number) => <span className="tabular-nums">{value}</span>,
  date: (timestamp: number) => <span>{formatDate(timestamp)}</span>,
  actions: (agency: AgencyWithStats) => <ActionMenu agency={agency} />,
};
```

### Phase 4: Update Main Page

#### 4.1 Update Page Component
**File:** `app/(private)/dashboard/implementing-agencies/page.tsx`

**Changes:**
1. Keep statistics cards section (top 4 cards)
2. Replace cards grid with `ImplementingAgenciesTable`
3. Add state management for:
   - Sort option
   - Search query
   - Selected rows
   - Hidden columns
4. Integrate modals for add/edit/delete

**Page State:**
```typescript
const [sortOption, setSortOption] = useState<AgencySortOption>("default");
const [searchQuery, setSearchQuery] = useState("");
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
const [showAddModal, setShowAddModal] = useState(false);
const [editingAgency, setEditingAgency] = useState<AgencyWithStats | null>(null);
const [showTrash, setShowTrash] = useState(false);
```

### Phase 5: Convex Queries Updates

#### 5.1 Add Paginated Query (Optional Enhancement)
**File:** `convex/implementingAgencies.ts`

Add server-side search and pagination support:

```typescript
export const listPaginated = query({
  args: {
    includeInactive: v.optional(v.boolean()),
    type: v.optional(v.union(v.literal("department"), v.literal("external"))),
    searchQuery: v.optional(v.string()),
    sortBy: v.optional(v.string()),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Implementation with pagination
  },
});
```

### Phase 6: Styling & Design Consistency

#### 6.1 Design Specifications

**Colors (Match Existing Table Pages):**
- Background: `bg-zinc-50 dark:bg-zinc-950`
- Table header: `bg-zinc-100 dark:bg-zinc-900`
- Borders: `border-zinc-200 dark:border-zinc-800`
- Text primary: `text-zinc-900 dark:text-zinc-100`
- Text secondary: `text-zinc-600 dark:text-zinc-400`
- Accent: Use `AccentColorContext` (green for PPDO)

**Typography:**
- Headers: `text-xs font-semibold uppercase tracking-wider`
- Body: `text-sm`
- Numbers: `tabular-nums`

**Spacing:**
- Table padding: `px-4 py-3`
- Toolbar padding: `px-4 py-2.5`
- Gap between elements: `gap-3`

**Interactions:**
- Hover row: `hover:bg-zinc-50 dark:hover:bg-zinc-900/50`
- Selected row: `bg-green-50 dark:bg-green-950/20`
- Resize handle: `w-1 hover:bg-green-500 cursor-col-resize`

#### 6.2 Responsive Behavior

**Desktop (>1024px):**
- Full table with all columns visible by default
- All toolbar buttons visible

**Tablet (768px - 1024px):**
- Condensed toolbar (icons only for some buttons)
- Some columns hidden by default

**Mobile (<768px):**
- Card view as alternative (keep existing AgencyCard)
- Minimal toolbar
- Horizontal scroll for table

---

## File Creation Checklist

### New Files to Create
- [ ] `app/(private)/dashboard/implementing-agencies/types/agency-table.types.ts`
- [ ] `app/(private)/dashboard/implementing-agencies/constants/agency-table.constants.ts`
- [ ] `app/(private)/dashboard/implementing-agencies/components/table/ImplementingAgenciesTable.tsx`
- [ ] `app/(private)/dashboard/implementing-agencies/components/table/AgencyTableToolbar.tsx`
- [ ] `app/(private)/dashboard/implementing-agencies/components/table/AgencyTableHeader.tsx`
- [ ] `app/(private)/dashboard/implementing-agencies/components/table/AgencyTableRow.tsx`
- [ ] `app/(private)/dashboard/implementing-agencies/components/table/EmptyState.tsx`
- [ ] `app/(private)/dashboard/implementing-agencies/components/table/index.ts`
- [ ] `app/(private)/dashboard/implementing-agencies/hooks/useAgencyTable.ts`

### Files to Update
- [ ] `app/(private)/dashboard/implementing-agencies/page.tsx` - Replace cards with table
- [ ] `convex/tableSettings.ts` - Add table ID validation
- [ ] `convex/implementingAgencies.ts` - Add paginated query (optional)

### Files to Deprecate (Keep for reference)
- [ ] `app/(private)/dashboard/implementing-agencies/components/AgencyCard.tsx` - May reuse for mobile view

---

## Implementation Order

### Sprint 1: Foundation
1. Create types and constants
2. Create basic table structure (without toolbars)
3. Integrate existing data fetching

### Sprint 2: Toolbar Integration
1. Create toolbar component with all buttons
2. Integrate column visibility
3. Add sort functionality
4. Add search functionality

### Sprint 3: Advanced Features
1. Column resizing
2. Column header renaming
3. Row selection
4. Context menus

### Sprint 4: Polish & Integration
1. Export/Print functionality
2. Empty states
3. Loading states
4. Responsive design
5. Update main page

---

## Testing Checklist

### Functionality
- [ ] Data loads correctly from Convex
- [ ] All columns display correct data
- [ ] Sorting works for all sortable columns
- [ ] Search filters data correctly
- [ ] Column visibility toggles work
- [ ] Column resizing persists
- [ ] Column renaming persists
- [ ] Row selection works
- [ ] Export CSV works
- [ ] Print preview works
- [ ] Add/Edit/Delete actions work

### UI/UX
- [ ] Design matches existing table pages
- [ ] Dark mode works correctly
- [ ] Responsive on all screen sizes
- [ ] Loading states display correctly
- [ ] Empty states display correctly
- [ ] Tooltips work on all buttons

### Performance
- [ ] Table renders smoothly with 100+ rows
- [ ] Search is responsive (debounced)
- [ ] Column resize doesn't cause lag

---

## Notes & Considerations

### Design Consistency
- MUST match the styling of `BreakdownHistoryTable`
- Use the same toolbar component patterns
- Use the same color scheme (zinc + green accent)
- Use the same typography scale

### Data Persistence
- Column widths: Stored in Convex `userTableSettings`
- Column visibility: Stored in Convex `userTableSettings`
- Column order: Stored in Convex `userTableSettings`
- Custom column names: Stored in Convex `userTableSettings`

### Accessibility
- Keyboard navigation for table
- ARIA labels for all interactive elements
- Focus indicators
- Screen reader support for dynamic content

### Future Enhancements
- Kanban view (like BreakdownHistoryTable)
- Bulk actions for selected rows
- Advanced filters
- Saved views/filters
- Column pinning
