// lib/shared/hooks/useAutoScrollHighlight.ts

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

/**
 * Hook for auto-scrolling and highlighting a row based on URL parameter
 *
 * This hook handles the "Search & Highlight" feature:
 * - Reads `?highlight={id}` from URL
 * - Scrolls the target element into view (center)
 * - Activates a yellow outline highlight for 3 seconds
 * - Cleans up the URL parameter after highlighting
 *
 * @param dataIds - Array of IDs currently rendered in the table
 * @param options - Configuration options
 * @returns Object with activeHighlightId and helper functions
 *
 * @example
 * ```tsx
 * const { activeHighlightId, isHighlighted } = useAutoScrollHighlight(
 *   budgetItems.map(item => item.id)
 * );
 *
 * // In row component:
 * <tr
 *   id={`row-${item.id}`}
 *   className={isHighlighted(item.id) ? "highlight-row-active" : ""}
 * >
 * ```
 */
export function useAutoScrollHighlight(
  dataIds: string[],
  options: {
    /** Duration in ms for the highlight effect (default: 3000) */
    highlightDuration?: number;
    /** Scroll behavior - 'smooth' or 'instant' (default: 'smooth') */
    scrollBehavior?: ScrollBehavior;
    /** Scroll block position - 'center', 'start', 'end', 'nearest' (default: 'center') */
    scrollBlock?: ScrollLogicalPosition;
    /** Whether to clean up the URL parameter after highlighting (default: true) */
    cleanupUrl?: boolean;
    /** Offset for sticky headers in pixels (default: 0) */
    headerOffset?: number;
    /** Delay before scrolling to allow data to load (default: 100) */
    scrollDelay?: number;
  } = {}
) {
  const {
    highlightDuration = 3000,
    scrollBehavior = "smooth",
    scrollBlock = "center",
    cleanupUrl = true,
    headerOffset = 0,
    scrollDelay = 100,
  } = options;

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const highlightId = searchParams.get("highlight");
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const hasScrolledRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function to clear highlight
  const clearHighlight = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setActiveHighlightId(null);
    hasScrolledRef.current = null;
  }, []);

  // Function to remove highlight param from URL
  const cleanupUrlParam = useCallback(() => {
    if (!cleanupUrl) return;

    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete("highlight");
    const newUrl = newParams.toString()
      ? `${pathname}?${newParams.toString()}`
      : pathname;

    // Use replaceState to avoid adding to history
    window.history.replaceState(null, "", newUrl);
  }, [cleanupUrl, pathname, searchParams]);

  // Main effect for scroll and highlight
  useEffect(() => {
    console.log('[SearchDebug] 🎯 useAutoScrollHighlight effect triggered', {
      highlightId,
      dataIdsCount: dataIds.length,
      hasAlreadyScrolled: hasScrolledRef.current === highlightId,
      timestamp: new Date().toISOString(),
    });

    // Skip if no highlight ID or already scrolled to this ID
    if (!highlightId || hasScrolledRef.current === highlightId) {
      console.log('[SearchDebug] ⏭️ Skipping - no highlightId or already scrolled', {
        highlightId,
        hasScrolledRef: hasScrolledRef.current,
      });
      return;
    }

    // Skip if the target ID is not in the data yet (data might still be loading)
    if (!dataIds.includes(highlightId)) {
      console.log('[SearchDebug] ⏳ Waiting - highlightId not in dataIds yet', {
        highlightId,
        dataIdsPreview: dataIds.slice(0, 5),
        totalDataIds: dataIds.length,
      });
      return;
    }

    console.log('[SearchDebug] ✅ HighlightId found in dataIds, proceeding with scroll', {
      highlightId,
    });

    // Mark that we've started processing this highlight ID
    hasScrolledRef.current = highlightId;

    // Clear any previous scroll timeout before starting a new one
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Delay scroll slightly to ensure DOM is ready
    // IMPORTANT: We use a ref for this timeout so it survives effect re-runs.
    // Previously, returning clearTimeout in the cleanup would cancel the scroll
    // when dataIds changed during React re-renders, before the scroll could execute.
    scrollTimeoutRef.current = setTimeout(() => {
      const elementId = `row-${highlightId}`;
      const element = document.getElementById(elementId);

      console.log('[SearchDebug] 🔍 Looking for element', {
        elementId,
        found: !!element,
        scrollDelay,
      });

      if (element) {
        console.log('[SearchDebug] 📜 Scrolling to element', {
          elementId,
          headerOffset,
          scrollBehavior,
          scrollBlock,
        });

        // Scroll the element into view
        // Note: For sticky headers, we might need custom scroll logic
        if (headerOffset > 0) {
          // Custom scroll with offset for sticky headers
          const elementRect = element.getBoundingClientRect();
          const absoluteElementTop = elementRect.top + window.pageYOffset;
          const middle = absoluteElementTop - (window.innerHeight / 2) + (elementRect.height / 2) - headerOffset;

          window.scrollTo({
            top: middle,
            behavior: scrollBehavior,
          });
          console.log('[SearchDebug] 📜 Custom scroll with offset executed');
        } else {
          // Standard scrollIntoView
          element.scrollIntoView({
            behavior: scrollBehavior,
            block: scrollBlock,
          });
          console.log('[SearchDebug] 📜 Standard scrollIntoView executed');
        }

        // Activate highlight
        setActiveHighlightId(highlightId);
        console.log('[SearchDebug] 💡 Highlight activated for:', highlightId);

        // Clean up URL param after a short delay
        setTimeout(() => {
          cleanupUrlParam();
          console.log('[SearchDebug] 🧹 URL param cleaned up');
        }, 500);

        // Clear highlight after duration
        timeoutRef.current = setTimeout(() => {
          setActiveHighlightId(null);
          console.log('[SearchDebug] ⏰ Highlight expired after', highlightDuration, 'ms');
        }, highlightDuration);
      } else {
        console.log('[SearchDebug] ❌ Element NOT found in DOM:', elementId);
      }
    }, scrollDelay);

    // Don't return a cleanup that clears scrollTimeoutRef - it's managed via the ref
    // and cleaned up on unmount below
  }, [
    highlightId,
    dataIds,
    highlightDuration,
    scrollBehavior,
    scrollBlock,
    headerOffset,
    scrollDelay,
    cleanupUrlParam,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Helper function to check if a specific ID is highlighted
  const isHighlighted = useCallback(
    (id: string) => activeHighlightId === id,
    [activeHighlightId]
  );

  // Get the CSS class for a row
  const getHighlightClass = useCallback(
    (id: string) => (activeHighlightId === id ? "highlight-row-active" : ""),
    [activeHighlightId]
  );

  return {
    /** The currently highlighted ID (null if none) */
    activeHighlightId,
    /** Check if a specific ID is currently highlighted */
    isHighlighted,
    /** Get the CSS class for a row */
    getHighlightClass,
    /** Manually clear the highlight */
    clearHighlight,
    /** The highlight ID from URL (even if not yet active) */
    pendingHighlightId: highlightId,
  };
}
