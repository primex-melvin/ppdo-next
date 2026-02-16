# Departments Schema

## Overview

The **Departments** table represents the organizational hierarchy of the entity using the PPDO-Next system. It provides a flexible, tree-structured model for managing internal organizational units, enabling hierarchical relationships, department head assignments, and seamless integration with the implementing agencies system.

### Purpose

- **Organizational Structure**: Model the complete organizational hierarchy with parent-child relationships
- **Department Management**: Track essential metadata for each organizational unit (contact info, location, leadership)
- **User Assignment**: Link users to departments through the `headUserId` field
- **Agency Integration**: Serve as the foundation for department-type implementing agencies
- **Hierarchical Reporting**: Enable roll-up reporting and cascading permissions

### Business Context

In government and enterprise environments, the department structure is fundamental because:

1. **Budget Authority**: Departments often have independent budget allocations and spending authority
2. **Approval Workflows**: Department heads typically serve as approval authorities for projects and expenditures
3. **Resource Management**: Projects and personnel are organized around departmental structures
4. **Reporting Lines**: Hierarchical reporting requires clear parent-child department relationships

### Key Relationships

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEPARTMENTS                                        │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        HIERARCHICAL STRUCTURE                        │    │
│  │                                                                      │    │
│  │                     ┌──────────────┐                                 │    │
│  │                     │   Province   │  ← Top-level (no parent)        │    │
│  │                     │  (Parent)    │                                 │    │
│  │                     └──────┬───────┘                                 │    │
│  │                            │                                         │    │
│  │            ┌───────────────┼───────────────┐                        │    │
│  │            ▼               ▼               ▼                        │    │
│  │     ┌──────────┐    ┌──────────┐   ┌──────────┐                    │    │
│  │     │  PEO     │    │  Treasurer│   │  Budget  │  ← Child depts      │    │
│  │     │(Child 1) │    │(Child 2) │   │(Child 3) │                     │    │
│  │     └────┬─────┘    └──────────┘   └──────────┘                    │    │
│  │          │                                                          │    │
│  │          ▼                                                          │    │
│  │   ┌──────────┐                                                      │    │
│  │   │Maintenance│  ← Grandchild department                            │    │
│  │   │ (Sub-child)                                                     │    │
│  │   └──────────┘                                                      │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        CROSS-RELATIONSHIPS                           │    │
│  │                                                                      │    │
│  │   departments ◄──────────┐                                           │    │
│  │       │                  │ parentDepartmentId (self-reference)       │    │
│  │       │ headUserId       │                                           │    │
│  │       ▼                  │                                           │    │
│  │   users              departments                                     │    │
│  │       │                  │                                           │    │
│  │       │                  │ implementingAgencies                      │    │
│  │       │                  ▼ (via departmentId)                        │    │
│  │       └────────► implementingAgencies (when type="department")       │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Related Table | Relationship | Description |
|--------------|--------------|-------------|
| `departments` | Self-Reference (Parent) | `parentDepartmentId` creates tree structure |
| `users` | Department Head | `headUserId` references the department manager |
| `users` | Created By / Updated By | Audit trail through `createdBy` and `updatedBy` |
| `implementingAgencies` | Referenced By | Department-type agencies link back via `departmentId` |

---

## Table Schema

### Fields Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | ✅ Yes | Full department name (e.g., "Finance Department") |
| `code` | `string` | ✅ Yes | Short code/abbreviation (e.g., "FIN", "HR") |
| `description` | `optional(string)` | No | Detailed description of responsibilities |
| `parentDepartmentId` | `optional(id("departments"))` | No | Parent department for hierarchy (null = top-level) |
| `headUserId` | `optional(id("users"))` | No | Department head/manager user ID |
| `email` | `optional(string)` | No | Department contact email |
| `phone` | `optional(string)` | No | Department contact phone |
| `location` | `optional(string)` | No | Physical office location |
| `isActive` | `boolean` | ✅ Yes | Whether department is currently active |
| `displayOrder` | `optional(number)` | No | Sorting priority (lower = first) |
| `createdBy` | `id("users")` | ✅ Yes | User who created the department |
| `createdAt` | `number` | ✅ Yes | Creation timestamp (Unix ms) |
| `updatedAt` | `number` | ✅ Yes | Last update timestamp (Unix ms) |
| `updatedBy` | `optional(id("users"))` | No | User who last updated |

