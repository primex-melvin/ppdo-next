# Implementing Agencies Schema

## Overview

The **Implementing Agencies** table serves as the master registry of all organizations and entities that can execute projects or project breakdowns within the PPDO-Next project management system. This schema provides a flexible, unified approach to managing both internal departments and external contractors under a single entity type.

### Purpose

- **Unified Agency Registry**: Consolidate all implementing entities (government departments, private contractors, subcontractors) into a single, queryable table
- **Dual-Context Usage**: Support agency assignment at both the project level and project breakdown level with independent usage tracking
- **Flexible Agency Types**: Distinguish between internal organizational units (departments) and external entities without duplicating data structures
- **Usage Analytics**: Track agency utilization across projects and breakdowns for reporting and resource planning

### Business Context

In government and large-scale project management, the "implementing agency" concept is critical because:

1. **Accountability**: Projects must be traceable to responsible implementing entities
2. **Budget Allocation**: Different agencies may have different budget authorities and spending rules
3. **Reporting**: Stakeholders need visibility into which agencies are handling what work
4. **Contract Management**: External contractors need to be tracked alongside internal departments

### Key Relationships

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         IMPLEMENTING AGENCIES                                │
│                                                                              │
│  ┌──────────────┐      ┌──────────────────┐      ┌─────────────────┐        │
│  │  DEPARTMENT  │◄────►│  IMPLEMENTING    │      │    PROJECTS     │        │
│  │     TYPE     │      │     AGENCY       │◄────►│  (Usage Count)  │        │
│  └──────────────┘      │                  │      └─────────────────┘        │
│                        │  - code          │                                 │
│  ┌──────────────┐      │  - fullName      │      ┌─────────────────┐        │
│  │   EXTERNAL   │◄────►│  - type          │◄────►│   BREAKDOWNS    │        │
│  │     TYPE     │      │  - departmentId  │      │  (Usage Count)  │        │
│  └──────────────┘      │  - isActive      │      └─────────────────┘        │
│                        │  - contact info  │                                 │
│                        └──────────────────┘                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Related Table | Relationship | Description |
|--------------|--------------|-------------|
| `departments` | Optional Parent (via `departmentId`) | When `type="department"`, links to the corresponding department record |
| `users` | Created By / Updated By | Audit trail through `createdBy` and `updatedBy` fields |
| `projects` | Referenced By | Projects reference implementing agencies via agency selection |
| `projectBreakdowns` | Referenced By | Breakdowns can have their own implementing agency assignments |

---

## Table Schema

### Fields Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` | ✅ Yes | Unique short code/abbreviation (e.g., "DPWH", "IAC") |
| `fullName` | `string` | ✅ Yes | Complete name of the agency |
| `type` | `union("department" \| "external")` | ✅ Yes | Classification of agency origin |
| `departmentId` | `optional(id("departments"))` | No | Links to department when `type="department"` |
| `description` | `optional(string)` | No | Detailed description of agency scope |
| `contactPerson` | `optional(string)` | No | Primary contact name (external agencies) |
| `contactEmail` | `optional(string)` | No | Contact email address |
| `contactPhone` | `optional(string)` | No | Contact phone number |
| `address` | `optional(string)` | No | Physical address |
| `displayOrder` | `optional(number)` | No | Sorting priority (lower = first) |
| `isActive` | `boolean` | ✅ Yes | Whether agency is available for selection |
| `isSystemDefault` | `optional(boolean)` | No | Protected flag preventing deletion |
| `projectUsageCount` | `optional(number)` | No | Number of projects using this agency |
| `breakdownUsageCount` | `optional(number)` | No | Number of breakdowns using this agency |
| `category` | `optional(string)` | No | Grouping category (e.g., "Government", "Private") |
| `colorCode` | `optional(string)` | No | Hex color for UI display |
| `createdBy` | `id("users")` | ✅ Yes | User who created the record |
| `createdAt` | `number` | ✅ Yes | Creation timestamp (Unix ms) |
| `updatedAt` | `number` | ✅ Yes | Last update timestamp (Unix ms) |
| `updatedBy` | `optional(id("users"))` | No | User who last updated |
| `notes` | `optional(string)` | No | Internal notes/comments |

### Field Details

