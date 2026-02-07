
/**
 * Action Builder Utility
 * 
 * Helper functions for building standardized action dropdown menus.
 * Ensures consistent action patterns across all tables.
 */

import { Eye, Edit, Trash2, Pin, Calculator, History, FolderOpen, MoreHorizontal } from "lucide-react";
import { ActionConfig, ActionIcon } from "../types/adapter.types";

export interface ActionMenuItem<T> {
    id: string;
    label: string;
    icon: ActionIcon;
    onClick: (item: T) => void;
    variant: "default" | "danger" | "separator";
    condition?: (item: T) => boolean;
}

/**
 * Build a standardized action menu based on action configuration
 */
export function buildActionMenu<T>(config: ActionConfig<T>, item: T): ActionMenuItem<T>[] {
    const actions: ActionMenuItem<T>[] = [];
    
    // View action (always first)
    if (config.onView) {
        actions.push({
            id: "view",
            label: "View Details",
            icon: Eye,
            onClick: config.onView,
            variant: "default",
        });
    }
    
    // Pin action
    if (config.onPin) {
        actions.push({
            id: "pin",
            label: "Pin Item", // Note: Dynamic label based on item.isPinned should be handled in component
            icon: Pin,
            onClick: config.onPin,
            variant: "default",
        });
    }
    
    // Change category action
    if (config.onChangeCategory) {
        actions.push({
            id: "changeCategory",
            label: "Change Category",
            icon: FolderOpen,
            onClick: config.onChangeCategory,
            variant: "default",
        });
    }
    
    // Toggle auto-calculate action
    if (config.onToggleAutoCalculate) {
        actions.push({
            id: "toggleAutoCalculate",
            label: "Toggle Auto-Calc", // Note: Dynamic label should be handled in component
            icon: Calculator,
            onClick: config.onToggleAutoCalculate,
            variant: "default",
        });
    }
    
    // View log action
    if (config.onViewLog) {
        actions.push({
            id: "viewLog",
            label: "View Log",
            icon: History,
            onClick: config.onViewLog,
            variant: "default",
        });
    }
    
    // Add separator before destructive actions if needed
    const hasDestructive = config.onEdit || config.onDelete;
    const hasPreSeparator = actions.length > 0 && hasDestructive;
    
    if (hasPreSeparator) {
        actions.push({
            id: "separator-1",
            label: "",
            icon: MoreHorizontal,
            onClick: () => {},
            variant: "separator",
        });
    }
    
    // Edit action
    if (config.onEdit) {
        actions.push({
            id: "edit",
            label: "Edit Item",
            icon: Edit,
            onClick: config.onEdit,
            variant: "default",
        });
    }
    
    // Delete action (always last, marked as dangerous)
    if (config.onDelete) {
        actions.push({
            id: "delete",
            label: "Move to Trash",
            icon: Trash2,
            onClick: config.onDelete,
            variant: "danger",
        });
    }
    
    // Custom actions (if any)
    if (config.customActions) {
        // Add separator before custom actions if there are already actions
        if (actions.length > 0 && config.customActions.length > 0) {
            actions.push({
                id: "separator-custom",
                label: "",
                icon: MoreHorizontal,
                onClick: () => {},
                variant: "separator",
            });
        }
        
        for (const customAction of config.customActions) {
            actions.push({
                id: `custom-${customAction.label}`,
                label: customAction.label,
                icon: customAction.icon,
                onClick: customAction.onClick,
                variant: customAction.variant ?? "default",
            });
        }
    }
    
    return actions;
}
