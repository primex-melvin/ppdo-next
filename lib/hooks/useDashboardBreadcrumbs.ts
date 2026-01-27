/**
 * useDashboardBreadcrumbs Hook
 * 
 * A reusable hook for managing breadcrumbs with skeleton loading states.
 * Automatically handles data-dependent loading states for breadcrumb items.
 */

import { useEffect } from "react";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";

interface BreadcrumbItem {
    label: string;
    href?: string;
    loading?: boolean;
}

interface UseDashboardBreadcrumbsParams {
    /**
     * Array of breadcrumb items to display when data is loaded
     */
    loadedBreadcrumbs: BreadcrumbItem[];

    /**
     * Array of breadcrumb items to display while loading (with loading flags)
     */
    loadingBreadcrumbs: BreadcrumbItem[];

    /**
     * Whether the data is currently loaded
     */
    isDataLoaded: boolean;

    /**
     * Dependencies array for the useEffect hook
     */
    dependencies: any[];
}

/**
 * Hook to manage breadcrumbs with loading states
 */
export function useDashboardBreadcrumbs({
    loadedBreadcrumbs,
    loadingBreadcrumbs,
    isDataLoaded,
    dependencies,
}: UseDashboardBreadcrumbsParams) {
    const { setCustomBreadcrumbs } = useBreadcrumb();

    useEffect(() => {
        if (isDataLoaded) {
            setCustomBreadcrumbs(loadedBreadcrumbs);
        } else {
            setCustomBreadcrumbs(loadingBreadcrumbs);
        }

        return () => setCustomBreadcrumbs(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDataLoaded, setCustomBreadcrumbs, ...dependencies]);
}
