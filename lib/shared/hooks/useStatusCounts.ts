import { useMemo } from "react";

export function useStatusCounts<T extends { status?: string }>(
    items: T[],
    defaultStatuses: string[] = ["completed", "ongoing", "delayed"]
): Record<string, number> {
    return useMemo(() => {
        const counts: Record<string, number> = {};

        // Initialize default statuses
        defaultStatuses.forEach((s) => {
            counts[s] = 0;
        });

        // Also initialize 'not_available' as it's commonly used as fallback
        if (!counts["not_available"]) {
            counts["not_available"] = 0;
        }

        items.forEach((item) => {
            const status = item.status || "not_available";
            counts[status] = (counts[status] || 0) + 1;
        });

        return counts;
    }, [items, defaultStatuses]);
}
