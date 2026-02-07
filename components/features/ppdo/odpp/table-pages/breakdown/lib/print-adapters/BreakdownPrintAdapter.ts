// components/ppdo/breakdown/lib/print-adapters/BreakdownPrintAdapter.ts

/**
 * Breakdown-specific print adapter
 * Converts Breakdown[] data to generic printable format
 */

import { PrintDataAdapter, PrintableData, PrintColumnDefinition, PrintRowMarker } from '@/lib/print/adapters/types';
import { Breakdown, ColumnConfig } from '../../types/breakdown.types';

export class BreakdownPrintAdapter implements PrintDataAdapter<Breakdown[]> {
  constructor(
    private breakdowns: Breakdown[],
    private breakdownId: string,
    private columns?: ColumnConfig[],
    private entityName?: string
  ) { }

  /**
   * Convert breakdown items to printable format
   */
  toPrintableData(): PrintableData {
    return {
      items: this.breakdowns.map(breakdown => ({
        ...breakdown,
        id: breakdown._id,
      })),
      totals: this.calculateBreakdownTotals(),
      metadata: {
        title: this.entityName || `Breakdown History`,
        subtitle: this.entityName ? undefined : `ID: ${this.breakdownId}`,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Get column definitions for breakdown data
   */
  getColumnDefinitions(): PrintColumnDefinition[] {
    // Use provided columns or default columns
    const columnsToUse = this.columns || this.getDefaultColumns();

    return columnsToUse.map(col => ({
      key: col.key as string,
      label: col.label,
      align: col.align as 'left' | 'center' | 'right',
    }));
  }

  /**
   * No row markers for breakdown (optional implementation)
   */
  getRowMarkers(): PrintRowMarker[] | undefined {
    return undefined;
  }

  /**
   * Get unique identifier for this dataset
   */
  getDataIdentifier(): string {
    return `breakdown-${this.breakdownId}`;
  }

  /**
   * Calculate totals for breakdown data
   */
  private calculateBreakdownTotals(): Record<string, number> {
    const totals: Record<string, number> = {
      totalAllocatedBudget: 0,
      totalObligatedBudget: 0,
      totalBudgetUtilized: 0,
      totalItems: this.breakdowns.length,
    };

    this.breakdowns.forEach(breakdown => {
      totals.totalAllocatedBudget += breakdown.allocatedBudget || 0;
      totals.totalObligatedBudget += breakdown.obligatedBudget || 0;
      totals.totalBudgetUtilized += breakdown.budgetUtilized || 0;
    });

    if (totals.totalAllocatedBudget > 0) {
      totals.averageUtilizationRate =
        (totals.totalBudgetUtilized / totals.totalAllocatedBudget) * 100;
    }

    return totals;
  }

  /**
   * Default columns for breakdown if not provided
   */
  private getDefaultColumns(): ColumnConfig[] {
    return [
      { key: 'projectTitle', label: 'Project Name', width: 280, flex: 3, minWidth: 180, maxWidth: 450, type: 'text', align: 'left' },
      { key: 'implementingOffice', label: 'Implementing Office', width: 180, flex: 2, minWidth: 140, maxWidth: 300, type: 'text', align: 'left' },
      { key: 'allocatedBudget', label: 'Allocated Budget', width: 150, flex: 1.5, minWidth: 110, maxWidth: 200, type: 'currency', align: 'right' },
      { key: 'obligatedBudget', label: 'Obligated Budget', width: 150, flex: 1.5, minWidth: 110, maxWidth: 200, type: 'currency', align: 'right' },
      { key: 'budgetUtilized', label: 'Budget Utilized', width: 150, flex: 1.5, minWidth: 110, maxWidth: 200, type: 'currency', align: 'right' },
      { key: 'utilizationRate', label: 'Utilization Rate', width: 120, flex: 1.2, minWidth: 100, maxWidth: 160, type: 'number', align: 'right' },
      { key: 'balance', label: 'Balance', width: 150, flex: 1.5, minWidth: 110, maxWidth: 200, type: 'currency', align: 'right' },
      { key: 'status', label: 'Status', width: 120, flex: 1, minWidth: 90, maxWidth: 180, type: 'status', align: 'center' },
    ];
  }
}
