"use client";

import React from "react";
import { SlidersHorizontal, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export interface StatusOption {
    id: string;
    label: string;
}

interface StatusVisibilityMenuProps {
    visibleStatuses: Set<string>;
    onToggleStatus: (statusId: string, isChecked: boolean) => void;
    statusOptions?: StatusOption[];
}

const DEFAULT_STATUS_OPTIONS = [
    { id: "not_available", label: "Not Available" },
    { id: "on_process", label: "On Process" },
    { id: "ongoing", label: "Ongoing" },
    { id: "completed", label: "Completed" },
];

export function StatusVisibilityMenu({
    visibleStatuses,
    onToggleStatus,
    statusOptions = DEFAULT_STATUS_OPTIONS,
}: StatusVisibilityMenuProps) {
    const hasHiddenStatuses = statusOptions.some(opt => !visibleStatuses.has(opt.id));

    // Specifically check for critical hidden statuses like "not_available" if present in options
    const isNotAvailableHidden = statusOptions.some(opt => opt.id === "not_available") && !visibleStatuses.has("not_available");

    return (
        <>
            <DropdownMenu>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 relative">
                                    <SlidersHorizontal className="w-4 h-4" />
                                    <span className="hidden sm:inline">Status</span>
                                    {/* Warning dot if critical statuses are hidden */}
                                    {isNotAvailableHidden && (
                                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                        </span>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        {isNotAvailableHidden && (
                            <TooltipContent>
                                <p>Some statuses like &quot;Not Available&quot; are hidden.</p>
                                <p className="text-xs text-muted-foreground">Click to show them.</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Toggle Status Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {statusOptions.map((status) => (
                        <DropdownMenuCheckboxItem
                            key={status.id}
                            checked={visibleStatuses.has(status.id)}
                            onCheckedChange={(checked) => onToggleStatus(status.id, checked)}
                        >
                            {status.label}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="h-6 mx-1" />
        </>
    );
}
