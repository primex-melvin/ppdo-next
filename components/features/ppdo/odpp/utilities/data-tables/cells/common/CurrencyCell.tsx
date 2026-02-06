
"use client";

import { cn } from "@/lib/utils";
import { formatCurrency } from "../../core/utils/formatters";

interface CurrencyCellProps {
    value: number | undefined | null;
    align?: "left" | "right" | "center";
    className?: string;
    showZero?: boolean;
}

export function CurrencyCell({
    value,
    align = "right",
    className,
    showZero = true
}: CurrencyCellProps) {
    const displayValue = value === undefined || value === null
        ? "-"
        : formatCurrency(value);

    const isZero = (value || 0) === 0;

    return (
        <div className={cn(
            "w-full truncate font-medium text-xs",
            align === "right" && "text-right",
            align === "center" && "text-center",
            align === "left" && "text-left",
            isZero && !showZero && "text-zinc-400",
            className
        )}>
            {displayValue}
        </div>
    );
}
