
"use client";

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { TwentyPercentDFSortField, SortDirection } from "../../types";

interface SortIconProps {
    field: TwentyPercentDFSortField;
    currentSortField: TwentyPercentDFSortField | null;
    currentSortDirection: SortDirection;
}

/**
 * Displays the appropriate sort icon based on current sort state
 */
export function SortIcon({
    field,
    currentSortField,
    currentSortDirection
}: SortIconProps) {
    if (currentSortField !== field) {
        return <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />;
    }

    return currentSortDirection === "asc"
        ? <ArrowUp className="w-3.5 h-3.5" />
        : <ArrowDown className="w-3.5 h-3.5" />;
}
