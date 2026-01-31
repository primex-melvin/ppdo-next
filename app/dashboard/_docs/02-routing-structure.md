# Routing Structure

> Complete route definitions and navigation hierarchy for PPDO Dashboard

---

## Route Overview

```
Dashboard routes follow Next.js 16 App Router conventions:
- Folders = URL segments
- page.tsx = Route content
- layout.tsx = Shared layout
- [param] = Dynamic segment
```

---

## Route Map

### Public Routes (Outside Dashboard)
| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Landing page |
| `/signin` | `app/(auth)/signin/page.tsx` | Login page |
| `/signup` | `app/(auth)/signup/page.tsx` | Registration |
| `/inspector` | `app/inspector/page.tsx` | Inspector dashboard |

### Dashboard Routes

#### Core Routes
| Route | File | Description | Access |
|-------|------|-------------|--------|
| `/dashboard` | `page.tsx` | Fund selection landing | All (except inspector) |
| `/dashboard?view=years&fund=X` | `page.tsx` | Fiscal year selection | All |
| `/dashboard/[year]` | `[year]/page.tsx` | Year-specific view | All |

#### My Workspace
| Route | File | Description |
|-------|------|-------------|
| `/dashboard/personal-kpi` | `personal-kpi/page.tsx` | Personal KPI tracking |

#### Department Modules

##### Projects Module (Complex Hierarchy)
| Route | File | Description |
|-------|------|-------------|
| `/dashboard/project` | `project/page.tsx` | Fiscal years landing |
| `/dashboard/project/[year]` | `project/[year]/page.tsx` | Budget items for year |
| `/dashboard/project/[year]/[particularId]` | `.../page.tsx` | Projects for particular |
| `/dashboard/project/[year]/[particularId]/[projectbreakdownId]` | `.../page.tsx` | Breakdowns list |
| `/dashboard/project/[year]/.../[projectId]` | `.../page.tsx` | Project detail with tabs |

##### Particulars Module
| Route | File | Description |
|-------|------|-------------|
| `/dashboard/particulars` | `particulars/page.tsx` | Consolidated particulars view |
| `/dashboard/particulars?year=X` | `page.tsx` | Filtered by year |

##### Trust Funds Module
| Route | File | Description |
|-------|------|-------------|
| `/dashboard/trust-funds` | `trust-funds/page.tsx` | Year selection landing |
| `/dashboard/trust-funds/[year]` | `trust-funds/[year]/page.tsx` | Trust funds for year |
| `/dashboard/trust-funds/[year]/[slug]` | `.../[slug]/page.tsx` | Specific trust fund |

##### Special Education Funds (SEF)
| Route | File | Description |
|-------|------|-------------|
| `/dashboard/special-education-funds` | `special-education-funds/page.tsx` | SEF landing |
| `/dashboard/special-education-funds/[year]` | `.../[year]/page.tsx` | SEF for year |
| `/dashboard/special-education-funds/[year]/[slug]` | `.../page.tsx` | Specific SEF |

##### Special Health Funds (SHF)
| Route | File | Description |
|-------|------|-------------|
| `/dashboard/special-health-funds` | `special-health-funds/page.tsx` | SHF landing |
| `/dashboard/special-health-funds/[year]` | `.../[year]/page.tsx` | SHF for year |
| `/dashboard/special-health-funds/[year]/[slug]` | `.../page.tsx` | Specific SHF |

##### 20% Development Fund
| Route | File | Description |
|-------|------|-------------|
| `/dashboard/20_percent_df` | `20_percent_df/page.tsx` | 20% DF landing |
| `/dashboard/20_percent_df/[year]` | `.../[year]/page.tsx` | 20% DF for year |
| `/dashboard/20_percent_df/[year]/[slug]` | `.../page.tsx` | Specific 20% DF item |

#### Cross Department
| Route | File | Description |
|-------|------|-------------|
| `/dashboard/office` | `office/page.tsx` | Office overview |
| `/dashboard/office/[code]` | `office/[code]/page.tsx` | Specific office details |
| `/dashboard/implementing-agencies` | `implementing-agencies/page.tsx` | Agencies list |
| `/dashboard/implementing-agencies/[id]` | `.../[id]/page.tsx` | Agency detail |

#### Control Panel
| Route | File | Description |
|-------|------|-------------|
| `/dashboard/cms` | `cms/page.tsx` | Content Management System |
| `/dashboard/restricted` | `restricted/page.tsx` | Access denied page |
| `/dashboard/security` | `security/page.tsx` | Security settings |

#### Settings Module
| Route | File | Description |
|-------|------|-------------|
| `/dashboard/settings/user-management` | `.../page.tsx` | User CRUD operations |
| `/dashboard/settings/user-management/password-reset-management` | `.../page.tsx` | Password reset requests |
| `/dashboard/settings/updates` | `settings/updates/page.tsx` | Updates hub |
| `/dashboard/settings/updates/changelogs` | `.../changelogs/page.tsx` | Version history |
| `/dashboard/settings/updates/bugs-report` | `.../bugs-report/page.tsx` | Bug reports list |
| `/dashboard/settings/updates/bugs-report/[id]` | `.../[id]/page.tsx` | Bug detail |
| `/dashboard/settings/updates/suggestions` | `.../suggestions/page.tsx` | Suggestions list |
| `/dashboard/settings/updates/suggestions/[id]` | `.../[id]/page.tsx` | Suggestion detail |

