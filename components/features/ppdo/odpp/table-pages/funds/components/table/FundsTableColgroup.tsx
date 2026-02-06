// components/ppdo/funds/components/table/FundsTableColgroup.tsx

"use client";

import { ColumnWidths } from "../../types";
import { DEFAULT_COLUMN_WIDTHS } from "../../constants";

interface FundsTableColgroupProps {
    isAdmin: boolean;
    hiddenColumns: Set<string>;
    columnWidths: ColumnWidths;
}

export function FundsTableColgroup({
    isAdmin,
    hiddenColumns,
    columnWidths,
}: FundsTableColgroupProps) {
    const isColumnVisible = (columnId: string) => !hiddenColumns.has(columnId);
    const getWidth = (key: keyof typeof DEFAULT_COLUMN_WIDTHS) =>
        columnWidths[key] ?? DEFAULT_COLUMN_WIDTHS[key];

    return (
        <colgroup>
            {isAdmin && <col style={{ width: '44px' }} />}
            {isColumnVisible("projectTitle") && <col style={{ width: `${getWidth("projectTitle")}px` }} />}
            {isColumnVisible("officeInCharge") && <col style={{ width: '200px' }} />}
            {isColumnVisible("status") && <col style={{ width: '180px' }} />}
            {isColumnVisible("dateReceived") && <col style={{ width: '130px' }} />}
            {isColumnVisible("received") && <col style={{ width: '150px' }} />}
            {isColumnVisible("obligatedPR") && <col style={{ width: '150px' }} />}
            {isColumnVisible("utilized") && <col style={{ width: '150px' }} />}
            {isColumnVisible("utilizationRate") && <col style={{ width: '120px' }} />}
            {isColumnVisible("balance") && <col style={{ width: '150px' }} />}
            {isColumnVisible("remarks") && <col style={{ width: `${getWidth("remarks")}px` }} />}
            <col style={{ width: '80px' }} />
        </colgroup>
    );
}
