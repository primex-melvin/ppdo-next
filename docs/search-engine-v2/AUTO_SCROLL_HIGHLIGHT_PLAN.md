# Search Engine V2: Auto-Scroll & Highlight Implementation Plan

This document outlines the meticulous implementation plan for the "Search & Highlight" feature, explicitly assigning responsibilities to the **Best Senior Frontend Team**.

## 🎯 Objective
- **Deep Linking**: Search results navigation URLs will include a `?highlight={id}` query parameter.
- **Auto-Scroll**: Target pages will automatically scroll the target item into the viewport (center/bottom).
- **Visual Feedback**: The target row will have a yellow outline for 3 seconds to draw attention.

---

## 🤝 Team & Responsibilities

| Agent | Role | Responsibility |
|-------|------|----------------|
| **Elena Vance** | Lead Architect | Design the `useAutoScrollHighlight` hook, ensure performance (no re-render loops), and oversee integration. |
| **Marcus Sterling** | Senior UI/UX | Define the exact Tailwind classes for the "Yellow Outline" and "Fade Out" animation. Ensure it feels "premium". |
| **Kenji Sato** | Mobile Specialist | Ensure `scrollIntoView` works on mobile (accounting for sticky headers/notches) and touch targets remain accessible. |
| **Martina Stuart** | Documentation | Document the new hook, URL parameters, and update the "Search Engine V2" architecture docs. |
| **David Kim** | QA Tester | Create test cases for deep linking, expiration of highlights, and regression testing on tables. |
| **Backend Agent** | Backend | Update Convex schema/functions to generate the correct URLs. |

---

## 🏗️ Architecture (Managed by **Elena Vance**)

### 1. URL Structure Standard
We will use the query parameter `highlight` to pass the entity ID.
**Pattern**: `.../dashboard/project/2026?highlight=jd7.......`

### 2. New Hook: `useAutoScrollHighlight`
**Responsibility**: **Elena Vance** (Logic) & **Kenji Sato** (Mobile Offset)

A reusable hook that handles the logic for detecting the param, scrolling, and flashing the outline.

```typescript
// hooks/useAutoScrollHighlight.ts (Proposed)
export function useAutoScrollHighlight(
  dataIds: string[] // List of IDs currently rendered
) {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);

  useEffect(() => {
    if (highlightId && dataIds.includes(highlightId)) {
      const element = document.getElementById(`row-${highlightId}`);
      if (element) {
        // Kenji Sato: Ensure 'block: center' works well on mobile with sticky headers
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        setActiveHighlightId(highlightId);
        
        // Marcus Sterling: Define the timing (3s) for the visual cue
        const timer = setTimeout(() => setActiveHighlightId(null), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [highlightId, dataIds]);

  return { activeHighlightId };
}
```

---

## 🛠️ Implementation Steps

### 1. Backend: URL Generation
**Agent**: **Backend Agent**
**File**: `convex/search/index.ts`
**Task**: Update `getEntityUrl` to append `?highlight={entityId}`.

### 2. Frontend: Shared Hook
**Agent**: **Elena Vance**
**File**: `hooks/useAutoScrollHighlight.ts` (Create new)
**Task**: Implement the hook. ensuring it handles race conditions (data loading vs URL param).

### 3. Frontend: Logic & Mobile Optimization
**Agent**: **Kenji Sato**
**Task**: Verify `scrollIntoView` behavior on small screens. If the table header is sticky, ensure the row isn't hidden behind it. Might need a custom scroll offset utility instead of native `scrollIntoView`.

### 4. Frontend: Visuals & Integration
**Agent**: **Marcus Sterling**
**Task**: Define the highlight styles in `globals.css` or inline.

#### A. Projects Table Integration
**Files**:
- `components/features/ppdo/odpp/table-pages/11_project_plan/table/BudgetTrackingTable.tsx`
- `components/features/ppdo/odpp/table-pages/11_project_plan/table/BudgetTableRow.tsx`

**Changes**:
1.  **Elena**: Import and call `useAutoScrollHighlight`.
2.  **Marcus**: Apply classes: `transition-all duration-500`, `outline-yellow-400`, `box-shadow-lg`.

#### B. Trust Funds Table Integration
**Files**:
- `components/features/ppdo/odpp/table-pages/funds/table/FundsTable.tsx`
- `components/features/ppdo/odpp/table-pages/funds/table/FundsResizableTable.tsx`

**Changes**:
1.  **Elena**: Import and call `useAutoScrollHighlight`.
2.  **Marcus**: Ensure consistent styling with Projects table.

---

## 📚 Documentation (Managed by **Martina Stuart**)

**Task**:
1.  Create `docs/search-engine-v2/HOOKS.md` documenting `useAutoScrollHighlight`.
2.  Update `docs/search-engine-v2/SOURCE_URL_MAPPING.md` to show the new URL pattern.

---

## 🧪 QA Strategy (Managed by **David Kim**)

**Test Cases**:
1.  **Deep Link Test**:
    *   Load `/dashboard/project/2026?highlight=[ID]` directly in a new tab.
    *   **Verify**: Page scrolls to item after data loads.
    *   **Verify**: Yellow outline appears.
2.  **Timing Test**:
    *   **Verify**: Outline disappears exactly after 3 seconds.
3.  **Mobile Test (Kenji + David)**:
    *   **Verify**: On iPhone SE (small screen), the highlighted row is not obstructed by the sticky header.
4.  **Regression**:
    *   **Verify**: Normal table sorting/filtering still works and doesn't break the highlight if the row moves.

---

## 🚀 Execution Order (Parallel)

1.  **Backend Agent**: Updates Convex API.
2.  **Elena Vance**: Creates the Hook.
3.  **Marcus Sterling**: Prepares CSS styles.
4.  **Integration**: Elena & Marcus apply changes to Tables.
5.  **Kenji Sato**: Reviews Mobile behavior.
6.  **David Kim**: Runs verification suite.
7.  **Martina Stuart**: Finalizes docs.
