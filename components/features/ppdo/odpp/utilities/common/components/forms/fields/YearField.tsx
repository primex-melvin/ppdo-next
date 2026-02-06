
/**
 * YearField - Unified Form Field Component
 * 
 * A reusable year input field with auto-fill support.
 * 
 * @example
 * <YearField
 *   form={form}
 *   fieldName="year"
 *   urlYear={2024}
 *   minYear={2000}
 *   maxYear={2100}
 * />
 */

"use client";

import { UseFormReturn, Path, FieldValues } from "react-hook-form";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export interface YearFieldProps<TFieldValues extends FieldValues> {
    /** React Hook Form instance */
    form: UseFormReturn<TFieldValues>;
    /** Field name */
    fieldName?: Path<TFieldValues>;
    /** Year from URL for auto-fill indication */
    urlYear?: number;
    /** Whether the year field was auto-filled (shows indicator) */
    isYearAutoFilled?: boolean;
    /** Minimum year (default: 2000) */
    minYear?: number;
    /** Maximum year (default: 2100) */
    maxYear?: number;
    /** Placeholder text (default: "e.g. 2024") */
    placeholder?: string;
    /** Whether field is disabled */
    disabled?: boolean;
}

export function YearField<TFieldValues extends FieldValues>({
    form,
    fieldName = "year" as Path<TFieldValues>,
    urlYear,
    isYearAutoFilled,
    minYear = 2000,
    maxYear = 2100,
    placeholder = "e.g. 2024",
    disabled = false,
}: YearFieldProps<TFieldValues>) {
    const showAutoFilled = urlYear || isYearAutoFilled;
    return (
        <FormField
            control={form.control}
            name={fieldName}
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-zinc-700 dark:text-zinc-300">
                        Year {showAutoFilled && <span className="text-xs text-blue-500">(Auto-filled)</span>}
                    </FormLabel>
                    <FormControl>
                        <Input
                            type="number"
                            placeholder={placeholder}
                            min={minYear}
                            max={maxYear}
                            disabled={disabled}
                            className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => {
                                const value = e.target.value.trim();
                                field.onChange(value ? parseInt(value) : undefined);
                            }}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
