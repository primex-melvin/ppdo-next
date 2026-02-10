# PPDO-Next Documentation

> **Complete Documentation for PPDO-Next Development Team**  
> **Last Updated:** February 10, 2026

---

## 📚 Documentation Structure

This documentation is organized for easy navigation and learning:

```
docs/
├── 00-getting-started/        # Start here if you're new
├── 01-core-systems/           # How the system works
├── 02-feature-modules/        # Specific feature documentation
├── 03-technical-reference/    # API references and guides
├── 04-troubleshooting/        # Bug fixes and solutions
├── 99-archive/                # Archived/deprecated docs
└── full-ppdo-docs/            # Complete feature documentation
```

---

## 🚀 Quick Start

### New to the Project?
1. Read [SETUP_GUIDE.md](./00-getting-started/SETUP_GUIDE.md) - Development setup
2. Review [full-ppdo-docs/README.md](./full-ppdo-docs/README.md) - Feature overview
3. Check [computation-guides/](./01-core-systems/computation-guides/) - Business logic

### Developer Tasks
| Task | Documentation |
|------|---------------|
| Deploy to staging | [POWERSHELL_AUTOMATION.md](./00-getting-started/POWERSHELL_AUTOMATION.md) |
| Migrate data | [CONVEX_DATA_MIGRATION_LOCAL_VS_PROD.md](./00-getting-started/CONVEX_DATA_MIGRATION_LOCAL_VS_PROD.md) |
| Work with tables | [table-system/README.md](./03-technical-reference/table-system/README.md) |
| Implement search | [search-system/README.md](./03-technical-reference/search-system/README.md) |
| Fix auth issues | [password-reset/](./04-troubleshooting/password-reset/) |

---

## 📖 Documentation Index

### 00 - Getting Started
| Document | Purpose |
|----------|---------|
| [SETUP_GUIDE.md](./00-getting-started/SETUP_GUIDE.md) | Development & production setup |
| [POWERSHELL_AUTOMATION.md](./00-getting-started/POWERSHELL_AUTOMATION.md) | Deployment automation |
| [CONVEX_DATA_MIGRATION_LOCAL_VS_PROD.md](./00-getting-started/CONVEX_DATA_MIGRATION_LOCAL_VS_PROD.md) | Data migration guide |

### 01 - Core Systems
| Document | Purpose |
|----------|---------|
| [computation-guides/README.md](./01-core-systems/computation-guides/README.md) | Understanding calculations |
| [computation-guides/01-budget-project-breakdown.md](./01-core-systems/computation-guides/01-budget-project-breakdown.md) | Budget calculations |
| [computation-guides/02-trust-fund.md](./01-core-systems/computation-guides/02-trust-fund.md) | Trust fund logic |
| [computation-guides/03-special-health-fund.md](./01-core-systems/computation-guides/03-special-health-fund.md) | SHF calculations |
| [computation-guides/04-special-education-fund.md](./01-core-systems/computation-guides/04-special-education-fund.md) | SEF calculations |
| [computation-guides/05-twenty-percent-df.md](./01-core-systems/computation-guides/05-twenty-percent-df.md) | 20% DF calculations |

### 02 - Feature Modules
| Document | Purpose |
|----------|---------|
| [inspection-system.md](./02-feature-modules/inspection-system.md) | Inspection module docs |
| [trash-hierarchy-system.md](./02-feature-modules/trash-hierarchy-system.md) | Trash/recovery system |

### 03 - Technical Reference
| Document | Purpose |
|----------|---------|
| [table-system/README.md](./03-technical-reference/table-system/README.md) | Table system architecture |
| [search-system/README.md](./03-technical-reference/search-system/README.md) | Search system docs |
| [TABLE_SYSTEM_DOCUMENTATION.md](./03-technical-reference/TABLE_SYSTEM_DOCUMENTATION.md) | Table system handover |
| [TABLE_COLUMN_RESIZE_SYSTEM.md](./03-technical-reference/TABLE_COLUMN_RESIZE_SYSTEM.md) | Column resize docs |
| [PROTECTED_ROUTES_BREAKDOWN.md](./03-technical-reference/PROTECTED_ROUTES_BREAKDOWN.md) | Route protection |
| [dashboard-analytics-data-flow.md](./03-technical-reference/dashboard-analytics-data-flow.md) | Dashboard data flow |

