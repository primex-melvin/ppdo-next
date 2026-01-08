# Sidebar Component Module

A modular, responsive, and highly customizable sidebar navigation component for the PPDO Next dashboard.

## 📁 Folder Structure

```
app/dashboard/components/sidebar/
├── index.ts                  # Main export file (barrel exports)
├── Sidebar.tsx              # Main sidebar container component
├── types.ts                 # TypeScript type definitions
├── utils.ts                 # Helper functions and utilities
├── navConfig.tsx            # Navigation items configuration
├── SidebarHeader.tsx        # Sidebar header with logo
├── SidebarNav.tsx           # Navigation list container
├── SidebarFooter.tsx        # Sidebar footer component
├── NavCategory.tsx          # Category section component
├── NavItem.tsx              # Individual navigation item
└── MobileMenuButton.tsx     # Mobile menu toggle button
```

## 🎯 Features

- **Responsive Design**: Works seamlessly on mobile and desktop
- **Minimized State**: Desktop sidebar can be minimized/expanded
- **Categorized Navigation**: Organizes menu items into logical categories
- **Active State Highlighting**: Uses accent colors for active routes
- **Submenu Support**: Expandable/collapsible submenus
- **Disabled States**: Support for coming-soon menu items
- **Mobile Overlay**: Full overlay menu for mobile devices
- **Accessibility**: Proper ARIA labels and keyboard navigation support

## 📦 Usage

### Basic Usage

```tsx
import { Sidebar } from "@/app/dashboard/components/sidebar";

export default function Layout() {
  return (
    <div className="flex">
      <Sidebar />
      <main>{/* Your content */}</main>
    </div>
  );
}
```

### Custom Navigation Items

```tsx
import { Sidebar, NavItem } from "@/app/dashboard/components/sidebar";

const customNavItems: NavItem[] = [
  {
    name: "My Dashboard",
    href: "/dashboard",
    category: "My Workspace",
    icon: <HomeIcon />,
  },
  {
    name: "Settings",
    category: "Control Panel",
    icon: <SettingsIcon />,
    submenu: [
      { name: "Profile", href: "/settings/profile" },
      { name: "Security", href: "/settings/security" },
    ],
  },
];

export default function Layout() {
  return <Sidebar navItems={customNavItems} />;
}
```

## 🔧 Component API

### Sidebar Props

```typescript
interface SidebarProps {
  navItems?: NavItem[]; // Optional custom navigation items
}
```

### NavItem Type

```typescript
interface NavItem {
  name: string; // Display name
  href?: string; // Navigation URL (optional for parent items with submenu)
  icon: React.ReactNode; // Icon component
  submenu?: SubMenuItem[]; // Optional submenu items
  category?: string; // Category grouping
  disabled?: boolean; // Disabled state (coming soon items)
}
```

### SubMenuItem Type

```typescript
interface SubMenuItem {
  name: string; // Display name
  href: string; // Navigation URL
}
```

## 📐 Architecture

### Component Hierarchy

```
Sidebar (Main Container)
├── SidebarHeader (Logo & Title)
├── SidebarNav (Navigation Container)
│   └── NavCategory[] (Category Groups)
│       └── NavItem[] (Individual Items)
│           └── SubMenuItem[] (Submenu Items)
├── SidebarFooter (Copyright Info)
└── MobileMenuButton (Mobile Toggle)
```

### State Management

- **Mobile Open State**: Local state in `Sidebar.tsx`
- **Desktop Minimized State**: From `SidebarContext` (global)
- **Accent Color**: From `AccentColorContext` (global)
- **Submenu Expansion**: Local state in `NavItem.tsx`

## 🎨 Styling

The sidebar uses Tailwind CSS with the following color system:

- **Background**: `bg-[#f8f8f8]/95` (light) / `bg-zinc-900/95` (dark)
- **Borders**: `border-zinc-200` (light) / `border-zinc-800` (dark)
- **Text**: `text-zinc-700` (light) / `text-zinc-300` (dark)
- **Active State**: Uses accent color from `AccentColorContext`

## 🔄 State Behaviors

### Desktop Mode
- Sidebar is always visible
- Can be minimized (width: 64px) or expanded (width: 256px)
- Minimized state shows only icons, expanded shows full text

### Mobile Mode
- Sidebar is initially visible
- Overlays content with a backdrop
- Can be toggled with the mobile menu button
- Clicking backdrop closes the sidebar

## 🛠️ Customization

### Adding New Categories

Edit `utils.ts` to add new categories to the order:

```typescript
const categoryOrder = [
  "My Workspace",
  "Department",
  "Cross Department",
  "Control Panel",
  "Your New Category", // Add here
];
```

### Modifying Default Navigation

Edit `navConfig.tsx` to add/remove/modify default navigation items:

```tsx
export const defaultNavItems: NavItem[] = [
  // Add your items here
];
```

### Styling Adjustments

Each component has isolated styling that can be customized:

- **SidebarHeader**: Logo and title styling
- **NavItem**: Item hover states and active states
- **NavCategory**: Category header styling

## 📱 Responsive Breakpoints

- **Mobile**: < 768px (md breakpoint)
  - Full overlay sidebar
  - Toggle button visible
  - Always expanded when open

- **Desktop**: ≥ 768px
  - Sticky sidebar
  - Can be minimized
  - No toggle button

## 🔍 Key Utilities

### `groupItemsByCategory()`

Groups navigation items by their category property.

```typescript
function groupItemsByCategory(items: NavItem[]): NavCategory[]
```

**Parameters:**
- `items`: Array of navigation items

**Returns:**
- Array of categorized navigation items with ordering applied

## 💡 Best Practices

1. **Keep Navigation Flat**: Avoid deeply nested submenus
2. **Use Meaningful Icons**: Choose icons that clearly represent their function
3. **Categorize Logically**: Group related items together
4. **Limit Categories**: 4-6 categories maximum for clarity
5. **Performance**: Icons are React nodes, consider memoization for large lists

## 🐛 Troubleshooting

### Sidebar Not Showing
- Check if `SidebarContext` is properly set up in parent layout
- Verify z-index conflicts with other components

### Active State Not Working
- Ensure route paths match exactly (including trailing slashes)
- Check if `usePathname()` is returning expected values

### Minimized State Not Persisting
- Verify `SidebarContext` provider is wrapping the component
- Check browser console for context errors

## 🔗 Dependencies

- `next/link`: Navigation
- `next/navigation`: Route detection
- `react`: Component library
- Custom Contexts:
  - `SidebarContext`: Minimized state management
  - `AccentColorContext`: Theme color management

## 📝 Migration Guide

If migrating from the old monolithic `Sidebar.tsx`:

1. All functionality is preserved
2. Import path remains the same: `@/app/dashboard/components/Sidebar`
3. Props interface is unchanged
4. No code changes needed in parent components

The old file now acts as a re-export for backward compatibility.

## 🎓 Learn More

- [Next.js Navigation](https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Component Patterns](https://reactpatterns.com/)
