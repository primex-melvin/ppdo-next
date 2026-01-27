// lib/shared/table/column-definitions.tsx

import React from "react";
import { getStatusColor, getUtilizationColor } from "../utils/colors";

/**
 * Locale and formatting options for consistent number/date formatting
 */
const LOCALE = "en-PH";
const CURRENCY_FORMAT_OPTIONS: Intl.NumberFormatOptions = {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
};

/**
 * Interface for cell renderer props
 */
interface CellValue {
  value: any;
  row?: any; // Optional row data for context
}

/**
 * Reusable cell renderer for currency values
 * Formats numbers as PHP currency with right alignment
 *
 * @example
 * // In a table component:
 * <td className={currencyCell.className}>
 *   {currencyCell.render({ value: breakdown.allocatedBudget })}
 * </td>
 */
export const currencyCell = {
  className: "text-right tabular-nums",
  render: ({ value }: CellValue): React.ReactNode => {
    if (value == null || value === undefined || value === "") {
      return <span className="text-zinc-400 dark:text-zinc-600">-</span>;
    }
    const formatted = new Intl.NumberFormat(LOCALE, CURRENCY_FORMAT_OPTIONS).format(value);
    return <span>{formatted}</span>;
  },
};

/**
 * Reusable cell renderer for date values
 * Formats timestamps as localized date strings
 *
 * @example
 * // In a table component:
 * <td className={dateCell.className}>
 *   {dateCell.render({ value: breakdown.dateStarted })}
 * </td>
 */
export const dateCell = {
  className: "text-left",
  render: ({ value }: CellValue): React.ReactNode => {
    if (value == null || value === undefined || value === "") {
      return <span className="text-zinc-400 dark:text-zinc-600">-</span>;
    }
    const formatted = new Date(value).toLocaleDateString(LOCALE);
    return <span>{formatted}</span>;
  },
};

/**
 * Reusable cell renderer for status badges
 * Renders status text with appropriate color coding
 *
 * Supported statuses:
 * - completed (green)
 * - ongoing (blue)
 * - delayed (red)
 * - default (gray)
 *
 * @example
 * // In a table component:
 * <td className={statusBadgeCell.className}>
 *   {statusBadgeCell.render({ value: breakdown.status })}
 * </td>
 */
export const statusBadgeCell = {
  className: "text-center",
  render: ({ value }: CellValue): React.ReactNode => {
    if (!value) {
      return <span className="text-zinc-400 dark:text-zinc-600">-</span>;
    }
    const colorClass = getStatusColor(value);
    const displayText = String(value).charAt(0).toUpperCase() + String(value).slice(1);
    return (
      <span className={`text-xs font-medium ${colorClass}`}>
        {displayText}
      </span>
    );
  },
};

/**
 * Reusable cell renderer for percentage values
 * Formats numbers as percentages with 1 decimal place
 *
 * @example
 * // In a table component:
 * <td className={percentageCell.className}>
 *   {percentageCell.render({ value: breakdown.utilizationRate })}
 * </td>
 */
export const percentageCell = {
  className: "text-right tabular-nums",
  render: ({ value }: CellValue): React.ReactNode => {
    if (value == null || value === undefined || value === "") {
      return <span className="text-zinc-400 dark:text-zinc-600">-</span>;
    }
    const formatted = `${parseFloat(String(value)).toFixed(1)}%`;
    return <span>{formatted}</span>;
  },
};

/**
 * Reusable cell renderer for utilization rate with color coding
 * Shows percentage with conditional colors:
 * - >= 80%: Red (over-utilized)
 * - >= 60%: Orange (warning)
 * - < 60%: Green (healthy)
 *
 * @example
 * // In a table component:
 * <td className={utilizationCell.className}>
 *   {utilizationCell.render({ value: breakdown.utilizationRate })}
 * </td>
 */
export const utilizationCell = {
  className: "text-right tabular-nums",
  render: ({ value }: CellValue): React.ReactNode => {
    if (value == null || value === undefined || value === "") {
      return <span className="text-zinc-400 dark:text-zinc-600">-</span>;
    }
    const numericValue = parseFloat(String(value));
    const colorClass = getUtilizationColor(numericValue);
    const formatted = `${numericValue.toFixed(1)}%`;
    return (
      <span className={`font-medium ${colorClass}`}>
        {formatted}
      </span>
    );
  },
};

/**
 * Reusable cell renderer for plain text
 * Basic text rendering with truncation support
 *
 * @example
 * // In a table component:
 * <td className={textCell.className}>
 *   {textCell.render({ value: breakdown.projectTitle })}
 * </td>
 */
export const textCell = {
  className: "text-left",
  render: ({ value }: CellValue): React.ReactNode => {
    if (value == null || value === undefined || value === "") {
      return <span className="text-zinc-400 dark:text-zinc-600">-</span>;
    }
    return <span>{String(value)}</span>;
  },
};

/**
 * Reusable cell renderer for numeric values
 * Formats numbers with proper alignment
 *
 * @example
 * // In a table component:
 * <td className={numberCell.className}>
 *   {numberCell.render({ value: breakdown.quantity })}
 * </td>
 */
export const numberCell = {
  className: "text-right tabular-nums",
  render: ({ value }: CellValue): React.ReactNode => {
    if (value == null || value === undefined || value === "") {
      return <span className="text-zinc-400 dark:text-zinc-600">-</span>;
    }
    const formatted = new Intl.NumberFormat(LOCALE).format(value);
    return <span>{formatted}</span>;
  },
};

/**
 * Helper function to get the appropriate cell renderer based on column type
 *
 * @param type - Column type (currency, date, status, number, text)
 * @returns Cell renderer object with className and render function
 */
export function getCellRenderer(type: string) {
  switch (type) {
    case "currency":
      return currencyCell;
    case "date":
      return dateCell;
    case "status":
      return statusBadgeCell;
    case "percentage":
    case "number":
      return percentageCell;
    case "utilization":
      return utilizationCell;
    case "text":
    default:
      return textCell;
  }
}

/**
 * Helper function to render a cell value based on column type
 * This provides a simpler API for tables that just need the rendered value
 *
 * @param value - The cell value
 * @param columnType - Column type (currency, date, status, etc.)
 * @param row - Optional row data for context
 * @returns Rendered React node
 *
 * @example
 * // In a table component:
 * <td className="text-right">
 *   {renderCell(breakdown.allocatedBudget, "currency")}
 * </td>
 */
export function renderCell(value: any, columnType: string, row?: any): React.ReactNode {
  const renderer = getCellRenderer(columnType);
  return renderer.render({ value, row });
}

/**
 * Helper function to get the className for a column type
 * Useful for applying consistent styling to table cells
 *
 * @param columnType - Column type (currency, date, status, etc.)
 * @returns Tailwind className string
 *
 * @example
 * // In a table component:
 * <td className={getCellClassName("currency")}>
 *   {formatCurrency(value)}
 * </td>
 */
export function getCellClassName(columnType: string): string {
  const renderer = getCellRenderer(columnType);
  return renderer.className;
}
