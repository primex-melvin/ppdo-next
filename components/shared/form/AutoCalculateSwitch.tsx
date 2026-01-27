// components/shared/form/AutoCalculateSwitch.tsx

"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface AutoCalculateSwitchProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  name?: string;
  childEntityName?: string; // e.g., "projects", "breakdowns"
}

/**
 * Shared AutoCalculateSwitch component
 * Used to toggle between automatic and manual budget utilization calculation
 */
export function AutoCalculateSwitch({
  control,
  name = "autoCalculateBudgetUtilized",
  childEntityName = "linked items",
}: AutoCalculateSwitchProps) {
  return (
    <FormField
      control={control}
      name={name}
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
              Auto-Calculate Budget Utilization
              <Badge variant={field.value ? "default" : "secondary"} className="text-xs">
                {field.value ? "Auto" : "Manual"}
              </Badge>
            </FormLabel>
            <FormDescription className="text-xs">
              {field.value
                ? `Budget utilized is automatically calculated from ${childEntityName}. Manual input is disabled.`
                : `Budget utilized can be manually entered. Automatic calculation from ${childEntityName} is disabled.`}
            </FormDescription>
          </div>
        </FormItem>
      )}
    />
  );
}
