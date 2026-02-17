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
// Note: GlobalSearch removed - new search system in development
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { DashboardFilters as Filters } from "@/hooks/useDashboardFilters";
import { DATE_RANGE_PRESETS, MONTH_LABELS, QUARTER_LABELS } from "@/hooks/useDashboardFilters";
import { toast } from "sonner";

interface DashboardFiltersProps {
    filters: Filters;
    onChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
    onReset: () => void;
    activeYear?: number;
}

export function DashboardFilters({
    filters,
    onChange,
    onReset,
    activeYear,
}: DashboardFiltersProps) {
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Fetch data for selectors
    // Fetch data for selectors
    const fiscalYears = useQuery(api.fiscalYears.list, {});
    const internalAgencies = useQuery(api.implementingAgencies.list, { type: "internal" });
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
                    {/* High-Visibility Year Switcher */}
                    <YearSwitcher
                        fiscalYears={fiscalYears || []}
                        currentFiscalYearId={filters.fiscalYearId}
                        activeYear={activeYear}
                    />

                    <div className="h-8 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-2" />
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
                        departments={internalAgencies || []}
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

                    {/* Global Search - Removed: New search system in development */}

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
                            <YearSwitcher
                                fiscalYears={fiscalYears || []}
                                currentFiscalYearId={filters.fiscalYearId}
                                activeYear={activeYear}
                                mobile
                            />
                            <DepartmentMultiSelect
                                value={filters.departmentIds || []}
                                onChange={(value) => onChange("departmentIds", value)}
                                departments={internalAgencies || []}
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

function LoadingModal({ open }: { open: boolean }) {
    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent className="[&>button]:hidden sm:max-w-[425px] flex flex-col items-center justify-center py-10 gap-6">
                <div className="relative">
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-primary animate-pulse" />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <DialogTitle className="text-xl font-bold tracking-tight">Updating Dashboard</DialogTitle>
                    <p className="text-sm text-muted-foreground">Switching fiscal year data...</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

interface YearSwitcherProps {
    fiscalYears: Doc<"fiscalYears">[];
    currentFiscalYearId?: Id<"fiscalYears">;
    mobile?: boolean;
    activeYear?: number;
}

function YearSwitcher({ fiscalYears, currentFiscalYearId, mobile, activeYear }: YearSwitcherProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const currentYear = fiscalYears.find(fy => fy._id === currentFiscalYearId);

    // Priority: activeYear prop > currentFiscalYearId lookup > "Select"
    const displayYear = activeYear || (currentYear ? currentYear.year : "Select");

    const handleYearChange = async (year: number) => {
        if ((activeYear === year) || (currentYear && currentYear.year === year)) {
            setOpen(false);
            return;
        }

        setOpen(false);
        setIsLoading(true);

        // 1.5s artificial delay for "loading" UX
        await new Promise(resolve => setTimeout(resolve, 1500));

        const params = new URLSearchParams(searchParams.toString());
        // We simply navigate to the new year path. 
        // Note: The parent component or page should handle the re-fetching based on the new URL params/path.
        router.push(`/dashboard/${year}?${params.toString()}`);

        // We don't turn off loading here immediately because the page navigation will happen.
        // However, since it's a client side transition, we should strictly turn it off 
        // to prevent it getting stuck if navigation is instant or fails. 
        // But for the UX requested, seeing it for 1.5s is the priority.
        setTimeout(() => setIsLoading(false), 500);
    };

    const TriggerInfo = (
        <div className={cn("flex items-center gap-2", mobile && "w-full justify-between")}>
            <span className="font-bold text-lg">Year: {displayYear}</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
        </div>
    );

    return (
        <>
            <LoadingModal open={isLoading} />
            <Popover open={open} onOpenChange={setOpen}>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "h-10 px-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200",
                                        mobile ? "w-full border rounded-md" : "border-b-2 border-transparent hover:border-primary rounded-none"
                                    )}
                                >
                                    {TriggerInfo}
                                </Button>
                            </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Switch Fiscal Year</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

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
                                        onSelect={() => handleYearChange(fy.year)}
                                        className="cursor-pointer"
                                    >
                                        <div
                                            className={cn(
                                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                displayYear === fy.year
                                                    ? "bg-primary text-primary-foreground"
                                                    : "opacity-50 [&_svg]:invisible"
                                            )}
                                        >
                                            <Check className="h-3 w-3" />
                                        </div>
                                        <span className="font-medium">FY {fy.year}</span>
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
        </>
    );
}
interface DepartmentMultiSelectProps {
    value: Id<"implementingAgencies">[];
    onChange: (value: Id<"implementingAgencies">[]) => void;
    departments: Doc<"implementingAgencies">[];
}

function DepartmentMultiSelect({ value, onChange, departments }: DepartmentMultiSelectProps) {
    const [open, setOpen] = useState(false);

    const toggleDepartment = (deptId: Id<"implementingAgencies">) => {
        const newValue: Id<"implementingAgencies">[] = value.includes(deptId)
            ? value.filter((id) => id !== deptId)
            : [...value, deptId];
        onChange(newValue);
    };



    const selectedDepts = departments.filter((d) => value.includes(d._id));

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto justify-between gap-2">
                    <div className="flex items-center">
                        <Building2 className="mr-2 h-4 w-4" />
                        {selectedDepts.length > 0
                            ? `${selectedDepts.length} Department${selectedDepts.length > 1 ? "s" : ""}`
                            : "Departments"}
                    </div>
                    <div className="flex items-center gap-1">
                        <Badge variant="outline" className="h-5 px-1.5 font-black bg-zinc-100/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-[10px]">
                            {departments.length}
                        </Badge>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </div>
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
                                    value={dept.fullName}
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
                                            <span className="text-sm">{dept.fullName}</span>
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
                <Button variant="outline" className="w-full sm:w-auto justify-between gap-2">
                    <div className="flex items-center">
                        <Building2 className="mr-2 h-4 w-4" />
                        {value.length > 0
                            ? `${value.length} Office${value.length > 1 ? "s" : ""}`
                            : "Offices"}
                    </div>
                    <div className="flex items-center gap-1">
                        <Badge variant="outline" className="h-5 px-1.5 font-black bg-zinc-100/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-[10px]">
                            {offices.length}
                        </Badge>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </div>
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
}

function ActiveFilterBadges({ filters, onChange }: ActiveFilterBadgesProps) {
    const badges: Array<{ key: string; label: string; onRemove: () => void }> = [];

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