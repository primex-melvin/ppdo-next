
import { ColumnConfig } from "../core/types/table.types";

/**
 * Funds table columns (Trust Funds, SEF, SHF) with persisted widths.
 */
export const FUNDS_TABLE_COLUMNS: ColumnConfig[] = [
    { 
        key: "projectTitle", 
        label: "Project Title", 
        width: 300,
        flex: 4, 
        minWidth: 200, 
        maxWidth: 450,
        type: "text", 
        align: "left" 
    },
    { 
        key: "officeInCharge", 
        label: "Implementing Office", 
        width: 180,
        flex: 3, 
        minWidth: 150, 
        maxWidth: 300,
        type: "text", 
        align: "left" 
    },
    { 
        key: "dateReceived", 
        label: "Date Received", 
        width: 120,
        flex: 2, 
        minWidth: 100, 
        maxWidth: 160,
        type: "date", 
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
        key: "received", 
        label: "Budget Allocated", 
        width: 150,
        flex: 2, 
        minWidth: 130, 
        maxWidth: 200,
        type: "currency", 
        align: "right" 
    },
    { 
        key: "obligatedPR", 
        label: "Obligated (PR)", 
        width: 150,
        flex: 2, 
        minWidth: 130, 
        maxWidth: 200,
        type: "currency", 
        align: "right" 
    },
    { 
        key: "utilized", 
        label: "Utilized", 
        width: 150,
        flex: 2, 
        minWidth: 130, 
        maxWidth: 200,
        type: "currency", 
        align: "right" 
    },
    { 
        key: "balance", 
        label: "Balance", 
        width: 150,
        flex: 2, 
        minWidth: 130, 
        maxWidth: 200,
        type: "currency", 
        align: "right" 
    },
    { 
        key: "utilizationRate", 
        label: "Util. Rate", 
        width: 110,
        flex: 2, 
        minWidth: 100, 
        maxWidth: 160,
        type: "percentage", 
        align: "right" 
    },
    { 
        key: "remarks", 
        label: "Remarks", 
        width: 250,
        flex: 3, 
        minWidth: 180, 
        maxWidth: 400,
        type: "text", 
        align: "left" 
    },
];
