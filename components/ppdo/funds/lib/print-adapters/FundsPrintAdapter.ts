import { PrintDataAdapter, PrintableData, PrintColumnDefinition, PrintRowMarker } from "@/lib/print/adapters/types";
import { BaseFund, FundStatistics } from "../../types";
import { ColumnDefinition } from "@/lib/print-canvas/types";

export class FundsPrintAdapter implements PrintDataAdapter<BaseFund[]> {
    constructor(
        private funds: BaseFund[],
        private statistics: FundStatistics | Record<string, any>,
        private columns: ColumnDefinition[],
        private year: number,
        private fundType: string,
        private title: string
    ) { }

    /**
     * Convert funds to printable format
     */
    toPrintableData(): PrintableData {
        return {
            items: this.funds.map(item => ({
                ...item,
                id: item.id,
            })),
            totals: this.convertStatisticsToRecord(this.statistics),
            metadata: {
                title: this.title,
                subtitle: `Year ${this.year}`,
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
     * No row markers for funds currently
     */
    getRowMarkers(): PrintRowMarker[] | undefined {
        return undefined;
    }

    /**
     * Get unique identifier for this dataset
     */
    getDataIdentifier(): string {
        return `${this.fundType}-${this.year}`;
    }

    /**
     * Convert FundStatistics to generic totals record
     */
    private convertStatisticsToRecord(stats: FundStatistics | any): Record<string, number> {
        return {
            received: stats.totalReceived !== undefined ? stats.totalReceived : (stats.received || 0),
            utilized: stats.totalUtilized !== undefined ? stats.totalUtilized : (stats.utilized || 0),
            balance: stats.totalBalance !== undefined ? stats.totalBalance : (stats.balance || 0),
            utilizationRate: stats.averageUtilizationRate !== undefined ? stats.averageUtilizationRate : (stats.utilizationRate || 0),
        };
    }
}
