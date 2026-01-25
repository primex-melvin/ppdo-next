// components/shared/table/TableSearchInput.tsx

"use client";

import { Search } from "lucide-react";

interface TableSearchInputProps {
  /**
   * Current search value
   */
  value: string;

  /**
   * Callback fired when the search value changes
   */
  onChange: (value: string) => void;

  /**
   * Placeholder text for the input
   * @default "Search..."
   */
  placeholder?: string;

  /**
   * Additional className for the container
   */
  className?: string;
}

/**
 * TableSearchInput - Shared search input component for table toolbars
 *
 * Features:
 * - Consistent search icon positioning
 * - Responsive width (w-full sm:w-64 lg:w-72)
 * - Dark mode support
 * - Focus states with ring styling
 * - Preserves exact border and padding from breakdown table
 *
 * @example
 * ```tsx
 * <TableSearchInput
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 *   placeholder="Search records..."
 * />
 * ```
 */
export function TableSearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}: TableSearchInputProps) {
  return (
    <div className={`relative w-full sm:w-64 lg:w-72 ${className}`}>
      <Search
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
        style={{ width: '14px', height: '14px' }}
      />
      <input
        className="w-full pl-8 pr-3 py-1.5 text-xs sm:text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-600 transition-shadow"
        style={{
          border: '1px solid rgb(228 228 231 / 1)',
          borderRadius: '6px',
        }}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