#### `code`

- **Purpose**: Provides a standardized, human-readable identifier for the agency
- **Validation Rules**:
  - Must be unique across all agencies (enforced at application level)
  - Recommended format: uppercase abbreviations (DPWH, PEO, IAC)
  - Typical length: 2-10 characters
- **Usage Examples**:
  - `"DPWH"` - Department of Public Works and Highways
  - `"PEO"` - Provincial Engineer's Office
  - `"IAC"` - Inter-Agency Council
- **Relationships**: Used as display value in dropdowns, tables, and reports

#### `fullName`

- **Purpose**: Complete, official name of the implementing agency
- **Validation Rules**: 
  - No strict length limit, but UI may truncate long names
  - Should be the official/registered name
- **Usage Examples**:
  - `"Department of Public Works and Highways"`
  - `"Provincial Engineer's Office - Cebu City"`
  - `"Imperial Asia Construction Corporation"`

#### `type`

- **Purpose**: Distinguishes between internal organizational units and external entities
- **Validation Rules**: Strict union type - only `"department"` or `"external"` allowed
- **Usage Patterns**:
  
  | Type | Use Case | `departmentId` Required? |
  |------|----------|-------------------------|
  | `"department"` | Internal government department/office | ✅ Yes |
  | `"external"` | Private contractor, subcontractor, NGO | ❌ No (must be null) |

- **Business Logic**:
  - When `type="department"`, the `departmentId` field must reference a valid `departments` record
  - When `type="external"`, contact information fields become more relevant
  - UI can style/filter agencies differently based on type

#### `departmentId`

- **Purpose**: Creates a formal link to the `departments` table for internal agencies
- **Validation Rules**:
  - Required when `type="department"`
  - Must be `undefined` when `type="external"`
  - Must reference an existing, active department
- **Relationships**: 
  ```
  implementingAgencies.departmentId ──► departments._id
  ```
- **Usage Example**:
  ```typescript
  // Department-type agency
  {
    type: "department",
    departmentId: "dep_123456789",
    code: "PEO",
    fullName: "Provincial Engineer's Office"
  }
  
  // External-type agency
  {
    type: "external",
    departmentId: undefined,
    code: "IACC",
    fullName: "Imperial Asia Construction Corp",
    contactPerson: "John Smith",
    contactEmail: "contact@iacc.com"
  }
  ```

#### `isActive`

- **Purpose**: Soft-delete mechanism allowing agencies to be hidden from new selections while preserving historical data
- **Validation Rules**: Boolean, no null allowed
- **Business Logic**:
  - Inactive agencies don't appear in dropdown selectors
  - Existing projects/breakdowns referencing inactive agencies remain valid
  - Can be reactivated without data loss
- **Query Pattern**:
  ```typescript
  // Only show active agencies in dropdowns
  db.query("implementingAgencies")
    .withIndex("isActive", q => q.eq("isActive", true))
    .collect()
  ```

#### `isSystemDefault`

- **Purpose**: Protects critical system agencies from accidental deletion
- **Validation Rules**: Optional boolean, defaults to `false`
- **Business Logic**:
  - System default agencies cannot be deleted through normal UI
  - Used for agencies that are integral to system operations
  - Can still be deactivated via `isActive`

#### `projectUsageCount` & `breakdownUsageCount`

- **Purpose**: Separate tracking of agency utilization in different contexts
- **Business Logic**:
  - Incremented when an agency is assigned to a project/breakdown
  - Decremented when assignment is removed
  - Enables sorting by popularity/usage
  - Supports analytics and cleanup decisions
- **Update Pattern**:
  ```typescript
  // When assigning agency to project
  await db.patch(agencyId, {
    projectUsageCount: (agency.projectUsageCount ?? 0) + 1
  });
  ```

#### `category`

- **Purpose**: Flexible grouping mechanism for organizing agencies
- **Common Values**:
  - `"Government"` - Government offices and departments
  - `"Private Contractor"` - Private construction firms
  - `"NGO"` - Non-governmental organizations
  - `"International"` - International agencies/organizations
- **UI Application**: Used for grouping in dropdowns and filter panels

#### `colorCode`

