// components/ppdo/odpp/funds/hooks/useTableSelection.ts

/**
 * @deprecated Use useTableSelection from @/components/features/ppdo/odpp/data-tables/core/hooks instead
 * 
 * This is a backward-compatible wrapper around the generic useTableSelection hook.
 * It maintains the old API (string[] for selected) while using the new implementation internally.
 */

"use client";

import { useTableSelection as useGenericTableSelection } from "@/components/features/ppdo/odpp/utilities/data-tables/core/hooks/useTableSelection";
import { BaseFund } from "../types";

export const useTableSelection = <T extends BaseFund>(data: T[]) => {
    const { 
        selectedIds, 
        handleSelectAll, 
        handleSelectRow, 
        handleClearSelection, 
        isAllSelected 
    } = useGenericTableSelection({
        data,
        getItemId: (item) => item.id,
    });
    
    // Convert Set to array for backward compatibility
    const selected = Array.from(selectedIds);
    
    const toggleAll = () => handleSelectAll(!isAllSelected);
    const toggleOne = (id: string) => handleSelectRow(id, !selectedIds.has(id));
    
    return { 
        selected, 
        allSelected: isAllSelected, 
        toggleAll, 
        toggleOne, 
        clearSelection: handleClearSelection 
    };
};