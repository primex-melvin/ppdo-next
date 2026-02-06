
/**
 * Generic Table Selection Hook
 */

"use client";

import { useState, useMemo, useCallback } from "react";

export interface UseTableSelectionProps<T> {
    data: T[];
    getItemId: (item: T) => string;
}

export function useTableSelection<T>({ data, getItemId }: UseTableSelectionProps<T>) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const handleSelectAll = useCallback((checked: boolean) => {
        if (checked) {
            const allIds = new Set(data.map(item => getItemId(item)));
            setSelectedIds(allIds);
        } else {
            setSelectedIds(new Set());
        }
    }, [data, getItemId]);

    const handleSelectRow = useCallback((id: string, checked: boolean) => {
        setSelectedIds(prev => {
            const newSelected = new Set(prev);
            if (checked) {
                newSelected.add(id);
            } else {
                newSelected.delete(id);
            }
            return newSelected;
        });
    }, []);

    const handleClearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const isAllSelected = useMemo(() => {
        return data.length > 0 && selectedIds.size === data.length;
    }, [data.length, selectedIds.size]);

    const isIndeterminate = useMemo(() => {
        return selectedIds.size > 0 && selectedIds.size < data.length;
    }, [data.length, selectedIds.size]);

    return {
        selectedIds,
        setSelectedIds,
        handleSelectAll,
        handleSelectRow,
        handleClearSelection,
        isAllSelected,
        isIndeterminate,
    };
}
