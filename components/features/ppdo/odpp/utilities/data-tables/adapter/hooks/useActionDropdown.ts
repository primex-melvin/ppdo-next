
/**
 * useActionDropdown Hook
 * 
 * Generates standardized action dropdown menus for table rows.
 * Ensures consistent action patterns across all table implementations.
 */

"use client";

import { useCallback, ReactNode } from "react";
import { ActionConfig } from "../types/adapter.types";
import { buildActionMenu, ActionMenuItem } from "../utils/actionBuilder";

export interface UseActionDropdownOptions<T> {
    actions: ActionConfig<T>;
}

export interface UseActionDropdownReturn<T> {
    /** Get action menu items for a specific item */
    getActionMenuItems: (item: T) => ActionMenuItem<T>[];
    /** Render the action dropdown for a specific item */
    renderActions: (item: T) => ReactNode;
}

/**
 * Hook for generating action dropdowns
 * Note: This hook provides the data structure. The actual dropdown rendering
 * is handled by the ActionDropdown component.
 */
export function useActionDropdown<T>(
    options: UseActionDropdownOptions<T>
): UseActionDropdownReturn<T> {
    const { actions } = options;

    const getActionMenuItems = useCallback(
        (item: T): ActionMenuItem<T>[] => {
            return buildActionMenu(actions, item);
        },
        [actions]
    );

    // This is a placeholder that returns null - actual rendering is done by ActionDropdown component
    const renderActions = useCallback(
        (item: T): ReactNode => {
            // The actual rendering is handled by the ActionDropdown component
            // This function exists to maintain the adapter interface
            return null;
        },
        []
    );

    return {
        getActionMenuItems,
        renderActions,
    };
}
