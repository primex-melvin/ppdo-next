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

---

## 📖 Full Documentation Index

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