---

## Route Parameters

### Dynamic Segments
```
[direction]      → enum: "forward", "reverse"
[year]           → number (e.g., 2024, 2025)
[particularId]   → Convex ID (Id<"budgetParticulars">)
[projectbreakdownId] → Convex ID (Id<"govtProjectBreakdowns">)
[projectId]      → Convex ID (Id<"govtProjects">)
[slug]           → string identifier
[code]           → string office code
[id]             → Convex ID (generic)
```

### Query Parameters
```
?view=years&fund=X    → Dashboard year selection view
?year=X               → Filter by year (particulars, etc.)
```

---

## Navigation Structure

### Sidebar Categories

```typescript
// From components/sidebar/config.tsx

[
  // MY WORKSPACE
  {
    name: "Dashboard",
    href: "/dashboard",
    category: "My Workspace",
  },
  {
    name: "Personal KPI",
    href: "/dashboard/personal-kpi",
    category: "My Workspace",
  },

  // DEPARTMENT
  {
    name: "Projects (11 plans)",
    href: "/dashboard/project",
    category: "Department",
  },
  {
    name: "20% DF",
    href: "/dashboard/20_percent_df",
    category: "Department",
  },
  {
    name: "Trust Funds (Project Organs)",
    href: "/dashboard/trust-funds",
    category: "Department",
  },
  {
    name: "Special Education Funds",
    href: "/dashboard/special-education-funds",
    category: "Department",
  },
  {
    name: "Special Health Funds",
    href: "/dashboard/special-health-funds",
    category: "Department",
  },
  {
    name: "Particulars",
    href: "/dashboard/particulars",
    category: "Department",
  },

  // CROSS DEPARTMENT
  {
    name: "Office",
    href: "/dashboard/office",
    category: "Cross Department",
  },

  // CONTROL PANEL
  {
    name: "CMS",
    href: "/dashboard/cms",
    category: "Control Panel",
  },
  {
    name: "Settings",
    category: "Control Panel",
    submenu: [
      { name: "User Management", href: "/dashboard/settings/user-management" },
      {
        name: "Updates",
        href: "/dashboard/settings/updates",
        submenu: [
          { name: "Changelogs", href: "/dashboard/settings/updates/changelogs" },
          { name: "Bugs", href: "/dashboard/settings/updates/bugs-report" },
          { name: "Suggestions", href: "/dashboard/settings/updates/suggestions" },
        ],
      },
    ],
  },
]
```

---

## Breadcrumb Navigation

Breadcrumbs are automatically generated based on the current route:

```
Dashboard → Project → 2025 → Road Infrastructure → Projects
```

### Breadcrumb Implementation
```typescript
// From contexts/BreadcrumbContext.tsx
// Automatically tracks navigation and builds breadcrumb trail
```

---

## Route Guards & Access Control

### Dashboard Layout Guard
```typescript
// app/dashboard/layout.tsx

useEffect(() => {
  if (!isAuthenticated) {
    router.replace("/signin");
    return;
  }

  if (currentUser?.role === "inspector") {
    router.replace("/inspector");
    return;
  }
}, [isAuthenticated, currentUser]);
```

### Role-Based Access
| Route Pattern | Allowed Roles |
|---------------|---------------|
| `/dashboard/project/*` | super_admin, admin, user |
| `/dashboard/particulars` | super_admin, admin, user (view only) |
| `/dashboard/settings/*` | super_admin, admin |
| `/dashboard/cms` | super_admin, admin |

---

## URL Conventions

### Naming Rules
1. **Folders**: lowercase with underscores for spaces
   - ✅ `20_percent_df`
   - ❌ `20PercentDF`, `20-percent-df`

2. **Parameters**: descriptive, camelCase
   - ✅ `[particularId]`, `[projectbreakdownId]`
   - ❌ `[id]`, `[pid]`

3. **Query Params**: lowercase, kebab-case
   - ✅ `?view=years&fund=projects`
   - ❌ `?view=Years&fund=Projects`

### Route File Structure
```
route-folder/
├── page.tsx              # Required: Route component
├── layout.tsx            # Optional: Wraps children
├── loading.tsx           # Optional: Loading UI
├── error.tsx             # Optional: Error boundary
├── not-found.tsx         # Optional: 404 page
├── components/           # Optional: Route-specific components
├── hooks/                # Optional: Route-specific hooks
├── types/                # Optional: TypeScript types
└── utils/                # Optional: Utility functions
```

---

## Related Documentation

- [Layout & Navigation](./03-layout-and-navigation.md) - Sidebar and layout system
- [Access Control & RBAC](./09-access-control.md) - Detailed permission system
- [Module: Projects](./04-module-projects.md) - Projects routing details
