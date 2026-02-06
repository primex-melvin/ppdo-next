
"use client";

import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BaseFund } from "@/components/features/ppdo/odpp/table-pages/funds/types";

interface FundStatusCellProps {
    item: BaseFund;
    onStatusChange: (itemId: string, newStatus: string) => Promise<void>;
    isUpdating?: boolean;
}

export function FundStatusCell({ item, onStatusChange, isUpdating = false }: FundStatusCellProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [localUpdating, setLocalUpdating] = useState(false);

    const handleValueChange = async (value: string) => {
        setLocalUpdating(true);
        try {
            await onStatusChange(item.id, value);
        } finally {
            setLocalUpdating(false);
            setIsOpen(false);
        }
    };

    const isLoading = isUpdating || localUpdating;
    const status = item.status || "not_yet_started";

    // Format status label (e.g., "on_process" -> "On Process")
    const getLabel = (s: string) => {
        return s.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const label = getLabel(status);

    // Stop propagation to prevent row click
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case "completed": return "text-green-600 dark:text-green-400 font-medium";
            case "ongoing": return "text-blue-600 dark:text-blue-400 font-medium";
            case "on_process": return "text-amber-600 dark:text-amber-400 font-medium";
            case "not_yet_started": return "text-zinc-500 dark:text-zinc-400";
            default: return "text-zinc-600 dark:text-zinc-300";
        }
    };

    return (
        <div className="flex items-center justify-center h-full" onClick={handleClick}>
            {isLoading ? (
                <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <Select
                    value={status}
                    onValueChange={handleValueChange}
                    open={isOpen}
                    onOpenChange={setIsOpen}
                    disabled={isLoading}
                >
                    <SelectTrigger
                        className={cn(
                            "h-7 w-full min-w-[110px] text-xs border-0 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:ring-0",
                            getStatusColor(status)
                        )}
                    >
                        <SelectValue>{label}</SelectValue>
                    </SelectTrigger>
                    <SelectContent align="center">
                        <SelectItem value="not_yet_started" className="text-xs">Not Yet Started</SelectItem>
                        <SelectItem value="on_process" className="text-xs">On Process</SelectItem>
                        <SelectItem value="ongoing" className="text-xs">Ongoing</SelectItem>
                        <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                        <SelectItem value="not_available" className="text-xs">Not Available</SelectItem>
                    </SelectContent>
                </Select>
            )}
        </div>
    );
}