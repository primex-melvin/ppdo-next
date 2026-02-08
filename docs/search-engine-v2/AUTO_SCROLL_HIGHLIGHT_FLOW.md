# Auto-Scroll Highlight Flow

This document details the architecture and implementation of the "Search & Highlight" feature, which allows users to click a search result and be automatically scrolled to and highlighted on the target item.

## 1. Overview

The flow consists of three main parts:
1.  **Deep Linking**: The Search Engine generates a URL with a `highlight` query parameter.
2.  **State Management**: The `useAutoScrollHighlight` hook on the target page detects the parameter.
3.  **Visual Feedback**: The target component applies a CSS class for scrolling and animation.

---

## 2. Architecture & Flow

### A. URL Generation (Backend)
**File**: `convex/search/index.ts`

When a user searches, the `getEntityUrl` function appends `?highlight={entityId}` to the destination URL.

**Example**:
- Search Result: "Slope Protection Project 2026"
- Generated URL: `/dashboard/project/2026?highlight=jd7...`

### B. The Hook (Frontend Logic)
**File**: `lib/shared/hooks/useAutoScrollHighlight.ts`

This reusable hook is responsible for:
1.  Reading the `highlight` content from the URL.
2.  Waiting for the data to load (ensuring the target ID exists in the rendered list).
3.  Finding the DOM element with ID `row-{entityId}`.
4.  Scrolling the element into view (centered).
5.  Returning an `isHighlighted(id)` function to the parent component.
6.  Cleaning up the URL parameter after a short delay.

### C. Component Integration (Frontend UI)

Target tables (e.g., `ProjectsTable`, `BudgetTable`) must:
1.  Call the hook with the list of currently rendered IDs.
2.  Pass the `isHighlighted` status down to the row component.
3.  Ensure the row component renders with `id="row-{entityId}"`.

---

## 3. Implementation Details

### CSS Animations
**File**: `app/globals.css`

The class `.highlight-row-active` triggers two animations:
- `highlight-pulse`: A yellow outline pulsing effect (runs twice).
- `highlight-fade-out`: Slowly removes the highlight.

### Shared Hook Usage

```typescript
// In your Page/Table component
import { useAutoScrollHighlight } from "@/lib/shared/hooks/useAutoScrollHighlight";

export function MyTable({ items }) {
  // 1. Initialize Hook
  const { isHighlighted } = useAutoScrollHighlight(
    items.map(item => item.id), 
    { scrollDelay: 200 }
  );

  return (
    <table>
      <tbody>
        {items.map(item => (
          <MyRow 
            key={item.id} 
            item={item} 
            // 2. Pass highlight status
            isHighlighted={isHighlighted(item.id)} 
          />
        ))}
      </tbody>
    </table>
  );
}
```

### Row Component Implementation

```typescript
// In your Row component
export function MyRow({ item, isHighlighted }) {
  return (
    <tr
      // 3. Set standard ID
      id={`row-${item.id}`} 
      // 4. Apply active class
      className={isHighlighted ? "highlight-row-active" : ""} 
    >
      {/* cells */}
    </tr>
  );
}
```

---

## 4. Current Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Backend** | ✅ Complete | URLs correctly generated in `convex/search/index.ts`. |
| **Hook** | ✅ Complete | `useAutoScrollHighlight.ts` is robust and handles waiting/scrolling. |
| **Budget Table** | ✅ Complete | `BudgetTrackingTable.tsx` passes `isHighlighted` correctly. |
| **Projects Table** | ⚠️ Partial | `ProjectsTable.tsx` calls the hook but **fails to pass** `isHighlighted` to the row. The row will scroll (due to ID) but **will not visually highlight**. |

### Required Fix for Projects Table
In `components/features/ppdo/odpp/utilities/data-tables/tables/ProjectsTable.tsx`:

```typescript
// Inside the map function
<ResizableTableRow
    // ... existing props
    isHighlighted={isHighlighted(project.id)} // Add this line
/>
```