- **Purpose**: Visual differentiation in UI components
- **Format**: Hex color string (e.g., `"#2563eb"`, `"#dc2626"`)
- **UI Application**: Badge backgrounds, table row highlights, chart colors

#### Audit Fields (`createdBy`, `createdAt`, `updatedAt`, `updatedBy`)

- **Purpose**: Full audit trail for compliance and debugging
- **Timestamps**: Unix milliseconds since epoch
- **Pattern**:
  ```typescript
  // On creation
  createdAt: Date.now(),
  updatedAt: Date.now(),
  createdBy: userId,
  updatedBy: undefined
  
  // On update
  updatedAt: Date.now(),
  updatedBy: userId
  ```

---

## Indexes

| Index Name | Fields | Purpose |
|------------|--------|---------|
| `code` | `["code"]` | Unique lookup and exact match queries by code |
| `type` | `["type"]` | Filter agencies by department vs external |
| `isActive` | `["isActive"]` | Fast filtering of active/inactive agencies |
| `displayOrder` | `["displayOrder"]` | Sorted display without filtering |
| `category` | `["category"]` | Group by category queries |
| `isActiveAndDisplayOrder` | `["isActive", "displayOrder"]` | **Primary list query**: Active agencies in display order |
| `departmentId` | `["departmentId"]` | Find agency by linked department |
| `typeAndActive` | `["type", "isActive"]` | Filtered lists by type and active status |
| `createdBy` | `["createdBy"]` | Find all agencies created by a user |
| `createdAt` | `["createdAt"]` | Chronological listing |
| `isSystemDefault` | `["isSystemDefault"]` | Identify protected agencies |
| `projectUsageCount` | `["projectUsageCount"]` | Sort by project popularity |
| `breakdownUsageCount` | `["breakdownUsageCount"]` | Sort by breakdown popularity |

### Index Strategy Rationale

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMMON QUERY PATTERNS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. List Active Agencies (Sorted)                               │
│     ├── Index: isActiveAndDisplayOrder                          │
│     └── Query: .eq("isActive", true).order("displayOrder")      │
│                                                                  │
│  2. Dropdown Population                                         │
│     ├── Index: isActiveAndDisplayOrder                          │
│     └── Query: Active agencies only, sorted                     │
│                                                                  │
│  3. Find by Code                                                │
│     ├── Index: code                                             │
│     └── Query: .eq("code", "DPWH")                              │
│                                                                  │
│  4. Filter by Type                                              │
│     ├── Index: typeAndActive                                    │
│     └── Query: .eq("type", "external").eq("isActive", true)     │
│                                                                  │
│  5. Department Lookup                                           │
│     ├── Index: departmentId                                     │
│     └── Query: .eq("departmentId", deptId)                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Relationships

### Entity Relationship Diagram

```
                    ┌─────────────────────┐
                    │      users          │
                    │─────────────────────│
                    │ _id: Id<"users">    │
                    │ name: string        │
                    │ email: string       │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                │                ▼
    ┌───────────────────┐      │      ┌───────────────────┐
    │   departments     │      │      │implementingAgencies│
    │───────────────────│      │      │───────────────────│
    │ _id: Id<"depts">  │      │      │ _id: Id<"agencies">
    │ name: string      │      │      │ code: string      │
    │ code: string      │◄─────┘      │ fullName: string  │
    │ parentDeptId: Id  │             │ type: "dept"|"ext"│
    │ headUserId: Id────┼────────────►│ departmentId: Id──┼────┐
    │ isActive: boolean │             │ isActive: boolean │    │
    └─────────┬─────────┘             │ createdBy: Id─────┼────┘
              │                       │ updatedBy: Id─────┼────┐
              │                       └─────────┬─────────┘    │
              │                                 │              │
              │    ┌────────────────────────────┘              │
              │    │                                           │
              │    ▼                                           │
              │ ┌─────────────────────────────────────┐        │
              │ │           projects                  │        │
              └►│-------------------------------------│        │
                │ implementingAgencyId: Id◄─────────────┘        │
                │ (references implementingAgencies)              │
                └─────────────────────────────────────┘          │
                                                                 │
                ┌─────────────────────────────────────┐          │
                │      projectBreakdowns              │◄─────────┘
                │-------------------------------------│
                │ implementingAgencyId: Id◄────────────┘
                │ (references implementingAgencies)
                └─────────────────────────────────────┘
```

