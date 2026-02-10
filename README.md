# PPDO Next

> **Provincial Planning and Development Office (Philippines)**  
> A modern web-based system for managing provincial planning, budgeting, and project tracking.

Built with **Next.js 16**, **Convex**, and **Tailwind CSS**. Designed for government use with role-based access control, real-time collaboration, and comprehensive reporting.

---

## 📚 Developer Documentation

### Quick Navigation

| Documentation | Description |
|--------------|-------------|
| [📊 Dashboard Docs](./app/dashboard/docs/README.md) | Main dashboard architecture, routing, modules |
| [🧩 Components Docs](./components/ppdo/docs/README.md) | Reusable component library documentation |
| [📁 Projects Module Docs](./app/dashboard/project/docs/README.md) | Detailed Projects module (Budget → Projects → Breakdowns → Details) |
| [📖 Main Docs](./docs/README.md) | Complete documentation index |
| [⚡ PowerShell Automation](./docs/00-getting-started/POWERSHELL_AUTOMATION.md) | Automate deployment with push-staging command |
| [🚀 Setup Guide](./docs/00-getting-started/SETUP_GUIDE.md) | Development & production setup instructions |

---

## 📖 Full Documentation Index

### Getting Started (`docs/00-getting-started/`)

| File | Topic |
|------|-------|
| [SETUP_GUIDE.md](./docs/00-getting-started/SETUP_GUIDE.md) | Development & production setup guide |
| [POWERSHELL_AUTOMATION.md](./docs/00-getting-started/POWERSHELL_AUTOMATION.md) | PowerShell automation for deployment |
| [CONVEX_DATA_MIGRATION_LOCAL_VS_PROD.md](./docs/00-getting-started/CONVEX_DATA_MIGRATION_LOCAL_VS_PROD.md) | Data migration between environments |

### Core Systems (`docs/01-core-systems/`)

| File | Topic |
|------|-------|
| [computation-guides/README.md](./docs/01-core-systems/computation-guides/README.md) | Understanding the numbers in PPDO |
| [01-budget-project-breakdown.md](./docs/01-core-systems/computation-guides/01-budget-project-breakdown.md) | Budget, Project & Breakdown calculations |
| [02-trust-fund.md](./docs/01-core-systems/computation-guides/02-trust-fund.md) | Trust Fund calculations |
| [03-special-health-fund.md](./docs/01-core-systems/computation-guides/03-special-health-fund.md) | Special Health Fund calculations |
| [04-special-education-fund.md](./docs/01-core-systems/computation-guides/04-special-education-fund.md) | Special Education Fund calculations |
| [05-twenty-percent-df.md](./docs/01-core-systems/computation-guides/05-twenty-percent-df.md) | 20% Development Fund calculations |

### Feature Modules (`docs/02-feature-modules/`)

| File | Topic |
|------|-------|
| [inspection-system.md](./docs/02-feature-modules/inspection-system.md) | Inspection module with image galleries |
| [trash-hierarchy-system.md](./docs/02-feature-modules/trash-hierarchy-system.md) | Trash/recycle bin with recovery |

### Technical Reference (`docs/03-technical-reference/`)

| File | Topic |
|------|-------|
| [TABLE_SYSTEM_DOCUMENTATION.md](./docs/03-technical-reference/TABLE_SYSTEM_DOCUMENTATION.md) | Table system handover guide |
| [TABLE_COLUMN_RESIZE_SYSTEM.md](./docs/03-technical-reference/TABLE_COLUMN_RESIZE_SYSTEM.md) | Column resize system documentation |
| [PROTECTED_ROUTES_BREAKDOWN.md](./docs/03-technical-reference/PROTECTED_ROUTES_BREAKDOWN.md) | Protected dashboard routes |
| [dashboard-analytics-data-flow.md](./docs/03-technical-reference/dashboard-analytics-data-flow.md) | Dashboard data flow |
| [search-system/README.md](./docs/03-technical-reference/search-system/README.md) | Search system architecture |
| [search-system/api-reference.md](./docs/03-technical-reference/search-system/api-reference.md) | Search API reference |
| [search-system/DEVELOPER-GUIDE.md](./docs/03-technical-reference/search-system/DEVELOPER-GUIDE.md) | Search developer guide |
| [search-system/hooks-reference.md](./docs/03-technical-reference/search-system/hooks-reference.md) | Search hooks reference |
| [search-system/error-handling.md](./docs/03-technical-reference/search-system/error-handling.md) | Search error handling |
| [search-system/component-examples.md](./docs/03-technical-reference/search-system/component-examples.md) | Search component examples |
| [table-system/README.md](./docs/03-technical-reference/table-system/README.md) | Table system overview |
| [table-system/01-architecture-overview.md](./docs/03-technical-reference/table-system/01-architecture-overview.md) | Table architecture |
| [table-system/02-unified-table-toolbar.md](./docs/03-technical-reference/table-system/02-unified-table-toolbar.md) | Unified toolbar |
| [table-system/03-table-toolbar-adapters.md](./docs/03-technical-reference/table-system/03-table-toolbar-adapters.md) | Toolbar adapters |
| [table-system/04-domain-specific-toolbars.md](./docs/03-technical-reference/table-system/04-domain-specific-toolbars.md) | Domain toolbars |
| [table-system/05-table-hooks.md](./docs/03-technical-reference/table-system/05-table-hooks.md) | Table hooks |
| [table-system/06-column-visibility-system.md](./docs/03-technical-reference/table-system/06-column-visibility-system.md) | Column visibility |
| [table-system/07-bulk-actions-system.md](./docs/03-technical-reference/table-system/07-bulk-actions-system.md) | Bulk actions |
| [table-system/08-print-preview-toolbar.md](./docs/03-technical-reference/table-system/08-print-preview-toolbar.md) | Print preview |
| [table-system/09-responsive-design-patterns.md](./docs/03-technical-reference/table-system/09-responsive-design-patterns.md) | Responsive tables |
| [table-system/10-integration-guide.md](./docs/03-technical-reference/table-system/10-integration-guide.md) | Table integration |

