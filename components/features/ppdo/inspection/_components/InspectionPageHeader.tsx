/**
 * InspectionPageHeader Component
 *
 * Standardized page header for the inspection page.
 * Follows the same pattern as BreakdownHeader for consistency.
 */

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ActivityLogSheet } from "@/components/shared/activity/ActivityLogSheet";
import { Eye, EyeOff, ChevronLeft, ClipboardCheck } from "lucide-react";
import { PageHeaderWithIcon } from "@/components/features/ppdo/odpp/utilities/shared/PageHeaderWithIcon";

export interface InspectionPageHeaderProps {
  // Navigation
  backUrl: string;
  backLabel: string;

  // Entity Information
  breakdownName: string;
  projectName: string;
  implementingOffice?: string;
  year: string;

  // Details Visibility
  showDetails: boolean;
  setShowDetails: (show: boolean) => void;

  // Activity Log
  showActivityLog?: boolean;
}

export function InspectionPageHeader({
  backUrl,
  backLabel,
  breakdownName,
  projectName,
  implementingOffice,
  year,
  showDetails,
  setShowDetails,
  showActivityLog = true,
}: InspectionPageHeaderProps) {
  const description = `Inspection records for ${projectName} • ${year}`;

  const ActionButtons = (
    <div className="flex items-center gap-2 mt-2 sm:mt-0">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDetails(!showDetails)}
        className="gap-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        {showDetails ? (
          <>
            <EyeOff className="w-4 h-4" />
            <span className="hidden sm:inline">Hide Details</span>
          </>
        ) : (
          <>
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Show Details</span>
          </>
        )}
      </Button>

      {/* Activity Log Sheet */}
      {showActivityLog && breakdownName && (
        <ActivityLogSheet
          type="breakdown"
          projectName={breakdownName}
          implementingOffice={implementingOffice}
        />
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-2 no-print">
      <Link
        href={backUrl}
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors w-fit"
      >
        <ChevronLeft className="w-4 h-4" />
        {backLabel}
      </Link>

      <PageHeaderWithIcon
        icon={ClipboardCheck}
        iconBgClass="bg-emerald-100 dark:bg-emerald-900/30"
        iconTextClass="text-emerald-700 dark:text-emerald-300"
        title={breakdownName}
        description={description}
        actionButton={ActionButtons}
      />
    </div>
  );
}

export default InspectionPageHeader;
