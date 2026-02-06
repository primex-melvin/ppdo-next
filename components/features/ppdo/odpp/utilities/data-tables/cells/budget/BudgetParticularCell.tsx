
"use client";

import { cn } from "@/lib/utils";
import type { BudgetItem } from "@/components/features/ppdo/odpp/table-pages/11_project_plan/types";

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