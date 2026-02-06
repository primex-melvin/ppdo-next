// app/components/spreadsheet/utils/formatting.ts

/**
 * Format currency in PHP format
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Format number with thousands separator
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-PH").format(value);
}

/**
 * Format value based on column type
 */
export function formatValue(value: any, type: string): string {
  if (value === null || value === undefined) return "";
  
  switch (type) {
    case "currency":
      return formatCurrency(Number(value));
    case "percentage":
      return formatPercentage(Number(value));
    case "number":
      const num = Number(value);
      return num === 0 ? "0" : String(num);
    default:
      return String(value);
  }
}

/**
 * Generate column letters (A, B, C... Z, AA, AB...)
 */
export function generateColumnLetters(count: number): string[] {
  const letters: string[] = [];
  for (let i = 0; i < count; i++) {
    if (i < 26) {
      letters.push(String.fromCharCode(65 + i)); // A-Z
    } else {
      const firstLetter = String.fromCharCode(65 + Math.floor(i / 26) - 1);
      const secondLetter = String.fromCharCode(65 + (i % 26));
      letters.push(firstLetter + secondLetter); // AA, AB, AC...
    }
  }
  return letters;
}

/**
 * Get cell key from row and column
 */
export function getCellKey(row: number, col: number, columns: string[]): string {
  return `${columns[col]}${row}`;
}