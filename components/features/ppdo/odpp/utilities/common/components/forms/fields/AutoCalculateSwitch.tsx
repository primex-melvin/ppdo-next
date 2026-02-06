
/**
 * AutoCalculateSwitch - Unified Form Field Component
 * 
 * A reusable switch component for auto-calculate budget utilization settings.
 * Works with any form that has an `autoCalculateBudgetUtilized` field.
 * 
 * @example
 * <AutoCalculateSwitch 
 *   form={form} 
 *   fieldName="autoCalculateBudgetUtilized"
 *   autoDescription="Budget utilized is automatically calculated from breakdowns."
 *   manualDescription="Budget utilized can be manually entered."
 * />
 */

"use client";

import { UseFormReturn, Path, FieldValues } from "react-hook-form";
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export interface AutoCalculateSwitchProps<TFieldValues extends FieldValues> {
    /** React Hook Form instance */
    form: UseFormReturn<TFieldValues>;
    /** Field name for the auto-calculate setting (default: "autoCalculateBudgetUtilized") */
    fieldName?: Path<TFieldValues>;
    /** Label text (default: "Auto-Calculate Budget Utilization") */
    label?: string;
    /** Description when auto-calculate is enabled */
    autoDescription?: string;
    /** Description when auto-calculate is disabled (manual mode) */
    manualDescription?: string;
    /** Badge text for auto mode (default: "Auto") */
    autoBadgeText?: string;
    /** Badge text for manual mode (default: "Manual") */
    manualBadgeText?: string;
}

export function AutoCalculateSwitch<TFieldValues extends FieldValues>({
    form,
    fieldName = "autoCalculateBudgetUtilized" as Path<TFieldValues>,
    label = "Auto-Calculate Budget Utilization",
    autoDescription = "Budget utilized is automatically calculated from breakdowns. Manual input is disabled.",
    manualDescription = "Budget utilized can be manually entered. Automatic calculation from breakdowns is disabled.",
    autoBadgeText = "Auto",
    manualBadgeText = "Manual",
}: AutoCalculateSwitchProps<TFieldValues>) {
    return (
        <FormField
            control={form.control}
            name={fieldName}
            render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 bg-zinc-50 dark:bg-zinc-900/50">
                    <FormControl>
                        <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                    </FormControl>
                    <div className="space-y-1 leading-none flex-1">
                        <FormLabel className="text-sm font-medium flex items-center gap-2">
                            {label}
                            <Badge variant={field.value ? "default" : "secondary"} className="text-xs">
                                {field.value ? autoBadgeText : manualBadgeText}
                            </Badge>
                        </FormLabel>
                        <FormDescription className="text-xs">
                            {field.value ? autoDescription : manualDescription}
                        </FormDescription>
                    </div>
                </FormItem>
            )}
        />
    );
}
