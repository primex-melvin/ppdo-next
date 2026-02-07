"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useAccentColor } from "@/contexts/AccentColorContext";

// Type for the delete mutation function
type DeleteFiscalYearMutation = (args: { id: Id<"fiscalYears"> }) => Promise<void>;

// Raw fiscal year type from Convex query
export interface RawFiscalYear {
  _id: Id<"fiscalYears">;
  _creationTime: number;
  year: number;
  isActive: boolean;
  label?: string;
  description?: string;
  isCurrent?: boolean;
  updatedBy?: Id<"users">;
  notes?: string;
}

// Type for fiscal year with stats
export interface FiscalYearWithStats {
  _id: Id<"fiscalYears">;
  _creationTime?: number;
  year: number;
  isActive?: boolean;
  label?: string;
  description?: string;
  isCurrent?: boolean;
  stats: Record<string, number | string>;
}

// Type for year to delete
export interface YearToDelete {
  id: Id<"fiscalYears">;
  year: number;
}

export interface UseFiscalYearDashboardOptions {
  /** Route prefix for navigation (e.g., "/dashboard/trust-funds") */
  routePrefix: string;
  /** Optional custom delete mutation. Defaults to api.fiscalYears.remove */
  deleteMutation?: DeleteFiscalYearMutation;
}

export interface UseFiscalYearDashboardReturn {
  // State
  showFiscalYearModal: boolean;
  expandedCards: Set<string>;
  deleteDialogOpen: boolean;
  yearToDelete: YearToDelete | null;
  isLoadingYears: boolean;
  accentColorValue: string;

  // Loading state helpers
  isLoadingData: boolean;
  setIsLoadingData: (loading: boolean) => void;

  // Handlers
  setShowFiscalYearModal: (show: boolean) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setYearToDelete: (year: YearToDelete | null) => void;
  toggleCard: (cardId: string) => void;
  handleDeleteClick: (e: React.MouseEvent, id: Id<"fiscalYears">, year: number) => void;
  handleConfirmDelete: () => Promise<void>;
  handleOpenYear: (year: number) => void;
  handleYearCreated: () => void;

  // Helpers
  formatCurrency: (amount: number) => string;

  // Fiscal years with stats (set by the consuming component after calculating stats)
  fiscalYearsWithStats: FiscalYearWithStats[] | undefined;
  setFiscalYearsWithStats: (years: FiscalYearWithStats[] | undefined) => void;

  // Raw fiscal years from query (for reference if needed)
  rawFiscalYears: RawFiscalYear[] | undefined;

  // Sorted years (descending by year)
  sortedYears: FiscalYearWithStats[];
}

/**
 * Reusable hook for fiscal year dashboard pages.
 * Encapsulates shared state management, handlers, and helpers.
 */
export function useFiscalYearDashboard(
  options: UseFiscalYearDashboardOptions
): UseFiscalYearDashboardReturn {
  const { routePrefix, deleteMutation: customDeleteMutation } = options;
  const router = useRouter();
  const { accentColorValue } = useAccentColor();

  // Modal and dialog states
  const [showFiscalYearModal, setShowFiscalYearModal] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [yearToDelete, setYearToDelete] = useState<YearToDelete | null>(null);

  // UI states
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [fiscalYearsWithStats, setFiscalYearsWithStats] = useState<FiscalYearWithStats[] | undefined>(undefined);

  // Fetch fiscal years
  const rawFiscalYears = useQuery(api.fiscalYears.list, { includeInactive: false });

  // Delete mutation - use custom if provided, otherwise default
  const defaultDeleteMutation = useMutation(api.fiscalYears.remove);
  const deleteFiscalYear = customDeleteMutation || defaultDeleteMutation;

  const isLoadingYears = rawFiscalYears === undefined;

  // Sort years in descending order (use fiscalYearsWithStats if available and non-empty, otherwise sort raw years with empty stats)
  const sortedYears = useMemo((): FiscalYearWithStats[] => {
    if (fiscalYearsWithStats && fiscalYearsWithStats.length > 0) {
      return [...fiscalYearsWithStats].sort((a, b) => b.year - a.year);
    }
    if (!rawFiscalYears) return [];
    // Return raw years with empty stats as fallback
    return rawFiscalYears.map(fy => ({
      ...fy,
      stats: {},
    })).sort((a, b) => b.year - a.year);
  }, [fiscalYearsWithStats, rawFiscalYears]);

  /**
   * Toggle expanded state of a card
   */
  const toggleCard = useCallback((cardId: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  }, []);

  /**
   * Handle delete button click on a card
   */
  const handleDeleteClick = useCallback(
    (e: React.MouseEvent, id: Id<"fiscalYears">, year: number) => {
      e.stopPropagation();
      setYearToDelete({ id, year });
      setDeleteDialogOpen(true);
    },
    []
  );

  /**
   * Confirm and execute deletion
   */
  const handleConfirmDelete = useCallback(async () => {
    if (!yearToDelete) return;

    try {
      await deleteFiscalYear({ id: yearToDelete.id });
      toast.success(`Year ${yearToDelete.year} deleted successfully`);
      setDeleteDialogOpen(false);
      setYearToDelete(null);
    } catch (error) {
      toast.error("Failed to delete year");
      console.error(error);
    }
  }, [yearToDelete, deleteFiscalYear]);

  /**
   * Navigate to year detail page
   */
  const handleOpenYear = useCallback(
    (year: number) => {
      router.push(`${routePrefix}/${year}`);
    },
    [router, routePrefix]
  );

  /**
   * Callback when a new year is created
   */
  const handleYearCreated = useCallback(() => {
    // Refresh handled by Convex automatically
  }, []);

  /**
   * Format number as Philippine Peso currency
   */
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  return {
    // State
    showFiscalYearModal,
    expandedCards,
    deleteDialogOpen,
    yearToDelete,
    isLoadingYears,
    accentColorValue,

    // Loading state helpers
    isLoadingData,
    setIsLoadingData,

    // Handlers
    setShowFiscalYearModal,
    setDeleteDialogOpen,
    setYearToDelete,
    toggleCard,
    handleDeleteClick,
    handleConfirmDelete,
    handleOpenYear,
    handleYearCreated,

    // Helpers
    formatCurrency,

    // Fiscal years with stats (to be set by consuming component)
    fiscalYearsWithStats,
    setFiscalYearsWithStats,

    // Raw fiscal years from query
    rawFiscalYears,

    // Sorted years
    sortedYears,
  };
}

export default useFiscalYearDashboard;
