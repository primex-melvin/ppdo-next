"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface KanbanColumnProps {
    id: string;
    title: string;
    count: number;
    totalCount?: number;
    itemIds: string[];
    children: React.ReactNode;
    color?: string;
}

export function KanbanColumn({
    id,
    title,
    count,
    totalCount = 0,
    itemIds,
    children,
    color = "bg-zinc-400",
}: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({
        id,
    });

    return (
        <div className="flex h-fit max-h-full w-[350px] min-w-[350px] flex-col rounded-xl bg-zinc-50/50 border border-zinc-200/50 dark:bg-zinc-900/50 dark:border-zinc-800/50 group">
            {/* Header */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 cursor-help">
                            <div className="flex items-center gap-2">
                                <div className={cn("h-2.5 w-2.5 rounded-full", color)} />
                                <h3 className="font-bold text-base tracking-tight uppercase text-zinc-800 dark:text-zinc-200">
                                    {title}
                                </h3>
                            </div>
                            <div className="flex items-center justify-center h-8 w-8 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm transition-all group-hover:scale-110 group-hover:border-[#15803D] group-hover:shadow-[#15803D]/20">
                                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                                    {count}
                                </span>
                            </div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-zinc-950 text-white border-zinc-700 shadow-xl px-4 py-2 text-xs font-medium rounded-lg">
                        <p className="flex items-center gap-1.5 capitalize">
                            <span className="font-bold text-sm text-[#15803D]">{count}</span>
                            <span className="opacity-70">out of</span>
                            <span className="font-bold text-sm">{totalCount}</span>
                            <span className="opacity-70">{totalCount === 1 ? 'is' : 'are'} currently</span>
                            <span className="font-bold text-[#15803D] lowercase">{title}</span>
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {/* Content Area - Droppable */}
            <ScrollArea className="flex-1 p-3">
                <SortableContext id={id} items={itemIds} strategy={verticalListSortingStrategy}>
                    <div ref={setNodeRef} className="space-y-3 pb-4 pt-2 min-h-[150px]">
                        {children}
                        {itemIds.length === 0 && (
                            <div className="text-center py-8 text-xs text-muted-foreground border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                                No items
                            </div>
                        )}
                    </div>
                </SortableContext>
            </ScrollArea>
        </div>
    );
}
