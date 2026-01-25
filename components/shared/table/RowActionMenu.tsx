// components/shared/table/RowActionMenu.tsx

"use client";

import { useState } from "react";
import { Edit, Trash2, MoreVertical, LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAccentColor } from "@/contexts/AccentColorContext";
import { cn } from "@/lib/utils";

/**
 * Additional action item configuration
 */
export interface ExtraAction {
  /** Unique key for the action */
  key: string;
  /** Display label */
  label: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Click handler */
  onClick: () => void;
  /** Whether action is destructive (uses red color) */
  destructive?: boolean;
  /** Whether action is disabled */
  disabled?: boolean;
  /** Whether to show a separator before this action */
  separatorBefore?: boolean;
}

/**
 * Props for RowActionMenu component
 */
export interface RowActionMenuProps {
  /** Edit action handler (optional) */
  onEdit?: () => void;
  /** Delete action handler (optional) */
  onDelete?: () => void;
  /** Additional custom actions */
  extraActions?: ExtraAction[];
  /** Whether edit action is disabled */
  disableEdit?: boolean;
  /** Whether delete action is disabled */
  disableDelete?: boolean;
  /** Custom edit label (default: "Edit") */
  editLabel?: string;
  /** Custom delete label (default: "Move to Trash") */
  deleteLabel?: string;
  /** Custom class name for the trigger button */
  triggerClassName?: string;
  /** Alignment of the dropdown menu */
  align?: "start" | "center" | "end";
  /** Whether to show the menu on hover (default: false) */
  openOnHover?: boolean;
}

/**
 * Unified Row Action Menu Component
 *
 * Provides a consistent "Three Dots" (Ellipsis) dropdown menu for table row actions.
 * Includes standard Edit and Delete actions, plus support for custom actions.
 *
 * Features:
 * - Consistent styling with accent color
 * - Dark mode support
 * - Flexible action configuration
 * - Icon-based actions with labels
 * - Separator support
 * - Disabled state handling
 *
 * @example
 * ```tsx
 * // Basic usage with Edit and Delete
 * <RowActionMenu
 *   onEdit={() => handleEdit(item)}
 *   onDelete={() => handleDelete(item.id)}
 * />
 *
 * // With custom actions
 * <RowActionMenu
 *   onEdit={() => handleEdit(item)}
 *   onDelete={() => handleDelete(item.id)}
 *   extraActions={[
 *     {
 *       key: 'duplicate',
 *       label: 'Duplicate',
 *       icon: Copy,
 *       onClick: () => handleDuplicate(item),
 *     },
 *     {
 *       key: 'archive',
 *       label: 'Archive',
 *       icon: Archive,
 *       onClick: () => handleArchive(item),
 *       separatorBefore: true,
 *     },
 *   ]}
 * />
 *
 * // Only custom actions (no edit/delete)
 * <RowActionMenu
 *   extraActions={[
 *     {
 *       key: 'view',
 *       label: 'View Details',
 *       icon: Eye,
 *       onClick: () => handleView(item),
 *     },
 *   ]}
 * />
 * ```
 */
export function RowActionMenu({
  onEdit,
  onDelete,
  extraActions = [],
  disableEdit = false,
  disableDelete = false,
  editLabel = "Edit",
  deleteLabel = "Move to Trash",
  triggerClassName,
  align = "end",
  openOnHover = false,
}: RowActionMenuProps) {
  const { accentColorValue } = useAccentColor();
  const [isOpen, setIsOpen] = useState(false);

  // Calculate if we have any actions to show
  const hasEdit = !!onEdit;
  const hasDelete = !!onDelete;
  const hasExtraActions = extraActions.length > 0;
  const hasAnyActions = hasEdit || hasDelete || hasExtraActions;

  // Don't render if no actions
  if (!hasAnyActions) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        asChild
        onMouseEnter={() => openOnHover && setIsOpen(true)}
        onMouseLeave={() => openOnHover && setIsOpen(false)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={cn(
            "p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-opacity-50",
            triggerClassName
          )}
          title="Actions"
        >
          <MoreVertical
            className="text-zinc-600 dark:text-zinc-400"
            style={{ width: "16px", height: "16px" }}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        className="w-48"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Extra Actions (if any come first) */}
        {extraActions
          .filter((action) => !action.separatorBefore)
          .map((action, index) => (
            <DropdownMenuItem
              key={action.key}
              onClick={(e) => {
                e.stopPropagation();
                if (!action.disabled) {
                  action.onClick();
                  setIsOpen(false);
                }
              }}
              disabled={action.disabled}
              className={cn(
                "flex items-center gap-2 cursor-pointer text-xs",
                action.destructive &&
                  "text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
              )}
            >
              <action.icon style={{ width: "14px", height: "14px" }} />
              <span>{action.label}</span>
            </DropdownMenuItem>
          ))}

        {/* Separator if we have extra actions and standard actions */}
        {hasExtraActions && (hasEdit || hasDelete) && <DropdownMenuSeparator />}

        {/* Edit Action */}
        {hasEdit && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              if (!disableEdit) {
                onEdit();
                setIsOpen(false);
              }
            }}
            disabled={disableEdit}
            className="flex items-center gap-2 cursor-pointer text-xs"
          >
            <Edit style={{ width: "14px", height: "14px" }} />
            <span>{editLabel}</span>
          </DropdownMenuItem>
        )}

        {/* Delete Action */}
        {hasDelete && (
          <>
            {hasEdit && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                if (!disableDelete) {
                  onDelete();
                  setIsOpen(false);
                }
              }}
              disabled={disableDelete}
              className="flex items-center gap-2 cursor-pointer text-xs text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
            >
              <Trash2 style={{ width: "14px", height: "14px" }} />
              <span>{deleteLabel}</span>
            </DropdownMenuItem>
          </>
        )}

        {/* Extra Actions with separatorBefore */}
        {extraActions
          .filter((action) => action.separatorBefore)
          .map((action) => (
            <>
              <DropdownMenuSeparator key={`sep-${action.key}`} />
              <DropdownMenuItem
                key={action.key}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!action.disabled) {
                    action.onClick();
                    setIsOpen(false);
                  }
                }}
                disabled={action.disabled}
                className={cn(
                  "flex items-center gap-2 cursor-pointer text-xs",
                  action.destructive &&
                    "text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                )}
              >
                <action.icon style={{ width: "14px", height: "14px" }} />
                <span>{action.label}</span>
              </DropdownMenuItem>
            </>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
