# Route Structure

> URL routes and navigation flow for Projects module

---

## Route Hierarchy

```
/dashboard/project
│
├── /dashboard/project                              # Level 0: Fiscal Years Landing
│
├── /dashboard/project/[year]                       # Level 1: Budget Items
│   └── year: number (e.g., 2024, 2025)
│
├── /dashboard/project/[year]/[particularId]        # Level 2: Projects
│   ├── year: number
│   └── particularId: string (URL-encoded budget particular ID)
│
├── /dashboard/project/[year]/[particularId]/[projectbreakdownId]
│   └── Level 3: Breakdowns
│       ├── year: number
│       ├── particularId: string
│       └── projectbreakdownId: string (project ID)
│
└── /dashboard/project/[year]/.../[projectId]
    └── Level 4: Project Detail
        └── projectId: string (breakdown ID)
```

---

## Route Details

### Level 0: Fiscal Years Landing

**Route:** `/dashboard/project`

**File:** `app/dashboard/project/page.tsx`

**Purpose:** Display all fiscal years with statistics, allow year selection

**Features:**
- Fiscal year cards with stats
- Add new year
- Delete year (with confirmation)
- Expand/collapse cards for details

**Navigation:**
```
Click "Open" on card → /dashboard/project/[year]
Click "Add Year" → Opens FiscalYearModal
Click "Delete" → Opens FiscalYearDeleteDialog
```

---

### Level 1: Budget Items (Year View)

**Route:** `/dashboard/project/[year]`

**File:** `app/dashboard/project/[year]/page.tsx`

**Purpose:** Display and manage budget items for a specific year

**Parameters:**
- `year`: Fiscal year (e.g., "2025")

**Features:**
- Budget tracking table
- Statistics cards (Allocated, Utilized, Obligated, Rate)
- Add/Edit/Delete budget items
- Bulk operations
- Print preview
- Trash bin (deleted items)

**Navigation:**
```
Click "Add Budget Item" → Opens BudgetModal
Click "Edit" on row → Opens BudgetModal with data
Click "Delete" on row → Opens confirmation dialog
Click "View Projects" on row → /dashboard/project/[year]/[particularId]
Click "Print" → Opens PrintPreviewModal
Click "Trash" → Opens TrashBinModal
```

---

### Level 2: Projects (Particular View)

**Route:** `/dashboard/project/[year]/[particularId]`

**File:** `app/dashboard/project/[year]/[particularId]/page.tsx`

**Purpose:** Display projects under a specific budget item

**Parameters:**
- `year`: Fiscal year
- `particularId`: Budget particular ID (URL-encoded)

**Features:**
- Projects table grouped by category
- Project statistics
- Add/Edit/Delete projects
- Bulk operations
- Expand project details

**Navigation:**
```
Click "Add Project" → Opens ProjectForm modal
Click "Edit" → Opens ProjectForm with data
Click "Delete" → Opens confirmation
Click "Expand" → Opens ProjectExpandModal
Click "View Breakdowns" → /dashboard/project/[year]/[particularId]/[projectId]
Click "Back" → /dashboard/project/[year]
```

---

### Level 3: Breakdowns List

**Route:** `/dashboard/project/[year]/[particularId]/[projectbreakdownId]`

**File:** `app/dashboard/project/[year]/[particularId]/[projectbreakdownId]/page.tsx`

**Purpose:** Display breakdown items for a specific project

**Parameters:**
- `year`: Fiscal year
- `particularId`: Budget particular ID
- `projectbreakdownId`: Project ID

**Features:**
- Breakdown history table
- Status chain tracking (MOA → PCIC → Delivery → Liquidation)
- Add/Edit breakdowns
- Budget tracking per breakdown
- Column resize/reorder

**Navigation:**
```
Click "Add Breakdown" → Opens BreakdownForm
Click "Edit" on row → Opens BreakdownForm
Click "Delete" on row → Confirmation dialog
Click "View Details" → /dashboard/project/[year]/.../[breakdownId]
Click "Back" → /dashboard/project/[year]/[particularId]
```

---

### Level 4: Project Detail

**Route:** `/dashboard/project/[year]/[particularId]/[projectbreakdownId]/[inspectionId]`

**File:** `app/dashboard/project/[year]/.../[projectId]/page.tsx`

**Purpose:** Detailed view of a breakdown with tabs