### Troubleshooting (`docs/04-troubleshooting/`)

| File | Topic |
|------|-------|
| [password-reset/password-reset-system.md](./docs/04-troubleshooting/password-reset/password-reset-system.md) | Password reset system |
| [password-reset/password-reset-bugfix-plan.md](./docs/04-troubleshooting/password-reset/password-reset-bugfix-plan.md) | Bug fix implementation |
| [password-reset/password-reset-error-handling.md](./docs/04-troubleshooting/password-reset/password-reset-error-handling.md) | Error handling |
| [password-reset/password-reset-attempt-bugfix.md](./docs/04-troubleshooting/password-reset/password-reset-attempt-bugfix.md) | Attempt bug fix |

### Complete Feature Documentation (`docs/full-ppdo-docs/`)

| File | Topic |
|------|-------|
| [README.md](./docs/full-ppdo-docs/README.md) | Complete feature catalog (132 features) |
| [FEATURE-MATRIX.md](./docs/full-ppdo-docs/FEATURE-MATRIX.md) | Feature matrix by module |
| [EXTRACTED_LEARNINGS.md](./docs/full-ppdo-docs/EXTRACTED_LEARNINGS.md) | Lessons from completed tasks |
| [01-phase-foundation/README.md](./docs/full-ppdo-docs/01-phase-foundation/README.md) | Phase 1: Foundation & Auth |
| [02-phase-projects/README.md](./docs/full-ppdo-docs/02-phase-projects/README.md) | Phase 2: Projects Module |
| [03-phase-funds/README.md](./docs/full-ppdo-docs/03-phase-funds/README.md) | Phase 3: Funds Management |
| [04-phase-advanced/README.md](./docs/full-ppdo-docs/04-phase-advanced/README.md) | Phase 4: Advanced Features |
| [05-phase-enhancements/README.md](./docs/full-ppdo-docs/05-phase-enhancements/README.md) | Phase 5: Enhancements |

### Dashboard Documentation (`app/dashboard/docs/`)

| File | Topic |
|------|-------|
| [README.md](./app/dashboard/docs/README.md) | Dashboard overview & quick start |
| [01-architecture-overview.md](./app/dashboard/docs/01-architecture-overview.md) | System architecture & tech stack |
| [02-routing-structure.md](./app/dashboard/docs/02-routing-structure.md) | Route definitions & navigation |
| [03-layout-and-navigation.md](./app/dashboard/docs/03-layout-and-navigation.md) | Sidebar, header, contexts |
| [04-module-projects.md](./app/dashboard/docs/04-module-projects.md) | Projects module overview |
| [05-module-particulars.md](./app/dashboard/docs/05-module-particulars.md) | Particulars management |
| [06-module-funds.md](./app/dashboard/docs/06-module-funds.md) | Trust Funds, SEF, SHF |
| [07-module-settings.md](./app/dashboard/docs/07-module-settings.md) | User management & updates |
| [08-data-flow.md](./app/dashboard/docs/08-data-flow.md) | Convex integration & data flow |
| [09-access-control.md](./app/dashboard/docs/09-access-control.md) | RBAC & permissions |
| [10-development-guide.md](./app/dashboard/docs/10-development-guide.md) | Coding standards & patterns |

### PPDO Components Documentation (`components/ppdo/docs/`)

