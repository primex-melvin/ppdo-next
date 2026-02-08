# Search Engine V2: UI/UX Improvements Plan

This document outlines the UI/UX enhancements for the Search Engine, focusing on mobile responsiveness, visual spacing, and input performance.

## 🎯 Objectives
1.  **Mobile Optimization**: Fix excessive padding in the "Filter by Category" sidebar on mobile.
2.  **Visual Breathing Room**: Increase vertical spacing between search result cards on large screens.
3.  **Typing Experience**: Fix "debounce ruining typing" issues in the search input field.

---

## 🤝 Team & Responsibilities

| Agent | Role | Responsibility |
|-------|------|----------------|
| **Elena Vance** | Lead Architect | Refactor `SearchInput.tsx` to decouple local state from parent prop updates (optimize debounce). |
| **Marcus Sterling** | Senior UI/UX | Implement the responsive padding (`lg:pt-40`) and dynamic spacing (`space-y-6`). |
| **Kenji Sato** | Mobile Specialist | Verify sidebar behavior on mobile (ensure it doesn't overlap header or have weird gaps). |
| **David Kim** | QA Tester | Test fast typing (100wpm) to ensure no cursor jumps or text loss. |

---

## 🛠️ Implementation Specs

### 1. Fix Mobile Filter Padding
**Component**: `components/search/CategorySidebar.tsx`
**Issue**: `pt-40` is applied globally, causing huge empty space on mobile/tablet.
**Fix**:
- **Marcus/Kenji**: Change `pt-40` to `lg:pt-40`.
- Define an appropriate padding for mobile (e.g., `pt-4` or `pt-20` if it's below a sticky header).
- **Plan**:
    ```tsx
    // Change line 176
    className={cn(
      "fixed right-0 top-0 ...",
      "pt-20 lg:pt-40", // Responsive padding
      // ...
    )}
    ```

### 2. Increase Card Gaps on Desktop
**Component**: `components/search/SearchResults.tsx`
**Issue**: `space-y-3` is too tight for large layouts.
**Fix**:
- **Marcus**: Update the container `div`.
- **Plan**:
    ```tsx
    // Change line 146
    <div className={cn("space-y-3 lg:space-y-6", className)}>
    ```

### 3. Fix Search Input Debounce
**Component**: `components/search/SearchInput.tsx`
**Issue**: The component synchronizes `value` prop to `localValue` in a `useEffect`. If the parent updates `value` (e.g., via URL state or async fetch) while the user is typing, it can overwrite `localValue` with an older state or cause cursor jumps.
**Fix**:
- **Elena**: Implement a "Draft State" pattern.
    1.  `localValue` should be the source of truth for the Input `value`.
    2.  `useEffect` syncing `value` -> `localValue` should **only** run if `value` changes **AND** it's significantly different (e.g., from a URL navigation), or utilize a `key` prop to force reset.
    3.  Alternatively, use a ref to track "user is typing" and block upstream updates during active typing.
- **Proposed Code Change**:
    ```typescript
    // Inside SearchInput.tsx

    // Track if the update comes from user typing
    const isTypingRef = React.useRef(false);

    React.useEffect(() => {
        // Only sync if we aren't currently typing (or maybe check logic deeper)
        // A simpler way: Only sync if value !== localValue AND the value seems authoritative
        if (value !== localValue && !isTypingRef.current) {
             setLocalValue(value);
        }
    }, [value]);

    const handleInputChange = (e) => {
        isTypingRef.current = true;
        setLocalValue(e.target.value);
        // ... debounce logic ...
        // Reset typing ref after delay or on blur
        setTimeout(() => { isTypingRef.current = false }, 500);
    };
    ```
    *Better Approach:* Move the Debounce **up** to the hook usage or use a library, but sticking to "modify existing" -> We will refine the `useEffect` to avoid race conditions.

---

## 🧪 Verification Plan (Managed by **David Kim**)

1.  **Visual Regression (Mobile)**:
    *   Open "Search Results" on Mobile View (Chrome DevTools).
    *   Verify the "Filter" sidebar starts at a reasonable height (not 10rem down).
2.  **Visual Regression (Desktop)**:
    *   Open "Search Results" on Desktop (1920px).
    *   Verify cards have `1.5rem` (24px) gap (`space-y-6`).
3.  **Typing Stress Test**:
    *   Type "Infrastructure Projects 2026" as fast as possible.
    *   **Pass**: Text appears exactly as typed, no characters lost, cursor stays at end.
    *   **Fail**: Text reverts to "Infra", or cursor jumps to start.

---

## 🚀 Execution Order

1.  **Elena Vance**: Refactors `SearchInput.tsx` logic.
2.  **Marcus Sterling**: Updates `CategorySidebar.tsx` and `SearchResults.tsx` styles.
3.  **Kenji Sato**: Confirms mobile layout.
4.  **David Kim**: Signs off on typing and responsiveness.
