# PPDO Dashboard Documentation

> **Provincial Planning and Development Office (Philippines)**  
> Next.js 16 + Convex Dashboard Documentation  
> *Version: 1.0.0 | Last Updated: January 2026*

---

## Table of Contents

1. [Architecture Overview](./01-architecture-overview.md)
2. [Routing Structure](./02-routing-structure.md)
3. [Layout & Navigation](./03-layout-and-navigation.md)
4. [Module: Projects](./04-module-projects.md)
5. [Module: Particulars](./05-module-particulars.md)
6. [Module: Funds](./06-module-funds.md)
7. [Module: Settings](./07-module-settings.md)
8. [Data Flow & Convex](./08-data-flow.md)
9. [Access Control & RBAC](./09-access-control.md)
10. [Development Guide](./10-development-guide.md)

---

## Quick Start

### Dashboard Entry Point
```
app/dashboard/
├── layout.tsx      # Root dashboard layout (auth, sidebar, providers)
├── page.tsx        # Dashboard landing (fund selection)
└── ...
```

### User Roles
| Role | Access Level | Description |
|------|--------------|-------------|
| `super_admin` | Full access | System administrator |
| `admin` | Full access | Department administrator |
| `user` | Limited access | Standard department user |
| `inspector` | Restricted | External inspector (redirected to /inspector) |

### Key Technologies
- **Framework:** Next.js 16 (App Router)
- **State Management:** Convex (real-time sync)
- **Styling:** Tailwind CSS 4 + Shadcn/ui
- **Forms:** React Hook Form + Zod
- **Auth:** @convex-dev/auth

---

## Dashboard Structure Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      DASHBOARD STRUCTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  HEADER (Search, User Menu, Notifications)               │  │
│  ├──────────┬───────────────────────────────────────────────┤  │
│  │          │                                               │  │
│  │ SIDEBAR  │              MAIN CONTENT                     │  │
│  │          │                                               │  │
│  │ - My     │  ┌─────────────────────────────────────────┐  │  │
│  │   Work-  │  │  BREADCRUMBS | TIME/LOCATION           │  │  │
│  │   space  │  ├─────────────────────────────────────────┤  │  │
│  │ - Dept   │  │                                         │  │  │
│  │   Modules│  │  PAGE CONTENT                           │  │  │
│  │ - Cross  │  │  (Varies by route)                      │  │  │
│  │   Dept   │  │                                         │  │  │
│  │ - Control│  └─────────────────────────────────────────┘  │  │
│  │   Panel│                                               │  │
│  │          │                                               │  │
│  └──────────┴───────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Module Categories

### My Workspace
| Module | Route | Description |
|--------|-------|-------------|
| Dashboard | `/dashboard` | Fund selection, fiscal year landing |
| Personal KPI | `/dashboard/personal-kpi` | Individual performance tracking |

### Department
| Module | Route | Description |
|--------|-------|-------------|
| Projects | `/dashboard/project` | Budget items, projects, breakdowns |
| 20% DF | `/dashboard/20_percent_df` | 20% Development Fund management |
| Trust Funds | `/dashboard/trust-funds` | Project organs/trust funds |
| Special Education Funds | `/dashboard/special-education-funds` | SEF management |
| Special Health Funds | `/dashboard/special-health-funds` | SHF management |
| Particulars | `/dashboard/particulars` | Budget & project particulars |

### Cross Department
| Module | Route | Description |
|--------|-------|-------------|
| Office | `/dashboard/office` | Office management across departments |

### Control Panel
| Module | Route | Description |
|--------|-------|-------------|
| CMS | `/dashboard/cms` | Content Management System |
| Settings | `/dashboard/settings/*` | User management, updates, changelogs |

---

## Related Documentation

- [Project Root README](../../README.md)
- [Dashboard Implementation Summary](../../DASHBOARD_IMPLEMENTATION_SUMMARY.md)
- [Dashboard Quick Start](../../DASHBOARD_QUICK_START.md)
- [Dashboard Verification Checklist](../../DASHBOARD_VERIFICATION_CHECKLIST.md)

---

## Support & Contacts

For technical issues or questions:
1. Check the specific module documentation
2. Review the [Development Guide](./10-development-guide.md)
3. Contact the development team

---

*Document maintained by: Product & Documentation Lead*  
*Part of: PPDO Next.js + Convex Project*
