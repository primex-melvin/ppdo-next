# Access Control & RBAC

> Role-Based Access Control system for PPDO Dashboard

---

## Overview

PPDO Dashboard implements a hierarchical RBAC (Role-Based Access Control) system:

```
┌─────────────────────────────────────────────────────────┐
│                    ROLE HIERARCHY                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│    ┌─────────────┐                                      │
│    │ super_admin │  ← Full system access                │
│    └──────┬──────┘                                      │
│           │                                             │
│    ┌──────▼──────┐                                      │
│    │    admin    │  ← Department-level admin            │
│    └──────┬──────┘                                      │
│           │                                             │
│    ┌──────▼──────┐                                      │
│    │     user    │  ← Standard user (create, edit own)  │
│    └──────┬──────┘                                      │
│           │                                             │
│    ┌──────▼──────┐                                      │
│    │  inspector  │  ← External inspector (separate app) │
│    └─────────────┘                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## User Roles

### super_admin
**Description:** System administrator with unrestricted access.

**Permissions:**
- Full CRUD on all data
- User management (all roles)
- System settings
- Department management
- Delete any record
- Access all modules

**Typical Users:**
- IT Administrator
- System Manager

### admin
**Description:** Department administrator with elevated permissions.

**Permissions:**
- CRUD on department data
- User management (user and inspector roles only)
- Cannot delete super_admin users
- Cannot modify system settings
- Full access to assigned department

**Typical Users:**
- Department Head
- Planning Officer

### user
**Description:** Standard department user with limited permissions.

**Permissions:**
- Create new records
- Edit own records
- View all records in department
- Cannot delete records
- Cannot manage users

**Typical Users:**
- Planning Assistant
- Project Officer
- Regular Staff

### inspector
**Description:** External inspector with read-only access to specific projects.

**Permissions:**
- View assigned projects only
- Add inspection reports
- Upload inspection photos
- Cannot access dashboard (redirected to /inspector)

**Typical Users:**
- External Auditor
- COA Inspector
- Provincial Inspector

---

## Permission Matrix

### Dashboard Access
| Module | super_admin | admin | user | inspector |
|--------|-------------|-------|------|-----------|
| Dashboard Landing | ✅ | ✅ | ✅ | ❌ (→ /inspector) |
| Personal KPI | ✅ | ✅ | ✅ | ❌ |

### Projects Module
| Action | super_admin | admin | user | inspector |
|--------|-------------|-------|------|-----------|
| View Budget Items | ✅ | ✅ | ✅ | ❌ |
| Create Budget Item | ✅ | ✅ | ❌ | ❌ |
| Edit Budget Item | ✅ | ✅ | ❌ | ❌ |
| Delete Budget Item | ✅ | ✅ | ❌ | ❌ |
| Create Project | ✅ | ✅ | ✅ | ❌ |
| Edit Project | ✅ | ✅ | ✅ | ❌ |
| Delete Project | ✅ | ✅ | ❌ | ❌ |
| View Breakdowns | ✅ | ✅ | ✅ | ❌ |
| Create Breakdown | ✅ | ✅ | ✅ | ❌ |
| Edit Breakdown | ✅ | ✅ | ✅ | ❌ |
| Delete Breakdown | ✅ | ✅ | ❌ | ❌ |

### Particulars Module
| Action | super_admin | admin | user | inspector |
|--------|-------------|-------|------|-----------|
| View Particulars | ✅ | ✅ | ✅ | ❌ |
| Create Particular | ✅ | ✅ | ❌ | ❌ |
| Edit Particular | ✅ | ✅ | ❌ | ❌ |
| Delete Particular | ✅ | ✅ | ❌ | ❌ |

### Funds Modules
| Module | super_admin | admin | user | inspector |
|--------|-------------|-------|------|-----------|
| Trust Funds | ✅ | ✅ | ✅ | ❌ |
| Special Education Funds | ✅ | ✅ | ✅ | ❌ |
| Special Health Funds | ✅ | ✅ | ✅ | ❌ |
| 20% Development Fund | ✅ | ✅ | ✅ | ❌ |
| Create Fund Item | ✅ | ✅ | ❌ | ❌ |
| Edit Fund Item | ✅ | ✅ | ❌ | ❌ |
| Delete Fund Item | ✅ | ✅ | ❌ | ❌ |

### Settings Module
| Feature | super_admin | admin | user | inspector |
|---------|-------------|-------|------|-----------|
| User Management | ✅ | ✅ (limited) | ❌ | ❌ |
| Password Reset Mgmt | ✅ | ✅ | ❌ | ❌ |
| View Changelogs | ✅ | ✅ | ✅ | ❌ |
| Submit Bugs | ✅ | ✅ | ✅ | ❌ |
| Manage Bugs | ✅ | ✅ | ❌ | ❌ |
| Submit Suggestions | ✅ | ✅ | ✅ | ❌ |
| Manage Suggestions | ✅ | ✅ | ❌ | ❌ |

---

## Implementation

### 1. Dashboard Layout Guard
```typescript
// app/dashboard/layout.tsx

useEffect(() => {
  if (isLoading) return;

  if (!isAuthenticated) {
    router.replace("/signin");
    return;
  }

  // Inspector users should be redirected to /inspector
  if (currentUser.role === "inspector") {
    router.replace("/inspector");
    return;
  }

  // User role can access dashboard
}, [isAuthenticated, isLoading, currentUser, router]);
```

### 2. useBudgetAccess Hook
```typescript
// app/dashboard/project/[year]/components/hooks/useBudgetAccess.ts

