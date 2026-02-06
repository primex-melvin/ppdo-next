
"use client";

import React, { useEffect } from "react";
import { Pin, PinOff, History, FolderOpen, Edit, Trash2, Calculator } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { TwentyPercentDFContextMenuState } from "../../types";
import { useContextMenuPosition } from "@/components/ui/hooks/useContextMenuPosition";

interface TwentyPercentDFContextMenuProps {
    contextMenu: TwentyPercentDFContextMenuState | null;
    onClose: () => void;
    onPin: () => void;
    onViewLog: () => void;
    onChangeCategory: () => void;
    onEdit: () => void;
    onDelete: () => void;
    canEdit?: boolean;
    canDelete?: boolean;
    onToggleAutoCalculate?: (newValue: boolean) => void;
    isTogglingAutoCalculate?: boolean;
}


interface ContextMenuStyle {
    top?: number;
    left?: number;
}

/**
 * Right-click context menu for project rows
 */

export function TwentyPercentDFContextMenu({
    contextMenu,
    onClose,
    onPin,
    onViewLog,
    onChangeCategory,
    onEdit,
    onDelete,
    canEdit = true,
    canDelete = true,
    onToggleAutoCalculate,
    isTogglingAutoCalculate = false,
}: TwentyPercentDFContextMenuProps) {

    const { ref, style } = useContextMenuPosition(contextMenu?.x, contextMenu?.y);
    const contextMenuStyle = style as ContextMenuStyle;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const menuElement = typeof ref === 'function' ? null : (ref as React.RefObject<HTMLDivElement | null>).current;
            if (menuElement && !menuElement.contains(event.target as Node)) {
                onClose();
            }
        };

        if (contextMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [contextMenu, onClose, ref]);

    if (!contextMenu) return null;

    const isPinned = 'isPinned' in contextMenu.entity && (contextMenu.entity as { isPinned?: boolean }).isPinned;
    // Get current auto-calculate state (default to true for backward compatibility)
    const isAutoCalculate = 'autoCalculateBudgetUtilized' in contextMenu.entity
        ? (contextMenu.entity as { autoCalculateBudgetUtilized?: boolean }).autoCalculateBudgetUtilized !== false
        : true;

    return (


        <div
            ref={ref}
            className="fixed bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 py-1 z-50 min-w-[220px]"
            style={{
                top: contextMenuStyle.top !== undefined ? `${contextMenuStyle.top}px` : undefined,
                left: contextMenuStyle.left !== undefined ? `${contextMenuStyle.left}px` : undefined,
            }}
        >
            {/* Pin/Unpin */}
            <button
                onClick={() => {
                    onPin();
                    onClose();
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-3 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
                {isPinned ? (
                    <>
                        <PinOff className="w-4 h-4" />
                        Unpin
                    </>
                ) : (
                    <>
                        <Pin className="w-4 h-4" />
                        Pin to top
                    </>
                )}
            </button>

            {/* 🆕 AUTO-CALCULATE TOGGLE */}
            {onToggleAutoCalculate && (
                <div className="border-t border-zinc-200 dark:border-zinc-700 my-1">
                    <div className="px-4 py-2.5 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                            <Calculator className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                            <div className="flex flex-col gap-0.5">
                                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                                    Auto-Calculate Budget
                                </span>
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {isAutoCalculate ? "ON" : "OFF"}
                                </span>
                            </div>
                        </div>
                        <Switch
                            checked={isAutoCalculate}
                            onCheckedChange={(checked) => {
                                onToggleAutoCalculate(checked);
                                onClose();
                            }}
                            disabled={isTogglingAutoCalculate}
                            className="ml-2"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}

            {/* Activity Log */}
            <button
                onClick={() => {
                    onViewLog();
                    onClose();
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-3 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
                <History className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                Activity Log
            </button>

            {/* Move to Category */}
            <button
                onClick={() => {
                    onChangeCategory();
                    onClose();
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-3 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
                <FolderOpen className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                Move to Category
            </button>

            {/* Edit */}
            {canEdit && (
                <button
                    onClick={() => {
                        onEdit();
                        onClose();
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-3 text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                    <Edit className="w-4 h-4" />
                    Edit
                </button>
            )}

            {/* Delete */}
            {canDelete && (
                <button
                    onClick={() => {
                        onDelete();
                        onClose();
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-3 text-red-600 dark:text-red-400 whitespace-nowrap transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                    Move to Trash
                </button>
            )}
        </div>
    );
}
