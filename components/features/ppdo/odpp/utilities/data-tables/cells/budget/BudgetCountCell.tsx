
"use client";

import { cn } from "@/lib/utils";

interface BudgetCountCellProps {
    value: number | undefined;
    align?: "left" | "right" | "center";
    className?: string;
    variant?: "default" | "success" | "warning" | "danger";
}

export function BudgetCountCell({
    value,
    align = "right",
    className,
    variant = "default"
}: BudgetCountCellProps) {
    return (
        <div className={cn(
            "w-full truncate font-medium text-xs",
            align === "right" && "text-right",
            align === "center" && "text-center",
            align === "left" && "text-left",
            value === 0 && "text-zinc-300 dark:text-zinc-600",
            value && value > 0 && variant === "success" && "text-green-600 dark:text-green-400",
            value && value > 0 && variant === "danger" && "text-red-500 dark:text-red-400",
            value && value > 0 && variant === "warning" && "text-amber-500 dark:text-amber-400",
            className
        )}>
            {value || 0}
        </div>
    );
}
