
"use client";

import { cn } from "@/lib/utils";
import { formatCurrency, formatPercentage } from "../../core/utils/formatters";

interface ProjectBudgetCellProps {
    value: number | undefined;
    type?: "currency" | "percentage";
    align?: "left" | "right" | "center";
    className?: string;
}

export function ProjectBudgetCell({
    value,
    type = "currency",
    align = "right",
    className
}: ProjectBudgetCellProps) {
    const formattedValue = type === "percentage"
        ? formatPercentage(value || 0)
        : formatCurrency(value || 0);

    return (
        <div className={cn(
            "w-full truncate font-medium",
            align === "right" && "text-right",
            align === "center" && "text-center",
            align === "left" && "text-left",
            type === "percentage" && (value || 0) >= 100 && "text-green-600 dark:text-green-400",
            type === "percentage" && (value || 0) === 0 && "text-zinc-400",
            className
        )}>
            {formattedValue}
        </div>
    );
}