### Field Details

#### `name`

- **Purpose**: Official, full name of the department as it should appear in reports and UI
- **Validation Rules**:
  - Required, non-empty string
  - Recommended format: Descriptive with "Department" or "Office" suffix for clarity
  - Typical length: 10-100 characters
- **Usage Examples**:
  - `"Provincial Engineer's Office"`
  - `"Finance and Budget Department"`
  - `"Human Resources and Administration Office"`
  - `"Planning and Development Office"`
- **UI Application**: Full display name in tables, reports, and official documents

#### `code`

- **Purpose**: Short, unique identifier for quick reference and categorization
- **Validation Rules**:
  - Required, typically 2-10 characters
  - Recommended: uppercase abbreviations
  - Should be unique (enforced at application level)
- **Usage Examples**:
  - `"PEO"` - Provincial Engineer's Office
  - `"FIN"` - Finance Department
  - `"HR"` - Human Resources
  - `"PDAO"` - Planning and Development Office
- **UI Application**: Used in dropdowns, compact displays, cross-references

#### `description`

- **Purpose**: Comprehensive description of the department's responsibilities and scope
- **Validation Rules**: Optional, no strict limit
- **Usage Examples**:
  ```
  "Responsible for the planning, design, construction, and maintenance of 
   all provincial infrastructure projects including roads, bridges, and 
   public buildings. Manages engineering staff and coordinates with DPWH."
  ```
- **UI Application**: Tooltip information, detail views, onboarding documentation

#### `parentDepartmentId`

- **Purpose**: Establishes hierarchical parent-child relationships between departments
- **Validation Rules**:
  - Optional; null indicates top-level department
  - Must reference an existing department if provided
  - Must not create circular references
- **Hierarchy Model**:
  ```
  Level 0: parentDepartmentId = null (Top-level)
     └── Level 1: parentDepartmentId = Level0._id
            └── Level 2: parentDepartmentId = Level1._id
  ```
- **Usage Example**:
  ```typescript
  // Top-level department
  {
    name: "Provincial Government",
    code: "PROV",
    parentDepartmentId: undefined  // null/undefined = top level
  }
  
  // Child department
  {
    name: "Provincial Engineer's Office",
    code: "PEO",
    parentDepartmentId: "dep_province_001"  // References PROV
  }
  ```

#### `headUserId`

- **Purpose**: Identifies the department head/manager responsible for the unit
- **Validation Rules**:
  - Optional; some departments may not have designated heads
  - Must reference an existing user when provided
- **Business Logic**:
  - Department heads typically have approval authority for department projects
  - Used in workflow routing (e.g., "Send to Department Head for approval")
  - Displayed in org charts and contact directories
- **Query Pattern**:
  ```typescript
  // Find all departments headed by a user
  const departments = await db
    .query("departments")
    .withIndex("headUserId", q => q.eq("headUserId", userId))
    .collect();
  ```

#### `email`

- **Purpose**: Official department contact email address
- **Validation Rules**:
  - Optional
  - Should be validated as proper email format
  - Often a shared/departmental inbox rather than individual
- **Usage Examples**:
  - `"peo@province.gov.ph"`
  - `"finance@province.gov.ph"`

#### `phone`

- **Purpose**: Department contact phone number
- **Validation Rules**:
  - Optional
  - Format varies by region; store as string to preserve formatting
- **Usage Examples**:
  - `"(032) 123-4567"`
  - `"+63 32 123 4567"`

