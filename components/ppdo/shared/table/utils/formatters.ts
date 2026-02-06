
/**
 * Shared Formatting Utilities
 */

export const CURRENCY_FORMAT_OPTIONS: Intl.NumberFormatOptions = {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
};

export const LOCALE = "en-PH";

/**
 * Formats a number as currency (PHP)
 */
export function formatCurrency(value: number | undefined | null): string {
    if (value === undefined || value === null) return "-";
    return new Intl.NumberFormat(LOCALE, CURRENCY_FORMAT_OPTIONS).format(value);
}

/**
 * Formats a timestamp as a date string
 */
export function formatDate(timestamp: number | undefined | null): string {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleDateString(LOCALE);
}

/**
 * Formats a number as percentage with 1 decimal place
 */
export function formatPercentage(value: number | undefined | null): string {
    if (value === undefined || value === null) return "-";
    return `${parseFloat(String(value)).toFixed(1)}%`;
}
