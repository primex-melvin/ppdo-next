// lib/shared/utils/formatting.ts

export const LOCALE = "en-PH";

export const CURRENCY_FORMAT_OPTIONS: Intl.NumberFormatOptions = {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
};

/**
 * Formats number with commas for input fields
 * @param value - String value to format
 * @returns Formatted string with commas
 */
export function formatNumberWithCommas(value: string): string {
  // Remove all non-digit characters except decimal point
  const cleaned = value.replace(/[^\d.]/g, "");

  // Split by decimal point
  const parts = cleaned.split(".");

  // Format the integer part with commas
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Rejoin with decimal (limit to 2 decimal places)
  if (parts.length > 1) {
    return parts[0] + "." + parts[1].slice(0, 2);
  }

  return parts[0];
}

/**
 * Parses formatted number string to number
 * @param value - Formatted string
 * @returns Parsed number
 */
export function parseFormattedNumber(value: string): number {
  const cleaned = value.replace(/,/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats number for display (e.g. input blur)
 * @param value - Number value
 * @returns Formatted string
 */
export function formatNumberForDisplay(value: number): string {
  if (value === 0) return "";
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats currency value (PHP)
 * @param value - Number to format as currency
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null) return "-";
  return new Intl.NumberFormat(LOCALE, CURRENCY_FORMAT_OPTIONS).format(value);
}

/**
 * Formats a number as percentage
 * Assumes value is 0-100 (e.g. 85 for 85%)
 * @param value - Number to format
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number | undefined | null, decimals = 1): string {
  if (value === undefined || value === null) return "-";
  return `${Number(value).toFixed(decimals)}%`;
}

/**
 * Formats a timestamp as a date string
 * @param timestamp - Number timestamp or Date object
 * @returns Formatted date string
 */
export function formatDate(timestamp: number | Date | undefined | null): string {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleDateString(LOCALE);
}