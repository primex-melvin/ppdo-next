import type { BudgetTotals, ColumnDefinition } from "@/lib/print-canvas/types";
import type { BudgetItem } from "@/components/features/ppdo/odpp/table-pages/11_project_plan/types";
import type { Breakdown, ColumnConfig } from "../types/breakdown.types";

interface BreakdownPrintPreviewInput {
  rows: Breakdown[];
  columns: ColumnConfig[];
  year: number;
  entityName?: string;
}

interface BreakdownPrintPreviewData {
  budgetItems: BudgetItem[];
  columns: ColumnDefinition[];
  totals: BudgetTotals;
  year: number;
  coverTitle: string;
  coverSubtitle: string;
  defaultDocumentTitle: string;
}

export function createBreakdownPrintPreviewData({
  rows,
  columns,
  year,
  entityName,
}: BreakdownPrintPreviewInput): BreakdownPrintPreviewData {
  const printColumns = columns.map<ColumnDefinition>((column) => ({
    key: String(column.key),
    label: column.label,
    align: column.align,
  }));

  const budgetItems = rows.map<BudgetItem>((row) => ({
    id: String(row._id),
    particular: row.projectTitle || row.projectName || "-",
    totalBudgetAllocated: row.allocatedBudget || 0,
    obligatedBudget: row.obligatedBudget || 0,
    totalBudgetUtilized: row.budgetUtilized || 0,
    utilizationRate: row.utilizationRate || 0,
    projectCompleted: row.status === "completed" ? 1 : 0,
    projectDelayed: row.status === "delayed" ? 1 : 0,
    projectsOngoing: row.status === "ongoing" ? 1 : 0,
    year,
    status: row.status,
    implementingOffice: row.implementingOffice,
    projectName: row.projectName,
    projectTitle: row.projectTitle,
    allocatedBudget: row.allocatedBudget,
    budgetUtilized: row.budgetUtilized,
    balance: row.balance,
    dateStarted: row.dateStarted,
    targetDate: row.targetDate,
    completionDate: row.completionDate,
    projectAccomplishment: row.projectAccomplishment,
    remarks: row.remarks,
  }) as BudgetItem);

  const totals = budgetItems.reduce<BudgetTotals>((acc, item) => ({
    totalBudgetAllocated: acc.totalBudgetAllocated + item.totalBudgetAllocated,
    obligatedBudget: acc.obligatedBudget + (item.obligatedBudget || 0),
    totalBudgetUtilized: acc.totalBudgetUtilized + item.totalBudgetUtilized,
    projectCompleted: acc.projectCompleted + item.projectCompleted,
    projectDelayed: acc.projectDelayed + item.projectDelayed,
    projectsOngoing: acc.projectsOngoing + item.projectsOngoing,
  }), {
    totalBudgetAllocated: 0,
    obligatedBudget: 0,
    totalBudgetUtilized: 0,
    projectCompleted: 0,
    projectDelayed: 0,
    projectsOngoing: 0,
  });

  return {
    budgetItems,
    columns: printColumns,
    totals,
    year,
    coverTitle: entityName || `Breakdown Tracking ${year}`,
    coverSubtitle: `Historical breakdown and progress tracking for ${year}`,
    defaultDocumentTitle: `${entityName || "Breakdown"} - ${year}`,
  };
}
