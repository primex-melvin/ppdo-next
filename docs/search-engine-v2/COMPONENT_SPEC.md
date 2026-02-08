# Search Result Card - Component Specification

## Overview
Individual search result card with highlighting, animations, and navigation.

## Props Interface
```typescript
interface SearchResultCardProps {
  result: SearchResult;
  index: number; // For stagger animation delay
}
```

## Visual Design

### Desktop Layout
```
┌─────────────────────────────────────────┐
│ [Project]              85% match        │  ← Header
├─────────────────────────────────────────┤
│ Project Ti<mark>tle</mark> Highlighted           │  ← Title
│ Description with <mark>highlight</mark>...       │  ← Description
│                                         │
│ [Particulars] [Status]                  │  ← Matched Fields
│                                         │
│ Created: Jan 15, 2024                   │  ← Metadata
├─────────────────────────────────────────┤
│ [View in Project]                       │  ← Footer Link
└─────────────────────────────────────────┘
```

### Mobile Layout
```
┌─────────────────────────┐
│ [Project]  85% match    │
├─────────────────────────┤
│ Project Ti<mark>tle</mark>        │
│ Description...          │
│ [Particulars]           │
│ Created: Jan 15         │
│ [View in Project]       │
└─────────────────────────┘
```

## Animation Specs

### Entrance Animation (Cascade)
```css
@keyframes cascade-in {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  70% {
    transform: translateY(-5px) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Stagger delays */
Card 0: 0ms
Card 1: 100ms
Card 2: 200ms
Card 3: 300ms
...
```

### Hover State
```css
hover: {
  shadow: "0 10px 25px -5px rgba(21, 128, 61, 0.1)",
  borderColor: "#15803D40",
  transform: "translateY(-2px)",
  transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)"
}
```

### Loading State
```css
loading: {
  overlay: "bg-background/80 backdrop-blur-sm",
  spinner: "text-[#15803D] size-8 animate-spin"
}
```

## Color Tokens

### Light Mode
| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#15803D` | Badges, buttons, borders |
| `--highlight-bg` | `#fef08a` | Mark background |
| `--highlight-text` | `#854d0e` | Mark text |
| `--card-bg` | `white` | Card background |
| `--muted` | `#71717a` | Metadata text |

### Dark Mode
| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#22c55e` | Brighter green for dark |
| `--highlight-bg` | `#a16207` | Darker yellow |
| `--highlight-text` | `#fef9c3` | Light text on mark |
| `--card-bg` | `#18181b` | Zinc-900 |
| `--muted` | `#a1a1aa` | Zinc-400 |

## Interaction States

### Default
- Border: 1px solid `border`
- Shadow: `shadow-sm`
- Cursor: `pointer`

### Hover
- Border: `border-[#15803D]/30`
- Shadow: `shadow-lg`
- Transform: `translateY(-2px)`

### Active/Clicking
- Transform: `scale(0.98)`
- Transition: 150ms

### Loading
- Overlay: `bg-background/80`
- Spinner: Centered, 32px
- Content: `opacity-50`

## Accessibility

### ARIA Attributes
```tsx
<article 
  role="listitem"
  aria-label={`Search result: ${title}`}
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
```

### Keyboard Navigation
- `Tab`: Focus card
- `Enter`: Navigate to source
- `Escape`: Clear focus

### Screen Reader
- Announces entity type
- Announces match percentage
- Announces highlighted terms count

## Responsive Breakpoints

| Breakpoint | Card Width | Padding | Font Size |
|------------|------------|---------|-----------|
| Mobile (<640px) | 100% | 16px | 16px title |
| Tablet (640-1024px) | 100% | 20px | 18px title |
| Desktop (>1024px) | 100% | 24px | 20px title |

## Error States

### No Highlights
- Show plain text (no mark tags)
- Still show match score

### No Source URL
- Hide footer button
- Card not clickable

### Invalid Date
- Show "Recently created" fallback

## Performance

### Optimization
- Use `will-change: transform` on cards
- Lazy load images if added
- Virtualize list for >50 results

### Bundle Size
- Target: <5KB gzipped
- Dependencies: lucide-react icons only
