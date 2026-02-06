# Dashboard Components

> Analytics, charts, and landing page components

---

## Overview

Dashboard components provide the analytics visualization and landing page interface for the PPDO system.

**Categories:**
- **Charts** - Data visualization components
- **Landing** - Fiscal year selection interface
- **Summary** - Dashboard overview cards

---

## Charts (`dashboard/charts/`)

### Chart Components Overview

| Component | Type | Purpose |
|-----------|------|---------|
| `BudgetStatusProgressList` | Progress List | Shows budget utilization by category |
| `DashboardChartCard` | Container | Wrapper for chart components |
| `DepartmentUtilizationHorizontalBar` | Bar Chart | Department budget comparison |
| `ProjectActivityTimeline` | Timeline | Project timeline visualization |
| `ProjectStatusVerticalBar` | Bar Chart | Project status distribution |
| `TabbedPieChart` | Pie Chart | Multi-view pie charts |
| `TrustFundLineChart` | Line Chart | Trust fund trends over time |

---

### BudgetStatusProgressList

Displays budget items as progress bars with status indicators.

```typescript
interface BudgetStatusProgressListProps {
  items: {
    id: string;
    name: string;
    allocated: number;
    utilized: number;
    percentage: number;
  }[];
  maxItems?: number;
  onViewAll?: () => void;
}
```

**Usage:**
```tsx
<BudgetStatusProgressList
  items={budgetItems.map(item => ({
    id: item._id,
    name: item.particularName,
    allocated: item.totalBudgetAllocated,
    utilized: item.totalBudgetUtilized,
    percentage: (item.totalBudgetUtilized / item.totalBudgetAllocated) * 100,
  }))}
  maxItems={5}
  onViewAll={() => router.push("/dashboard/project/2025")}
/>
```

---

### DashboardChartCard

Container component for charts with title, actions, and loading states.

```typescript
interface DashboardChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}
```

**Usage:**
```tsx
<DashboardChartCard
  title="Budget Utilization"
  subtitle="By Department"
  actions={
    <Select value={year} onValueChange={setYear}>
      <SelectTrigger>{year}</SelectTrigger>
      <SelectContent>
        <SelectItem value="2025">2025</SelectItem>
        <SelectItem value="2024">2024</SelectItem>
      </SelectContent>
    </Select>
  }
  isLoading={isLoading}
>
  <DepartmentUtilizationHorizontalBar data={deptData} />
</DashboardChartCard>
```

---

### DepartmentUtilizationHorizontalBar

Horizontal bar chart comparing departments.

```typescript
interface DepartmentUtilizationHorizontalBarProps {
  data: {
    department: string;
    allocated: number;
    utilized: number;
    percentage: number;
  }[];
  maxBars?: number;
  sortBy?: "allocated" | "utilized" | "percentage";
}
```

---

### ProjectActivityTimeline

Timeline visualization of project activities.

```typescript
interface ProjectActivityTimelineProps {
  events: {
    id: string;
    date: number;
    title: string;
    description?: string;
    type: "milestone" | "task" | "deadline";
    status: "completed" | "ongoing" | "upcoming";
  }[];
  startDate: number;
  endDate: number;
}
```

---

### ProjectStatusVerticalBar

Vertical bar chart showing project status distribution.

```typescript
interface ProjectStatusVerticalBarProps {
  data: {
    status: string;
    count: number;
    color: string;
  }[];
  showLegend?: boolean;
  showValues?: boolean;
}
```

---

### TabbedPieChart

Pie chart with multiple view tabs.

```typescript
interface TabbedPieChartProps {
  tabs: {
    id: string;
    label: string;
    data: {
      label: string;
      value: number;
      color: string;
    }[];
  }[];
  defaultTab?: string;
}
```

---

### TrustFundLineChart

Line chart showing trust fund trends.

```typescript
interface TrustFundLineChartProps {
  data: {
    month: string;
    received: number;
    utilized: number;
    balance: number;
  }[];
  showReceived?: boolean;
  showUtilized?: boolean;
  showBalance?: boolean;
}
```

---

## Landing Components (`dashboard/landing/`)

### DashboardFundSelection

Initial dashboard view for selecting fund type.

```typescript
interface DashboardFundSelectionProps {
  onSelectFund: (fundId: string) => void;
  onBack: () => void;
}
```

**Features:**
- Fund type cards (Projects, Trust Funds, SEF, SHF, 20% DF)
- Visual icons and descriptions
- Recent activity preview

---

### FiscalYearLanding

Fiscal year selection view after choosing fund type.

```typescript
interface FiscalYearLandingProps {
  onBack: () => void;
}
```

**Features:**
- Year cards with statistics
- Expandable details
- Quick actions (Open, Delete)
- Add new year button

---

### FiscalYearLandingCard

Individual year card component.

