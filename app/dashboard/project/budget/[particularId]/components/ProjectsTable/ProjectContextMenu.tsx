// app/dashboard/project/budget/[particularId]/components/ProjectsTable/ProjectContextMenu.tsx

import React, { useRef, useEffect } from "react";
import { Pin, PinOff, History, FolderOpen, Edit, Trash2 } from "lucide-react";
import { ProjectContextMenuState } from "../../types";

interface ProjectContextMenuProps {
  contextMenu: ProjectContextMenuState | null;
  onClose: () => void;
  onPin: () => void;
  onViewLog: () => void;
  onChangeCategory: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

/**
 * Right-click context menu for project rows
 */
export function ProjectContextMenu({
  contextMenu,
  onClose,
  onPin,
  onViewLog,
  onChangeCategory,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}: ProjectContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (contextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [contextMenu, onClose]);

  if (!contextMenu) return null;

  const isPinned = 'isPinned' in contextMenu.entity && (contextMenu.entity as any).isPinned;

  return (
    <div
      ref={menuRef}
      className="fixed bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 py-1 z-50 min-w-[180px]"
      style={{ 
        top: `${contextMenu.y}px`, 
        left: `${contextMenu.x}px` 
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