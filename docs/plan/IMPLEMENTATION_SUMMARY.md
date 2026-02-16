# Implementing Agencies Table - Quick Reference

## 🎯 Goal
Convert the stub "Implementing Agencies" page from card view to a dynamic table view with all toolbar features.

---

## 📁 Files to Create (9 files)

```
app/(private)/dashboard/implementing-agencies/
├── types/
│   └── agency-table.types.ts          # TypeScript interfaces
├── constants/
│   └── agency-table.constants.ts      # Column configs, sort options
├── hooks/
│   └── useAgencyTable.ts              # Combined table hooks
└── components/table/
    ├── index.ts                       # Barrel export
    ├── ImplementingAgenciesTable.tsx  # Main table component (400+ lines)
    ├── AgencyTableToolbar.tsx         # Toolbar with all buttons
    ├── AgencyTableHeader.tsx          # Resizable/reorderable headers
    ├── AgencyTableRow.tsx             # Individual row with actions
    └── EmptyState.tsx                 # No data display
```

---

## 📝 Files to Modify (3 files)

| File | Changes |
|------|---------|
| `app/(private)/dashboard/implementing-agencies/page.tsx` | Replace card grid with table component |
| `convex/tableSettings.ts` | Add `"implementing-agencies-table"` to valid table IDs |
| `convex/implementingAgencies.ts` | (Optional) Add paginated query |

---

## 🎨 Design Requirements

**MUST MATCH:** `BreakdownHistoryTable` styling exactly

| Element | Specification |
|---------|---------------|
| Background | `bg-zinc-50 dark:bg-zinc-950` |
| Header | `bg-zinc-100 dark:bg-zinc-900` |
| Borders | `border-zinc-200 dark:border-zinc-800` |
| Text | `text-zinc-900 dark:text-zinc-100` |
| Accent | Green (from `AccentColorContext`) |
| Header Font | `text-xs font-semibold uppercase tracking-wider` |
| Body Font | `text-sm` |

---

## 🧩 Toolbar Features (8 total)

```
[Sort ▼] [Search...          ] | [👁 Columns] [🗑 Trash] [⬇ Export] [🔗 Share] [⛶] [+ Add]
```

1. **Sort Dropdown** - 9 sort options (Last Modified, Name A-Z, Projects count, etc.)
2. **Search Input** - Filter by code, name, contact info
3. **Columns Menu** - Toggle column visibility
4. **Recycle Bin** - View deleted agencies
5. **Export** - CSV export
6. **Share** - Manage access (admin only)
7. **Fullscreen** - Expand table
8. **Add Button** - Create new agency

---

## 📊 Table Columns (16 total)

| # | Column | Type | Resizable | Renamable | Default |
|---|--------|------|-----------|-----------|---------|
| 1 | Checkbox | - | No | No | Visible |
| 2 | Code | text | ✅ | ✅ | Visible |
| 3 | Agency Name | text | ✅ | ✅ | Visible |
| 4 | Type | badge | ✅ | ✅ | Visible |
| 5 | Category | text | ✅ | ✅ | Hidden |
| 6 | Department | text | ✅ | ✅ | Visible |
| 7 | Contact Person | text | ✅ | ✅ | Hidden |
| 8 | Email | text | ✅ | ✅ | Hidden |
| 9 | Phone | text | ✅ | ✅ | Hidden |
| 10 | Address | text | ✅ | ✅ | Hidden |
| 11 | Projects | number | ✅ | ✅ | Visible |
| 12 | Breakdowns | number | ✅ | ✅ | Hidden |
| 13 | Status | status | ✅ | ✅ | Visible |
| 14 | Created | date | ✅ | ✅ | Hidden |
| 15 | Last Modified | date | ✅ | ✅ | Hidden |
| 16 | Actions | actions | No | No | Visible |

---

## 🔄 Reusable Components to Import