### Related Tables

| Table | Cardinality | Relationship Description |
|-------|-------------|-------------------------|
| `departments` | 0:1 (Optional) | When `type="department"`, the agency links to exactly one department. One department can have at most one implementing agency record (enforced at application level). |
| `users` | Many:1 | Every agency has a creator (`createdBy`). Updates track the updating user (`updatedBy`). |
| `projects` | 1:Many | An agency can be assigned to multiple projects. Projects reference agencies by ID. |
| `projectBreakdowns` | 1:Many | An agency can be assigned to multiple breakdowns. Independent count from projects. |

### Foreign Key Constraints

Convex does not enforce foreign key constraints at the database level. Application-level enforcement is required:

```typescript
// Validation when creating/updating department-type agency
if (type === "department" && !departmentId) {
  throw new Error("departmentId is required when type is 'department'");
}

if (type === "external" && departmentId) {
  throw new Error("departmentId must not be set when type is 'external'");
}

// Verify referenced department exists
if (departmentId) {
  const dept = await db.get(departmentId);
  if (!dept) {
    throw new Error("Referenced department does not exist");
  }
}

// Verify code uniqueness
const existing = await db.query("implementingAgencies")
  .withIndex("code", q => q.eq("code", code))
  .first();
if (existing && existing._id !== currentId) {
  throw new Error("Agency code must be unique");
}
```

---

## Usage Patterns

### Common Queries

#### 1. List Active Agencies for Dropdown

```typescript
// Sorted by display order, only active
const agencies = await db
  .query("implementingAgencies")
  .withIndex("isActiveAndDisplayOrder", q => 
    q.eq("isActive", true)
  )
  .order("asc")
  .take(100);
```

#### 2. Get Agency with Department Details

```typescript
// Fetch agency and resolve department if linked
const agency = await db.get(agencyId);
let department = null;
if (agency?.type === "department" && agency.departmentId) {
  department = await db.get(agency.departmentId);
}
return { ...agency, department };
```

#### 3. Search Agencies by Name or Code

```typescript
// Full-text search pattern (requires separate search index table)
const results = await db
  .query("implementingAgencies")
  .filter(q => 
    q.or(
      q.contains(q.field("fullName"), searchTerm),
      q.contains(q.field("code"), searchTerm)
    )
  )
  .take(20);
```

#### 4. Filter by Category and Type

```typescript
// Get all active external contractors
const contractors = await db
  .query("implementingAgencies")
  .withIndex("typeAndActive", q => 
    q.eq("type", "external").eq("isActive", true)
  )
  .filter(q => q.eq(q.field("category"), "Private Contractor"))
  .collect();
```

#### 5. Usage Statistics Report

```typescript
// Top agencies by project usage
const topAgencies = await db
  .query("implementingAgencies")
  .withIndex("projectUsageCount", q => q.gte("projectUsageCount", 1))
  .order("desc")
  .take(10);
```

### Best Practices

