// components/ppdo/table/print-preview/TableFontSizeDropdown.tsx

'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TABLE_FONT_SIZE_MIN,
  TABLE_FONT_SIZE_MAX,
  clampTableFontSize,
} from '@/lib/print-canvas/types';

interface TableFontSizeDropdownProps {
  value: number;
  onChange: (fontSize: number) => void;
}

const FONT_SIZE_OPTIONS = Array.from(
  { length: TABLE_FONT_SIZE_MAX - TABLE_FONT_SIZE_MIN + 1 },
  (_, index) => TABLE_FONT_SIZE_MIN + index
);

export function TableFontSizeDropdown({ value, onChange }: TableFontSizeDropdownProps) {
  const normalizedValue = clampTableFontSize(value);

  return (
    <Select
      value={String(normalizedValue)}
      onValueChange={(nextValue) => onChange(clampTableFontSize(Number(nextValue)))}
    >
      <SelectTrigger className="w-20 h-8 text-xs bg-white dark:bg-zinc-900">
        <SelectValue placeholder="Size" />
      </SelectTrigger>
      <SelectContent>
        {FONT_SIZE_OPTIONS.map((size) => (
          <SelectItem key={size} value={String(size)}>
            {size}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
