// components/analytics/DashboardFilters.tsx
/**
 * Advanced Dashboard Filters Component
 * 
 * Comprehensive filtering interface with:
 * - Multi-select departments/offices
 * - Date range picker with presets
 * - Month and quarter selectors
 * - Status filters
 * - Global search
 * - Share URL functionality
 * - Active filter badges
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { GlobalSearch } from "./GlobalSearch";
import { api } from "@/convex/_generated/api";
import type { Id, Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Calendar,
    Building2,
    X,
    Share2,
    Filter,
    ChevronDown,
    Check,
} from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { DashboardFilters as Filters } from "@/hooks/useDashboardFilters";
import { DATE_RANGE_PRESETS, MONTH_LABELS, QUARTER_LABELS } from "@/hooks/useDashboardFilters";
import { toast } from "sonner";

interface DashboardFiltersProps {
    filters: Filters;
    onChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
    onReset: () => void;
}

export function DashboardFilters({
    filters,
    onChange,
    onReset,
}: DashboardFiltersProps) {
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Fetch data for selectors
    const fiscalYears = useQuery(api.fiscalYears.list, {});
    const departments = useQuery(api.departments.list, {});
    const implementingAgencies = useQuery(api.implementingAgencies.list, {});

    // Count active filters
    const activeCount = Object.entries(filters).reduce((count, [key, value]) => {
        if (key === "sortBy" || key === "sortOrder") return count;
        if (Array.isArray(value)) return count + (value.length > 0 ? 1 : 0);
        return count + (value !== undefined && value !== null ? 1 : 0);
    }, 0);

    const handleShare = () => {
        const url = `${window.location.origin}${window.location.pathname}?${new URLSearchParams(
            window.location.search
        ).toString()}`;

        navigator.clipboard.writeText(url);
        toast.success("Dashboard link copied to clipboard!");
    };

    return (
        <div className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="container mx-auto p-4">
                {/* Desktop Filters */}
                <div className="hidden lg:flex flex-wrap items-center gap-3">
                    {/* Fiscal Year Selector */}
                    <FiscalYearSelector
                        value={filters.fiscalYearId}
                        onChange={(value) => onChange("fiscalYearId", value)}
                        fiscalYears={fiscalYears || []}
                    />

                    {/* Office Multi-Select */}
                    <OfficeMultiSelect
                        value={filters.officeIds || []}
                        onChange={(value) => onChange("officeIds", value)}
                        offices={implementingAgencies || []}
                    />

                    {/* Department Multi-Select */}
                    <DepartmentMultiSelect
                        value={filters.departmentIds || []}
                        onChange={(value) => onChange("departmentIds", value)}
                        departments={departments || []}
                    />

                    {/* Date Range Picker */}
                    <DateRangePicker
                        startDate={filters.startDate}
                        endDate={filters.endDate}
                        onChange={(start, end) => {
                            onChange("startDate", start);
                            onChange("endDate", end);
                        }}
                    />

                    {/* Quarter Selector */}
                    <QuarterSelector
                        value={filters.quarter}
                        onChange={(value) => onChange("quarter", value)}
                    />

                    {/* Global Search */}
                    <GlobalSearch />

                    {/* Project Status Filter - Hidden for now */}
                    {/* <StatusFilter
                        label="Project Status"
                        value={filters.projectStatuses || []}
                        onChange={(value) => onChange("projectStatuses", value)}
                        options={[
                            { value: "draft", label: "Draft" },
                            { value: "approved", label: "Approved" },
                            { value: "ongoing", label: "Ongoing" },
                            { value: "completed", label: "Completed" },
                            { value: "delayed", label: "Delayed" },
                            { value: "cancelled", label: "Cancelled" },
                        ]}
                    /> */}

                    {/* Actions */}
                    <div className="ml-auto flex items-center gap-2">
                        {activeCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={onReset}>
                                <X className="mr-2 h-4 w-4" />
                                Clear ({activeCount})
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={handleShare}>
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                        </Button>
                    </div>
                </div>

                {/* Mobile Filter Button */}
                <div className="lg:hidden flex items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={() => setShowMobileFilters(!showMobileFilters)}
                    >
                        <Filter className="mr-2 h-4 w-4" />
                        Filters
                        {activeCount > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {activeCount}
                            </Badge>
                        )}
                    </Button>

                    <div className="flex gap-2">
                        {activeCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={onReset}>
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={handleShare}>
                            <Share2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Mobile Filters Dropdown */}
                <AnimatePresence>
                    {showMobileFilters && (
                        <motion.div
                            className="lg:hidden mt-4 space-y-3"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <FiscalYearSelector
                                value={filters.fiscalYearId}
                                onChange={(value) => onChange("fiscalYearId", value)}
                                fiscalYears={fiscalYears || []}
                            />
                            <DepartmentMultiSelect
                                value={filters.departmentIds || []}
                                onChange={(value) => onChange("departmentIds", value)}
                                departments={departments || []}
                            />
                            {/* Add more mobile filters */}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Active Filter Badges */}
                {activeCount > 0 && (
                    <motion.div
                        className="mt-3 flex flex-wrap gap-2"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <ActiveFilterBadges
                            filters={filters}
                            onChange={onChange}
                            fiscalYears={fiscalYears || []}
                        />
                    </motion.div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface FiscalYearSelectorProps {
    value?: Id<"fiscalYears">;
    onChange: (value?: Id<"fiscalYears">) => void;
    fiscalYears: Doc<"fiscalYears">[];
}

function FiscalYearSelector({ value, onChange, fiscalYears }: FiscalYearSelectorProps) {
    const [open, setOpen] = useState(false);

    const selected = fiscalYears.find((fy) => fy._id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto justify-between">
                    <Calendar className="mr-2 h-4 w-4" />
                    {selected ? `FY ${selected.year}` : "Year"}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search year..." />
                    <CommandList>
                        <CommandEmpty>No year found.</CommandEmpty>
                        <CommandGroup>
                            {fiscalYears.map((fy) => (
                                <CommandItem
                                    key={fy._id}
                                    value={fy.year.toString()}
                                    onSelect={() => {
                                        onChange(fy._id);
                                        setOpen(false);
                                    }}
                                >
                                    <div
                                        className={cn(
                                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                            value === fy._id
                                                ? "bg-primary text-primary-foreground"
                                                : "opacity-50 [&_svg]:invisible"
                                        )}
                                    >
                                        <Check className="h-3 w-3" />
                                    </div>
                                    FY {fy.year}
                                    {fy.label && (
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            {fy.label}
                                        </span>
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

interface DepartmentMultiSelectProps {
    value: Id<"departments">[];
    onChange: (value: Id<"departments">[]) => void;
    departments: Doc<"departments">[];
}

function DepartmentMultiSelect({ value, onChange, departments }: DepartmentMultiSelectProps) {
    const [open, setOpen] = useState(false);

    const toggleDepartment = (deptId: Id<"departments">) => {
        const newValue: Id<"departments">[] = value.includes(deptId)
            ? value.filter((id) => id !== deptId)
            : [...value, deptId];
        onChange(newValue);
    };

    const selectedDepts = departments.filter((d) => value.includes(d._id));

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto justify-between">
                    <Building2 className="mr-2 h-4 w-4" />
                    {selectedDepts.length > 0
                        ? `${selectedDepts.length} Department${selectedDepts.length > 1 ? "s" : ""}`
                        : "Departments"}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search departments..." />
                    <CommandList>
                        <CommandEmpty>No department found.</CommandEmpty>
                        <CommandGroup>
                            {departments.map((dept) => (
                                <CommandItem
                                    key={dept._id}
                                    value={dept.name}
                                    onSelect={() => toggleDepartment(dept._id)}
                                >
                                    <div className="flex items-center">
                                        <div
                                            className={cn(
                                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                value.includes(dept._id)
                                                    ? "bg-primary text-primary-foreground"
                                                    : "opacity-50 [&_svg]:invisible"
                                            )}
                                        >
                                            <Check className="h-3 w-3" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm">{dept.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {dept.code}
                                            </span>
                                        </div>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

interface OfficeMultiSelectProps {
    value: string[];
    onChange: (value: string[]) => void;
    offices: Doc<"implementingAgencies">[];
}

function OfficeMultiSelect({ value, onChange, offices }: OfficeMultiSelectProps) {
    const [open, setOpen] = useState(false);

    const toggleOffice = (officeCode: string) => {
        const newValue = value.includes(officeCode)
            ? value.filter((code) => code !== officeCode)
            : [...value, officeCode];
        onChange(newValue);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto justify-between">
                    <Building2 className="mr-2 h-4 w-4" />
                    {value.length > 0
                        ? `${value.length} Office${value.length > 1 ? "s" : ""}`
                        : "Offices"}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search offices..." />
                    <CommandList>
                        <CommandEmpty>No office found.</CommandEmpty>
                        <CommandGroup>
                            {offices.map((office) => (
                                <CommandItem
                                    key={office._id}
                                    value={office.fullName}
                                    onSelect={() => toggleOffice(office.code)}
                                >
                                    <div className="flex items-center">
                                        <div
                                            className={cn(
                                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                value.includes(office.code)
                                                    ? "bg-primary text-primary-foreground"
                                                    : "opacity-50 [&_svg]:invisible"
                                            )}
                                        >
                                            <Check className="h-3 w-3" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm">{office.fullName}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {office.code}
                                            </span>
                                        </div>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

interface DateRangePickerProps {
    startDate?: number;
    endDate?: number;
    onChange: (start?: number, end?: number) => void;
}

function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
    const [open, setOpen] = useState(false);

    const displayText = startDate && endDate
        ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
        : "Date Range";

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto justify-between">
                    <Calendar className="mr-2 h-4 w-4" />
                    {displayText}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
                <div className="space-y-4">
                    {/* Presets */}
                    <div className="grid grid-cols-2 gap-2">
                        {DATE_RANGE_PRESETS.map((preset) => (
                            <Button
                                key={preset.label}
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const range = preset.getValue();
                                    onChange(range.start, range.end);
                                    setOpen(false);
                                }}
                            >
                                {preset.label}
                            </Button>
                        ))}
                    </div>

                    {/* Custom Range */}
                    <div className="border-t pt-4">
                        <p className="text-sm font-medium mb-2">Custom Range</p>
                        <CalendarComponent
                            mode="range"
                            selected={{
                                from: startDate ? new Date(startDate) : undefined,
                                to: endDate ? new Date(endDate) : undefined,
                            }}
                            onSelect={(range: any) => {
                                if (range?.from) onChange(range.from.getTime(), range.to?.getTime());
                            }}
                            initialFocus
                        />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

interface QuarterSelectorProps {
    value?: number;
    onChange: (value?: number) => void;
}

function QuarterSelector({ value, onChange }: QuarterSelectorProps) {
    const [open, setOpen] = useState(false);

    const selected = QUARTER_LABELS.find((q) => q.value === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto justify-between">
                    {selected ? selected.label : "Quarter"}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                    <CommandList>
                        <CommandGroup>
                            {QUARTER_LABELS.map((quarter) => (
                                <CommandItem
                                    key={quarter.value}
                                    onSelect={() => {
                                        onChange(quarter.value === value ? undefined : quarter.value);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === quarter.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {quarter.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

interface StatusFilterProps {
    label: string;
    value: string[];
    onChange: (value: string[]) => void;
    options: { value: string; label: string }[];
}

function StatusFilter({ label, value, onChange, options }: StatusFilterProps) {
    const [open, setOpen] = useState(false);

    const toggleStatus = (statusValue: string) => {
        const newValue = value.includes(statusValue)
            ? value.filter((v) => v !== statusValue)
            : [...value, statusValue];
        onChange(newValue);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto justify-between">
                    {label}
                    {value.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                            {value.length}
                        </Badge>
                    )}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                    <CommandList>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    onSelect={() => toggleStatus(option.value)}
                                >
                                    <div
                                        className={cn(
                                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                            value.includes(option.value)
                                                ? "bg-primary text-primary-foreground"
                                                : "opacity-50 [&_svg]:invisible"
                                        )}
                                    >
                                        <Check className="h-3 w-3" />
                                    </div>
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

interface ActiveFilterBadgesProps {
    filters: Filters;
    onChange: DashboardFiltersProps["onChange"];
    fiscalYears?: Doc<"fiscalYears">[];
}

function ActiveFilterBadges({ filters, onChange, fiscalYears }: ActiveFilterBadgesProps) {
    const badges: Array<{ key: string; label: string; onRemove: () => void }> = [];

    if (filters.fiscalYearId) {
        const fy = fiscalYears?.find((f) => f._id === filters.fiscalYearId);
        badges.push({
            key: "fiscalYear",
            label: fy ? `FY: ${fy.year}` : "FY: ...",
            onRemove: () => onChange("fiscalYearId", undefined),
        });
    }

    if (filters.departmentIds && filters.departmentIds.length > 0) {
        badges.push({
            key: "departments",
            label: `${filters.departmentIds.length} Department(s)`,
            onRemove: () => onChange("departmentIds", []),
        });
    }

    if (filters.officeIds && filters.officeIds.length > 0) {
        badges.push({
            key: "offices",
            label: `${filters.officeIds.length} Office(s)`,
            onRemove: () => onChange("officeIds", []),
        });
    }

    if (filters.quarter) {
        badges.push({
            key: "quarter",
            label: `Q${filters.quarter}`,
            onRemove: () => onChange("quarter", undefined),
        });
    }

    return (
        <>
            {badges.map((badge) => (
                <Badge
                    key={badge.key}
                    variant="secondary"
                    className="flex items-center gap-1"
                >
                    {badge.label}
                    <button
                        onClick={badge.onRemove}
                        className="ml-1 rounded-full hover:bg-zinc-300 dark:hover:bg-zinc-700"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            ))}
        </>
    );
}