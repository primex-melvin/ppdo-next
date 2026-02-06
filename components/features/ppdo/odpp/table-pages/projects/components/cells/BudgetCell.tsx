
"use client";

import { formatCurrency, formatPercentage } from "@/components/features/ppdo/odpp/utilities/shared/table/utils/formatters";
import { cn } from "@/lib/utils";

interface BudgetCellProps {
    value: number | undefined;
    type?: "currency" | "percentage";
    align?: "left" | "right" | "center";
    className?: string;
}

export function BudgetCell({
    value,
    type = "currency",
    align = "right",
    className
}: BudgetCellProps) {
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