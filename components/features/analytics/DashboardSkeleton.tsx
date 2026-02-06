import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Filter Skeleton */}
            <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-10 w-32" />
                ))}
            </div>

            {/* KPI Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-32 rounded-lg" />
                ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-80 rounded-lg" />
                ))}
            </div>
        </div>
    );
}