#### `location`

- **Purpose**: Physical office location/building
- **Validation Rules**: Optional string
- **Usage Examples**:
  - `"Capitol Building, 3rd Floor, Room 301"`
  - `"Provincial Engineering Compound, Brgy. Central"`
- **UI Application**: Office directories, visitor information, meeting coordination

#### `isActive`

- **Purpose**: Controls visibility and usability of the department
- **Validation Rules**: Required boolean
- **Business Logic**:
  - Inactive departments are hidden from dropdowns and selection lists
  - Existing projects/records referencing the department remain valid
  - Supports organizational restructuring without data loss
- **Cascade Consideration**: Deactivating a parent department may require evaluating child departments

#### `displayOrder`

- **Purpose**: Controls sort order in UI lists and dropdowns
- **Validation Rules**:
  - Optional number
  - Lower values appear first
  - Recommended: use increments of 10 for flexibility
- **Usage Pattern**:
  ```typescript
  // Sibling departments
  { name: "PEO", displayOrder: 10 }      // First
  { name: "Treasurer", displayOrder: 20 } // Second
  { name: "Budget", displayOrder: 30 }    // Third
  ```

#### Audit Fields (`createdBy`, `createdAt`, `updatedAt`, `updatedBy`)

- **Purpose**: Complete audit trail for compliance and accountability
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
| `name` | `["name"]` | Lookup and search by full department name |
| `code` | `["code"]` | Quick lookup by short code |
| `parentDepartmentId` | `["parentDepartmentId"]` | **Critical**: Build hierarchy trees, find children |
| `headUserId` | `["headUserId"]` | Find departments managed by a user |
| `isActive` | `["isActive"]` | Filter active/inactive departments |
| `displayOrder` | `["displayOrder"]` | Sorted display within hierarchy levels |

### Index Strategy Rationale

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMMON QUERY PATTERNS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Build Department Tree (Org Chart)                           │
│     ├── Index: parentDepartmentId                               │
│     └── Steps:                                                  │
│         1. Get all top-level (parentDepartmentId = undefined)   │
│         2. For each, recursively get children                   │
│                                                                  │
│  2. Get Child Departments                                       │
│     ├── Index: parentDepartmentId                               │
│     └── Query: .eq("parentDepartmentId", parentId)              │
│                                                                  │
│  3. Dropdown - Active Departments                               │
│     ├── Index: isActive                                         │
│     └── Query: .eq("isActive", true)                            │
│                                                                  │
│  4. Find Department by Code                                     │
│     ├── Index: code                                             │
│     └── Query: .eq("code", "PEO")                               │
│                                                                  │
│  5. Get Department Head's Departments                           │
│     ├── Index: headUserId                                       │
│     └── Query: .eq("headUserId", userId)                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Relationships

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ENTITY RELATIONSHIPS                                 │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────┐
    │                        SELF-REFERENCE (Tree)                         │
    │                                                                      │
    │    ┌─────────────┐          parentDepartmentId                       │
    │    │ departments │◄────────────────────────────────┐                │
    │    │─────────────│                                 │                │
    │    │ _id          │                                 │                │
    │    │ name         │                                 │                │
    │    │ parentDeptId─┼─────────────────────────────────┘                │
    │    └─────────────┘                                                  │
    │                                                                      │
    └─────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────┐
    │                      DEPARTMENT HEAD (User)                          │
    │                                                                      │
    │    ┌─────────────┐         headUserId                               │
    │    │ departments │──────────────────────►┌─────────────┐            │
    │    │─────────────│                       │    users    │            │
    │    │ _id          │                       │─────────────│            │
    │    │ name         │                       │ _id         │            │
    │    │ headUserId   │                       │ name        │            │
    │    └─────────────┘                       │ email       │            │
    │                                          └─────────────┘            │
    │                                                                      │
    └─────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────┐
    │                    AUDIT RELATIONSHIPS                               │
    │                                                                      │
    │    ┌─────────────┐                                                  │
    │    │ departments │                                                  │
    │    │─────────────│                                                  │
    │    │ createdBy   │──────────┐                                       │
    │    │ updatedBy   │───────┐  │                                       │
    │    └─────────────┘       │  │                                       │
    │                          ▼  ▼                                       │
    │                      ┌─────────────┐                                │
    │                      │    users    │                                │
    │                      └─────────────┘                                │
    │                                                                      │
    └─────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────┐
    │               IMPLEMENTING AGENCIES (Reverse Link)                   │
    │                                                                      │
    │    ┌─────────────┐                                                  │
    │    │ departments │                                                  │
    │    │─────────────│                                                  │
    │    │ _id ◄────────┼──┐                                              │
    │    │ name         │  │  departmentId                                 │
    │    └─────────────┘  │                                              │
    │                     │                                              │
    │                     │    ┌─────────────────────────┐               │
    │                     └───│ implementingAgencies    │               │
    │                         │─────────────────────────│               │
    │                         │ _id                     │               │
    │                         │ type: "department"      │               │
    │                         │ departmentId            │               │
    │                         └─────────────────────────┘               │
    │                                                                      │
    │    Note: One department may have zero or one implementing          │
    │          agency record (type="department").                        │
    │                                                                      │
    └─────────────────────────────────────────────────────────────────────┘
