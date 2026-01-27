// lib/shared/hooks/useBreakpoint.ts

"use client";

import { useState, useEffect } from "react";

/**
 * Tailwind CSS default breakpoints
 * These match the default Tailwind configuration
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

/**
 * Return type for useBreakpoint hook
 */
export interface BreakpointState {
  /** Current window width in pixels */
  width: number;
  /** Whether viewport is mobile size (< 640px) */
  isMobile: boolean;
  /** Whether viewport is tablet size (>= 640px && < 1024px) */
  isTablet: boolean;
  /** Whether viewport is desktop size (>= 1024px) */
  isDesktop: boolean;
  /** Check if viewport is above a specific breakpoint */
  isAbove: (breakpoint: BreakpointKey) => boolean;
  /** Check if viewport is below a specific breakpoint */
  isBelow: (breakpoint: BreakpointKey) => boolean;
  /** Check if viewport matches a specific breakpoint range */
  isExactly: (breakpoint: BreakpointKey) => boolean;
}

/**
 * Hook for detecting viewport breakpoints and responsive behavior
 *
 * Centralizes viewport detection in JavaScript, allowing you to:
 * - Conditionally render entire sections based on screen size
 * - Make layout decisions in component logic
 * - Improve performance vs CSS-only display:none
 * - Respond to breakpoint changes in real-time
 *
 * @example
 * ```tsx
 * const { isMobile, isDesktop, isAbove } = useBreakpoint();
 *
 * // Conditionally render components
 * if (isMobile) {
 *   return <MobileView />;
 * }
 *
 * // Use in logic
 * const columns = isDesktop ? 4 : isTablet ? 2 : 1;
 *
 * // Check specific breakpoints
 * if (isAbove("lg")) {
 *   // Show advanced features on large screens
 * }
 * ```
 *
 * @param debounceMs - Optional debounce delay in milliseconds (default: 150)
 * @returns Breakpoint state with helpers
 */
export function useBreakpoint(debounceMs: number = 150): BreakpointState {
  const [width, setWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 0
  );

  useEffect(() => {
    // Skip if not in browser
    if (typeof window === "undefined") return;

    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      // Debounce resize events
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWidth(window.innerWidth);
      }, debounceMs);
    };

    // Set initial width
    setWidth(window.innerWidth);

    // Listen to resize events
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, [debounceMs]);

  const isMobile = width < BREAKPOINTS.sm;
  const isTablet = width >= BREAKPOINTS.sm && width < BREAKPOINTS.lg;
  const isDesktop = width >= BREAKPOINTS.lg;

  const isAbove = (breakpoint: BreakpointKey): boolean => {
    return width >= BREAKPOINTS[breakpoint];
  };

  const isBelow = (breakpoint: BreakpointKey): boolean => {
    return width < BREAKPOINTS[breakpoint];
  };

  const isExactly = (breakpoint: BreakpointKey): boolean => {
    const breakpointKeys = Object.keys(BREAKPOINTS) as BreakpointKey[];
    const currentIndex = breakpointKeys.indexOf(breakpoint);

    if (currentIndex === -1) return false;

    const min = BREAKPOINTS[breakpoint];
    const nextBreakpoint = breakpointKeys[currentIndex + 1];
    const max = nextBreakpoint ? BREAKPOINTS[nextBreakpoint] : Infinity;

    return width >= min && width < max;
  };

  return {
    width,
    isMobile,
    isTablet,
    isDesktop,
    isAbove,
    isBelow,
    isExactly,
  };
}

/**
 * Hook using matchMedia for more efficient breakpoint detection
 * Recommended for production use as it's more performant
 *
 * @example
 * ```tsx
 * const isMobile = useMediaQuery("(max-width: 639px)");
 * const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Skip if not in browser
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Create event listener
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
    // Legacy browsers
    else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [query]);

  return matches;
}

/**
 * Predefined media query hooks for common breakpoints
 */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.sm - 1}px)`);
}

export function useIsTablet(): boolean {
  return useMediaQuery(
    `(min-width: ${BREAKPOINTS.sm}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`
  );
}

export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
}

export function useIsAbove(breakpoint: BreakpointKey): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS[breakpoint]}px)`);
}

export function useIsBelow(breakpoint: BreakpointKey): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS[breakpoint] - 1}px)`);
}
