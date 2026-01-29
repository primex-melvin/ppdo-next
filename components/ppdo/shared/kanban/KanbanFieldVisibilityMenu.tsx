"use client";

import React from "react";
import { ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const TOGGLEABLE_FIELDS = [
    { id: "received", label: "Received" },
    { id: "allocatedBudget", label: "Allocated Budget" },
    { id: "obligatedBudget", label: "Obligated Budget" },
    { id: "budgetUtilized", label: "Budget Utilized" },
    { id: "balance", label: "Balance" },
    { id: "utilizationRate", label: "Utilization Rate" },
    { id: "date", label: "Date" },
    { id: "remarks", label: "Remarks" },
];

export interface KanbanFieldVisibilityMenuProps {
    visibleFields: Set<string>;
    onToggleField: (fieldId: string, isChecked: boolean) => void;
    fields?: { id: string; label: string }[];
}

export function KanbanFieldVisibilityMenu({
    visibleFields,
    onToggleField,
    fields = TOGGLEABLE_FIELDS,
}: KanbanFieldVisibilityMenuProps) {
    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                        <ListFilter className="w-4 h-4" />
                        <span className="hidden sm:inline">Fields</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Show/Hide Fields</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {fields.map((field) => (
                        <DropdownMenuCheckboxItem
                            key={field.id}
                            checked={visibleFields.has(field.id)}
                            onCheckedChange={(checked) => onToggleField(field.id, checked)}
                        >
                            {field.label}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="h-6 mx-1" />
        </>
    );
}