1. **Always Filter by `isActive`** in user-facing dropdowns to prevent selection of deprecated agencies
2. **Validate `type`/`departmentId` Consistency** at creation/update time
3. **Use Transactions** when updating usage counts to prevent race conditions
4. **Cache Agency Lists** client-side since they change infrequently
5. **Soft Delete via `isActive`** rather than hard deletion to preserve historical data
6. **Maintain `displayOrder`** in increments of 10 (10, 20, 30) to allow easy insertion
7. **Enforce Code Uniqueness** at the application level (Convex doesn't support unique constraints)

### Code Examples

#### Creating a Department-Type Agency

```typescript
// convex/implementingAgencies.ts
export const createDepartmentAgency = mutation({
  args: {
    code: v.string(),
    fullName: v.string(),
    departmentId: v.id("departments"),
    description: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
    category: v.optional(v.string()),
    colorCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Verify department exists
    const dept = await ctx.db.get(args.departmentId);
    if (!dept) throw new Error("Department not found");
    
    // Check code uniqueness
    const existing = await ctx.db
      .query("implementingAgencies")
      .withIndex("code", q => q.eq("code", args.code))
      .first();
    if (existing) throw new Error("Agency code already exists");
    
    return await ctx.db.insert("implementingAgencies", {
      code: args.code,
      fullName: args.fullName,
      type: "department",
      departmentId: args.departmentId,
      description: args.description,
      isActive: true,
      displayOrder: args.displayOrder,
      category: args.category ?? "Government",
      colorCode: args.colorCode,
      projectUsageCount: 0,
      breakdownUsageCount: 0,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
```

#### Creating an External Agency

```typescript
export const createExternalAgency = mutation({
  args: {
    code: v.string(),
    fullName: v.string(),
    contactPerson: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    address: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Validate email format if provided
    if (args.contactEmail && !isValidEmail(args.contactEmail)) {
      throw new Error("Invalid email format");
    }
    
    return await ctx.db.insert("implementingAgencies", {
      ...args,
      type: "external",
      isActive: true,
      projectUsageCount: 0,
      breakdownUsageCount: 0,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
```

#### Incrementing Usage Count

```typescript
export const assignAgencyToProject = mutation({
  args: {
    projectId: v.id("projects"),
    agencyId: v.id("implementingAgencies"),
  },
  handler: async (ctx, args) => {
    // Update project
    await ctx.db.patch(args.projectId, {
      implementingAgencyId: args.agencyId,
    });
    
    // Increment usage count
    const agency = await ctx.db.get(args.agencyId);
    if (agency) {
      await ctx.db.patch(args.agencyId, {
        projectUsageCount: (agency.projectUsageCount ?? 0) + 1,
        updatedAt: Date.now(),
      });
    }
  },
});
```

---

## Business Logic

### State Management

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENCY STATE LIFECYCLE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐                 │
│   │  DRAFT   │───►│  ACTIVE  │───►│ INACTIVE │                 │
│   │ (create) │    │ (usable) │    │(archived)│                 │
│   └──────────┘    └────┬─────┘    └────┬─────┘                 │
│                        │               │                        │
│                        ▼               │                        │
│                   ┌──────────┐         │                        │
│                   │ ASSIGNED │◄────────┘                        │
│                   │ (in use) │  (reactivate)                    │
│                   └──────────┘                                  │
│                        │                                        │
│                        ▼                                        │
│                   ┌──────────┐                                  │
│                   │PROTECTED │ (isSystemDefault = true)        │
│                   │(no delete)│                                 │
│                   └──────────┘                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Validation Rules

| Rule | Enforcement | Error Message |
|------|-------------|---------------|
| Code uniqueness | Application | "Agency code '{code}' already exists" |
| Department ID exists | Application | "Referenced department not found" |
| Type/departmentId consistency | Application | "Invalid type and departmentId combination" |
| Email format | Application | "Invalid email format" |
| Phone format | Application | "Invalid phone format" |
| System default protection | Application | "Cannot delete system default agency" |
| Active for assignment | Application | "Cannot assign inactive agency" |

### Special Behaviors

1. **Cascade Deactivation**: Deactivating a department should consider deactivating linked agencies (application decision)
2. **Usage Count Recalculation**: If counts become inconsistent, provide an admin function to recalculate:
   ```typescript
   // Recalculate from actual project references
   const projectCount = await ctx.db
     .query("projects")
     .withIndex("implementingAgencyId", q => q.eq("implementingAgencyId", agencyId))
     .collect()
     .then(p => p.length);
   ```
3. **Type Conversion**: Converting between department and external types requires clearing or setting `departmentId` accordingly

---

## Migration & Data Integrity

### Creating Records

```typescript
interface CreateAgencyInput {
  code: string;              // Required, unique
  fullName: string;          // Required
  type: "department" | "external";
  departmentId?: Id<"departments">;  // Required if type="department"
  // ... optional fields
}

// Steps:
// 1. Validate required fields
// 2. Check code uniqueness
// 3. Verify department exists (if applicable)
// 4. Set defaults: isActive=true, usage counts=0
// 5. Set audit fields
// 6. Insert record
```

### Updating Records

```typescript
interface UpdateAgencyInput {
  id: Id<"implementingAgencies">;
  code?: string;             // Check uniqueness if changed
  fullName?: string;
  type?: "department" | "external";  // Handle departmentId accordingly
  departmentId?: Id<"departments">;
  isActive?: boolean;
  // ... other fields
}

// Steps:
// 1. Fetch existing record
// 2. Validate changes
// 3. If type changes, validate departmentId consistency
// 4. Update updatedAt and updatedBy
// 5. Patch record
```

### Soft Deletion Pattern

Instead of hard deletion, use the `isActive` flag:

```typescript
export const deactivateAgency = mutation({
  args: { id: v.id("implementingAgencies") },
  handler: async (ctx, args) => {
    const agency = await ctx.db.get(args.id);
    if (!agency) throw new Error("Agency not found");
    
    // Check if system default
    if (agency.isSystemDefault) {
      throw new Error("Cannot deactivate system default agency");
    }
    
    // Soft delete via deactivation
    await ctx.db.patch(args.id, {
      isActive: false,
      updatedAt: Date.now(),
      updatedBy: await getAuthUserId(ctx),
    });
  },
});
```

To "hard delete" (rarely recommended):
1. Verify `projectUsageCount === 0` and `breakdownUsageCount === 0`
2. Verify `!isSystemDefault`
3. Delete record
4. Consider archiving to separate table for audit purposes

---

## TypeScript Types

### Generated Types

From Convex, the following types are generated:

```typescript
// convex/_generated/dataModel.d.ts
export type Doc<"implementingAgencies"> = {
  _id: Id<"implementingAgencies">;
  _creationTime: number;
  code: string;
  fullName: string;
  type: "department" | "external";
  departmentId?: Id<"departments">;
  description?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  displayOrder?: number;
  isActive: boolean;
  isSystemDefault?: boolean;
  projectUsageCount?: number;
  breakdownUsageCount?: number;
  category?: string;
  colorCode?: string;
  createdBy: Id<"users">;
  createdAt: number;
  updatedAt: number;
  updatedBy?: Id<"users">;
  notes?: string;
};
```

### Custom Types for UI

```typescript
// types/implementingAgencies.ts

import { Doc, Id } from "@/convex/_generated/dataModel";

// Base type from Convex
export type ImplementingAgency = Doc<"implementingAgencies">;

// Extended type with resolved department
export interface ImplementingAgencyWithDepartment 
  extends ImplementingAgency {
  department?: {
    _id: Id<"departments">;
    name: string;
    code: string;
  } | null;
}

// Type for dropdown options
export interface AgencyOption {
  value: Id<"implementingAgencies">;
  label: string;
  code: string;
  type: "department" | "external";
  colorCode?: string;
}

// Form input types
export interface CreateAgencyFormData {
  code: string;
  fullName: string;
  type: "department" | "external";
  departmentId?: string;
  description?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  category?: string;
  colorCode?: string;
}

// Sort options for table
export type AgencySortOption =
  | "code_asc"
  | "code_desc"
  | "name_asc"
  | "name_desc"
  | "type_asc"
  | "type_desc"
  | "usage_desc"
  | "created_desc"
  | "displayOrder_asc";
```

### Usage in Components

```typescript
// components/forms/AgencySelect.tsx
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function AgencySelect({ value, onChange, type }: AgencySelectProps) {
  // Query active agencies for dropdown
  const agencies = useQuery(api.implementingAgencies.listActive, {
    type: type, // "department" | "external" | undefined (all)
  });
  
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select agency..." />
      </SelectTrigger>
      <SelectContent>
        {agencies?.map(agency => (
          <SelectItem key={agency._id} value={agency._id}>
            <span style={{ color: agency.colorCode }}>
              {agency.code}
            </span>
            {" - "}
            {agency.fullName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

---

## See Also

- **[Implementing Agencies Architecture](../plan/implementing-agencies-architecture.md)** - Component hierarchy and data flow diagrams
- **[Departments Schema](./departments-schema.md)** - Related table for internal organizational units
- **[Table System Documentation](./table-system/README.md)** - UI table patterns used for agency management
- **[Trash Hierarchy System](../02-feature-modules/trash-hierarchy-system.md)** - Soft deletion patterns in the system
- **[Search System](./search-system/README.md)** - How agency search is implemented

---

*Last Updated: February 2026*  
*Schema Version: 1.0*  
*Maintainer: Technical Documentation Team*
