// app/dashboard/particulars/_constants/particularConstants.ts

/**
 * Centralized constants for the Particulars module
 * 
 * This file contains all configurable values used across the particulars components.
 * Developers can easily modify these values without touching component logic.
 */

/**
 * UI Timing Constants
 */
export const UI_TIMING = {
  /**
   * Tooltip hover delay in milliseconds
   * How long the user must hover before the tooltip appears
   * @default 1000 (1 seconds)
   */
  TOOLTIP_HOVER_DELAY: 1000,

  /**
   * Search debounce delay in milliseconds
   * How long to wait after user stops typing before executing search
   * @default 300
   */
  SEARCH_DEBOUNCE_DELAY: 300,

  /**
   * Toast notification duration in milliseconds
   * How long success/info toasts are displayed
   * @default 2000 (2 seconds)
   */
  TOAST_DURATION: 2000,

  /**
   * URL copied feedback duration in milliseconds
   * How long to show "copied" state after copying URL
   * @default 2000 (2 seconds)
   */
  URL_COPIED_DURATION: 2000,

  /**
   * Animation delay per item in milliseconds
   * Used for staggered animations in tree view
   * @default 50
   */
  ANIMATION_DELAY_PER_ITEM: 50,

  /**
   * Suggestion dropdown close delay in milliseconds
   * Delay before closing suggestions on blur to allow click
   * @default 200
   */
  SUGGESTION_CLOSE_DELAY: 200,
} as const;

/**
 * Display Constants
 */
export const DISPLAY = {
  /**
   * Text truncation length for particular names
   * @default 20
   */
  TEXT_TRUNCATE_LENGTH: 20,

  /**
   * Maximum height for scrollable content areas
   * @default "calc(100vh-340px)"
   */
  MAX_CONTENT_HEIGHT: "calc(100vh-340px)",

  /**
   * Minimum search term length for showing suggestions
   * @default 2
   */
  MIN_SEARCH_LENGTH_FOR_SUGGESTIONS: 2,
} as const;

/**
 * Format Constants
 */
export const FORMAT = {
  /**
   * Currency code for formatting
   * @default "PHP"
   */
  CURRENCY_CODE: "PHP",

  /**
   * Locale for number/date formatting
   * @default "en-PH"
   */
  LOCALE: "en-PH",

  /**
   * Date format options
   */
  DATE_FORMAT: {
    year: "numeric" as const,
    month: "long" as const,
    day: "numeric" as const,
  },
} as const;

/**
 * Permission Constants
 */
export const PERMISSIONS = {
  /**
   * Roles that can view particulars
   */
  VIEW_ROLES: ["admin", "super_admin", "user"] as const,

  /**
   * Roles that can edit/delete particulars
   */
  MANAGE_ROLES: ["admin", "super_admin"] as const,

  /**
   * Roles that are denied access
   */
  DENIED_ROLES: ["inspector"] as const,
} as const;

/**
 * Helper function to get timing value
 */
export const getTiming = (key: keyof typeof UI_TIMING): number => {
  return UI_TIMING[key];
};

/**
 * Helper function to get display value
 */
export const getDisplay = (key: keyof typeof DISPLAY): string | number => {
  return DISPLAY[key];
};

/**
 * Helper function to format currency
 */
export const formatCurrency = (amount: number, minimumFractionDigits: number = 0): string => {
  return new Intl.NumberFormat(FORMAT.LOCALE, {
    style: "currency",
    currency: FORMAT.CURRENCY_CODE,
    minimumFractionDigits,
  }).format(amount);
};

/**
 * Helper function to format date
 */
export const formatDate = (timestamp?: number): string => {
  if (!timestamp) return "N/A";
  return new Date(timestamp).toLocaleDateString(FORMAT.LOCALE, FORMAT.DATE_FORMAT);
};