// app/dashboard/project/[year]/lib/print-adapters/BudgetPrintAdapter.ts
/**
 * Budget-specific print adapter
 * Converts BudgetItem[] data to generic printable format
 */

import { PrintDataAdapter, PrintableData, PrintColumnDefinition, PrintRowMarker } from '@/lib/print/adapters/types';
import { BudgetItem } from '@/app/dashboard/project/[year]/types/budget.types';
import { BudgetTotals, ColumnDefinition } from '@/lib/print-canvas/types';

export class BudgetPrintAdapter implements PrintDataAdapter<BudgetItem[]> {
  constructor(
    private budgetItems: BudgetItem[],
    private totals: BudgetTotals,
    private columns: ColumnDefinition[],
    private year: number,
    private particular?: string
  ) {}

  /**
   * Convert budget items to printable format
   */
  toPrintableData(): PrintableData {
    return {
      items: this.budgetItems.map(item => ({
        ...item,
        id: item.id,
      })),
      totals: this.convertTotalsToRecord(this.totals),
      metadata: {
        title: `Budget Tracking ${this.year}`,
        subtitle: this.particular ? `Particular: ${this.particular}` : undefined,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Get column definitions from the provided columns
   */
  getColumnDefinitions(): PrintColumnDefinition[] {
    return this.columns.map(col => ({
      key: col.key,
      label: col.label,
      align: col.align as 'left' | 'center' | 'right',
      sortable: col.sortable,
      filterable: col.filterable,
    }));
  }

  /**
   * No row markers for budget (optional implementation)
   */
  getRowMarkers(): PrintRowMarker[] | undefined {
    return undefined;
  }

  /**
   * Get unique identifier for this dataset
   */
  getDataIdentifier(): string {
    return `budget-${this.year}-${this.particular || 'all'}`;
  }

  /**
   * Convert BudgetTotals to generic totals record
   */
  private convertTotalsToRecord(totals: BudgetTotals): Record<string, number> {
    return {
      totalBudgetAllocated: totals.totalBudgetAllocated,
      obligatedBudget: totals.obligatedBudget,
      totalBudgetUtilized: totals.totalBudgetUtilized,
      projectCompleted: totals.projectCompleted,
      projectDelayed: totals.projectDelayed,
      projectsOnTrack: totals.projectsOnTrack,
    };
  }
}
