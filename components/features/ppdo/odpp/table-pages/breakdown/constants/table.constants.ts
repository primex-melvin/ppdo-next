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
    width: 280,       // Default pixel width
    flex: 3,
    minWidth: 180,
    maxWidth: 450,
    type: "text",
    align: "left"
  },
  {
    key: "implementingOffice",
    label: "Implementing Office",
    width: 180,
    flex: 2,
    minWidth: 140,
    maxWidth: 300,
    type: "text",
    align: "left"
  },
  {
    key: "allocatedBudget",
    label: "Allocated Budget",
    width: 150,
    flex: 1.5,
    minWidth: 110,
    maxWidth: 200,
    type: "currency",
    align: "right"
  },
  {
    key: "obligatedBudget",
    label: "Obligated Budget",
    width: 150,
    flex: 1.5,
    minWidth: 110,
    maxWidth: 200,
    type: "currency",
    align: "right"
  },
  {
    key: "budgetUtilized",
    label: "Budget Utilized",
    width: 150,
    flex: 1.5,
    minWidth: 110,
    maxWidth: 200,
    type: "currency",
    align: "right"
  },
  {
    key: "utilizationRate",
    label: "Utilization Rate",
    width: 120,
    flex: 1.2,
    minWidth: 100,
    maxWidth: 160,
    type: "number",
    align: "right"
  },
  {
    key: "balance",
    label: "Balance",
    width: 150,
    flex: 1.5,
    minWidth: 110,
    maxWidth: 200,
    type: "currency",
    align: "right"
  },
  {
    key: "dateStarted",
    label: "Date Started",
    width: 120,
    flex: 1.2,
    minWidth: 100,
    maxWidth: 160,
    type: "date",
    align: "left"
  },
  {
    key: "targetDate",
    label: "Target Date",
    width: 120,
    flex: 1.2,
    minWidth: 100,
    maxWidth: 160,
    type: "date",
    align: "left"
  },
  {
    key: "completionDate",
    label: "Completion Date",
    width: 120,
    flex: 1.2,
    minWidth: 100,
    maxWidth: 160,
    type: "date",
    align: "left"
  },
  {
    key: "projectAccomplishment",
    label: "Accomplishment %",
    width: 100,
    flex: 1,
    minWidth: 80,
    maxWidth: 140,
    type: "number",
    align: "right"
  },
  {
    key: "status",
    label: "Status",
    width: 120,
    flex: 1,
    minWidth: 90,
    maxWidth: 180,
    type: "status",
    align: "center"
  },
  {
    key: "remarks",
    label: "Remarks",
    width: 250,
    flex: 2,
    minWidth: 150,
    maxWidth: 400,
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
