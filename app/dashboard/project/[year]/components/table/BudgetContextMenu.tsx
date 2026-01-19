// app/dashboard/project/budget/components/table/BudgetContextMenu.tsx

"use client";

import { forwardRef } from "react";
import { Pin, PinOff, Edit, Trash2 } from "lucide-react";
import { BudgetItem } from "@/app/dashboard/project/[year]/types";

interface BudgetContextMenuProps {
  position: { x: number; y: number };
  item: BudgetItem;
  canEdit: boolean;
  canDelete: boolean;
  onPin: (item: BudgetItem) => void;
  onEdit: (item: BudgetItem) => void;
  onDelete: (item: BudgetItem) => void;
}

export const BudgetContextMenu = forwardRef<
  HTMLDivElement,
  BudgetContextMenuProps
>(({ position, item, canEdit, canDelete, onPin, onEdit, onDelete }, ref) => {
  return (
    <div
      ref={ref}
      className="fixed bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 py-1 z-50 min-w-[180px]"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
      }}
    >
      <button
        onClick={() => onPin(item)}
        className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-3"
      >
        {item.isPinned ? (
          <>
            <PinOff className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            <span className="text-zinc-700 dark:text-zinc-300">Unpin</span>
          </>
        ) : (
          <>
            <Pin className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            <span className="text-zinc-700 dark:text-zinc-300">Pin to top</span>
          </>
        )}
      </button>
      {canEdit && (
        <button
          onClick={() => onEdit(item)}
          className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-3"
        >
          <Edit className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          <span className="text-zinc-700 dark:text-zinc-300">Edit</span>
        </button>
      )}
      {canDelete && (
        <button
          onClick={() => onDelete(item)}
          className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-3"
        >
          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          <span className="text-red-700 dark:text-red-300">
            Move to Trash
          </span>
        </button>
      )}
    </div>
  );
});

BudgetContextMenu.displayName = "BudgetContextMenu";