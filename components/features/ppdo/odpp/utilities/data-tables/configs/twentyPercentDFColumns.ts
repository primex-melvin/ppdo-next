
import { ColumnConfig } from "../core/types/table.types";

/**
 * 20% DF table columns with persisted widths.
 * Note: Slightly different structure than projects table
 * to account for fund-specific fields.
 */
export const TWENTY_PERCENT_DF_COLUMNS: ColumnConfig[] = [
    { 
        key: "particulars", 
        label: "Particulars", 
        width: 300,
        flex: 5, 
        minWidth: 200, 
        maxWidth: 450,
        type: "text", 
        align: "left" 
    },
    { 
        key: "implementingOffice", 
        label: "Implementing Office", 
        width: 200,
        flex: 3, 
        minWidth: 140, 
        maxWidth: 320,
        type: "text", 
        align: "left" 
    },
    { 
        key: "year", 
        label: "Year", 
        width: 80,
        flex: 1, 
        minWidth: 60, 
        maxWidth: 120,
        type: "number", 
        align: "center" 
    },
    { 
        key: "status", 
        label: "Status", 
        width: 120,
        flex: 2, 
        minWidth: 100, 
        maxWidth: 180,
        type: "status", 
        align: "center" 
    },
    { 
        key: "totalBudgetAllocated", 
        label: "Allocated", 
        width: 140,
        flex: 3, 
        minWidth: 120, 
        maxWidth: 200,
        type: "currency", 
        align: "right" 
    },
    { 
        key: "totalBudgetUtilized", 
        label: "Utilized", 
        width: 140,
        flex: 3, 
        minWidth: 120, 
        maxWidth: 200,
        type: "currency", 
        align: "right" 
    },
    { 
        key: "utilizationRate", 
        label: "Util. Rate", 
        width: 100,
        flex: 2, 
        minWidth: 90, 
        maxWidth: 150,
        type: "percentage", 
        align: "right" 
    },
    { 
        key: "projectCompleted", 
        label: "COMPLETED", 
        width: 100,
        flex: 1, 
        minWidth: 70, 
        maxWidth: 140,
        type: "number", 
        align: "right" 
    },
    { 
        key: "projectDelayed", 
        label: "DELAYED", 
        width: 100,
        flex: 1, 
        minWidth: 70, 
        maxWidth: 140,
        type: "number", 
        align: "right" 
    },
    { 
        key: "projectsOngoing", 
        label: "ONGOING", 
        width: 100,
        flex: 1, 
        minWidth: 70, 
        maxWidth: 140,
        type: "number", 
        align: "right" 
    },
    { 
        key: "remarks", 
        label: "Remarks", 
        width: 250,
        flex: 4, 
        minWidth: 150, 
        maxWidth: 400,
        type: "text", 
        align: "left" 
    },
];
