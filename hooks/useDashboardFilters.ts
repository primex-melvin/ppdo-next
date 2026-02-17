// hooks/useDashboardFilters.ts
/**
 * Dashboard Filters Hook - URL State Management
 * 
 * Manages dashboard filter state in URL query parameters for:
 * - Shareable URLs
 * - Browser back/forward navigation
 * - Persistent filter state across page reloads
 */

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { Id } from "@/convex/_generated/dataModel";

export interface DashboardFilters {
    fiscalYearId?: Id<"fiscalYears">;
    departmentIds?: Id<"implementingAgencies">[];
    officeIds?: string[];
    startDate?: number;
    endDate?: number;
    months?: number[];
    quarter?: number;
    projectStatuses?: string[];
    budgetStatuses?: string[];
    searchTerm?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    fundType?: "budget" | "trust" | "twenty-percent-df" | "education" | "health";
}

// URL parameter key mapping for cleaner URLs
const URL_KEY_MAP: Record<keyof DashboardFilters, string> = {
    fiscalYearId: "fy",
    departmentIds: "depts",
    officeIds: "offices",
    startDate: "start",
    endDate: "end",
    months: "months",
    quarter: "q",
    projectStatuses: "ps",
    budgetStatuses: "bs",
    searchTerm: "search",
    sortBy: "sort",
    sortOrder: "order",
    fundType: "fund",
};

export function useDashboardFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    /**
     * Parse URL parameters to filters object
     */
    const filters = useMemo<DashboardFilters>(() => {
        const parsed: DashboardFilters = {};

        // Fund Type
        const fund = searchParams.get("fund");
        if (fund) parsed.fundType = fund as any;

        // Fiscal Year
        const fy = searchParams.get("fy");
        if (fy) parsed.fiscalYearId = fy as Id<"fiscalYears">;

        // Departments (comma-separated IDs)
        const depts = searchParams.get("depts");
        if (depts) {
            parsed.departmentIds = depts.split(",") as Id<"implementingAgencies">[];
        }

        // Offices (comma-separated codes)
        const offices = searchParams.get("offices");
        if (offices) {
            parsed.officeIds = offices.split(",");
        }

        // Date Range
        const start = searchParams.get("start");
        const end = searchParams.get("end");
        if (start) parsed.startDate = Number(start);
        if (end) parsed.endDate = Number(end);

        // Months (comma-separated 1-12)
        const months = searchParams.get("months");
        if (months) {
            parsed.months = months.split(",").map(Number);
        }

        // Quarter (1-4)
        const quarter = searchParams.get("q");
        if (quarter) parsed.quarter = Number(quarter);

        // Project Statuses
        const ps = searchParams.get("ps");
        if (ps) {
            parsed.projectStatuses = ps.split(",");
        }

        // Budget Statuses
        const bs = searchParams.get("bs");
        if (bs) {
            parsed.budgetStatuses = bs.split(",");
        }

        // Search Term
        const search = searchParams.get("search");
        if (search) parsed.searchTerm = search;

        // Sorting
        const sort = searchParams.get("sort");
        const order = searchParams.get("order");
        if (sort) parsed.sortBy = sort;
        if (order && (order === "asc" || order === "desc")) {
            parsed.sortOrder = order;
        }

        return parsed;
    }, [searchParams]);

    /**
     * Update a single filter value
     */
    const updateFilter = useCallback(
        <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
            const params = new URLSearchParams(searchParams.toString());
            const urlKey = URL_KEY_MAP[key];

            // Remove if undefined, null, empty string, or empty array
            if (
                value === undefined ||
                value === null ||
                value === "" ||
                (Array.isArray(value) && value.length === 0)
            ) {
                params.delete(urlKey);
            } else if (Array.isArray(value)) {
                // Join arrays with commas
                params.set(urlKey, value.join(","));
            } else {
                params.set(urlKey, String(value));
            }

            // Navigate with new params (without scroll to maintain position)
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [searchParams, router, pathname]
    );

    /**
     * Update multiple filters at once
     */
    const updateFilters = useCallback(
        (updates: Partial<DashboardFilters>) => {
            const params = new URLSearchParams(searchParams.toString());

            Object.entries(updates).forEach(([key, value]) => {
                const urlKey = URL_KEY_MAP[key as keyof DashboardFilters];

                if (
                    value === undefined ||
                    value === null ||
                    value === "" ||
                    (Array.isArray(value) && value.length === 0)
                ) {
                    params.delete(urlKey);
                } else if (Array.isArray(value)) {
                    params.set(urlKey, value.join(","));
                } else {
                    params.set(urlKey, String(value));
                }
            });

            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [searchParams, router, pathname]
    );

    /**
     * Reset all filters
     */
    const resetFilters = useCallback(() => {
        router.push(pathname, { scroll: false });
    }, [router, pathname]);

    /**
     * Get shareable URL with current filters
     */
    const getShareableUrl = useCallback(() => {
        if (typeof window === "undefined") return "";
        return `${window.location.origin}${pathname}?${searchParams.toString()}`;
    }, [pathname, searchParams]);

    /**
     * Check if any filters are active
     */
    const hasActiveFilters = useMemo(() => {
        return Object.values(filters).some((value) => {
            if (Array.isArray(value)) return value.length > 0;
            return value !== undefined && value !== null && value !== "";
        });
    }, [filters]);

    /**
     * Count active filters
     */
    const activeFilterCount = useMemo(() => {
        return Object.entries(filters).reduce((count, [key, value]) => {
            if (key === "sortBy" || key === "sortOrder") return count;
            if (Array.isArray(value)) return count + (value.length > 0 ? 1 : 0);
            return count + (value !== undefined && value !== null && value !== "" ? 1 : 0);
        }, 0);
    }, [filters]);

    /**
     * Get filter preset (for save/load functionality)
     */
    const getFilterPreset = useCallback(() => {
        return {
            name: "",
            filters: { ...filters },
            createdAt: Date.now(),
        };
    }, [filters]);

    /**
     * Apply filter preset
     */
    const applyFilterPreset = useCallback(
        (preset: { filters: DashboardFilters }) => {
            updateFilters(preset.filters);
        },
        [updateFilters]
    );

    return {
        filters,
        updateFilter,
        updateFilters,
        resetFilters,
        getShareableUrl,
        hasActiveFilters,
        activeFilterCount,
        getFilterPreset,
        applyFilterPreset,
    };
}

