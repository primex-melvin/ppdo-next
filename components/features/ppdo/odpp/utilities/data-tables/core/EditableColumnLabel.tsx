"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface EditableColumnLabelProps {
    columnKey: string;
    originalLabel: string;
    customLabel?: string;
    isLoading: boolean;
    canEdit: boolean;
    onSave: (columnKey: string, newLabel: string) => void;
}

export function EditableColumnLabel({
    columnKey,
    originalLabel,
    customLabel,
    isLoading,
    canEdit,
    onSave,
}: EditableColumnLabelProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const displayLabel = customLabel || originalLabel;

    // Focus and select all text when entering edit mode
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleDoubleClick = useCallback(
        (e: React.MouseEvent) => {
            if (!canEdit) return;
            e.stopPropagation();
            e.preventDefault();
            setEditValue(displayLabel);
            setIsEditing(true);
        },
        [canEdit, displayLabel]
    );

    const handleSave = useCallback(() => {
        const trimmed = editValue.trim();
        setIsEditing(false);

        if (!trimmed || trimmed === originalLabel) {
            // Empty or same as original → reset to default (remove custom override)
            if (customLabel) {
                onSave(columnKey, "");
            }
            return;
        }

        if (trimmed !== displayLabel) {
            onSave(columnKey, trimmed);
        }
    }, [editValue, originalLabel, customLabel, displayLabel, columnKey, onSave]);

    const handleCancel = useCallback(() => {
        setEditValue(displayLabel);
        setIsEditing(false);
    }, [displayLabel]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleSave();
            } else if (e.key === "Escape") {
                e.preventDefault();
                handleCancel();
            }
        },
        [handleSave, handleCancel]
    );

    // Skeleton while loading custom names from Convex
    if (isLoading) {
        return <Skeleton className="h-3.5 w-full max-w-[80px] rounded" />;
    }

    // Editing mode: inline input
    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-full min-w-[40px] text-[11px] sm:text-xs font-semibold uppercase tracking-wide bg-white dark:bg-zinc-700 border border-blue-500 rounded px-1 py-0.5 text-zinc-800 dark:text-zinc-100 outline-none"
            />
        );
    }

    // Normal display mode
    return (
        <span
            onDoubleClick={handleDoubleClick}
            className={`flex-1 truncate text-[11px] sm:text-xs font-semibold uppercase tracking-wide ${
                canEdit ? "cursor-text" : "cursor-default"
            }`}
            title={canEdit ? "Double-click to rename" : displayLabel}
        >
            {displayLabel}
        </span>
    );
}