### 04 - Troubleshooting
| Document | Purpose |
|----------|---------|
| [password-reset/password-reset-system.md](./04-troubleshooting/password-reset/password-reset-system.md) | Password reset docs |
| [password-reset/password-reset-bugfix-plan.md](./04-troubleshooting/password-reset/password-reset-bugfix-plan.md) | Bug fix plan |
| [password-reset/password-reset-error-handling.md](./04-troubleshooting/password-reset/password-reset-error-handling.md) | Error handling |

### full-ppdo-docs - Complete Documentation
| Document | Purpose |
|----------|---------|
| [README.md](./full-ppdo-docs/README.md) | Master feature catalog |
| [FEATURE-MATRIX.md](./full-ppdo-docs/FEATURE-MATRIX.md) | Complete feature matrix |
| [EXTRACTED_LEARNINGS.md](./full-ppdo-docs/EXTRACTED_LEARNINGS.md) | Lessons from completed tasks |
| [01-phase-foundation/](./full-ppdo-docs/01-phase-foundation/) | Phase 1: Auth & Foundation |
| [02-phase-projects/](./full-ppdo-docs/02-phase-projects/) | Phase 2: Projects Module |
| [03-phase-funds/](./full-ppdo-docs/03-phase-funds/) | Phase 3: Funds Management |
| [04-phase-advanced/](./full-ppdo-docs/04-phase-advanced/) | Phase 4: Advanced Features |
| [05-phase-enhancements/](./full-ppdo-docs/05-phase-enhancements/) | Phase 5: Enhancements |

---

## 🎯 Documentation by Role

### Frontend Developer
- [table-system/](./03-technical-reference/table-system/) - Table components
- [search-system/](./03-technical-reference/search-system/) - Search implementation
- [computation-guides/](./01-core-systems/computation-guides/) - Business logic

### Backend Developer
- [PROTECTED_ROUTES_BREAKDOWN.md](./03-technical-reference/PROTECTED_ROUTES_BREAKDOWN.md) - Route protection
- [dashboard-analytics-data-flow.md](./03-technical-reference/dashboard-analytics-data-flow.md) - Data flow
- [CONVEX_DATA_MIGRATION_LOCAL_VS_PROD.md](./00-getting-started/CONVEX_DATA_MIGRATION_LOCAL_VS_PROD.md) - Migrations

### DevOps/Deployment
- [POWERSHELL_AUTOMATION.md](./00-getting-started/POWERSHELL_AUTOMATION.md) - Deployment scripts
- [SETUP_GUIDE.md](./00-getting-started/SETUP_GUIDE.md) - Environment setup

### New Team Member
1. [SETUP_GUIDE.md](./00-getting-started/SETUP_GUIDE.md)
2. [full-ppdo-docs/README.md](./full-ppdo-docs/README.md)
3. [computation-guides/README.md](./01-core-systems/computation-guides/README.md)

---

## 🧠 Key Learnings

Important patterns and lessons are documented in:
- [EXTRACTED_LEARNINGS.md](./full-ppdo-docs/EXTRACTED_LEARNINGS.md) - Distilled knowledge from completed tasks

---

## 📝 Contributing to Docs

1. Place new docs in the appropriate numbered folder
2. Update this README with links
3. Use clear, descriptive filenames
4. Include a header with purpose and date

---

## 🗂️ Archive

Deprecated or completed task documentation is moved to:
- `99-archive/` - For historical reference only

---

*For questions or to suggest documentation improvements, contact the development team.*
