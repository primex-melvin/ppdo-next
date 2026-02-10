// components/ppdo/table/print-preview/JustifyDropdown.tsx

'use client';

import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type TextAlign = 'left' | 'center' | 'right';

interface JustifyDropdownProps {
  value: TextAlign;
  onChange: (align: TextAlign) => void;
}

const alignOptions: { value: TextAlign; label: string; icon: typeof AlignLeft }[] = [
  { value: 'left', label: 'Align Left', icon: AlignLeft },
  { value: 'center', label: 'Align Center', icon: AlignCenter },
  { value: 'right', label: 'Align Right', icon: AlignRight },
];

export function JustifyDropdown({ value, onChange }: JustifyDropdownProps) {
  const current = alignOptions.find(o => o.value === value) || alignOptions[0];
  const CurrentIcon = current.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 px-2.5">
                <CurrentIcon className="w-4 h-4" />
                <svg className="w-2.5 h-2.5 opacity-50" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Text Alignment</TooltipContent>
          <DropdownMenuContent align="start" className="min-w-[140px]">
            {alignOptions.map(opt => {
              const Icon = opt.icon;
              return (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => onChange(opt.value)}
                  className={value === opt.value ? 'bg-zinc-100 dark:bg-zinc-800' : ''}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {opt.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </Tooltip>
    </TooltipProvider>
  );
}
