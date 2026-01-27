// lib/shared/utils/validation.ts

/**
 * Centralized validation messages for Zod schemas
 *
 * This file ensures consistency across all form validations and makes it easy to:
 * - Update validation messages in one place
 * - Support future internationalization (i18n)
 * - Maintain consistent tone and messaging
 */

/**
 * Standard validation messages for common scenarios
 */
export const VALIDATION_MESSAGES = {
  // Required fields
  REQUIRED: "This field is required.",
  REQUIRED_FIELD: (fieldName: string) => `${fieldName} is required.`,

  // Empty/whitespace validation
  EMPTY_WHITESPACE: "Cannot be empty or only whitespace.",

  // Format validation
  INVALID_FORMAT:
    "Only letters (including accents), numbers, underscores, percentage signs, spaces, commas, periods, hyphens, and @ are allowed.",

  // Number validation
  MIN_ZERO: "Must be 0 or greater.",
  MIN_VALUE: (min: number) => `Must be ${min} or greater.`,
  MAX_VALUE: (max: number) => `Must be ${max} or less.`,
  POSITIVE_NUMBER: "Must be a positive number.",
  NON_NEGATIVE: "Must be 0 or greater.",
  INTEGER: "Must be a whole number.",

  // Range validation
  RANGE: (min: number, max: number) => `Must be between ${min} and ${max}.`,
  YEAR_RANGE: "Year must be between 2000 and 2100.",
  YEAR_MIN: "Year must be 2000 or later.",
  YEAR_MAX: "Year must be 2100 or earlier.",
  PERCENTAGE_RANGE: "Must be between 0 and 100.",

  // String length validation
  TOO_SHORT: (min: number) => `Must be at least ${min} character${min === 1 ? '' : 's'}.`,
  TOO_LONG: (max: number) => `Maximum ${max} character${max === 1 ? '' : 's'} allowed.`,
  EXACT_LENGTH: (length: number) => `Must be exactly ${length} character${length === 1 ? '' : 's'}.`,

  // Email validation
  INVALID_EMAIL: "Please enter a valid email address.",

  // URL validation
  INVALID_URL: "Please enter a valid URL.",

  // Date validation
  INVALID_DATE: "Please enter a valid date.",
  DATE_IN_PAST: "Date must be in the past.",
  DATE_IN_FUTURE: "Date must be in the future.",
  DATE_BEFORE: (date: string) => `Date must be before ${date}.`,
  DATE_AFTER: (date: string) => `Date must be after ${date}.`,

  // Budget-specific validation
  OBLIGATED_EXCEEDS_ALLOCATED:
    "Obligated budget cannot exceed allocated budget.",
  UTILIZED_EXCEEDS_OBLIGATED:
    "Utilized budget cannot exceed obligated budget.",
  UTILIZED_EXCEEDS_ALLOCATED:
    "Utilized budget cannot exceed allocated budget.",

  // Unique validation
  DUPLICATE_VALUE: "This value already exists.",
  DUPLICATE_FIELD: (fieldName: string) => `This ${fieldName} already exists.`,

  // Custom patterns
  ALPHANUMERIC_ONLY: "Only letters and numbers are allowed.",
  NO_SPECIAL_CHARS: "Special characters are not allowed.",
} as const;

/**
 * Validation limits used across the application
 */
export const VALIDATION_LIMITS = {
  // Year constraints
  MIN_YEAR: 2000,
  MAX_YEAR: 2100,

  // String length constraints
  MAX_TEXT_LENGTH: 255,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_TEXTAREA_LENGTH: 5000,

  // Number constraints
  MIN_BUDGET: 0,
  MAX_BUDGET: 999999999999, // 1 trillion - 1
  MIN_PERCENTAGE: 0,
  MAX_PERCENTAGE: 100,
} as const;

/**
 * Common regex patterns for validation
 */
export const VALIDATION_PATTERNS = {
  // Allow accented letters, spaces, %, commas, periods, hyphens, and @
  CODE: /^[\p{L}0-9_%\s,.\-@]+$/u,

  // Alphanumeric with spaces
  ALPHANUMERIC_SPACES: /^[a-zA-Z0-9\s]+$/,

  // Alphanumeric only (no spaces)
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,

  // Letters only (including accented)
  LETTERS_ONLY: /^[\p{L}\s]+$/u,

  // Numbers only
  NUMBERS_ONLY: /^\d+$/,

  // Email (basic pattern)
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Phone number (flexible format)
  PHONE: /^[\d\s\-\+\(\)]+$/,
} as const;

/**
 * Helper functions for creating validation messages
 */
export const createValidationMessage = {
  /**
   * Create a "required" message for a specific field
   */
  required: (fieldName: string) => VALIDATION_MESSAGES.REQUIRED_FIELD(fieldName),

  /**
   * Create a "minimum value" message
   */
  min: (value: number) => VALIDATION_MESSAGES.MIN_VALUE(value),

  /**
   * Create a "maximum value" message
   */
  max: (value: number) => VALIDATION_MESSAGES.MAX_VALUE(value),

  /**
   * Create a "range" message
   */
  range: (min: number, max: number) => VALIDATION_MESSAGES.RANGE(min, max),

  /**
   * Create a "too short" message for string length
   */
  tooShort: (min: number) => VALIDATION_MESSAGES.TOO_SHORT(min),

  /**
   * Create a "too long" message for string length
   */
  tooLong: (max: number) => VALIDATION_MESSAGES.TOO_LONG(max),
} as const;