
"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DateCellProps {
    value: number | Date | undefined | null;
    align?: "left" | "right" | "center";
    className?: string;
    formatString?: string;
}

export function DateCell({
    value,
    align = "center",
    className,
    formatString = "MMM dd, yyyy"
}: DateCellProps) {
    if (!value) {
        return <span className="text-zinc-400">-</span>;
    }

    const date = typeof value === "number" ? new Date(value) : value;
    const formattedDate = format(date, formatString);

    return (
        <div className={cn(
            "w-full truncate text-xs",
            align === "center" && "text-center",
            align === "right" && "text-right",
            align === "left" && "text-left",
            className
        )}>
            {formattedDate}
        </div>
    );
}