```typescript
interface FiscalYearLandingCardProps {
  year: FiscalYear;
  stats: {
    itemCount: number;
    totalAllocated: number;
    totalUtilized: number;
    utilizationRate: number;
  };
  isExpanded: boolean;
  onToggleExpand: () => void;
  onOpen: () => void;
  onDelete: () => void;
}
```

---

## Summary Components (`dashboard/summary/`)

### DashboardSummary

Complete dashboard summary section.

```typescript
interface DashboardSummaryProps {
  year: number;
  data: {
    budgetItems: BudgetItem[];
    projects: Project[];
    trustFunds: TrustFund[];
  };
}
```

---

### KPICardsRow

Row of Key Performance Indicator cards.

```typescript
interface KPICardsRowProps {
  kpis: {
    id: string;
    title: string;
    value: number | string;
    change?: number;
    changeLabel?: string;
    icon: React.ReactNode;
    color: string;
  }[];
}
```

**Usage:**
```tsx
<KPICardsRow
  kpis={[
    {
      id: "budget",
      title: "Total Budget",
      value: formatCurrency(totalBudget),
      change: 12.5,
      changeLabel: "vs last year",
      icon: <Wallet size={20} />,
      color: "#15803D",
    },
    {
      id: "projects",
      title: "Active Projects",
      value: activeProjects,
      change: -5,
      changeLabel: "vs last month",
      icon: <Folder size={20} />,
      color: "#2563EB",
    },
  ]}
/>
```

---

### AnalyticsGrid

Grid layout for multiple analytics charts.

```typescript
interface AnalyticsGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
}
```

---

## Chart Data Format Examples

### Budget Utilization Data
```typescript
const budgetData = {
  departments: [
    { 
      department: "Engineering",
      allocated: 5000000,
      utilized: 3750000,
      percentage: 75
    },
    { 
      department: "Health",
      allocated: 3000000,
      utilized: 2400000,
      percentage: 80
    },
  ],
  status: [
    { status: "Completed", count: 45, color: "#22c55e" },
    { status: "Ongoing", count: 32, color: "#3b82f6" },
    { status: "Delayed", count: 8, color: "#ef4444" },
    { status: "Pending", count: 15, color: "#f59e0b" },
  ],
};
```

### Timeline Data
```typescript
const timelineData = {
  events: [
    {
      id: "1",
      date: Date.parse("2024-01-15"),
      title: "Project Kickoff",
      description: "Initial planning meeting",
      type: "milestone",
      status: "completed"
    },
    {
      id: "2",
      date: Date.parse("2024-02-01"),
      title: "Procurement Phase",
      type: "task",
      status: "ongoing"
    },
  ],
  startDate: Date.parse("2024-01-01"),
  endDate: Date.parse("2024-12-31"),
};
```

---

## Complete Dashboard Example

```tsx
"use client";

import {
  KPICardsRow,
  AnalyticsGrid,
  DashboardChartCard,
  DepartmentUtilizationHorizontalBar,
  ProjectStatusVerticalBar,
  BudgetStatusProgressList,
} from "@/components/features/ppdo/dashboard";
import { Wallet, Folder, Users, TrendingUp } from "lucide-react";

export default function DashboardOverview({ year }: { year: number }) {
  const { data, isLoading } = useDashboardData(year);
  
  return (
    <div className="space-y-6">
      <KPICardsRow
        kpis={[
          {
            id: "budget",
            title: "Total Budget",
            value: formatCurrency(data?.totalBudget),
            icon: <Wallet size={20} />,
            color: "#15803D",
          },
          {
            id: "projects",
            title: "Projects",
            value: data?.projectCount,
            icon: <Folder size={20} />,
            color: "#2563EB",
          },
          {
            id: "agencies",
            title: "Agencies",
            value: data?.agencyCount,
            icon: <Users size={20} />,
            color: "#7C3AED",
          },
          {
            id: "utilization",
            title: "Utilization",
            value: `${data?.utilizationRate}%`,
            icon: <TrendingUp size={20} />,
            color: "#EA580C",
          },
        ]}
      />
      
      <AnalyticsGrid columns={2}>
        <DashboardChartCard
          title="Department Utilization"
          isLoading={isLoading}
        >
          <DepartmentUtilizationHorizontalBar
            data={data?.departmentUtilization}
          />
        </DashboardChartCard>
        
        <DashboardChartCard
          title="Project Status"
          isLoading={isLoading}
        >
          <ProjectStatusVerticalBar
            data={data?.projectStatus}
          />
        </DashboardChartCard>
        
        <DashboardChartCard
          title="Budget Status"
          isLoading={isLoading}
        >
          <BudgetStatusProgressList
            items={data?.budgetStatus}
            maxItems={5}
          />
        </DashboardChartCard>
      </AnalyticsGrid>
    </div>
  );
}
```

---

## Related Documentation

- [Fiscal Years Components](./08-static-components.md#fiscal-years)
- [Component Patterns](./09-component-patterns.md)