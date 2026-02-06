
"use client";

import { cn } from "@/lib/utils";

interface FundAmountCellProps {
    value: number | undefined;
    type?: "currency" | "percentage";
    align?: "left" | "right" | "center";
    className?: string;
}

export function FundAmountCell({
    value,
    type = "currency",
    align = "right",
    className
}: FundAmountCellProps) {
    const formattedValue = type === "percentage"
        ? new Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format((value || 0) / 100)
        : new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value || 0);

    return (
        <div className={cn(
            "w-full truncate font-medium text-xs",
            align === "right" && "text-right",
            align === "center" && "text-center",
            align === "left" && "text-left",
            type === "percentage" && (value || 0) >= 100 && "text-green-600 dark:text-green-400",
            type === "percentage" && (value || 0) === 0 && "text-zinc-400",
            type !== "percentage" && (value || 0) === 0 && "text-zinc-400",
            className
        )}>
            {formattedValue}
        </div>
    );
}