/**
 * Date Range Presets for quick selection
 */
export const DATE_RANGE_PRESETS = [
    {
        label: "Today",
        getValue: () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const end = new Date(today);
            end.setHours(23, 59, 59, 999);
            return { start: today.getTime(), end: end.getTime() };
        },
    },
    {
        label: "This Week",
        getValue: () => {
            const today = new Date();
            const start = new Date(today);
            start.setDate(today.getDate() - today.getDay());
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            return { start: start.getTime(), end: end.getTime() };
        },
    },
    {
        label: "This Month",
        getValue: () => {
            const today = new Date();
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
            return { start: start.getTime(), end: end.getTime() };
        },
    },
    {
        label: "This Quarter",
        getValue: () => {
            const today = new Date();
            const quarter = Math.floor(today.getMonth() / 3);
            const start = new Date(today.getFullYear(), quarter * 3, 1);
            const end = new Date(today.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
            return { start: start.getTime(), end: end.getTime() };
        },
    },
    {
        label: "Last 6 Months",
        getValue: () => {
            const today = new Date();
            const start = new Date(today);
            start.setMonth(today.getMonth() - 6);
            start.setHours(0, 0, 0, 0);
            const end = new Date();
            end.setHours(23, 59, 59, 999);
            return { start: start.getTime(), end: end.getTime() };
        },
    },
    {
        label: "Year to Date",
        getValue: () => {
            const today = new Date();
            const start = new Date(today.getFullYear(), 0, 1);
            const end = new Date();
            end.setHours(23, 59, 59, 999);
            return { start: start.getTime(), end: end.getTime() };
        },
    },
] as const;

/**
 * Month labels for month selector
 */
export const MONTH_LABELS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
] as const;

/**
 * Quarter labels for quarter selector
 */
export const QUARTER_LABELS = [
    { value: 1, label: "Q1 (Jan-Mar)" },
    { value: 2, label: "Q2 (Apr-Jun)" },
    { value: 3, label: "Q3 (Jul-Sep)" },
    { value: 4, label: "Q4 (Oct-Dec)" },
] as const;