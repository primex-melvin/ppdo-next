# Responsive Design Patterns

The PPDO table toolbars implement consistent responsive patterns to ensure usability across all device sizes.

## Breakpoint Strategy

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | `< 640px` (sm) | Minimal UI, most in "More" menu |
| Tablet | `640px - 1023px` | Compact buttons, icons only |
| Desktop | `1024px+` (lg) | Full UI, all actions visible |
| Wide | `1280px+` (xl) | Full button labels |

## Core Layout Pattern

```tsx
<div className="flex items-center justify-between gap-4">
  {/* LEFT: Title/Selection */}
  <div className="min-w-[200px]">
    {/* Title or selection badge */}
  </div>

  {/* RIGHT: Actions */}
  <div className="flex items-center gap-2 flex-1 justify-end">
    {/* Search */}
    {/* Desktop Actions (hidden lg:flex) */}
    {/* Mobile Actions (flex lg:hidden) */}
    {/* Add Button */}
  </div>
</div>
```

## ResponsiveMoreMenu Component

**Location**: `components/shared/table/ResponsiveMoreMenu.tsx`

A container for actions that don't fit on smaller screens:

```tsx
interface ResponsiveMoreMenuProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveMoreMenu({ children, className }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">More options</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## Desktop vs. Mobile Actions

### Desktop Actions Pattern

```tsx
{/* Hidden on mobile, visible on desktop */}
<div className="hidden lg:flex items-center gap-2">
  <ColumnVisibilityMenu {...props} />
  <Button onClick={onOpenTrash}>
    <Trash2 className="w-4 h-4" />
    <span className="hidden xl:inline">Recycle Bin</span>
  </Button>
  <ExportDropdown />
  {isAdmin && <ShareButton />}
</div>
```

### Mobile Actions Pattern

```tsx
{/* Visible on mobile, hidden on desktop */}
<div className="flex lg:hidden items-center gap-1">
  <ColumnVisibilityMenu {...props} />

  <ResponsiveMoreMenu>
    <DropdownMenuItem onClick={onOpenTrash}>
      <Trash2 className="w-4 h-4 mr-2" />
      Recycle Bin
    </DropdownMenuItem>
    <DropdownMenuItem onClick={onExportCSV}>
      <FileSpreadsheet className="w-4 h-4 mr-2" />
      Export CSV
    </DropdownMenuItem>
    {isAdmin && (
      <DropdownMenuItem onClick={onOpenShare}>
        <Share2 className="w-4 h-4 mr-2" />
        Share
      </DropdownMenuItem>
    )}
  </ResponsiveMoreMenu>
</div>
```

## Animated Search Expansion

On mobile, the search input expands to fill available space when focused:

```tsx
const [isSearchFocused, setIsSearchFocused] = useState(false);
const isSearchExpanded = isSearchFocused || (searchQuery && searchQuery.length > 0);

// Title fades out on mobile when search expands
<AnimatePresence mode="popLayout">
  {(!isSearchExpanded || window.innerWidth >= 1024) && (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, width: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Title or Selection Badge */}
    </motion.div>
  )}
</AnimatePresence>

// Search expands
<motion.div
  animate={{
    width: isSearchExpanded ? "100%" : "20rem",
    flexGrow: isSearchExpanded ? 1 : 0
  }}
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
>
  <input
    onFocus={() => setIsSearchFocused(true)}
    onBlur={() => setIsSearchFocused(false)}
    // ...
  />
</motion.div>

// Actions fade out when search expands
<AnimatePresence>
  {!isSearchExpanded && (
    <motion.div
      initial={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, width: 0 }}
      animate={{ opacity: 1, scale: 1, width: "auto" }}
    >
      {/* Action buttons */}
    </motion.div>
  )}
</AnimatePresence>
```

## Responsive Button Labels

Labels hide at different breakpoints:

```tsx
<Button>
  <Icon className="w-4 h-4" />
  <span className="hidden xl:inline">Full Label</span>
</Button>
```

Or for "Add" buttons:

```tsx
<Button>
  <span className="text-lg">+</span>
  <span className="hidden md:inline">Add New Item</span>
  <span className="md:hidden">Add</span>
</Button>
```

## Selection Badge Responsive

The selection badge adapts to screen size:

```tsx
<Badge className="px-2 py-1 h-7">
  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
  {selectedCount} Selected
</Badge>
<Button
  variant="ghost"
  size="sm"
  onClick={onClearSelection}
  className="text-xs h-7"
>
  Clear
</Button>
```

## Icon Button Sizing

Consistent icon button sizing across breakpoints:

```tsx
// Standard button with icon
<Button variant="outline" size="sm" className="gap-2">
  <Icon className="w-4 h-4" />
</Button>

// Icon-only button (mobile)
<Button variant="ghost" size="icon" className="h-8 w-8">
  <Icon className="w-4 h-4" />
</Button>
```

## Separator Visibility

Separators hidden on mobile:

```tsx
<Separator
  orientation="vertical"
  className="h-6 mx-1 hidden sm:block"
/>
```

## Tooltip Considerations

Tooltips work best on desktop with hover:

```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button>
        <Icon />
        <span className="hidden xl:inline">Label</span>
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Full description for tooltip</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

## Print Considerations

Hide toolbar when printing:

```css
.no-print {
  @media print {
    display: none !important;
  }
}
```

```tsx
<div className="h-16 ... no-print">
  {/* Toolbar content */}
</div>
```

## Testing Responsive Behavior

Test at these key widths:

| Width | Test Focus |
|-------|------------|
| 375px | Mobile (iPhone) |
| 414px | Mobile (larger phones) |
| 768px | Tablet |
| 1024px | Small desktop |
| 1280px | Standard desktop |
| 1440px+ | Wide desktop |
