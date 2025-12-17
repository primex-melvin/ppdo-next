"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAccentColor } from "../../../../contexts/AccentColorContext";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";

// Define the form schema with Zod
const breakdownSchema = z.object({
  projectTitle: z.string().min(1, { message: "Project title is required." }), // Added projectTitle
  // Removed reportDate from input validation
  district: z.string().min(1, { message: "District is required." }),
  municipality: z.string().min(1, { message: "Municipality is required." }),
  barangay: z.string().optional(),
  fundSource: z.string().optional(),
  implementingAgency: z.string().optional(),
  appropriation: z.number().min(0, { message: "Must be 0 or greater." }),
  accomplishmentRate: z
    .number()
    .min(0, { message: "Must be 0 or greater." })
    .max(100, { message: "Must be 100 or less." }),
  remarksRaw: z.string().min(1, { message: "Remarks are required." }),
  statusCategory: z.enum([
    "pre_procurement",
    "procurement",
    "implementation",
    "completed",
    "suspended",
    "cancelled",
  ]),
  batchId: z.string().optional(),
});

type BreakdownFormValues = z.infer<typeof breakdownSchema>;

interface Breakdown {
  _id: string;
  projectTitle: string; // Added projectTitle
  reportDate: number;
  district: string;
  municipality: string;
  barangay?: string;
  fundSource?: string;
  implementingAgency?: string;
  appropriation: number;
  accomplishmentRate: number;
  remarksRaw: string;
  statusCategory: string;
  batchId?: string;
}

interface BreakdownFormProps {
  breakdown?: Breakdown | null;
  onSave: (breakdown: Omit<Breakdown, "_id" | "reportDate">) => void;
  onCancel: () => void;
}

export function BreakdownForm({
  breakdown,
  onSave,
  onCancel,
}: BreakdownFormProps) {
  const { accentColorValue } = useAccentColor();

  // Define the form
  const form = useForm<BreakdownFormValues>({
    resolver: zodResolver(breakdownSchema),
    defaultValues: {
      projectTitle: breakdown?.projectTitle || "",
      district: breakdown?.district || "",
      municipality: breakdown?.municipality || "",
      barangay: breakdown?.barangay || "",
      fundSource: breakdown?.fundSource || "",
      implementingAgency: breakdown?.implementingAgency || "",
      appropriation: breakdown?.appropriation || 0,
      accomplishmentRate: breakdown?.accomplishmentRate || 0,
      remarksRaw: breakdown?.remarksRaw || "",
      statusCategory: (breakdown?.statusCategory as any) || "implementation",
      batchId: breakdown?.batchId || "",
    },
  });

  // Watch values for validation
  const accomplishmentRate = form.watch("accomplishmentRate");
  const isAccomplishmentInvalid =
    accomplishmentRate < 0 || accomplishmentRate > 100;

  // Define submit handler
  function onSubmit(values: BreakdownFormValues) {
    const breakdownData = {
      projectTitle: values.projectTitle,
      // reportDate is handled by the parent or backend now
      district: values.district,
      municipality: values.municipality,
      barangay: values.barangay,
      fundSource: values.fundSource,
      implementingAgency: values.implementingAgency,
      appropriation: values.appropriation,
      accomplishmentRate: values.accomplishmentRate,
      remarksRaw: values.remarksRaw,
      statusCategory: values.statusCategory,
      batchId: values.batchId,
    };
    onSave(breakdownData as any);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Project Title - New First Field */}
        <FormField
          name="projectTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-700 dark:text-zinc-300">
                Project Title
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Construction of Multi-Purpose Building"
                  className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Location Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* District */}
          <FormField
            name="district"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-700 dark:text-zinc-300">
                  District
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., First District"
                    className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Municipality */}
          <FormField
            name="municipality"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-700 dark:text-zinc-300">
                  Municipality
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Anao"
                    className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Barangay */}
          <FormField
            name="barangay"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-700 dark:text-zinc-300">
                  Barangay{" "}
                  <span className="text-xs text-zinc-500">(Optional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., San Jose North"
                    className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Implementing Agency */}
          <FormField
            name="implementingAgency"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-700 dark:text-zinc-300">
                  Implementing Agency{" "}
                  <span className="text-xs text-zinc-500">(Optional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., PEO"
                    className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Budget Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Appropriation */}
          <FormField
            name="appropriation"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-700 dark:text-zinc-300">
                  Appropriation
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value.trim();
                      field.onChange(parseFloat(value) || 0);
                    }}
                  />
                </FormControl>
                <FormDescription className="text-zinc-500 dark:text-zinc-400 text-xs">
                  Budget allocated for this location
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Accomplishment Rate */}
          <FormField
            name="accomplishmentRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-700 dark:text-zinc-300">
                  Accomplishment (%)
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.1"
                    className={`bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 ${
                      isAccomplishmentInvalid
                        ? "border-red-500 dark:border-red-500 focus-visible:ring-red-500"
                        : "border-zinc-300 dark:border-zinc-700"
                    }`}
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value.trim();
                      field.onChange(parseFloat(value) || 0);
                    }}
                  />
                </FormControl>
                {isAccomplishmentInvalid && (
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    Must be between 0 and 100
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Fund Source */}
        <FormField
          name="fundSource"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-700 dark:text-zinc-300">
                Fund Source{" "}
                <span className="text-xs text-zinc-500">(Optional)</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., 20% Development Fund 2022"
                  className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status Category */}
        <FormField
          name="statusCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-700 dark:text-zinc-300">
                Status Category
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pre_procurement">
                    Pre-Procurement
                  </SelectItem>
                  <SelectItem value="procurement">Procurement</SelectItem>
                  <SelectItem value="implementation">Implementation</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription className="text-zinc-500 dark:text-zinc-400 text-xs">
                Current phase of the project
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Remarks */}
        <FormField
          name="remarksRaw"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-700 dark:text-zinc-300">
                Remarks
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., NOA, Contract, NTP under process"
                  rows={3}
                  className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-zinc-500 dark:text-zinc-400 text-xs">
                Current status and notes about the project
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Batch ID */}
        <FormField
          name="batchId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-700 dark:text-zinc-300">
                Batch ID{" "}
                <span className="text-xs text-zinc-500">(Optional)</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Import_June_2022"
                  className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription className="text-zinc-500 dark:text-zinc-400 text-xs">
                Used to group related import records
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button
            type="button"
            onClick={onCancel}
            variant="ghost"
            className="text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="text-white"
            style={{ backgroundColor: accentColorValue }}
          >
            {breakdown ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}