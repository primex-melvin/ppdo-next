
/**
 * ActionDropdown Component
 * 
 * Standardized action dropdown menu for table rows.
 * Renders a dropdown menu with configurable actions.
 */

"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActionConfig } from "../types/adapter.types";
import { buildActionMenu } from "../utils/actionBuilder";

interface ActionDropdownProps<T> {
    /** Table item */
    item: T;
    /** Action configuration */
    config: ActionConfig<T>;
    /** Optional className */
    className?: string;
    /** Optional callback when an action is clicked (for row click prevention) */
    onActionClick?: (e: React.MouseEvent) => void;
}

/**
 * Standardized action dropdown for table rows
 * 
 * @example
 * ```tsx
 * <ActionDropdown
 *   item={budgetItem}
 *   config={{
 *     onView: (item) => console.log("View", item),
 *     onEdit: (item) => console.log("Edit", item),
 *     onDelete: (item) => console.log("Delete", item),
 *   }}
 * />
 * ```
 */
export function ActionDropdown<T>({
    item,
    config,
    className,
    onActionClick,
}: ActionDropdownProps<T>) {
    const actions = buildActionMenu(config, item);

    // Don't render if no actions
    if (actions.length === 0) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn(
                        "h-6 w-6 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                        className
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        onActionClick?.(e);
                    }}
                >
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
                {actions.map((action) => {
                    // Render separator
                    if (action.variant === "separator") {
                        return <DropdownMenuSeparator key={action.id} />;
                    }

                    // Render menu item
                    const Icon = action.icon;
                    const isDanger = action.variant === "danger";

                    return (
                        <DropdownMenuItem
                            key={action.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                action.onClick(item);
                            }}
                            className={cn(
                                isDanger && "text-red-600 focus:text-red-600"
                            )}
                        >
                            <Icon
                                className={cn(
                                    "mr-2 h-3.5 w-3.5",
                                    isDanger
                                        ? "text-red-600"
                                        : "text-muted-foreground/70"
                                )}
                            />
                            {action.label}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
