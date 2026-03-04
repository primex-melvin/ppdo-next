import type { BudgetItem } from '@/components/features/ppdo/odpp/table-pages/11_project_plan/types';
import type { BudgetTotals, ColumnDefinition } from '@/lib/print-canvas/types';
import type { BaseFund } from '../types';

interface FundsPrintPreviewInput<T extends BaseFund> {
  funds: T[];
  totals: {
    received: number;
    obligatedPR: number;
    utilized: number;
    balance: number;
    utilizationRate: number;
  };
  columns: ColumnDefinition[];
  year: number;
  title: string;
}

interface FundsPrintPreviewData {
  budgetItems: BudgetItem[];
  totals: BudgetTotals;
  columns: ColumnDefinition[];
  year: number;
  coverTitle: string;
  coverSubtitle: string;
  defaultDocumentTitle: string;
}

export function createFundsPrintPreviewData<T extends BaseFund>({
  funds,
  totals,
  columns,
  year,
  title,
}: FundsPrintPreviewInput<T>): FundsPrintPreviewData {
  const budgetItems = funds.map((fund) => ({
    id: fund.id,
    particular: fund.projectTitle,
    totalBudgetAllocated: fund.received,
    obligatedBudget: fund.obligatedPR || 0,
    totalBudgetUtilized: fund.utilized,
    utilizationRate: fund.utilizationRate ?? (fund.received > 0 ? (fund.utilized / fund.received) * 100 : 0),
    projectCompleted: fund.status === 'completed' ? 1 : 0,
    projectDelayed: fund.status === 'delayed' ? 1 : 0,
    projectsOngoing: fund.status === 'ongoing' || fund.status === 'on_process' ? 1 : 0,
    year: fund.year ?? fund.fiscalYear ?? year,
    status: (fund.status === 'completed' || fund.status === 'ongoing' || fund.status === 'delayed'
      ? fund.status
      : undefined) as BudgetItem['status'],
    aipRefCode: fund.aipRefCode,
    projectTitle: fund.projectTitle,
    officeInCharge: fund.officeInCharge,
    dateReceived: fund.dateReceived,
    received: fund.received,
    obligatedPR: fund.obligatedPR || 0,
    utilized: fund.utilized,
    balance: fund.balance,
    remarks: fund.remarks,
  })) as BudgetItem[];

  const printTotals = {
    totalBudgetAllocated: totals.received,
    obligatedBudget: totals.obligatedPR || 0,
    totalBudgetUtilized: totals.utilized,
    projectCompleted: 0,
    projectDelayed: 0,
    projectsOngoing: 0,
    received: totals.received,
    obligatedPR: totals.obligatedPR || 0,
    utilized: totals.utilized,
    balance: totals.balance,
    utilizationRate: totals.utilizationRate,
  } as BudgetTotals;

  return {
    budgetItems,
    totals: printTotals,
    columns,
    year,
    coverTitle: title,
    coverSubtitle: `Year ${year}`,
    defaultDocumentTitle: `${title} - ${year}`,
  };
}
