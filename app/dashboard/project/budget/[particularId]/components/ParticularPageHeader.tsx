import Link from "next/link";
import { Button } from "@/components/ui/button";
import { History, RefreshCw, Eye, EyeOff } from "lucide-react";
import { ActivityLogSheet } from "../../../../components/ActivityLogSheet";
import { getStatusDisplayText, getStatusColorClass } from "../../../types";
import { Id } from "@/convex/_generated/dataModel";

interface ParticularPageHeaderProps {
  particularFullName: string;
  budgetItemId?: Id<"budgetItems">;
  budgetItemParticulars?: string;
  budgetItemStatus?: string;
  showDetails: boolean;
  onToggleDetails: () => void;
  onRecalculate: () => void;
}

export function ParticularPageHeader({
  particularFullName,
  budgetItemId,
  budgetItemParticulars,
  budgetItemStatus,
  showDetails,
  onToggleDetails,
  onRecalculate,
}: ParticularPageHeaderProps) {
  return (
    <div className="mb-6 no-print">
      <Link
        href="/dashboard/project/budget"
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-4 transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Budget Tracking
      </Link>

      <div className="flex items-center justify-between gap-4 mb-1">
        <h1
          className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-zinc-100"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          {particularFullName}
        </h1>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleDetails}
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

          {budgetItemId && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRecalculate}
              className="gap-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Recalculate</span>
            </Button>
          )}

          {budgetItemId && budgetItemParticulars && (
            <ActivityLogSheet
              type="project"
              budgetItemId={budgetItemId}
              title={`Project Activities: ${budgetItemParticulars}`}
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <History className="w-4 h-4" />
                  <span className="hidden sm:inline">Project Log</span>
                </Button>
              }
            />
          )}
        </div>
      </div>

      <p className="text-zinc-600 dark:text-zinc-400">
        Detailed project tracking and budget utilization
        {budgetItemStatus && (
          <span className={`ml-2 font-medium ${getStatusColorClass(budgetItemStatus as any)}`}>
            • Status: {getStatusDisplayText(budgetItemStatus as any)}
          </span>
        )}
      </p>
    </div>
  );
}
