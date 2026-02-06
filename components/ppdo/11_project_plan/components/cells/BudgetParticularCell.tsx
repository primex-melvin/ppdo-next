"use client";

import { BudgetItem } from "@/types/types";
import { cn } from "@/lib/utils";

interface BudgetParticularCellProps {
    item: BudgetItem;
    onClick?: (e: React.MouseEvent) => void;
}

export function BudgetParticularCell({ item, onClick }: BudgetParticularCellProps) {
    return (
        <div
            className="flex items-center h-full max-w-full cursor-pointer hover:text-primary transition-colors"
            onClick={onClick}
            title={item.particular}
        >
            <span className="truncate font-medium text-sm text-zinc-900 dark:text-zinc-100">
                {item.particular}
            </span>
        </div>
    );
}
