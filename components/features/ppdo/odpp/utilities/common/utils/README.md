# Common Utilities Consolidation

This directory contains shared utility functions that have been consolidated from various entity-specific locations across the PPDO codebase.

## Files

### 1. `budgetCalculations.ts`
**Status:** Already consolidated (was the source of truth)

Contains generic budget calculation utilities:
- `calculateBudgetAvailability()` - Calculate available budget from parent
- `calculateUtilizationRate()` - Calculate utilization percentage
- `calculateBalance()` - Calculate remaining balance
- `checkAllocationViolation()` - Check if allocation exceeds parent budget
- `checkUtilizationViolation()` - Check if utilized exceeds allocated

**Used by:**
- `projects/components/form/utils/budgetCalculations.ts` (re-export)
- `twenty-percent-df/components/form/utils/budgetCalculations.ts` (re-export)

**Entity-specific implementations that remain separate:**
- `breakdown/form/utils/budgetCalculations.ts` - Uses different `BudgetAllocationStatus` interface with additional fields (`noProjectId`, `siblings`, `siblingCount`)

---

### 2. `formValidation.ts` (NEW)
**Consolidated from:**
- `projects/components/form/utils/formValidation.ts`
- `twenty-percent-df/components/form/utils/formValidation.ts`
- `11_project_plan/form/formValidation.ts`

Contains shared Zod validation schemas:
- `baseProjectSchema` - Common schema for project-like entities (Projects, 20% DF)
- `budgetItemSchema` - Simpler schema for budget items (11_project_plan)

**Types exported:**
- `BaseProjectFormValues`
- `ProjectFormValues` (alias for backward compatibility)
- `TwentyPercentDFFormValues` (alias for backward compatibility)
- `BudgetItemFormValues`

**Migration guide:**
```typescript
// Before (in projects form)
import { projectSchema, ProjectFormValues } from "./utils/formValidation";

// After
import { baseProjectSchema, BaseProjectFormValues } from "@/components/features/ppdo/odpp/common/utils";
```

**Entity-specific implementations that remain separate:**
- `breakdown/form/utils/formValidation.ts` - Has unique fields (district, municipality, barangay, projectName, etc.)

---

### 3. `spreadsheetConfig.ts` (NEW)
**Consolidated from:**
- `projects/constants/projectSpreadsheetConfig.ts`
- `twenty-percent-df/constants/projectSpreadsheetConfig.ts`
- `11_project_plan/utils/budgetSpreadsheetConfig.ts`

Contains shared spreadsheet configurations:
- `PROJECT_COLUMNS` - Standard column definitions for project-like entities
- `createProjectSpreadsheetConfig()` - Factory function for project configs
- `BUDGET_ITEM_COLUMNS` - Column definitions for budget items
- `BUDGET_SPREADSHEET_CONFIG` - Standard budget tracking config

**Migration guide:**
```typescript
// Before (in projects)
import { createProjectSpreadsheetConfig } from "../constants/projectSpreadsheetConfig";

// After
import { createProjectSpreadsheetConfig } from "@/components/features/ppdo/odpp/common/utils";
```

---

## Consolidation Summary

### What Was Consolidated

| Function/Schema | Source Locations | Destination |
|----------------|------------------|-------------|
| `projectSchema` | `projects/formValidation.ts`, `twenty-percent-df/formValidation.ts` | `common/utils/formValidation.ts` |
| `createProjectSpreadsheetConfig` | `projects/constants/`, `twenty-percent-df/constants/` | `common/utils/spreadsheetConfig.ts` |
| `BUDGET_SPREADSHEET_CONFIG` | `11_project_plan/utils/` | `common/utils/spreadsheetConfig.ts` |

### What Stayed Entity-Specific

| File | Reason |
|------|--------|
| `breakdown/form/utils/budgetCalculations.ts` | Uses specialized `BudgetAllocationStatus` interface with UI-specific fields (`siblings`, `siblingCount`, `noProjectId`) |
| `breakdown/form/utils/formValidation.ts` | Has unique fields (district, municipality, barangay, projectName) not present in other forms |
| `funds/utils/fundsSpreadsheetConfig.ts` | Multi-fund type configuration with dynamic API endpoint selection |

### Deprecated Files (Re-exports with @deprecated notices)

- [x] `projects/components/form/utils/formValidation.ts`
- [x] `twenty-percent-df/components/form/utils/formValidation.ts`
- [x] `11_project_plan/form/formValidation.ts`
- [x] `projects/constants/projectSpreadsheetConfig.ts`
- [x] `twenty-percent-df/constants/projectSpreadsheetConfig.ts`
- [x] `11_project_plan/utils/budgetSpreadsheetConfig.ts`

These files now re-export from common utils and include @deprecated notices with migration instructions.

## Future Cleanup Tasks

1. **Update imports** - Gradually update imports in consuming components to use the new common utils location
2. **Remove deprecated files** - After all imports are updated, remove the deprecated re-export files
3. **Consolidate duplicate functions in lib/shared** - Consider consolidating `formatCurrency` and `calculateUtilizationRate` from `lib/shared/utils/form-helpers.ts` into `lib/shared/utils/formatting.ts`