"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { MoreVertical, Eye, Edit, Pin, Archive, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface KanbanMetric {
    label: string;
    value: string | number;
    highlight?: boolean;
}

export interface KanbanCardData {
    id: string;
    title: string;
    subtitle: string;
    metrics?: KanbanMetric[];
    utilizationRate?: number;
    footerLeft?: string;
    footerRight?: string;
    isPinned?: boolean;
    navigationUrl?: string;
}

export interface KanbanCardProps {
    data: KanbanCardData;
    actions?: {
        onView?: () => void;
        onEdit?: () => void;
        onDelete?: () => void;
        onPin?: () => void;
    };
    isOverlay?: boolean;
    isDragging?: boolean;
    style?: React.CSSProperties;
    innerRef?: React.Ref<HTMLDivElement>;
    dragHandleProps?: any;
}

export function KanbanCard({
    data,
    actions,
    isOverlay,
    isDragging,
    style,
    innerRef,
    dragHandleProps,
    ...props
}: KanbanCardProps & React.HTMLAttributes<HTMLDivElement>) {
    const router = useRouter();
    const { title, subtitle, metrics = [], utilizationRate, footerLeft, footerRight, isPinned, navigationUrl } = data;

    return (
        <Card
            ref={innerRef}
            style={style}
            className={cn(
                "group relative bg-white dark:bg-zinc-950 border-zinc-400 dark:border-zinc-800 transition-all duration-300 overflow-hidden select-none",
                "hover:shadow-lg hover:shadow-[#15803D]/10 hover:border-[#15803D] dark:hover:border-[#15803D] hover:-translate-y-1 hover:z-50",
                isDragging && "opacity-50 ring-2 ring-[#15803D]/30",
                isOverlay && "shadow-2xl border-[#15803D] scale-[1.02] cursor-grabbing",
                !isOverlay && "cursor-grab active:cursor-grabbing",
                isPinned && "bg-amber-50/30 dark:bg-amber-950/20 border-amber-500/30 dark:border-amber-900/40"
            )}
            {...props}
        >
            {/* Drag Handle Area */}
            {dragHandleProps && (
                <div
                    {...dragHandleProps}
                    className="absolute top-0 left-0 right-0 h-10 z-10"
                    onClick={(e) => e.stopPropagation()}
                />
            )}

            {isPinned && (
                <div className="absolute top-0 right-0 p-1.5 z-20">
                    <Pin className="h-3 w-3 text-amber-500 fill-amber-500 rotate-45" />
                </div>
            )}

            <CardHeader className="px-4 pt-3 pb-2 space-y-0">
                <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-base leading-tight line-clamp-2 pr-4 text-zinc-800 dark:text-zinc-200" title={title}>
                        {title}
                    </h4>

                    {actions && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 -mr-1.5 -mt-1 shrink-0 text-zinc-400 hover:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                >
                                    <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                {actions.onView && (
                                    <DropdownMenuItem onClick={actions.onView}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        View Details
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {actions.onPin && (
                                    <DropdownMenuItem onClick={actions.onPin}>
                                        <Pin className="h-4 w-4 mr-2" />
                                        {isPinned ? "Unpin" : "Pin"}
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {actions.onEdit && (
                                    <DropdownMenuItem onClick={actions.onEdit}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                    </DropdownMenuItem>
                                )}
                                {actions.onDelete && (
                                    <DropdownMenuItem onClick={actions.onDelete} className="text-red-600">
                                        <Archive className="h-4 w-4 mr-2" />
                                        Move to Trash
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
                <div className="flex items-center gap-1.5 pt-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 shrink-0" />
                    <p className="text-xs font-medium text-muted-foreground truncate flex-1 leading-none" title={subtitle}>
                        {subtitle}
                    </p>
                </div>
            </CardHeader>

            <CardContent className={cn(
                "px-4 pt-0 transition-all flex flex-col gap-2",
                (metrics.length > 0 || utilizationRate !== undefined || navigationUrl) ? "pb-3" : "pb-0"
            )}>
                {metrics.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-md border border-zinc-100 dark:border-zinc-800/50">
                        {metrics.map((metric, idx) => (
                            <div key={idx}>
                                <span className="text-zinc-500 dark:text-zinc-500 block text-xs uppercase tracking-wider mb-0.5 leading-none font-bold">
                                    {metric.label}
                                </span>
                                <span className={cn(
                                    "font-bold tabular-nums text-zinc-900 dark:text-zinc-100 text-sm leading-tight",
                                    metric.highlight && "text-[#15803D]"
                                )}>
                                    {metric.value}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {utilizationRate !== undefined && (
                    <div className="space-y-1">
                        <div className="flex justify-between items-center px-0.5">
                            <span className="text-muted-foreground font-bold text-xs uppercase tracking-tight">Utilization</span>
                            <span className={`font-bold text-xs ${utilizationRate >= 100 ? "text-[#15803D]" : "text-zinc-800 dark:text-zinc-200"}`}>
                                {utilizationRate.toFixed(1)}%
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-100 dark:border-zinc-800">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-300",
                                    utilizationRate >= 100 ? "bg-[#15803D]" :
                                        utilizationRate >= 80 ? "bg-[#15803D]/80" :
                                            utilizationRate >= 50 ? "bg-amber-500" :
                                                "bg-zinc-400"
                                )}
                                style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                {navigationUrl && (
                    <Button
                        size="sm"
                        className="w-full h-7 text-[10px] gap-1.5 mt-1 font-semibold"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(navigationUrl);
                        }}
                    >
                        <ExternalLink className="h-3 w-3" />
                        View Breakdown Details
                    </Button>
                )}
            </CardContent>

            {(footerLeft || footerRight) && (
                <CardFooter className="px-4 py-2.5 flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                    <span className="font-mono text-[11px] font-medium text-zinc-500 opacity-80 leading-none">{footerLeft}</span>
                    {footerRight && (
                        <span className="truncate max-w-[140px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[11px] font-medium leading-none text-zinc-600 dark:text-zinc-400" title={footerRight}>
                            {footerRight}
                        </span>
                    )}
                </CardFooter>
            )}
        </Card>
    );
}
