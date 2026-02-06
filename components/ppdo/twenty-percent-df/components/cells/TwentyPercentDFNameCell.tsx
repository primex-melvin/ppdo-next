"use client";

import { Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { TwentyPercentDF } from "../../types";

interface TwentyPercentDFNameCellProps {
    item: TwentyPercentDF;
    onClick?: (e: React.MouseEvent) => void;
    onPin?: (item: TwentyPercentDF) => void;
}

export function TwentyPercentDFNameCell({ item, onClick, onPin }: TwentyPercentDFNameCellProps) {
    return (
        <div className="flex items-center justify-between gap-2 max-w-full group">
            <div
                className="flex-1 truncate font-medium text-sm text-zinc-900 dark:text-zinc-100 cursor-pointer hover:text-primary transition-colors"
                onClick={onClick}
                title={item.particulars}
            >
                {item.particulars}
            </div>
            {onPin && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onPin(item);
                    }}
                    className={cn(
                        "p-1 rounded-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100",
                        item.isPinned && "text-amber-500 opacity-100"
                    )}
                >
                    <Pin className={cn("h-3.5 w-3.5", item.isPinned && "fill-current")} />
                </button>
            )}
        </div>
    );
}
