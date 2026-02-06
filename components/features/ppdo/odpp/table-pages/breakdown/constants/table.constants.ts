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
    flex: 3,
    minWidth: 180,
    type: "text",
    align: "left"
  },
  {
    key: "implementingOffice",
    label: "Implementing Office",
    flex: 2,
    minWidth: 140,
    type: "text",
    align: "left"
  },
  {
    key: "allocatedBudget",
    label: "Allocated Budget",
    flex: 1.5,
    minWidth: 110,
    type: "currency",
    align: "right"
  },
  {
    key: "obligatedBudget",
    label: "Obligated Budget",
    flex: 1.5,
    minWidth: 110,
    type: "currency",
    align: "right"
  },
  {
    key: "budgetUtilized",
    label: "Budget Utilized",
    flex: 1.5,
    minWidth: 110,
    type: "currency",
    align: "right"
  },
  {
    key: "utilizationRate",
    label: "Utilization Rate",
    flex: 1.2,
    minWidth: 100,
    type: "number",
    align: "right"
  },
  {
    key: "balance",
    label: "Balance",
    flex: 1.5,
    minWidth: 110,
    type: "currency",
    align: "right"
  },
  {
    key: "dateStarted",
    label: "Date Started",
    flex: 1.2,
    minWidth: 100,
    type: "date",
    align: "left"
  },
  {
    key: "targetDate",
    label: "Target Date",
    flex: 1.2,
    minWidth: 100,
    type: "date",
    align: "left"
  },
  {
    key: "completionDate",
    label: "Completion Date",
    flex: 1.2,
    minWidth: 100,
    type: "date",
    align: "left"
  },
  {
    key: "projectAccomplishment",
    label: "Accomplishment %",
    flex: 1,
    minWidth: 80,
    type: "number",
    align: "right"
  },
  {
    key: "status",
    label: "Status",
    flex: 1,
    minWidth: 90,
    type: "status",
    align: "center"
  },
  {
    key: "remarks",
    label: "Remarks",
    flex: 2,
    minWidth: 150,
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
