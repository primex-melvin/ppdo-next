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
import { ProjectFormValues } from "./utils/formValidation";

interface AipRefCodeFieldProps {
    form: UseFormReturn<ProjectFormValues>;
}

export function AipRefCodeField({ form }: AipRefCodeFieldProps) {
    return (
        <FormField
            name="aipRefCode"
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-zinc-700 dark:text-zinc-300">
                        AIP Ref. Code <span className="text-xs text-zinc-500">(Optional)</span>
                    </FormLabel>
                    <FormControl>
                        <Input
                            placeholder="Enter AIP reference code..."
                            className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
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