| File | Topic |
|------|-------|
| [README.md](./components/ppdo/docs/README.md) | Component library overview |
| [01-architecture-overview.md](./components/ppdo/docs/01-architecture-overview.md) | Component architecture |
| [02-breakdown-components.md](./components/ppdo/docs/02-breakdown-components.md) | Breakdown module components |
| [03-dashboard-components.md](./components/ppdo/docs/03-dashboard-components.md) | Charts & dashboard UI |
| [04-projects-components.md](./components/ppdo/docs/04-projects-components.md) | Projects table & forms |
| [05-funds-components.md](./components/ppdo/docs/05-funds-components.md) | Funds management components |
| [06-table-components.md](./components/ppdo/docs/06-table-components.md) | Table system & print preview |
| [07-shared-components.md](./components/ppdo/docs/07-shared-components.md) | Cross-module shared components |
| [08-static-components.md](./components/ppdo/docs/08-static-components.md) | Landing page components |
| [09-component-patterns.md](./components/ppdo/docs/09-component-patterns.md) | Design patterns & best practices |

### Projects Module Documentation (`app/dashboard/project/docs/`)

| File | Topic |
|------|-------|
| [README.md](./app/dashboard/project/docs/README.md) | Projects module overview |
| [01-architecture-overview.md](./app/dashboard/project/docs/01-architecture-overview.md) | 4-level hierarchy architecture |
| [02-route-structure.md](./app/dashboard/project/docs/02-route-structure.md) | Route structure & navigation |
| [03-budget-items.md](./app/dashboard/project/docs/03-budget-items.md) | Budget items (Level 1) |
| [04-projects-list.md](./app/dashboard/project/docs/04-projects-list.md) | Projects list (Level 2) |
| [05-breakdowns-list.md](./app/dashboard/project/docs/05-breakdowns-list.md) | Breakdowns (Level 3) |
| [06-project-detail.md](./app/dashboard/project/docs/06-project-detail.md) | Project detail tabs (Level 4) |
| [07-hooks-data-flow.md](./app/dashboard/project/docs/07-hooks-data-flow.md) | Hooks & data flow |
| [08-print-system.md](./app/dashboard/project/docs/08-print-system.md) | Print preview & PDF generation |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Convex account

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/ppdo-next.git
cd ppdo-next

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

### Environment Setup

```bash
# Set Convex environment
npx convex env set APP_ENV development
```

---

## 📝 Git Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Use For |
|--------|---------|
| `feat:` | New features |
| `fix:` | Bug fixes |
| `docs:` | Documentation |
| `style:` | Code formatting |
| `refactor:` | Code restructuring |
| `perf:` | Performance improvements |
| `test:` | Tests |
| `build:` | Build system |
| `ci:` | CI/CD |
| `chore:` | Maintenance |

Example:
```bash
git commit -m "feat: add budget approval workflow"
git commit -m "docs: update API documentation"
```

---

## 🏗️ Project Structure

```
ppdo-next/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (signin, signup)
│   ├── (dashboard)/              # Dashboard routes
│   │   ├── project/              # Projects module
│   │   ├── particulars/          # Particulars module
│   │   ├── trust-funds/          # Trust Funds module
│   │   ├── settings/             # Settings module
│   │   └── ...
│   └── page.tsx                  # Landing page
├── components/
│   ├── ppdo/                     # PPDO-specific components
│   ├── ui/                       # shadcn/ui components
│   ├── sidebar/                  # Navigation sidebar
│   └── header/                   # App header
├── convex/                       # Backend (Convex)
│   ├── schema.ts                 # Database schema
│   ├── *.ts                      # Queries & mutations
│   └── lib/                      # Shared backend code
├── docs/                         # Documentation
│   ├── 00-getting-started/       # Setup guides
│   ├── 01-core-systems/          # Business logic
│   ├── 02-feature-modules/       # Feature docs
│   ├── 03-technical-reference/   # API & guides
│   ├── 04-troubleshooting/       # Bug fixes
│   └── full-ppdo-docs/           # Complete docs
├── lib/                          # Utilities
├── types/                        # TypeScript types
└── ...
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **UI Library** | React 19 |
| **Styling** | Tailwind CSS 4 |
| **Components** | shadcn/ui + Radix UI |
| **Backend** | Convex (real-time database) |
| **Auth** | @convex-dev/auth |
| **Forms** | React Hook Form + Zod |
| **Charts** | Recharts |
| **PDF** | jsPDF |
| **Testing** | Jest + React Testing Library |

---

## 👥 Team

This project is maintained by the **PPDO Development Team**:

- **Product & Documentation Lead** - Requirements & documentation
- **Backend/Convex Architect** - Database & API design
- **Frontend/React Specialist** - UI development
- **UI/UX Designer** - Design system & accessibility
- **Security & Auth Specialist** - Authentication & RBAC
- **Data & Business Logic Engineer** - Domain logic
- **QA & Testing Agent** - Quality assurance
- **Print & Export Specialist** - PDF & document generation
- **DevOps & Performance Agent** - Deployment & optimization

---

## 📄 License

© 2026 Provincial Planning and Development Office. All rights reserved.

---

*For detailed documentation, see the [Developer Docs Index](#-full-documentation-index) above.*
