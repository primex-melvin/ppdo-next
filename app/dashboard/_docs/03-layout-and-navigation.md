# Layout & Navigation

> Dashboard layout system, sidebar navigation, and UI structure

---

## Layout Hierarchy

```
Root Layout (app/layout.tsx)
│
├── Theme Provider (next-themes)
├── Convex Provider (real-time data)
│
└── Dashboard Layout (app/dashboard/layout.tsx)
    │
    ├── Providers
    │   ├── SearchProvider
    │   ├── SidebarProvider
    │   ├── AccentColorProvider
    │   └── BreadcrumbProvider
    │
    └── DashboardContent
        │
        ├── Sidebar (Left Navigation)
        │   ├── SidebarHeader (Logo, Toggle)
        │   ├── SidebarNav (Navigation Items)
        │   └── SidebarFooter (User Profile)
        │
        └── Main Content Area
            │
            ├── Header
            │   ├── Search (Global Search)
            │   ├── Notifications
            │   └── User Menu
            │
            ├── Beta Banner (Conditional)
            │
            └── Page Content
                ├── Breadcrumbs + Time/Location
                └── Route-Specific Content
```

---

## Dashboard Layout (`app/dashboard/layout.tsx`)

### Key Features
- **Authentication Guard**: Redirects to `/signin` if not authenticated
- **Role Guard**: Redirects `inspector` role to `/inspector`
- **Providers**: Wraps all dashboard pages with necessary contexts
- **Responsive**: Sidebar collapses on mobile, fixed header

### Layout Code Structure
```typescript
"use client";

export default function DashboardLayout({ children }) {
  return (
    <SearchProvider>
      <SidebarProvider>
        <AccentColorProvider>
          <BreadcrumbProvider>
            <DashboardContent>{children}</DashboardContent>
          </BreadcrumbProvider>
        </AccentColorProvider>
      </SidebarProvider>
    </SearchProvider>
  );
}

function DashboardContent({ children }) {
  // Auth checks & role validation
  // Renders: Sidebar + Header + Page Content
}
```

---

## Sidebar Navigation

### File Structure
```
components/sidebar/
├── Sidebar.tsx           # Main sidebar component
├── SidebarHeader.tsx     # Logo and mobile close button
├── SidebarNav.tsx        # Navigation items rendering
├── SidebarFooter.tsx     # User profile section
├── navItems.tsx          # Hook to get nav items
├── config.tsx            # Static navigation configuration
├── types.ts              # TypeScript definitions
├── utils.ts              # Helper functions
└── badges/
    └── UpdatesBadges.tsx # Dynamic badges for bugs/suggestions
```

### Navigation Categories

```
┌─────────────────────────────────────┐
│           MY WORKSPACE              │
├─────────────────────────────────────┤
│ 📊 Dashboard                        │
│ 📈 Personal KPI                     │
├─────────────────────────────────────┤
│           DEPARTMENT                │
├─────────────────────────────────────┤
│ 💼 Projects (11 plans)              │
│ 📊 20% DF                           │
│ 🔐 Trust Funds (Project Organs)     │
│ 🎓 Special Education Funds          │
│ 🏥 Special Health Funds             │
│ 📄 Particulars                      │
├─────────────────────────────────────┤
│         CROSS DEPARTMENT            │
├─────────────────────────────────────┤
│ 🏢 Office                           │
├─────────────────────────────────────┤
│         CONTROL PANEL               │
├─────────────────────────────────────┤
│ 📝 CMS                              │
│ ⚙️ Settings                         │
│   ├── User Management               │
│   └── Updates                       │
│       ├── Changelogs                │
│       ├── Bugs (with badge)         │
│       └── Suggestions (with badge)  │
└─────────────────────────────────────┘
```

### Sidebar Features

#### 1. Collapsible State
```typescript
// contexts/SidebarContext.tsx
const [isMinimized, setIsMinimized] = useState(false);

// On minimize:
// - Width changes from 256px to 80px
// - Text labels hidden
// - Icons centered
// - Tooltips appear on hover
```

