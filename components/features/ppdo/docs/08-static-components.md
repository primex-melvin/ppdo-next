# Static Components

> Landing page (marketing) components

---

## Overview

Static components are used on the public landing page (`/`). These are marketing-focused components that showcase the PPDO system.

**File Location:** `components/ppdo/static/`

---

## Components

### PPDOBanner

Hero banner section for the landing page.

```typescript
interface PPDOBannerProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  onCtaClick?: () => void;
  backgroundImage?: string;
}
```

**Default Content:**
- Title: "Provincial Planning and Development Office"
- Subtitle: "Streamlined planning, budgeting, and project management"
- CTA: "Get Started"

---

### PPDOAbout

About section describing PPDO.

```typescript
interface PPDOAboutProps {
  title?: string;
  description?: string;
  features?: {
    icon: React.ReactNode;
    title: string;
    description: string;
  }[];
}
```

**Sections:**
- Mission statement
- Vision statement
- Core values
- Key statistics

---

### PPDOFeatures

Features grid showcasing system capabilities.

```typescript
interface PPDOFeaturesProps {
  title?: string;
  subtitle?: string;
  features?: FeatureItem[];
}

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  image?: string;
}
```

**Default Features:**
1. **Budget Planning** - Comprehensive budget management
2. **Project Tracking** - Monitor project progress
3. **Fund Management** - Manage trust and special funds
4. **Reporting** - Generate detailed reports
5. **Collaboration** - Multi-user access
6. **Security** - Role-based access control

---

### PPDOActivities

Showcase of recent activities or impact.

```typescript
interface PPDOActivitiesProps {
  title?: string;
  activities?: ActivityItem[];
}

interface ActivityItem {
  image: string;
  title: string;
  description: string;
  date: string;
  category: string;
}
```

---

## Fiscal Years Components (`fiscal-years/`)

While not in the static folder, these are shared across dashboard pages.

### FiscalYearCard

Card displaying fiscal year information.

```typescript
interface FiscalYearCardProps {
  fiscalYear: FiscalYear;
  stats: {
    itemCount: number;
    totalAllocated: number;
    totalUtilized: number;
    utilizationRate: number;
  };
  isExpanded: boolean;
  onToggleExpand: () => void;
  onOpen: () => void;
  onDelete: (e: React.MouseEvent) => void;
  accentColor?: string;
  openButtonLabel?: string;
  statsContent?: React.ReactNode;
  expandedContent?: React.ReactNode;
}
```

---

### FiscalYearHeader

Header for fiscal year pages.

```typescript
interface FiscalYearHeaderProps {
  title: string;
  subtitle?: string;
  onAddYear: () => void;
  onOpenLatest?: () => void;
  hasYears: boolean;
  accentColor?: string;
}
```

---

### FiscalYearEmptyState

Empty state when no fiscal years exist.

```typescript
interface FiscalYearEmptyStateProps {
  onCreateFirst: () => void;
  accentColor?: string;
}
```

---

### FiscalYearModal

Modal for creating new fiscal years.

```typescript
interface FiscalYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
```

---

### FiscalYearDeleteDialog

Confirmation dialog for year deletion.

```typescript
interface FiscalYearDeleteDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  yearToDelete: { id: string; year: number } | null;
  onConfirm: () => void;
  itemTypeLabel?: string;  // "trust funds", "projects", etc.
}
```

---

## Usage Example: Landing Page

```tsx
// app/page.tsx

import {
  PPDOBanner,
  PPDOAbout,
  PPDOFeatures,
  PPDOActivities,
} from "@/components/features/ppdo/static";

export default function LandingPage() {
  return (
    <main>
      <PPDOBanner
        onCtaClick={() => router.push("/signin")}
      />
      
      <PPDOAbout />
      
      <PPDOFeatures
        features={[
          {
            icon: <Wallet size={32} />,
            title: "Budget Planning",
            description: "Comprehensive budget management...",
          },
          // ...
        ]}
      />
      
      <PPDOActivities
        activities={[
          {
            image: "/images/project-1.jpg",
            title: "Road Rehabilitation",
            description: "Major road project completed...",
            date: "2024-01-15",
            category: "Infrastructure",
          },
          // ...
        ]}
      />
    </main>
  );
}
```

---

## Styling Notes

Static components use a different styling approach than dashboard components:

- **Landing Page:** Marketing-focused, larger typography, more imagery
- **Dashboard:** Functional, compact, data-dense

### Landing Page Theme
```typescript
// Uses full-width sections
className="w-full py-20 px-4"

// Larger typography
className="text-5xl font-bold"

// Gradient backgrounds
className="bg-gradient-to-r from-green-700 to-green-500"
```

---

## Related Documentation

- [Dashboard Components](./03-dashboard-components.md)