```typescript
// From components/shared/table/
import { GenericTableToolbar } from "@/components/shared/table/GenericTableToolbar";
import { SortDropdown } from "@/components/shared/table/SortDropdown";
import { ColumnVisibilityMenu } from "@/components/shared/table/ColumnVisibilityMenu";
import { TableActionButton } from "@/components/shared/table/TableActionButton";

// From components/features/ppdo/odpp/utilities/data-tables/core/hooks/
import { useTableSettings } from "@/components/features/ppdo/odpp/utilities/data-tables/core/hooks/useTableSettings";
import { useTableResize } from "@/components/features/ppdo/odpp/utilities/data-tables/core/hooks/useTableResize";
import { useColumnDragDrop } from "@/components/features/ppdo/odpp/utilities/data-tables/core/hooks/useColumnDragDrop";
```

---

## 💾 Data Persistence

All user preferences saved to Convex `userTableSettings` table:

```typescript
{
  tableId: "implementing-agencies-table",
  userId: "...",
  columnWidths: { code: 100, fullName: 250, ... },
  columnOrder: ["code", "fullName", "type", ...],
  hiddenColumns: ["category", "address"],
  customColumnLabels: { fullName: "Agency", contactEmail: "E-mail" },
  rowHeights?: Record<string, number>,
}
```

---

## 📋 Implementation Order

```
Week 1: Foundation
├── Day 1-2: Create types, constants, basic table structure
├── Day 3-4: Integrate data fetching, display rows
└── Day 5: Add toolbar shell

Week 2: Toolbar Features
├── Day 1-2: Sort + Search functionality
├── Day 3: Column visibility toggle
├── Day 4: Export + Print
└── Day 5: Add/Edit/Delete modals

Week 3: Advanced Features
├── Day 1-2: Column resizing
├── Day 3: Column header renaming
├── Day 4: Row selection + context menus
└── Day 5: Testing + Polish
```

---

## ✅ Success Criteria

- [ ] Table displays all 16 columns correctly
- [ ] All 8 toolbar buttons functional
- [ ] Sort works for all sortable columns (9 options)
- [ ] Search filters in real-time
- [ ] Column visibility toggles persist
- [ ] Column widths resize and persist
- [ ] Column headers rename and persist
- [ ] Row selection with checkboxes works
- [ ] Export to CSV works
- [ ] Print preview works
- [ ] Design matches BreakdownHistoryTable exactly
- [ ] Dark mode works correctly
- [ ] Responsive on mobile/tablet/desktop

---

## ⚠️ Important Notes

1. **Keep Statistics Cards** - The 4 summary cards at top stay as-is
2. **Preserve Detail Page** - `[id]/page.tsx` remains unchanged
3. **Reuse Patterns** - Copy patterns from BreakdownHistoryTable exactly
4. **Mobile Fallback** - Consider keeping AgencyCard for mobile view
5. **Testing** - Test with 100+ rows for performance

---

## 📚 Reference Files

| Purpose | Path |
|---------|------|
| Main table reference | `components/features/ppdo/odpp/table-pages/breakdown/table/BreakdownHistoryTable.tsx` |
| Toolbar reference | `components/features/ppdo/odpp/utilities/table/toolbar/TableToolbar.tsx` |
| Table settings hook | `components/features/ppdo/odpp/utilities/data-tables/core/hooks/useTableSettings.ts` |
| Schema | `convex/schema/implementingAgencies.ts` |
| Queries | `convex/implementingAgencies.ts` |
| Current page | `app/(private)/dashboard/implementing-agencies/page.tsx` |

---

## 🤝 Integration Checklist

Before starting implementation:
- [ ] Read existing BreakdownHistoryTable thoroughly
- [ ] Understand useTableSettings hook API
- [ ] Review implementingAgencies Convex queries
- [ ] Check tableSettings.ts for valid table IDs

After implementation:
- [ ] Verify all TypeScript types compile
- [ ] Test all toolbar buttons
- [ ] Test column resize/rename/visibility
- [ ] Verify data persistence to Convex
- [ ] Test responsive breakpoints
- [ ] Verify dark mode styling
