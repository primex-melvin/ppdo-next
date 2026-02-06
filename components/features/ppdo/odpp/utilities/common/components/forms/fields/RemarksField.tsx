
/**
 * RemarksField - Unified Form Field Component
 * 
 * A reusable textarea field for remarks/comments.
 * 
 * @example
 * <RemarksField
 *   form={form}
 *   fieldName="remarks"
 *   label="Remarks"
 *   placeholder="Add any additional notes..."
 *   rows={4}
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
import { Textarea } from "@/components/ui/textarea";

export interface RemarksFieldProps<TFieldValues extends FieldValues> {
    /** React Hook Form instance */
    form: UseFormReturn<TFieldValues>;
    /** Field name (default: "remarks") */
    fieldName?: Path<TFieldValues>;
    /** Label text (default: "Remarks") */
    label?: string;
    /** Whether the field is optional */
    isOptional?: boolean;
    /** Placeholder text */
    placeholder?: string;
    /** Number of rows (default: 3) */
    rows?: number;
    /** Whether field is disabled */
    disabled?: boolean;
}

export function RemarksField<TFieldValues extends FieldValues>({
    form,
    fieldName = "remarks" as Path<TFieldValues>,
    label = "Remarks",
    isOptional = true,
    placeholder = "Add any additional notes or comments...",
    rows = 3,
    disabled = false,
}: RemarksFieldProps<TFieldValues>) {
    return (
        <FormField
            control={form.control}
            name={fieldName}
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-zinc-700 dark:text-zinc-300">
                        {label} {isOptional && <span className="text-xs text-zinc-500">(Optional)</span>}
                    </FormLabel>
                    <FormControl>
                        <Textarea
                            placeholder={placeholder}
                            className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 resize-none"
                            rows={rows}
                            disabled={disabled}
                            {...field}
                            value={field.value || ""}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
