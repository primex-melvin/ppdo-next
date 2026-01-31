# Module: Settings

> Documentation for Settings, User Management, and Updates

---

## Overview

The Settings module provides administrative functions for system configuration:

| Sub-module | Description |
|------------|-------------|
| **User Management** | CRUD operations for users, departments, password resets |
| **Updates** | System updates, changelogs, bug reports, suggestions |

---

## Route Structure

```
/dashboard/settings
├── /user-management
│   ├── page.tsx                    # User list and CRUD
│   └── password-reset-management   # Pending password resets
├── /updates
│   ├── page.tsx                    # Updates hub
│   ├── /changelogs
│   │   └── page.tsx                # Version history
│   ├── /bugs-report
│   │   ├── page.tsx                # Bug reports list
│   │   └── [id]/page.tsx           # Bug detail
│   └── /suggestions
│       ├── page.tsx                # Suggestions list
│       └── [id]/page.tsx           # Suggestion detail
```

---

## User Management

### Route
`/dashboard/settings/user-management`

### File Structure
```
settings/user-management/
├── page.tsx                          # Main user management page
├── components/
│   ├── UserModal.tsx                 # Create/Edit user modal
│   ├── UserDeleteDialog.tsx          # Delete confirmation
│   ├── UserFilters.tsx               # Filter controls
│   ├── UserActions.tsx               # Action buttons
│   ├── UserRoleBadge.tsx             # Role display badge
│   ├── UserStatusBadge.tsx           # Status display badge
│   └── DepartmentModal.tsx           # Department CRUD modal
└── hooks/
    ├── useUserManagement.ts          # User CRUD logic
    ├── useUserFilters.ts             # Filtering logic
    └── useDepartmentManagement.ts    # Department CRUD logic
```

### Features

#### User CRUD
- **Create User**: Add new users with role assignment
- **Read**: List all users with pagination
- **Update**: Edit user details, change role/status
- **Delete**: Soft or hard delete users

#### User Roles
```typescript
type UserRole = "super_admin" | "admin" | "user" | "inspector";
```

#### User Status
```typescript
type UserStatus = "active" | "inactive" | "suspended" | "pending";
```

#### Filters
- Search by name/email
- Filter by role
- Filter by department
- Filter by status

#### Pagination
```typescript
const ITEMS_PER_PAGE = 10;
const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
```

---

## Password Reset Management

### Route
`/dashboard/settings/user-management/password-reset-management`

### Features
- View pending password reset requests
- Approve/reject reset requests
- Reset password for users
- Track reset history

---

## Updates Module

### Route Structure
```
/dashboard/settings/updates           # Updates hub
/dashboard/settings/updates/changelogs
/dashboard/settings/updates/bugs-report
/dashboard/settings/updates/bugs-report/[id]
/dashboard/settings/updates/suggestions
/dashboard/settings/updates/suggestions/[id]
```

### Components
```
settings/updates/
├── page.tsx
├── layout.tsx
├── context/
│   └── UpdatesContext.tsx
├── bugs-report/
│   ├── page.tsx
│   └── [id]/page.tsx
├── changelogs/
│   └── page.tsx
└── suggestions/
    ├── page.tsx
    └── [id]/page.tsx
```

### Updates Hub
Central page showing:
- Latest changelog
- Recent bug reports
- Recent suggestions
- Quick action buttons

### Changelogs
Version history and release notes.

**Features:**
- Version numbering (semver)
- Release dates
- Feature list
- Bug fixes
- Breaking changes

### Bug Reports
User-submitted bug reports with status tracking.

**Status Values:**
```typescript
type BugStatus = "open" | "in_progress" | "resolved" | "closed" | "rejected";
```

**Priority Levels:**
```typescript
type BugPriority = "low" | "medium" | "high" | "critical";
```

**Features:**
- Submit new bug report
- View all reports
- Filter by status/priority
- Add comments
- Status updates
- Assign to developers

### Suggestions
User feature requests and suggestions.

