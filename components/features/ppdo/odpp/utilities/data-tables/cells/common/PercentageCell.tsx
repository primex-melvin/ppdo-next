
"use client";

import { cn } from "@/lib/utils";
import { formatPercentage } from "../../core/utils/formatters";

interface PercentageCellProps {
    value: number | undefined | null;
    align?: "left" | "right" | "center";
    className?: string;
    highlightThreshold?: number;
}

export function PercentageCell({
    value,
    align = "right",
    className,
    highlightThreshold = 100
}: PercentageCellProps) {
    const displayValue = value === undefined || value === null
        ? "-"
        : formatPercentage(value);

    const numValue = value || 0;
    const isZero = numValue === 0;
    const isHighlighted = numValue >= highlightThreshold;

    return (
        <div className={cn(
            "w-full truncate font-medium text-xs",
            align === "right" && "text-right",
            align === "center" && "text-center",
            align === "left" && "text-left",
            isHighlighted && "text-green-600 dark:text-green-400",
            isZero && "text-zinc-400",
            className
        )}>
            {displayValue}
        </div>
    );
}