**Parameters:**
- All parent params + `projectId`: Breakdown ID

**Features:**
- Tabbed interface:
  - **Overview**: Project/breakdown summary
  - **Inspections**: Inspection records with media
  - **Analytics**: Charts and statistics
  - **Remarks**: Comments and discussion

**Navigation:**
```
Click tabs → Switch between views
Click "Add Inspection" → Opens NewInspectionForm
Click "Add Remark" → Opens NewRemarkModal
Click "Back" → Parent breakdown list
```

---

## Breadcrumb Navigation

```
Dashboard → Projects → 2025 → Road Infrastructure → National Highway Rehab → Breakdown Details

/dashboard
    /project
        /2025
            /road-infrastructure
                /national-highway-rehab
                    /breakdown-123
```

**Breadcrumb Component:**
```tsx
<Breadcrumbs items={[
  { label: "Dashboard", href: "/dashboard" },
  { label: "Projects", href: "/dashboard/project" },
  { label: "2025", href: "/dashboard/project/2025" },
  { label: "Road Infrastructure", href: "/dashboard/project/2025/road-infra" },
  { label: "National Highway Rehab", href: "/dashboard/project/.../project-123" },
  { label: "Breakdown Details" },  // Current page (no href)
]} />
```

---

## URL Parameters

### Parameter Types

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `year` | number | Fiscal year | `2025` |
| `particularId` | string | Budget particular ID (URL-encoded) | `road-infrastructure` |
| `projectbreakdownId` | string | Project ID | `proj_abc123` |
| `projectId` | string | Breakdown ID | `breakdown_xyz789` |

### URL Encoding

Particular IDs are URL-encoded for safe routing:

```typescript
// Encoding
const urlParticular = encodeURIComponent("Road Infrastructure");
// Result: "Road%20Infrastructure"

// Decoding
const particular = decodeURIComponent(urlParticular);
// Result: "Road Infrastructure"
```

---

## Query Parameters

Used for state that shouldn't be in the URL path:

```
/dashboard/project/2025?view=table|kanban
/dashboard/project/2025?filter=active
/dashboard/project/2025?search=road
```

**Reading Query Params:**
```tsx
import { useSearchParams } from "next/navigation";

function Page() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "table";
  const filter = searchParams.get("filter");
}
```

---

## Navigation Helpers

### Build Navigation Paths

```typescript
// _lib/navigation.utils.ts

export const paths = {
  // Level 0
  projectsLanding: () => "/dashboard/project",
  
  // Level 1
  yearBudget: (year: number) => 
    `/dashboard/project/${year}`,
  
  // Level 2
  particularProjects: (year: number, particularId: string) =>
    `/dashboard/project/${year}/${encodeURIComponent(particularId)}`,
  
  // Level 3
  projectBreakdowns: (year: number, particularId: string, projectId: string) =>
    `/dashboard/project/${year}/${encodeURIComponent(particularId)}/${projectId}`,
  
  // Level 4
  breakdownDetail: (year: number, particularId: string, projectId: string, breakdownId: string) =>
    `/dashboard/project/${year}/${encodeURIComponent(particularId)}/${projectId}/${breakdownId}`,
};
```

### Usage

```tsx
import { useRouter } from "next/navigation";
import { paths } from "./_lib/navigation.utils";

function BudgetRow({ item }: { item: BudgetItem }) {
  const router = useRouter();
  
  const handleViewProjects = () => {
    router.push(paths.particularProjects(item.year, item.particularId));
  };
  
  return <Button onClick={handleViewProjects}>View Projects</Button>;
}
```

---

## Access Control

Each level checks permissions:

```tsx
// Example: Level 1
const { canAccess, canCreate, canEdit, canDelete } = useBudgetAccess();

if (!canAccess) return <AccessDeniedPage />;
```

| Level | View | Create | Edit | Delete |
|-------|------|--------|------|--------|
| Budget Items | All roles | Admin+ | Admin+ | Admin+ |
| Projects | All roles | All roles | All roles | Admin+ |
| Breakdowns | All roles | All roles | All roles | Admin+ |
| Project Detail | All roles | All roles | All roles | Admin+ |

---

## Related Documentation

- [Budget Items (Year View)](./03-budget-items.md)
- [Hooks & Data Flow](./07-hooks-data-flow.md)
