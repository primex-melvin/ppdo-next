
"use client";

import { cn } from "@/lib/utils";

interface CountCellProps {
    value: number | undefined;
    align?: "left" | "right" | "center";
    className?: string;
    variant?: "default" | "success" | "warning" | "danger";
}

export function CountCell({
    value,
    align = "right",
    className,
    variant = "default"
}: CountCellProps) {
    const numValue = value || 0;

    return (
        <div className={cn(
            "w-full truncate font-medium text-xs",
            align === "right" && "text-right",
            align === "center" && "text-center",
            align === "left" && "text-left",
            numValue === 0 && "text-zinc-300 dark:text-zinc-600",
            numValue > 0 && variant === "success" && "text-green-600 dark:text-green-400",
            numValue > 0 && variant === "danger" && "text-red-500 dark:text-red-400",
            numValue > 0 && variant === "warning" && "text-amber-500 dark:text-amber-400",
            className
        )}>
            {numValue}
        </div>
    );
}