export function useBudgetAccess() {
  const { user, isLoading: isUserLoading } = useCurrentUser();
  
  const accessCheck = useQuery(
    api.access.checkBudgetAccess,
    user ? { userId: user._id } : "skip"
  );

  const canAccess = accessCheck?.granted ?? false;
  const canCreate = user?.role === "super_admin" || user?.role === "admin";
  const canEdit = canCreate;
  const canDelete = canCreate;

  return {
    accessCheck,
    canAccess,
    canCreate,
    canEdit,
    canDelete,
    isLoading: isUserLoading || accessCheck === undefined,
  };
}
```

### 3. Component-Level Permission
```typescript
// Button only visible to admins
{canCreate && (
  <Button onClick={handleCreate}>
    Add Budget Item
  </Button>
)}

// Action menu with conditional items
<DropdownMenu>
  <DropdownMenuItem onClick={handleView}>
    View
  </DropdownMenuItem>
  {canEdit && (
    <DropdownMenuItem onClick={handleEdit}>
      Edit
    </DropdownMenuItem>
  )}
  {canDelete && (
    <DropdownMenuItem onClick={handleDelete}>
      Delete
    </DropdownMenuItem>
  )}
</DropdownMenu>
```

### 4. Server-Side Validation (Convex)
```typescript
// convex/budgetItems.ts

export const remove = mutation({
  args: { id: v.id("budgetItems") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    // Check permission
    if (user.role !== "super_admin" && user.role !== "admin") {
      throw new Error("Unauthorized: Only admins can delete budget items");
    }
    
    await ctx.db.delete(args.id);
  },
});
```

---

## Access Denied Page

```typescript
// components/AccessDeniedPage.tsx

interface AccessDeniedPageProps {
  userName: string;
  userEmail: string;
  departmentName: string;
  pageRequested: string;
}

export default function AccessDeniedPage(props) {
  return (
    <div className="max-w-2xl mx-auto mt-8">
      <Alert variant="destructive">
        <Lock className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You don't have permission to access {props.pageRequested}.
          Contact your administrator for access.
        </AlertDescription>
      </Alert>
    </div>
  );
}
```

---

## Department-Based Access

### Concept
Users can be assigned to departments, restricting their access to department-specific data.

### Implementation
```typescript
// Check if user can access specific department data
const canAccessDepartment = (
  user: User,
  targetDepartmentId: string
) => {
  // Super admin can access all departments
  if (user.role === "super_admin") return true;
  
  // Admin can access their department
  if (user.role === "admin") {
    return user.departmentId === targetDepartmentId;
  }
  
  // Regular user can only access their department
  return user.departmentId === targetDepartmentId;
};
```

---

## Inspector Portal

### Separate Route
Inspectors are redirected to a separate application:

```
/inspector          # Inspector portal
/dashboard/*        # Main dashboard (inspectors blocked)
```

### Inspector Features
- View assigned projects only
- Submit inspection reports
- Upload photos
- View inspection history

---

## Permission Hooks

### useCurrentUser
```typescript
// app/hooks/useCurrentUser.ts

export function useCurrentUser() {
  const user = useQuery(api.auth.getCurrentUser);
  
  return {
    user,
    isLoading: user === undefined,
    isSuperAdmin: user?.role === "super_admin",
    isAdmin: user?.role === "admin" || user?.role === "super_admin",
    isUser: user?.role === "user",
    isInspector: user?.role === "inspector",
  };
}
```

### useParticularPermissions
```typescript
// app/dashboard/particulars/_hooks/useParticularPermissions.ts

export function useParticularPermissions() {
  const { user } = useCurrentUser();
  
  const canView = user?.role !== "inspector";
  const canManage = user?.role === "super_admin" || user?.role === "admin";
  
  return { canView, canManage };
}
```

---

## Audit Trail

### Tracking Changes
```typescript
// convex/lib/activityLogger.ts

export async function logActivity(ctx, {
  action,
  entityType,
  entityId,
  oldValue,
  newValue,
  userId,
}) {
  await ctx.db.insert("activityLogs", {
    action,           // "create", "update", "delete"
    entityType,       // "budgetItems", "projects", etc.
    entityId,
    oldValue,
    newValue,
    userId,
    timestamp: Date.now(),
  });
}
```

### Usage in Mutations
```typescript
export const update = mutation({
  args: { id: v.id("budgetItems"), ... },
  handler: async (ctx, args) => {
    const oldValue = await ctx.db.get(args.id);
    const result = await ctx.db.patch(args.id, args);
    
    await logActivity(ctx, {
      action: "update",
      entityType: "budgetItems",
      entityId: args.id,
      oldValue,
      newValue: args,
      userId: (await getCurrentUser(ctx))._id,
    });
    
    return result;
  },
});
```

---

## Best Practices

1. **Always validate on server** - Client checks are for UX only
2. **Use least privilege** - Grant minimum necessary permissions
3. **Log access violations** - Track unauthorized attempts
4. **Regular audits** - Review user permissions periodically
5. **Department isolation** - Ensure data isolation between departments

---

## Related Documentation

- [Module: Settings](./07-module-settings.md) - User management
- [Data Flow & Convex](./08-data-flow.md) - Backend validation