#### 2. Expandable Submenus
```typescript
// Settings has nested submenu
{
  name: "Settings",
  category: "Control Panel",
  icon: <SettingsIcon size={20} />,
  submenu: [
    { name: "User Management", href: "/dashboard/settings/user-management" },
    {
      name: "Updates",
      submenu: [
        { name: "Changelogs", href: "..." },
        { name: "Bugs", href: "...", badgeComponent: BugsBadge },
        { name: "Suggestions", href: "...", badgeComponent: SuggestionsBadge },
      ],
    },
  ],
}
```

#### 3. Active State Styling
```typescript
// Active item styling
isActive && {
  backgroundColor: `${accentColor}10`,  // 10% opacity
  color: accentColor,
  fontWeight: "medium"
}
```

#### 4. Badges
- **Count Badges**: Show pending counts (bugs, suggestions)
- **NEW Badge**: Highlight new features
- **Custom Components**: Dynamic badges from Convex data

---

## Header Component

### Location
```
components/header/
├── Header.tsx            # Main header
├── SearchBar.tsx         # Global search
├── UserMenu.tsx          # User dropdown
└── Notifications.tsx     # Notification bell
```

### Header Features
1. **Global Search**: Search across dashboard content
2. **Time/Location**: Shows current time and location
3. **User Menu**: Profile, settings, logout
4. **Notifications**: Real-time notification bell

---

## Context Providers

### 1. SidebarContext
```typescript
interface SidebarContextType {
  isMinimized: boolean;
  toggleMinimize: () => void;
  setMinimized: (value: boolean) => void;
}
```

### 2. SearchContext
```typescript
interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult[];
  isSearching: boolean;
}
```

### 3. AccentColorContext
```typescript
interface AccentColorContextType {
  accentColor: AccentColor;
  accentColorValue: string;
  setAccentColor: (color: AccentColor) => void;
}

// Available colors: green, blue, purple, orange, red
// Default: green (#15803D)
```

### 4. BreadcrumbContext
```typescript
interface BreadcrumbContextType {
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
  addBreadcrumb: (item: BreadcrumbItem) => void;
}
```

---

## Page Content Structure

### Standard Page Layout
```tsx
// Most dashboard pages follow this structure:

export default function Page() {
  return (
    <div className="space-y-4">
      {/* Page Header */}
      <PageHeader 
        title="Page Title"
        description="Optional description"
        actions={<ActionButtons />}
      />

      {/* Statistics/Overview Cards */}
      <StatsGrid>
        <StatCard title="Total" value={100} />
        <StatCard title="Active" value={50} />
      </StatsGrid>

      {/* Main Content */}
      <DataTable />
      {/* OR */}
      <FormComponent />
      {/* OR */}
      <CardGrid />
    </div>
  );
}
```

---

## Responsive Behavior

### Breakpoints
| Breakpoint | Width | Sidebar Behavior |
|------------|-------|------------------|
| Mobile | < 768px | Hidden, hamburger menu |
| Tablet | 768px - 1024px | Collapsible |
| Desktop | > 1024px | Default expanded |

### Mobile Layout
```
┌─────────────────────────┐
│ ☰ PPDO              👤 │  ← Header with hamburger
├─────────────────────────┤
│                         │
│      PAGE CONTENT       │  ← Full width
│                         │
└─────────────────────────┘

Sidebar slides in from left when ☰ clicked
```

---

## UI Components from Shadcn/ui

### Used Components
```typescript
// Components used throughout dashboard
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Separator,
  Skeleton,
  ScrollArea,
  Sheet,
  Toast,  // From sonner
} from "@/components/ui/*";
```

---

## Theme Support

### Light/Dark Mode
```typescript
// Using next-themes
// Theme toggle in header

// Dark mode classes:
className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
```

### Accent Colors
```typescript
// 5 accent colors available:
const accentColors = {
  green:  "#15803D",  // Default
  blue:   "#2563EB",
  purple: "#7C3AED",
  orange: "#EA580C",
  red:    "#DC2626",
};
```

---

## Beta Banner

### Conditional Display
```typescript
// Shows on specific pages during beta
const shouldShowBetaBanner = pathname === "/dashboard/particulars";

<BetaBanner
  featureName="Particulars Management"
  variant="danger"
  dismissible={false}
  message="We're actively refining the Particulars Management interface..."
/>
```

---

## Related Documentation

- [Architecture Overview](./01-architecture-overview.md)
- [Routing Structure](./02-routing-structure.md)
- [Development Guide](./10-development-guide.md) - Styling standards