```

### Related Tables

| Table | Cardinality | Relationship Description |
|-------|-------------|-------------------------|
| `departments` (self) | 1:Many (Parent:Children) | Self-referential tree structure. A department can have multiple children; each child has exactly one parent (or none for root). |
| `users` (head) | 1:Many | A user can head multiple departments; each department has zero or one head. |
| `users` (audit) | Many:1 | Audit fields reference the creating/updating users. |
| `implementingAgencies` | 1:0..1 | A department may be linked to an implementing agency record (when `type="department"`). Not all departments need to be implementing agencies. |

### Foreign Key Constraints

Convex does not enforce foreign key constraints at the database level. Application-level enforcement is required:

```typescript
// Validation when creating/updating department

// 1. Prevent circular references in hierarchy
async function wouldCreateCycle(
  db: DatabaseReader,
  departmentId: Id<"departments">,
  newParentId: Id<"departments">
): Promise<boolean> {
  let currentId: Id<"departments"> | null = newParentId;
  while (currentId) {
    if (currentId === departmentId) return true; // Cycle detected
    const parent = await db.get(currentId);
    currentId = parent?.parentDepartmentId ?? null;
  }
  return false;
}

// 2. Verify head user exists
if (headUserId) {
  const user = await db.get(headUserId);
  if (!user) {
    throw new Error("Department head user not found");
  }
}

