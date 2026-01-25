// components/shared/table/TableActionButton.tsx

"use client";

import { LucideIcon } from "lucide-react";

interface TableActionButtonProps {
  /**
   * Lucide icon component to display
   */
  icon: LucideIcon;

  /**
   * Button label text (hidden on mobile via sm:inline)
   */
  label: string;

  /**
   * Click handler
   */
  onClick: () => void;

  /**
   * Button variant style
   * - 'default': White/zinc-800 background with border
   * - 'primary': Colored background (uses accentColor)
   * @default 'default'
   */
  variant?: 'default' | 'primary';

  /**
   * Accent color for 'primary' variant (hex or rgb)
   * @example "#3b82f6" or "rgb(59, 130, 246)"
   */
  accentColor?: string;

  /**
   * Optional title attribute for accessibility
   */
  title?: string;

  /**
   * Additional className for customization
   */
  className?: string;
}

/**
 * TableActionButton - Shared action button component for table toolbars
 *
 * Features:
 * - Consistent sizing and spacing
 * - Responsive label hiding (hidden sm:inline)
 * - Two variants: default (outline) and primary (filled)
 * - Dark mode support
 * - Icon size fixed at 14x14px
 *
 * @example
 * ```tsx
 * // Default variant (outline button)
 * <TableActionButton
 *   icon={Trash2}
 *   label="Recycle Bin"
 *   onClick={handleOpenTrash}
 *   title="View Recycle Bin"
 * />
 *
 * // Primary variant (colored button)
 * <TableActionButton
 *   icon={Plus}
 *   label="Add Record"
 *   onClick={handleAdd}
 *   variant="primary"
 *   accentColor="#3b82f6"
 * />
 * ```
 */
export function TableActionButton({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
  accentColor,
  title,
  className = "",
}: TableActionButtonProps) {
  // Default variant: outline style with border
  if (variant === 'default') {
    return (
      <button
        onClick={onClick}
        className={`flex cursor-pointer items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors ${className}`}
        style={{
          border: '1px solid rgb(228 228 231 / 1)',
          borderRadius: '6px',
        }}
        title={title}
      >
        <Icon style={{ width: '14px', height: '14px' }} />
        <span className="hidden sm:inline">{label}</span>
      </button>
    );
  }

  // Primary variant: filled style with accent color
  return (
    <button
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-white hover:opacity-90 transition-opacity ${className}`}
      style={{
        backgroundColor: accentColor,
        borderRadius: '6px',
      }}
      title={title}
    >
      <Icon style={{ width: '14px', height: '14px' }} />
      <span>{label}</span>
    </button>
  );
}
