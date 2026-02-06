// components/features/ppdo/inspection/index.ts
// Centralized Inspection Components Module

// ============================================================================
// NEW STANDARDIZED COMPONENTS (Following Breakdown Page Pattern)
// ============================================================================
export { InspectionPageHeader } from "./_components/InspectionPageHeader";
export type { InspectionPageHeaderProps } from "./_components/InspectionPageHeader";

export { InspectionStatistics } from "./_components/InspectionStatistics";

export { InspectionTable } from "./_components/InspectionTable";

// ============================================================================
// HOOKS
// ============================================================================
export { useInspectionStats } from "./_hooks/useInspectionStats";
export type { InspectionStats } from "./_hooks/useInspectionStats";

// ============================================================================
// LEGACY COMPONENTS (Preserved for backward compatibility)
// ============================================================================

// Financial Components
export { FinancialBreakdownCard } from "./components/financial/FinancialBreakdownCard";
export { FinancialBreakdownHeader } from "./components/financial/FinancialBreakdownHeader";
export { FinancialBreakdownMain } from "./components/financial/FinancialBreakdownMain";
export { FinancialBreakdownTable } from "./components/financial/FinancialBreakdownTable";
export { FinancialBreakdownTabs } from "./components/financial/FinancialBreakdownTabs";
export { FinancialBreakdownItemForm } from "./components/financial/FinancialBreakdownItemForm";

// Inspection Components
export { InspectionContextMenu } from "./components/inspection/InspectionContextMenu";
export { InspectionGalleryModal } from "./components/inspection/InspectionGalleryModal";
export { InspectionsDataTable } from "./components/inspection/InspectionsDataTable";
export { InspectionViewToggle } from "./components/inspection/InspectionViewToggle";

// Tab Components
export { AnalyticsContent } from "./components/tabs/AnalyticsContent";
export { InspectionContent } from "./components/tabs/InspectionContent";
export { OverviewContent } from "./components/tabs/OverviewContent";
export { RemarksContent } from "./components/tabs/RemarksContent";

// Modal Components
export { InspectionDetailsModal } from "./components/modals/InspectionDetailsModal";
export { NewInspectionForm } from "./components/modals/NewInspectionForm";
export { NewRemarkModal } from "./components/modals/NewRemarkModal";

// UI Components
export { Card } from "./components/Card";
export { StatCard } from "./components/StatCard";
export { TransactionCard } from "./components/TransactionCard";
export { default as RemarksSection } from "./components/RemarksSection";

export { tabs } from "./components/financial/FinancialBreakdownHeader";

// ============================================================================
// TYPES
// ============================================================================
export * from "./types";

// ============================================================================
// UTILITIES & CONSTANTS
// ============================================================================
export * from "./components/utils";
export * from "./components/mockData";
