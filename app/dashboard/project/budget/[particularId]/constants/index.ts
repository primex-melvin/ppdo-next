// app/dashboard/project/budget/[particularId]/constants/index.ts

import { TableColumn } from "../types";

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  FORM_DRAFT: "project_form_draft",
  YEAR_PREFERENCE: "budget_year_preference",
  SHOW_DETAILS: "showBudgetDetails",
} as const;

// ============================================================================
// TABLE COLUMNS
// ============================================================================

export const AVAILABLE_COLUMNS: TableColumn[] = [
  { id: "particulars", label: "Particulars", sortable: true, align: "left" },
  { id: "implementingOffice", label: "Implementing Office", filterable: true, align: "left" },
  { id: "year", label: "Year", filterable: true, align: "center" },
  { id: "status", label: "Status", filterable: true, align: "left" },
  { id: "totalBudgetAllocated", label: "Budget Allocated", sortable: true, align: "right" },
  { id: "obligatedBudget", label: "Obligated Budget", sortable: true, align: "right" },
  { id: "totalBudgetUtilized", label: "Budget Utilized", sortable: true, align: "right" },
  { id: "utilizationRate", label: "Utilization Rate", sortable: true, align: "right" },
  { id: "projectCompleted", label: "Completed", sortable: true, align: "right" },
  { id: "projectDelayed", label: "Delayed", sortable: true, align: "right" },
  { id: "projectsOngoing", label: "Ongoing", sortable: true, align: "right" },
  { id: "remarks", label: "Remarks", align: "left" },
];

// ============================================================================
// CATEGORY COLORS
// ============================================================================

export const DEFAULT_CATEGORY_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
] as const;

export const UNCATEGORIZED_COLOR = "#71717a" as const;

// ============================================================================
// ANIMATION DURATIONS
// ============================================================================

export const ANIMATION = {
  NEW_PROJECT_DURATION: 2000, // 2 seconds
  SCROLL_DELAY: 100, // 100ms
} as const;

// ============================================================================
// EXPORT SETTINGS
// ============================================================================

export const EXPORT = {
  CSV_FILENAME_PREFIX: "projects_export",
  DATE_FORMAT: "YYYY-MM-DD",
} as const;