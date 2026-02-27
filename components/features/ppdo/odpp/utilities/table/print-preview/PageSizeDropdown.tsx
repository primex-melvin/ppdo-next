'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type PageSize = 'A4' | 'Short' | 'Long';

interface PageSizeDropdownProps {
  value: PageSize;
  onChange: (size: PageSize) => void;
}

const PAGE_SIZE_LABELS: Record<PageSize, string> = {
  A4: 'A4',
  Short: 'Short (8.5 x 11")',
  Long: 'Long (8.5 x 13")',
};

export function PageSizeDropdown({ value, onChange }: PageSizeDropdownProps) {
  return (
    <Select value={value} onValueChange={(nextValue) => onChange(nextValue as PageSize)}>
      <SelectTrigger className="w-36 h-8 text-xs bg-white dark:bg-zinc-900">
        <SelectValue placeholder="Page Size" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="A4">{PAGE_SIZE_LABELS.A4}</SelectItem>
        <SelectItem value="Short">{PAGE_SIZE_LABELS.Short}</SelectItem>
        <SelectItem value="Long">{PAGE_SIZE_LABELS.Long}</SelectItem>
      </SelectContent>
    </Select>
  );
}

