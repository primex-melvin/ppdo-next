# Inspection System Documentation

## Overview

The Inspection System is a comprehensive module within the PPDO (Provincial Planning and Development Office) Next application that enables users to create, manage, and track project inspections. It includes features for photo documentation, status tracking, remarks/commentary, and detailed reporting.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Inspection Lifecycle](#inspection-lifecycle)
4. [API Reference](#api-reference)
5. [Frontend Components](#frontend-components)
6. [Media & Image Handling](#media--image-handling)
7. [Remarks System](#remarks-system)
8. [Data Flow](#data-flow)
9. [Security & Access Control](#security--access-control)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        INSPECTION SYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Schema     │  │   Convex     │  │    Frontend          │  │
│  │   Layer      │  │   Backend    │  │    Components        │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│         ▼                 ▼                      ▼              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Data Relationships                     │  │
│  │  Project → Inspections → Images/Remarks                   │  │
│  │  BudgetItem → Inspections                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Relationships

- **Project** → Has many **Inspections**
- **Inspection** → Has many **Images** (via uploadSession)
- **Inspection** → Has many **Remarks**
- **BudgetItem** → Can have linked **Inspections**

---

## Database Schema

### Inspections Table

**Location:** `convex/schema/inspections.ts`

```typescript
{
  // Core Fields
  projectId: Id<"projects">;           // Parent project reference
  budgetItemId?: Id<"budgetItems">;    // Optional budget item link
  
  // Inspection Details
  programNumber: string;                // Program identifier
  title: string;                        // Inspection title
  category: string;                     // Category classification
  inspectionDate: number;               // Unix timestamp
  remarks: string;                      // Detailed remarks
  status: "completed" | "in_progress" | "pending" | "cancelled";
  
  // Media
  uploadSessionId?: Id<"uploadSessions">;  // Links to image gallery
  
  // Analytics
  viewCount: number;                    // Number of times viewed
  
  // Metadata
  metadata?: string;                    // Additional JSON metadata
  
  // Audit Fields
  createdBy: Id<"users">;
  createdAt: number;
  updatedAt: number;
  updatedBy?: Id<"users">;
}
```

### Indexes

| Index Name | Fields | Purpose |
|------------|--------|---------|
| `projectId` | `projectId` | Query inspections by project |
| `budgetItemId` | `budgetItemId` | Query by budget item |
| `status` | `status` | Filter by status |
| `category` | `category` | Filter by category |
| `inspectionDate` | `inspectionDate` | Sort by date |
| `projectAndStatus` | `projectId`, `status` | Combined project + status queries |
| `projectAndDate` | `projectId`, `inspectionDate` | Project inspections sorted by date |
| `categoryAndStatus` | `category`, `status` | Analytics queries |

### Related Schemas

#### Media Tables (`convex/schema/media.ts`)

```typescript
// Upload Sessions - Groups images for an inspection
{
  userId: Id<"users">;
  imageCount: number;
  createdAt: number;
  caption?: string;
}

// Media Files - Individual images
{
  storageId: Id<"_storage">;       // Convex storage reference
  name: string;
  type: string;
  size: number;
  userId: Id<"users">;
  sessionId: Id<"uploadSessions">;
  orderInSession: number;          // For maintaining image order
  uploadedAt: number;
}
```

#### Remarks Table (`convex/schema/projects.ts`)

```typescript
{
  projectId: Id<"projects">;
  inspectionId?: Id<"inspections">;  // Optional: link to specific inspection
  budgetItemId?: Id<"budgetItems">;
  content: string;
  category?: string;
  priority?: "high" | "medium" | "low";
  createdBy: Id<"users">;
  createdAt: number;
  updatedAt: number;
  updatedBy: Id<"users">;
  isPinned?: boolean;
  tags?: string;
  attachments?: string;
}
```

---

## Inspection Lifecycle

### Status States

```
┌─────────┐     ┌─────────────┐     ┌───────────┐     ┌──────────┐
│  PENDING │────▶│ IN_PROGRESS │────▶│ COMPLETED │────▶│ ARCHIVED │
└────┬────┘     └─────────────┘     └─────┬─────┘     └──────────┘
     │                                      │
     └──────────────────────────────────────┘
                    Cancel (anytime)
                          │
                          ▼
                    ┌───────────┐
                    │ CANCELLED │
                    └───────────┘
```

| Status | Description |
|--------|-------------|
| `pending` | Inspection scheduled but not started |
| `in_progress` | Inspection actively being conducted |
| `completed` | Inspection finished, report submitted |
| `cancelled` | Inspection aborted or postponed indefinitely |

---

## API Reference

### Inspection Mutations (`convex/inspections.ts`)

#### `createInspection`
Creates a new inspection record.

```typescript
args: {
  projectId: Id<"projects">;
  budgetItemId?: Id<"budgetItems">;
  programNumber: string;
  title: string;
  category: string;
  inspectionDate: number;      // Unix timestamp
  remarks: string;
  status: InspectionStatus;
  uploadSessionId?: Id<"uploadSessions">;
  metadata?: string;
}
returns: Id<"inspections">
```

#### `updateInspection`
Updates an existing inspection.

```typescript
args: {
  inspectionId: Id<"inspections">;
  // All fields optional for partial updates
  programNumber?: string;
  title?: string;
  category?: string;
  inspectionDate?: number;
  remarks?: string;
  status?: InspectionStatus;
  uploadSessionId?: Id<"uploadSessions">;
  metadata?: string;
}
returns: Id<"inspections">
```

#### `deleteInspection`
Permanently removes an inspection.

```typescript
args: { inspectionId: Id<"inspections"> }
returns: { success: true }
```

#### `incrementViewCount`
Tracks inspection views for analytics.

```typescript
args: { inspectionId: Id<"inspections"> }
returns: number  // New view count
```

### Inspection Queries

#### `getInspection`
Retrieves a single inspection with enriched data.

```typescript
args: { inspectionId: Id<"inspections"> }
returns: {
  ...inspection,
  project: Project,
  budgetItem: BudgetItem | null,
  creator: User,
  images: MediaWithUrl[]   // Includes storage URLs
}
```

#### `listInspectionsByProject`
Lists all inspections for a project.

```typescript
args: {
  projectId: Id<"projects">;
  status?: InspectionStatus;  // Optional filter
}
returns: EnrichedInspection[]  // Sorted by date (newest first)
```

#### `listInspectionsByBudgetItem`
Lists inspections linked to a budget item.

```typescript
args: { budgetItemId: Id<"budgetItems"> }
returns: EnrichedInspection[]
```

#### `getProjectInspectionStats`
Returns analytics for project inspections.

```typescript
args: { projectId: Id<"projects"> }
returns: {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  cancelled: number;
  totalViews: number;
}
```

#### `searchInspections`
Full-text search across inspections.

```typescript
args: {
  searchTerm: string;
  projectId?: Id<"projects">;  // Optional scope
}
returns: Inspection[]  // Sorted by relevance
```

### Media API (`convex/media.ts`)

#### `generateUploadUrl`
Generates a signed URL for direct file upload.

```typescript
returns: string  // Upload URL
```

#### `createUploadSession`
Creates a session to group uploaded images.

```typescript
args: {
  imageCount: number;
  caption?: string;
}
returns: Id<"uploadSessions">
```

#### `saveMedia`
Saves media metadata after successful upload.

```typescript
args: {
  storageId: Id<"_storage">;
  name: string;
  type: string;
  size: number;
  sessionId: Id<"uploadSessions">;
  orderInSession: number;
}
returns: Id<"media">
```

---

## Frontend Components

### Component Architecture

```
components/ppdo/inspection/
├── index.ts                    # Public API exports
├── types/
│   └── index.ts               # TypeScript definitions
├── components/
│   ├── Card.tsx               # Base card component
│   ├── StatCard.tsx           # Statistics display
│   ├── TransactionCard.tsx    # Financial transactions
│   ├── RemarksSection.tsx     # Remarks list
│   │
│   ├── financial/             # Financial breakdown
│   │   ├── FinancialBreakdownCard.tsx
│   │   ├── FinancialBreakdownHeader.tsx
│   │   ├── FinancialBreakdownMain.tsx
│   │   ├── FinancialBreakdownTable.tsx
│   │   └── FinancialBreakdownTabs.tsx
│   │
│   ├── inspection/            # Inspection-specific
│   │   ├── InspectionsDataTable.tsx
│   │   ├── InspectionGalleryModal.tsx
│   │   ├── InspectionContextMenu.tsx
│   │   └── InspectionViewToggle.tsx
│   │
│   ├── tabs/                  # Tab content
│   │   ├── AnalyticsContent.tsx
│   │   ├── InspectionContent.tsx
│   │   ├── OverviewContent.tsx
│   │   └── RemarksContent.tsx
│   │
│   └── modals/                # Modals
│       ├── InspectionDetailsModal.tsx
│       ├── NewInspectionForm.tsx
│       └── NewRemarkModal.tsx
```

### Key Types (`components/ppdo/inspection/types/index.ts`)

```typescript
// Core Inspection Interface
interface InspectionItem {
  _id: string;
  _creationTime: number;
  projectId: string;
  budgetItemId?: string;
  programNumber: string;
  title: string;
  category: string;
  inspectionDate: number;
  remarks: string;
  status: "completed" | "in_progress" | "pending" | "cancelled";
  viewCount: number;
  uploadSessionId?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  // Enriched fields
  creator?: UserInfo;
  imageCount?: number;
  thumbnails?: string[];
}

// Form Data
interface InspectionFormData {
  programNumber: string;
  title: string;
  category: string;
  date: string;              // YYYY-MM-DD format
  remarks: string;
  images: File[];
  uploadSessionId?: Id<"uploadSessions">;
}
```

### Page Structure

**Route:** `/dashboard/project/[year]/[particularId]/[projectbreakdownId]/[inspectionId]/`

```typescript
// Page layout components
<BreakdownDetailPage>
  ├── FinancialBreakdownCard      // Left sidebar (collapsible)
  ├── FinancialBreakdownHeader    // Tab navigation
  └── FinancialBreakdownMain      // Tab content
      ├── InspectionContent       // List/Table view
      ├── OverviewContent         // Summary statistics
      ├── AnalyticsContent        // Charts & graphs
      └── RemarksContent          // Comments & notes
```

---

## Media & Image Handling

### Upload Flow

```
┌─────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  User Select │───▶│  Create Upload   │───▶│ Generate Signed │
│   Images     │    │    Session       │    │     URLs        │
└─────────────┘    └──────────────────┘    └─────────────────┘
                                                    │
                                                    ▼
┌─────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Save to   │◀───│  Save Metadata   │◀───│  Upload to      │
│ Inspection  │    │   (convex/media) │    │  Convex Storage │
└─────────────┘    └──────────────────┘    └─────────────────┘
```

### Image Display Modes

#### 1. Table View Thumbnails
- Displays up to 3 thumbnail images
- Shows overflow indicator (`+N`) for additional images
- Click opens gallery modal

#### 2. List View Cards
- Shows 4 thumbnail grid
- Overlay counter for images beyond 4
- Full-width card layout

#### 3. Gallery Modal (`InspectionGalleryModal`)
- Full-screen image viewer
- Keyboard navigation (arrow keys)
- Thumbnail strip for quick selection
- Image counter overlay

#### 4. Details Modal (`InspectionDetailsModal`)
- Facebook-style image grid layout:
  - 1 image: Full width
  - 2 images: Side-by-side
  - 3 images: One large + two stacked
  - 4+ images: 2×2 grid with overflow indicator
- Click opens fullscreen viewer

### Image Optimization

- Images stored in Convex Storage
- Thumbnails generated for display
- Lazy loading for gallery images
- Error fallbacks for broken image links

---

## Remarks System

### Remark Structure

```typescript
{
  projectId: Id<"projects">;           // Required parent
  inspectionId?: Id<"inspections">;    // Optional inspection link
  content: string;                      // Markdown supported
  category?: string;                    // User-defined category
  priority?: "high" | "medium" | "low";
  isPinned?: boolean;                   // Pin to top
  tags?: string;                        // Comma-separated tags
  attachments?: string;                 // JSON string of file refs
  
  // Audit
  createdBy: Id<"users">;
  createdAt: number;
  updatedAt: number;
  updatedBy: Id<"users">;
}
```

### Remark Features

1. **Multi-level Linking**
   - Project-level remarks (general)
   - Inspection-specific remarks
   - Budget item remarks

2. **Filtering & Sorting**
   - Filter by inspection
   - Filter by category
   - Filter by priority
   - Pinned remarks always first

3. **CRUD Operations**
   - Create with modal form
   - Inline editing
   - Soft delete (with confirmation)
   - Pin/unpin toggle

4. **Visual Indicators**
   - Priority badges (color-coded)
   - Category badges
   - Pinned indicator (📌)
   - "Edited" timestamp

### UI Components

```typescript
// Main remarks component
<RemarksContent projectId={projectId}>
  ├── Filter Bar              // Inspection, Category, Priority
  ├── NewRemarkModal          // Create new remark
  └── RemarksList
      └── RemarkCard
          ├── Header          // Author, date, badges
          ├── Inspection Link // If linked to inspection
          ├── Content         // Text body
          └── Actions         // Pin, Edit, Delete
```

---

## Data Flow

### Creating an Inspection

```
User
 │
 ├─▶ Open NewInspectionForm
 │   ├─▶ Fill form fields
 │   ├─▶ Select images (optional)
 │   │   ├─▶ createUploadSession()
 │   │   ├─▶ generateUploadUrl() for each image
 │   │   ├─▶ Upload to storage
 │   │   └─▶ saveMedia() for each
 │   └─▶ Submit
 │       └─▶ createInspection() with uploadSessionId
 │           └─▶ Database record created
 │               └─▶ UI revalidates list
```

### Viewing an Inspection

```
User clicks "View"
 │
 ├─▶ incrementViewCount()       // Track analytics
 ├─▶ Open InspectionDetailsModal
 │   ├─▶ getInspection()        // Fetch full details
 │   │   ├─▶ Get inspection record
 │   │   ├─▶ Get project details
 │   │   ├─▶ Get creator info
 │   │   └─▶ Get images with URLs
 │   └─▶ Render gallery grid
 └─▶ User can view fullscreen images
```

### Adding a Remark

```
User clicks "Add Remark"
 │
 ├─▶ Open NewRemarkModal
 │   ├─▶ Select inspection (optional)
 │   ├─▶ Set category & priority
 │   └─▶ Write content
 └─▶ Submit
     └─▶ createRemark()
         ├─▶ Validate inspection if provided
         ├─▶ Insert remark record
         └─▶ UI updates with new remark
```

---

## Security & Access Control

### Authentication Requirements

All inspection operations require authentication:

```typescript
const userId = await getAuthUserId(ctx);
if (!userId) {
  throw new Error("Not authenticated");
}
```

### Data Validation

1. **Existence Checks**
   - Verify inspection exists before update/delete
   - Verify project exists when creating
   - Verify inspection belongs to project when linking remarks

2. **Type Safety**
   - Strict Convex schema validation
   - TypeScript interfaces on frontend
   - Union types for status/priority enums

3. **User Attribution**
   - `createdBy` set automatically
   - `updatedBy` tracked on modifications
   - User info enriched in queries

### File Upload Security

- Signed URLs for direct storage upload
- File type validation (images only)
- Size limits enforced
- User attribution on all media

---

## Best Practices

### For Developers

1. **Always Use Enriched Queries**
   ```typescript
   // ✅ Good - includes related data
   const inspection = useQuery(api.inspections.getInspection, { id });
   
   // ❌ Avoid - raw DB access
   const inspection = useQuery(api.myFunctions.getRawInspection, { id });
   ```

2. **Handle Loading States**
   ```typescript
   if (!inspections) return <LoadingSkeleton />;
   if (inspections.length === 0) return <EmptyState />;
   ```

3. **Optimistic Updates**
   ```typescript
   // Use Convex mutations with proper error handling
   const createInspection = useMutation(api.inspections.createInspection);
   ```

4. **Image Cleanup**
   - Revoke object URLs after upload: `URL.revokeObjectURL(url)`
   - Handle broken images with fallbacks

### For Users

1. **Organization**
   - Use consistent categories
   - Add descriptive titles
   - Link remarks to specific inspections when relevant

2. **Media Management**
   - Upload relevant images only
   - Use high-quality photos
   - Add captions when available

3. **Status Updates**
   - Keep status current
   - Add remarks explaining status changes
   - Use priorities to highlight urgent items

---

## Related Documentation

- [Project Module](./project-docs/01-architecture-overview.md)
- [Budget System](./how-computation-works/01-budget-project-breakdown.md)
- [Trash System](./trash-hierarchy-system.md) - Soft delete implementation
- [RBAC System](../lib/rbac.ts) - Role-based access control

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024 | Initial inspection system implementation |
| 1.1 | 2024 | Added image gallery with upload sessions |
| 1.2 | 2024 | Integrated remarks system with inspection linking |
| 1.3 | 2024 | Added view tracking and analytics |

---

*For technical support or feature requests, please refer to the main project documentation or contact the development team.*