// 3. Verify parent department exists
if (parentDepartmentId) {
  const parent = await db.get(parentDepartmentId);
  if (!parent) {
    throw new Error("Parent department not found");
  }
}
```

---

## Usage Patterns

### Common Queries

#### 1. Get Department Tree (Full Hierarchy)

```typescript
// Build complete org chart
async function getDepartmentTree(db: DatabaseReader) {
  // Get all departments
  const allDepts = await db.query("departments").collect();
  
  // Build tree structure
  const deptMap = new Map(allDepts.map(d => [d._id, { ...d, children: [] }]));
  const roots: DepartmentNode[] = [];
  
  for (const dept of allDepts) {
    const node = deptMap.get(dept._id)!;
    if (dept.parentDepartmentId) {
      const parent = deptMap.get(dept.parentDepartmentId);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  }
  
  // Sort each level by displayOrder
  function sortLevel(nodes: DepartmentNode[]) {
    nodes.sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
    nodes.forEach(n => sortLevel(n.children));
  }
  sortLevel(roots);
  
  return roots;
}
```

#### 2. Get Department with Head Details

```typescript
// Fetch department and resolve head user
const department = await db.get(departmentId);
let headUser = null;
if (department?.headUserId) {
  headUser = await db.get(department.headUserId);
}
return { 
  ...department, 
  head: headUser ? { 
    _id: headUser._id, 
    name: headUser.name, 
    email: headUser.email 
  } : null 
};
```

#### 3. Get Child Departments

```typescript
// Direct children only
const children = await db
  .query("departments")
  .withIndex("parentDepartmentId", q => 
    q.eq("parentDepartmentId", parentId)
  )
  .order("asc")
  .collect();
```

#### 4. Get All Descendants (Recursive)

```typescript
// All children, grandchildren, etc.
async function getAllDescendants(
  db: DatabaseReader, 
  parentId: Id<"departments">
): Promise<Doc<"departments">[]> {
  const descendants: Doc<"departments">[] = [];
  const toProcess = [parentId];
  
  while (toProcess.length > 0) {
    const currentId = toProcess.shift()!;
    const children = await db
      .query("departments")
      .withIndex("parentDepartmentId", q => 
        q.eq("parentDepartmentId", currentId)
      )
      .collect();
    
    descendants.push(...children);
    toProcess.push(...children.map(c => c._id));
  }
  
  return descendants;
}
```

#### 5. Get Department Path (Breadcrumbs)

```typescript
// Get full path from root to department
async function getDepartmentPath(
  db: DatabaseReader,
  departmentId: Id<"departments">
): Promise<Doc<"departments">[]> {
  const path: Doc<"departments">[] = [];
  let currentId: Id<"departments"> | null = departmentId;
  
  while (currentId) {
    const dept = await db.get(currentId);
    if (!dept) break;
    path.unshift(dept);
    currentId = dept.parentDepartmentId ?? null;
  }
  
  return path;
}
// Result: [Root Dept, ..., Parent Dept, Target Dept]
```

#### 6. Active Departments for Dropdown

```typescript
const activeDepts = await db
  .query("departments")
  .withIndex("isActive", q => q.eq("isActive", true))
  .order("asc")
  .take(100);
```

### Best Practices

1. **Prevent Circular References**: Always validate that a department cannot be its own ancestor
2. **Handle Orphaned Children**: When deactivating a parent, consider the impact on children
3. **Use Transactions for Moves**: When changing `parentDepartmentId`, ensure atomic updates
4. **Cache Tree Structure**: Department hierarchies change infrequently; cache client-side
5. **Soft Delete Pattern**: Use `isActive` rather than hard deletion to preserve history
6. **Validate Code Uniqueness**: Enforce at application level (Convex doesn't support unique constraints)
7. **Maintain Display Order**: Keep sibling departments ordered for consistent UI

### Code Examples

#### Creating a Department

```typescript
// convex/departments.ts
export const create = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    parentDepartmentId: v.optional(v.id("departments")),
    headUserId: v.optional(v.id("users")),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Validate code uniqueness
    const existing = await ctx.db
      .query("departments")
      .withIndex("code", q => q.eq("code", args.code))
      .first();
    if (existing) throw new Error("Department code already exists");
    
    // Validate parent exists
    if (args.parentDepartmentId) {
      const parent = await ctx.db.get(args.parentDepartmentId);
      if (!parent) throw new Error("Parent department not found");
    }
    
    // Validate head user exists
    if (args.headUserId) {
      const head = await ctx.db.get(args.headUserId);
      if (!head) throw new Error("Department head user not found");
    }
    
    return await ctx.db.insert("departments", {
      ...args,
      isActive: true,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
```

#### Moving a Department in Hierarchy

```typescript
export const moveDepartment = mutation({
  args: {
    departmentId: v.id("departments"),
    newParentId: v.optional(v.id("departments")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const dept = await ctx.db.get(args.departmentId);
    if (!dept) throw new Error("Department not found");
    
    // Prevent moving to self
    if (args.newParentId === args.departmentId) {
      throw new Error("Cannot move department under itself");
    }
    
    // Prevent circular reference
    if (args.newParentId) {
      let currentId: Id<"departments"> | null = args.newParentId;
      while (currentId) {
        if (currentId === args.departmentId) {
          throw new Error("Cannot create circular reference in department hierarchy");
        }
        const parent = await ctx.db.get(currentId);
        currentId = parent?.parentDepartmentId ?? null;
      }
      
      // Verify new parent exists
      const newParent = await ctx.db.get(args.newParentId);
      if (!newParent) throw new Error("New parent department not found");
    }
    
    return await ctx.db.patch(args.departmentId, {
      parentDepartmentId: args.newParentId,
      updatedAt: Date.now(),
      updatedBy: userId,
    });
  },
});
```

#### Getting Department with Implementing Agency

```typescript
export const getWithAgency = query({
  args: { id: v.id("departments") },
  handler: async (ctx, args) => {
    const dept = await ctx.db.get(args.id);
    if (!dept) return null;
    
    // Check if this department has an implementing agency record
    const agency = await ctx.db
      .query("implementingAgencies")
      .withIndex("departmentId", q => q.eq("departmentId", args.id))
      .first();
    
    // Get head user details
    let head = null;
    if (dept.headUserId) {
      const headUser = await ctx.db.get(dept.headUserId);
      if (headUser) {
        head = {
          _id: headUser._id,
          name: headUser.name,
          email: headUser.email,
        };
      }
    }
    
    return {
      ...dept,
      head,
      implementingAgency: agency ? {
        _id: agency._id,
        code: agency.code,
        isActive: agency.isActive,
      } : null,
    };
  },
});
```

---

## Business Logic

### State Management

```
┌─────────────────────────────────────────────────────────────────┐
│                  DEPARTMENT STATE LIFECYCLE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐                 │
│   │  DRAFT   │───►│  ACTIVE  │───►│ INACTIVE │                 │
│   │ (create) │    │ (usable) │    │(archived)│                 │
│   └──────────┘    └────┬─────┘    └──────────┘                 │
│                        │                                        │
│                        ▼                                        │
│                   ┌──────────┐                                  │
│                   │  HAS     │                                  │
│                   │ CHILDREN │                                  │
│                   └────┬─────┘                                  │
│                        │                                        │
│                        ▼                                        │
│                   ┌──────────┐                                  │
│                   │ LINKED   │                                  │
│                   │  AGENCY  │ (via implementingAgencies)       │
│                   └──────────┘                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Validation Rules

| Rule | Enforcement | Error Message |
|------|-------------|---------------|
| Code uniqueness | Application | "Department code '{code}' already exists" |
| Parent department exists | Application | "Parent department not found" |
| No circular references | Application | "Cannot create circular reference in department hierarchy" |
| Head user exists | Application | "Department head user not found" |
| Cannot be own parent | Application | "Cannot move department under itself" |
| Active parent recommended | Warning | "Parent department is inactive" |

### Special Behaviors

1. **Hierarchy Consistency**: Moving a department automatically moves its entire subtree
2. **Cascade Considerations**: 
   - Deactivating a department does NOT automatically deactivate children
   - Deleting (if allowed) should consider impact on implementing agencies
3. **Agency Sync**: When department details change, consider if implementing agency should be updated
4. **Display Order Scope**: `displayOrder` is typically meaningful only among siblings (same parent)

---

## Migration & Data Integrity

### Creating Records

```typescript
interface CreateDepartmentInput {
  name: string;              // Required
  code: string;              // Required, unique
  description?: string;      // Optional
  parentDepartmentId?: Id<"departments">;  // Optional
  headUserId?: Id<"users">;  // Optional
  email?: string;            // Optional
  phone?: string;            // Optional
  location?: string;         // Optional
  displayOrder?: number;     // Optional
}

// Steps:
// 1. Validate required fields
// 2. Check code uniqueness
// 3. Verify parent exists (if provided)
// 4. Verify head user exists (if provided)
// 5. Set defaults: isActive=true
// 6. Set audit fields
// 7. Insert record
```

### Updating Records

```typescript
interface UpdateDepartmentInput {
  id: Id<"departments">;
  name?: string;
  code?: string;             // Check uniqueness if changed
  description?: string;
  parentDepartmentId?: Id<"departments">;  // Check for cycles
  headUserId?: Id<"users">;
  email?: string;
  phone?: string;
  location?: string;
  isActive?: boolean;
  displayOrder?: number;
}

// Steps:
// 1. Fetch existing record
// 2. Validate changes
// 3. If parent changes, check for circular reference
// 4. If code changes, check uniqueness
// 5. Update updatedAt and updatedBy
// 6. Patch record
```

### Soft Deletion Pattern

```typescript
export const deactivate = mutation({
  args: { id: v.id("departments") },
  handler: async (ctx, args) => {
    const dept = await ctx.db.get(args.id);
    if (!dept) throw new Error("Department not found");
    
    // Check for active children (warning only)
    const activeChildren = await ctx.db
      .query("departments")
      .withIndex("parentDepartmentId", q => 
        q.eq("parentDepartmentId", args.id)
      )
      .filter(q => q.eq(q.field("isActive"), true))
      .collect();
    
    if (activeChildren.length > 0) {
      // Log warning or require confirmation
      console.warn(`Deactivating department with ${activeChildren.length} active children`);
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

### Data Integrity Checks

```typescript
// Admin function to validate department hierarchy integrity
export const validateHierarchy = query({
  args: {},
  handler: async (ctx) => {
    const issues: string[] = [];
    const allDepts = await ctx.db.query("departments").collect();
    const deptIds = new Set(allDepts.map(d => d._id));
    
    for (const dept of allDepts) {
      // Check parent exists
      if (dept.parentDepartmentId && !deptIds.has(dept.parentDepartmentId)) {
        issues.push(`Department ${dept.code} references non-existent parent`);
      }
      
      // Check for cycles
      const visited = new Set<string>();
      let currentId: Id<"departments"> | null = dept.parentDepartmentId ?? null;
      while (currentId) {
        if (visited.has(currentId)) {
          issues.push(`Cycle detected involving ${dept.code}`);
          break;
        }
        visited.add(currentId);
        const parent = allDepts.find(d => d._id === currentId);
        currentId = parent?.parentDepartmentId ?? null;
      }
    }
    
    return { isValid: issues.length === 0, issues };
  },
});
```

---

## TypeScript Types

### Generated Types

From Convex, the following types are generated:

```typescript
// convex/_generated/dataModel.d.ts
export type Doc<"departments"> = {
  _id: Id<"departments">;
  _creationTime: number;
  name: string;
  code: string;
  description?: string;
  parentDepartmentId?: Id<"departments">;
  headUserId?: Id<"users">;
  email?: string;
  phone?: string;
  location?: string;
  isActive: boolean;
  displayOrder?: number;
  createdBy: Id<"users">;
  createdAt: number;
  updatedAt: number;
  updatedBy?: Id<"users">;
};
```

### Custom Types for UI

```typescript
// types/departments.ts

import { Doc, Id } from "@/convex/_generated/dataModel";

// Base type from Convex
export type Department = Doc<"departments">;

// Tree node for hierarchy display
export interface DepartmentNode extends Department {
  children: DepartmentNode[];
  level: number;  // Depth in tree (0 = root)
}

// Flattened with path info
export interface DepartmentWithPath extends Department {
  path: { _id: Id<"departments">; name: string; code: string }[];
  level: number;
}

// Extended with resolved relations
export interface DepartmentWithRelations extends Department {
  parent?: Department | null;
  children?: Department[];
  head?: {
    _id: Id<"users">;
    name: string;
    email: string;
  } | null;
  implementingAgency?: {
    _id: Id<"implementingAgencies">;
    code: string;
    isActive: boolean;
  } | null;
}

// Form input types
export interface CreateDepartmentFormData {
  name: string;
  code: string;
  description?: string;
  parentDepartmentId?: string;
  headUserId?: string;
  email?: string;
  phone?: string;
  location?: string;
  displayOrder?: number;
}

// Dropdown option
export interface DepartmentOption {
  value: Id<"departments">;
  label: string;
  code: string;
  level: number;  // For indentation
}

// Breadcrumb item
export interface DepartmentBreadcrumb {
  _id: Id<"departments">;
  name: string;
  code: string;
}
```

### Usage in Components

```typescript
// components/departments/DepartmentSelect.tsx
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function DepartmentSelect({ 
  value, 
  onChange, 
  includeInactive = false,
  excludeIds = [] 
}: DepartmentSelectProps) {
  const departments = useQuery(api.departments.listTree, {
    includeInactive,
  });
  
  // Flatten tree for select options
  const options: DepartmentOption[] = [];
  function flatten(nodes: DepartmentNode[], level = 0) {
    for (const node of nodes) {
      if (!excludeIds.includes(node._id)) {
        options.push({
          value: node._id,
          label: `${"  ".repeat(level)}${node.code} - ${node.name}`,
          code: node.code,
          level,
        });
        flatten(node.children, level + 1);
      }
    }
  }
  if (departments) flatten(departments);
  
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select department..." />
      </SelectTrigger>
      <SelectContent>
        {options.map(opt => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

#### Department Tree Component

```typescript
// components/departments/DepartmentTree.tsx
interface DepartmentTreeProps {
  departments: DepartmentNode[];
  onSelect?: (dept: Department) => void;
  selectedId?: Id<"departments">;
}

export function DepartmentTree({ departments, onSelect, selectedId }: DepartmentTreeProps) {
  return (
    <ul className="space-y-1">
      {departments.map(dept => (
        <DepartmentTreeNode
          key={dept._id}
          department={dept}
          onSelect={onSelect}
          selectedId={selectedId}
        />
      ))}
    </ul>
  );
}

function DepartmentTreeNode({ department, onSelect, selectedId }: NodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = department.children.length > 0;
  const isSelected = department._id === selectedId;
  
  return (
    <li>
      <div 
        className={cn(
          "flex items-center gap-2 p-2 rounded cursor-pointer",
          isSelected && "bg-primary/10",
          !department.isActive && "opacity-50"
        )}
        onClick={() => onSelect?.(department)}
      >
        {hasChildren && (
          <button 
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="p-1 hover:bg-muted rounded"
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
        {!hasChildren && <span className="w-6" />}
        <Building size={16} className="text-muted-foreground" />
        <span className="font-medium">{department.code}</span>
        <span className="text-muted-foreground">-</span>
        <span>{department.name}</span>
        {!department.isActive && (
          <Badge variant="secondary" className="ml-auto">Inactive</Badge>
        )}
      </div>
      
      {hasChildren && expanded && (
        <ul className="ml-6 mt-1 space-y-1">
          {department.children.map(child => (
            <DepartmentTreeNode
              key={child._id}
              department={child}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
```

---

## See Also

- **[Implementing Agencies Schema](./implementing-agencies-schema.md)** - Related table for agency representation
- **[Implementing Agencies Architecture](../plan/implementing-agencies-architecture.md)** - Component and data flow documentation
- **[Table System Documentation](./table-system/README.md)** - UI table patterns for department management
- **[Trash Hierarchy System](../02-feature-modules/trash-hierarchy-system.md)** - Soft deletion patterns in the system

---

*Last Updated: February 2026*  
*Schema Version: 1.0*  
*Maintainer: Technical Documentation Team*
