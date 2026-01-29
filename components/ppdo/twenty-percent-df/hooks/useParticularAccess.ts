
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Hook to check if current user can access a specific budget particular page
 * @param particularCode - The particular code (e.g., "GJC", "GAD")
 */
export function useParticularAccess(particularCode: string) {
    const accessCheck = useQuery(
        api.budgetParticularAccess.canAccessParticular,
        particularCode ? { particularCode } : "skip"
    );

    return {
        accessCheck,
        isLoading: accessCheck === undefined,
        canAccess: accessCheck?.canAccess ?? false,
        user: accessCheck?.user,
        department: accessCheck?.department,
        accessLevel: accessCheck?.accessLevel,
        accessSource: accessCheck?.accessSource,
    };
}
