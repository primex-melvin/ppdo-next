# Project Detail

> Level 4: Detailed view of a breakdown with tabs (Overview, Inspections, Analytics, Remarks)

---

## Overview

The Project Detail page provides a comprehensive view of a breakdown item with tabbed interface for different aspects: Overview, Inspections, Analytics, and Remarks.

**Route:** `/dashboard/project/[year]/[particularId]/[projectbreakdownId]/[inspectionId]`  
**File:** `app/dashboard/project/[year]/.../[projectId]/page.tsx`

---

## Tab Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Overview] [Inspections] [Analytics] [Remarks]                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TAB CONTENT                                                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tab 1: Overview

**Component:** `OverviewContent`

Displays:
- Project/breakdown summary
- Financial breakdown
- Status information
- Implementing agency details
- Location information
- Timeline (start/end dates)

### Financial Breakdown Card

```typescript
interface FinancialBreakdownCardProps {
  breakdown: GovtProjectBreakdown;
  showDetails?: boolean;
}
```

Shows:
- Total Budget
- Obligated Amount
- Utilized Amount
- Balance
- Utilization Rate

---

## Tab 2: Inspections

**Component:** `InspectionContent`

Manages inspection records with media uploads.

### Features

- **Inspection List**: Table of all inspections
- **Media Gallery**: Photos and documents
- **Add Inspection**: Form for new inspection
- **Inspection Types**:
  - Pre-inspection
  - During implementation
  - Post-completion

### Inspection Data Structure

```typescript
interface Inspection {
  _id: string;
  breakdownId: string;
  type: InspectionType;
  date: number;
  description: string;
  findings?: string;
  recommendations?: string;
  photos: InspectionPhoto[];
  documents: InspectionDocument[];
  inspectedBy: string;
  createdAt: number;
}

type InspectionType = 
  | "pre"
  | "during"
  | "post";

interface InspectionPhoto {
  id: string;
  url: string;
  caption?: string;
  uploadedAt: number;
}
```

### Inspection Components

| Component | Purpose |
|-----------|---------|
| `InspectionsDataTable` | List of inspections |
| `InspectionGalleryModal` | Photo gallery viewer |
| `NewInspectionForm` | Add inspection form |
| `InspectionDetailsModal` | View inspection details |
| `InspectionViewToggle` | Toggle between views |
| `InspectionContextMenu` | Right-click actions |

---

## Tab 3: Analytics

**Component:** `AnalyticsContent`

Data visualization and statistics.

### Features

- **Budget Utilization Chart**: Bar/line chart
- **Timeline Visualization**: Gantt-style chart
- **Status Breakdown**: Pie chart
- **Comparative Analysis**: vs. other projects

### Chart Components

```typescript
interface AnalyticsContentProps {
  breakdown: GovtProjectBreakdown;
  inspections: Inspection[];
  remarks: Remark[];
}
```

---

## Tab 4: Remarks

**Component:** `RemarksContent`

Comment thread for discussion.

### Features

- **Comment List**: Threaded comments
- **Add Remark**: Text input with submit
- **User Mentions**: @username support
- **Timestamps**: Relative time display
- **Attachments**: File upload support

### Remark Data Structure

```typescript
interface Remark {
  _id: string;
  breakdownId: string;
  userId: string;
  userName: string;
  content: string;
  mentions: string[];  // User IDs mentioned
  attachments: Attachment[];
  createdAt: number;
  replies?: Remark[];
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}
```

### Remark Components

| Component | Purpose |
|-----------|---------|
| `RemarksSection` | Main remarks container |
| `RemarksContent` | Tab content |
| `NewRemarkModal` | Add remark modal |

---

## Component Structure

```
ProjectDetailPage
│
├── Page Header
│   ├── Breadcrumbs
│   ├── Project Title
│   └── Back button
│
├── Tabs
│   ├── Overview Tab
│   │   ├── FinancialBreakdownCard
│   │   ├── ProjectInfoCard
│   │   └── StatusCard
│   │
│   ├── Inspections Tab
│   │   ├── InspectionsDataTable
│   │   ├── InspectionGalleryModal
│   │   └── NewInspectionForm
│   │
│   ├── Analytics Tab
│   │   ├── BudgetChart
│   │   ├── TimelineChart
│   │   └── StatsCards
│   │
│   └── Remarks Tab
│       ├── RemarksList
│       └── NewRemarkForm
│
└── Modals (conditional)
    ├── InspectionDetailsModal
    └── NewRemarkModal
```

---

## Types

```typescript
// _types/inspection.ts

interface Inspection {
  _id: string;
  breakdownId: string;
  projectId: string;
  type: "pre" | "during" | "post";
  date: number;
  description: string;
  findings?: string;
  recommendations?: string;
  photos: Photo[];
  documents: Document[];
  inspectedBy: string;
  createdBy: string;
  createdAt: number;
}

interface Photo {
  _id: string;
  inspectionId: string;
  url: string;
  storageId: string;
  caption?: string;
  uploadedAt: number;
}

interface Remark {
  _id: string;
  breakdownId: string;
  userId: string;
  content: string;
  mentions: string[];
  attachments: Attachment[];
  createdAt: number;
}
```

---

## Usage Example

```tsx
"use client";

export default function ProjectDetailPage() {
  const params = useParams();
  const breakdownId = params.projectId as string;
  
  const breakdown = useQuery(api.breakdowns.getById, { id: breakdownId });
  const inspections = useQuery(api.inspections.getByBreakdown, { breakdownId });
  const remarks = useQuery(api.remarks.getByBreakdown, { breakdownId });
  
  const [activeTab, setActiveTab] = useState("overview");
  
  if (!breakdown) return <LoadingState />;
  
  return (
    <div className="space-y-6">
      <PageHeader
        title={breakdown.projectTitle}
        breadcrumbs={[...]}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inspections">
            Inspections ({inspections?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="remarks">
            Remarks ({remarks?.length || 0})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <OverviewContent breakdown={breakdown} />
        </TabsContent>
        
        <TabsContent value="inspections">
          <InspectionContent 
            inspections={inspections || []}
            breakdownId={breakdownId}
          />
        </TabsContent>
        
        <TabsContent value="analytics">
          <AnalyticsContent 
            breakdown={breakdown}
            inspections={inspections || []}
          />
        </TabsContent>
        
        <TabsContent value="remarks">
          <RemarksContent 
            remarks={remarks || []}
            breakdownId={breakdownId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## Related Documentation

- [Breakdowns List](./05-breakdowns-list.md)
- [Hooks & Data Flow](./07-hooks-data-flow.md)
