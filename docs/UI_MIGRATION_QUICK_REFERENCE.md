# UI Migration Quick Reference: Departments → Implementing Agencies

## 🎯 Core Concept

**Before:** Two separate entities
- `departments` - Internal org units with hierarchy
- `implementingAgencies` - External/internal project executors

**After:** Single unified entity
- `implementingAgencies` with `type: "department" | "external"`

---

## 📁 Key Files to Modify

### User Management (Department Assignment)
```
MODIFY:
├── app/(private)/dashboard/settings/user-management/components/UserModal.tsx
├── app/(private)/dashboard/settings/user-management/hooks/useUserManagement.ts
├── app/(private)/dashboard/settings/user-management/page.tsx
└── types/user.types.ts
```

### Agency Management (Main Interface)
```
MODIFY:
├── app/(private)/dashboard/implementing-agencies/page.tsx
├── app/(private)/dashboard/implementing-agencies/components/table/ImplementingAgenciesTable.tsx
├── app/(private)/dashboard/implementing-agencies/types/agency-table.types.ts
└── app/(private)/dashboard/implementing-agencies/[id]/page.tsx
```

### Office Selector (Project Forms)
```
SIMPLIFY:
├── components/features/ppdo/odpp/utilities/table/implementing-office/ImplementingOfficeSelector.tsx
├── components/features/ppdo/odpp/utilities/table/implementing-office/hooks/useOfficeSelector.ts
├── components/features/ppdo/odpp/utilities/table/implementing-office/types.ts
└── components/features/ppdo/odpp/utilities/table/implementing-office/utils.ts
```

### Analytics & Search
```
MODIFY/RENAME:
├── components/features/analytics/DepartmentMultiSelect.tsx → AgencyMultiSelect.tsx
├── components/features/analytics/DepartmentBreakdownChart.tsx
└── components/search/cards/DepartmentCard.tsx
```

---

## 🗑️ Files to Remove/Deprecate

```
REMOVE:
├── app/(private)/dashboard/settings/user-management/components/DepartmentModal.tsx
├── app/(private)/dashboard/settings/user-management/hooks/useDepartmentManagement.ts
└── components/search/cards/DepartmentCard.tsx (merge into AgencyCard)
```

---

## 📝 Type Changes Summary

### User Types
```typescript
// BEFORE
interface User {
  departmentId?: Id<"departments">;
}

// AFTER - Option 1: Keep name, change reference
interface User {
  departmentId?: Id<"implementingAgencies">;
}

// AFTER - Option 2: Rename for clarity
interface User {
  internalAgencyId?: Id<"implementingAgencies">;
}
```

### Agency Types (New Fields)
```typescript
interface Agency {
  // Existing
  _id: Id<"implementingAgencies">;
  code: string;
  fullName: string;
  type: "department" | "external";
  
  // NEW - From departments schema
  parentAgencyId?: Id<"implementingAgencies">;  // was parentDepartmentId
  headUserId?: Id<"users">;
  location?: string;
  
  // Existing contact fields (compatible)
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
}
```

---

## 🔄 API Migration

### Before
```typescript
// Fetch departments
const departments = useQuery(api.departments.list, {});

// Create department
await createDepartment({ name, code, parentDepartmentId, headUserId });
```

### After
```typescript
// Fetch internal agencies (former departments)
const internalAgencies = useQuery(api.implementingAgencies.list, { 
  type: "department" 
});

// Create internal agency
await createAgency({ 
  code, 
  fullName, 
  type: "department",
  parentAgencyId,  // NEW field
  headUserId,      // NEW field
  location         // NEW field
});
```

---

## 🎨 UI Workflow Changes

### Creating a Department (Now "Internal Agency")

**Old Flow:**
1. Settings → User Management
2. Click "Manage Departments"
3. Fill DepartmentModal
4. Save

**New Flow:**
1. Navigate to Implementing Agencies
2. Click "Add Agency"
3. Select Type: "Internal (Department)"
4. Fill AgencyFormModal
5. Save

### Assigning User to Department

**Old:**
- UserModal has "Department" dropdown
- Lists all from `api.departments.list`

**New:**
- UserModal has "Internal Agency" dropdown
- Lists only where `type === "department"`
- From `api.implementingAgencies.list({ type: "department" })`

---

## 🏗️ New Components Needed

```
CREATE:
├── components/features/agencies/AgencyFormModal.tsx
│   └── Type selector: Department | External
│   └── Conditional fields based on type
│
├── components/features/agencies/AgencyHierarchyTree.tsx
│   └── Visual tree for parent-child relationships
│
├── components/features/agencies/AgencyTypeBadge.tsx
│   └── Shows "Internal" or "External" badge
│
└── app/(private)/dashboard/implementing-agencies/hooks/useAgencyMutations.ts
    └── Create, update, delete agency operations
```

---

## ⚠️ Critical Considerations

### 1. Data Migration
- Existing departments → Create agencies with `type: "department"`
- Update all `departmentId` references in users table
- Migrate `parentDepartmentId` → `parentAgencyId`

### 2. Backward Compatibility
- Projects use `implementingOffice` (string code) - **NO CHANGE NEEDED**
- Projects with `departmentId` - **MUST UPDATE REFERENCE**

### 3. Form Validation
```typescript
// Agency code validation differs by type
if (type === "department") {
  // Allow: FIN, HR, PEO-ENG (no spaces preferred)
} else {
  // Allow: DPWH, IAC, "External Contractor" (spaces allowed)
}
```

### 4. Hierarchy Constraints
- Only `type: "department"` can have parent/child relationships
- External agencies are always top-level
- Circular references must be prevented

---

## ✅ Testing Checklist

### User Workflows
- [ ] Create new internal agency
- [ ] Create new external agency
- [ ] Set agency hierarchy (parent/child)
- [ ] Assign department head
- [ ] Assign user to department
- [ ] Change user's department
- [ ] View agency detail page
- [ ] Filter agencies by type

### Form Workflows
- [ ] Create project with implementing office
- [ ] Create 20% DF project
- [ ] Create trust fund project
- [ ] Edit project implementing office
- [ ] Search and select implementing office

### Analytics
- [ ] View department breakdown chart
- [ ] Filter dashboard by department
- [ ] Search for departments

---

## 📊 Impact Summary

| Area | Files | Risk | Effort |
|------|-------|------|--------|
| User Management | 4 | High | 3 days |
| Agency Management | 5 | Medium | 3 days |
| Office Selector | 4 | High | 2 days |
| Analytics | 3 | Low | 1 day |
| Search | 2 | Low | 1 day |
| Forms (verify) | 6 | Medium | 1 day |
| **Total** | **~24** | | **~11 days** |

---

## 🔗 Related Backend Files

These will need parallel updates:
```
convex/
├── schema/departments.ts         → DEPRECATE
├── schema/implementingAgencies.ts → ENHANCE
├── schema/users.ts               → UPDATE reference
├── departments.ts                → DEPRECATE
├── implementingAgencies.ts       → ENHANCE
└── userManagement.ts             → UPDATE
```

---

*Quick Reference generated: 2026-02-16*
