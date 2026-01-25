// components/shared/form/CurrencyInput.tsx

"use client";

import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  formatNumberWithCommas,
  parseFormattedNumber,
  formatNumberForDisplay,
} from "@/lib/shared/utils/form-helpers";

interface CurrencyInputProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  name: string;
  label: string;
  placeholder?: string;
  displayValue: string;
  setDisplayValue: (value: string) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode; // For additional content like tooltips
}

/**
 * Shared CurrencyInput component for handling PHP currency inputs
 * Handles number formatting with commas and validation
 */
export function CurrencyInput({
  control,
  name,
  label,
  placeholder = "0",
  displayValue,
  setDisplayValue,
  disabled = false,
  className = "",
  children,
}: CurrencyInputProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <div className="flex items-center justify-between">
            <FormLabel className="text-zinc-700 dark:text-zinc-300">
              {label}
            </FormLabel>
            {children}
          </div>
          <FormControl>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 dark:text-zinc-400">
                ₱
              </span>
              <Input
                placeholder={placeholder}
                className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 pl-8"
                value={displayValue}
                disabled={disabled}
                onChange={(e) => {
                  const value = e.target.value;
                  const formatted = formatNumberWithCommas(value);
                  setDisplayValue(formatted);
                  const numericValue = parseFormattedNumber(formatted);
                  field.onChange(numericValue);
                }}
                onBlur={() => {
                  const numericValue = parseFormattedNumber(displayValue);
                  if (numericValue > 0) {
                    setDisplayValue(formatNumberForDisplay(numericValue));
                  } else {
                    setDisplayValue("");
                  }
                  field.onChange(numericValue);
                }}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
