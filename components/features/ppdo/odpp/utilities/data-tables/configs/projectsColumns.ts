
import { ColumnConfig } from "../core/types/table.types";

/**
 * Project table columns with persisted widths.
 * 
 * Width Strategy:
 * - width: Default pixel width (persisted in DB, user-customizable)
 * - minWidth: Minimum allowed width (prevents breaking UI)
 * - maxWidth: Maximum allowed width (optional, prevents oversized columns)
 * - flex: Proportional weight for auto-distribution when container resizes
 */
export const PROJECT_TABLE_COLUMNS: ColumnConfig[] = [
    {
        key: "aipRefCode",
        label: "AIP Ref. Code",
        width: 140,
        flex: 2,
        minWidth: 100,
        maxWidth: 250,
        type: "text",
        align: "left"
    },
    {
        key: "particulars",
        label: "Project Name",
        width: 320,         // Default width in pixels
        flex: 5,            // Widest proportionally
        minWidth: 200,      // Never smaller than 200px
        maxWidth: 500,      // Never larger than 500px
        type: "text",
        align: "left"
    },
    {
        key: "implementingOffice",
        label: "Implementing Office",
        width: 200,
        flex: 3,
        minWidth: 140,
        maxWidth: 350,
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
        label: "Allocated Budget",
        width: 150,
        flex: 3,
        minWidth: 130,
        maxWidth: 220,
        type: "currency",
        align: "right"
    },
    {
        key: "obligatedBudget",
        label: "Obligated Budget",
        width: 150,
        flex: 3,
        minWidth: 130,
        maxWidth: 220,
        type: "currency",
        align: "right"
    },
    {
        key: "totalBudgetUtilized",
        label: "Utilized Budget",
        width: 150,
        flex: 3,
        minWidth: 130,
        maxWidth: 220,
        type: "currency",
        align: "right"
    },
    {
        key: "utilizationRate",
        label: "Utilization Rate",
        width: 110,
        flex: 2,
        minWidth: 100,
        maxWidth: 160,
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
