
"use client";

import { format } from "date-fns";

interface FundDateCellProps {
    value: number | undefined;
    align?: "left" | "right" | "center";
}

export function FundDateCell({ value, align = "center" }: FundDateCellProps) {
    if (!value) return <span className="text-zinc-400">-</span>;

    const formattedDate = format(new Date(value), "MMM dd, yyyy");

    return (
        <div className={`w-full truncate text-xs ${align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"}`}>
            {formattedDate}
        </div>
    );
}