**Status Values:**
```typescript
type SuggestionStatus = "pending" | "under_review" | "accepted" | "implemented" | "rejected";
```

**Features:**
- Submit suggestions
- Vote on suggestions
- Comment threads
- Status tracking

---

## Badge System

Sidebar shows badges for pending items:

```typescript
// components/sidebar/badges/UpdatesBadges.tsx

// BugsBadge - Shows count of open bugs
const openBugs = useQuery(api.bugs.getOpenCount);

// SuggestionsBadge - Shows count of pending suggestions
const pendingSuggestions = useQuery(api.suggestions.getPendingCount);
```

---

## Permission Matrix

| Feature | super_admin | admin | user | inspector |
|---------|-------------|-------|------|-----------|
| View User List | ✅ | ✅ | ❌ | ❌ |
| Create User | ✅ | ✅ | ❌ | ❌ |
| Edit User | ✅ | ✅ | ❌ | ❌ |
| Delete User | ✅ | ❌ | ❌ | ❌ |
| Manage Departments | ✅ | ✅ | ❌ | ❌ |
| Password Reset Mgmt | ✅ | ✅ | ❌ | ❌ |
| View Changelogs | ✅ | ✅ | ✅ | ❌ |
| Submit Bugs | ✅ | ✅ | ✅ | ❌ |
| Manage Bugs | ✅ | ✅ | ❌ | ❌ |
| Submit Suggestions | ✅ | ✅ | ✅ | ❌ |
| Manage Suggestions | ✅ | ✅ | ❌ | ❌ |

---

## Data Types

### User
```typescript
interface User {
  _id: Id<"users">;
  _creationTime: number;
  email: string;
  name: string;
  role: UserRole;
  departmentId?: Id<"departments">;
  status: UserStatus;
  emailVerified?: boolean;
  image?: string;
}
```

### Department
```typescript
interface Department {
  _id: Id<"departments">;
  _creationTime: number;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}
```

### Bug Report
```typescript
interface BugReport {
  _id: Id<"bugReports">;
  _creationTime: number;
  title: string;
  description: string;
  status: BugStatus;
  priority: BugPriority;
  reportedBy: Id<"users">;
  assignedTo?: Id<"users">;
  screenshots?: string[];
  comments: BugComment[];
}
```

### Suggestion
```typescript
interface Suggestion {
  _id: Id<"suggestions">;
  _creationTime: number;
  title: string;
  description: string;
  status: SuggestionStatus;
  submittedBy: Id<"users">;
  votes: number;
  comments: SuggestionComment[];
}
```

---

## Convex API Endpoints

### Users
```typescript
// Queries
api.users.list
api.users.getById
api.users.getByEmail
api.users.getByDepartment

// Mutations
api.users.create
api.users.update
api.users.updateStatus
api.users.remove
```

### Departments
```typescript
// Queries
api.departments.list
api.departments.getById

// Mutations
api.departments.create
api.departments.update
api.departments.remove
```

### Bug Reports
```typescript
// Queries
api.bugs.list
api.bugs.getById
api.bugs.getOpenCount

// Mutations
api.bugs.create
api.bugs.update
api.bugs.updateStatus
api.bugs.addComment
```

### Suggestions
```typescript
// Queries
api.suggestions.list
api.suggestions.getById
api.suggestions.getPendingCount

// Mutations
api.suggestions.create
api.suggestions.update
api.suggestions.vote
api.suggestions.addComment
```

---

## Settings Components

### Settings Layout
Simple pass-through layout:
```typescript
// settings/layout.tsx
export default function Layout({ children }) {
  return <>{children}</>;
}
```

### Updates Context
Provides shared state for updates module:
```typescript
// settings/context/UpdatesContext.tsx
interface UpdatesContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  refreshData: () => void;
}
```

---

## Related Documentation

- [Access Control & RBAC](./09-access-control.md) - Detailed permissions
- [Data Flow & Convex](./08-data-flow.md) - Backend integration
