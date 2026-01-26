// components/ppdo/breakdown/constants/table.constants.ts

/**
 * Centralized Table Constants for Breakdown Components
 *
 * These constants are used by both Project and Trust Fund breakdown tables.
 */

import { ColumnConfig } from "../types/breakdown.types";

export const TABLE_IDENTIFIER = "breakdown";

// Row height settings
export const DEFAULT_ROW_HEIGHT = 42;
export const MIN_COLUMN_WIDTH = 80;
export const MIN_ROW_HEIGHT = 28;

export const TABLE_HEIGHT = "700px";

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  {
    key: "projectTitle",
    label: "Project Name",
    width: 200,
    type: "text",
    align: "left"
  },
  {
    key: "implementingOffice",
    label: "Implementing Office",
    width: 160,
    type: "text",
    align: "left"
  },
  {
    key: "allocatedBudget",
    label: "Allocated Budget",
    width: 120,
    type: "currency",
    align: "right"
  },
  {
    key: "obligatedBudget",
    label: "Obligated Budget",
    width: 120,
    type: "currency",
    align: "right"
  },
  {
    key: "budgetUtilized",
    label: "Budget Utilized",
    width: 120,
    type: "currency",
    align: "right"
  },
  {
    key: "utilizationRate",
    label: "Utilization Rate",
    width: 100,
    type: "number",
    align: "right"
  },
  {
    key: "balance",
    label: "Balance",
    width: 120,
    type: "currency",
    align: "right"
  },
  {
    key: "dateStarted",
    label: "Date Started",
    width: 110,
    type: "date",
    align: "left"
  },
  {
    key: "targetDate",
    label: "Target Date",
    width: 110,
    type: "date",
    align: "left"
  },
  {
    key: "completionDate",
    label: "Completion Date",
    width: 110,
    type: "date",
    align: "left"
  },
  {
    key: "projectAccomplishment",
    label: "Accomplishment %",
    width: 80,
    type: "number",
    align: "right"
  },
  {
    key: "status",
    label: "Status",
    width: 100,
    type: "status",
    align: "center"
  },
  {
    key: "remarks",
    label: "Remarks",
    width: 180,
    type: "text",
    align: "left"
  },
];

export const CURRENCY_FORMAT_OPTIONS: Intl.NumberFormatOptions = {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
};

export const LOCALE = "en-PH";
