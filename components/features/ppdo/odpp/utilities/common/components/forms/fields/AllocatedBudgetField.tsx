
/**
 * AllocatedBudgetField - Unified Form Field Component
 * 
 * A reusable currency input field for budget allocation with formatting,
 * validation, and optional budget availability checking.
 * 
 * @example
 * <AllocatedBudgetField
 *   form={form}
 *   fieldName="totalBudgetAllocated"
 *   displayValue={displayValue}
 *   setDisplayValue={setDisplayValue}
 *   label="Total Budget Allocated"
 *   showBudgetTooltip={true}
 *   availableBudget={500000}
 *   showOverBudgetWarning={true}
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Info, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/shared/utils/form-helpers";
import { cn } from "@/lib/utils";

// Utility functions (re-exported for convenience)
export {
    formatNumberWithCommas,
    parseFormattedNumber,
    formatNumberForDisplay,
} from "@/lib/shared/utils/form-helpers";

export interface AllocatedBudgetFieldProps<TFieldValues extends FieldValues> {
    /** React Hook Form instance */
    form: UseFormReturn<TFieldValues>;
    /** Field name for the budget amount (default: "totalBudgetAllocated") */
    fieldName?: Path<TFieldValues>;
    /** Display value (formatted string) */
    displayValue: string;
    /** Setter for display value */
    setDisplayValue: (value: string) => void;
    /** Label text (default: "Total Budget Allocated") */
    label?: string;
    /** Currency symbol (default: "₱") */
    currencySymbol?: string;
    /** Placeholder text (default: "0") */
    placeholder?: string;
    /** Whether to show the budget availability tooltip */
    showBudgetTooltip?: boolean;
    /** Available budget amount for tooltip */
    availableBudget?: number;
    /** Whether the budget availability is loading */
    isLoadingBudget?: boolean;
    /** Whether to show over-budget warning */
    showOverBudgetWarning?: boolean;
    /** Whether the current value exceeds budget */
    isOverBudget?: boolean;
    /** Additional CSS class for the input */
    inputClassName?: string;
}

export function AllocatedBudgetField<TFieldValues extends FieldValues>({
    form,
    fieldName = "totalBudgetAllocated" as Path<TFieldValues>,
    displayValue,
    setDisplayValue,
    label = "Total Budget Allocated",
    currencySymbol = "₱",
    placeholder = "0",
    showBudgetTooltip = false,
    availableBudget,
    isLoadingBudget = false,
    showOverBudgetWarning = false,
    isOverBudget = false,
    inputClassName,
}: AllocatedBudgetFieldProps<TFieldValues>) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Allow only numbers, commas, and dots
        const sanitized = value.replace(/[^\d.,]/g, "");
        setDisplayValue(sanitized);
    };

    const handleBlur = () => {
        const numericValue = parseFormattedNumber(displayValue);
        if (numericValue > 0) {
            setDisplayValue(formatNumberForDisplay(numericValue));
        } else {
            setDisplayValue("");
        }
        form.setValue(fieldName, numericValue as any, { shouldValidate: true });
    };

    return (
        <FormField
            control={form.control}
            name={fieldName}
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-zinc-700 dark:text-zinc-300">
                        <div className="flex items-center gap-2">
                            <span>{label}</span>
                            {showBudgetTooltip && !isLoadingBudget && availableBudget !== undefined && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="w-4 h-4 text-zinc-400 hover:text-zinc-600 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Available: {formatCurrency(availableBudget)}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    </FormLabel>
                    <FormControl>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 dark:text-zinc-400">
                                {currencySymbol}
                            </span>
                            <Input
                                placeholder={placeholder}
                                className={cn(
                                    "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 pl-8",
                                    isOverBudget && "border-red-500 focus-visible:ring-red-500",
                                    inputClassName
                                )}
                                value={displayValue}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                        </div>
                    </FormControl>
                    {showOverBudgetWarning && isOverBudget && availableBudget !== undefined && (
                        <div className="flex items-start gap-1 mt-1 text-xs text-red-600 font-medium animate-in slide-in-from-top-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>
                                Warning: Amount exceeds available budget ({formatCurrency(availableBudget)})
                            </span>
                        </div>
                    )}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

// Helper functions
function formatNumberWithCommas(value: string): string {
    const numeric = value.replace(/[^\d]/g, "");
    if (!numeric) return "";
    return parseInt(numeric).toLocaleString("en-US");
}

function parseFormattedNumber(value: string): number {
    if (!value) return 0;
    const numeric = value.replace(/[^\d]/g, "");
    return parseInt(numeric) || 0;
}

function formatNumberForDisplay(value: number): string {
    if (!value || value === 0) return "";
    return value.toLocaleString("en-US");
}
