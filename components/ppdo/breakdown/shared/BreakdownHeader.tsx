/**
 * Shared Breakdown Header Component
 *
 * Standardized page header with Title, Back Button, and optional Action slots.
 * Used by both Project and Trust Fund breakdown pages.
 */

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ActivityLogSheet } from "@/components/ActivityLogSheet";
import { Eye, EyeOff, RefreshCw, ChevronLeft } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface BreakdownHeaderProps {
  // Navigation
  backUrl: string;
  backLabel: string;

  // Entity Information
  entityName?: string;
  entityType: "project" | "trustfund" | "specialeducationfund" | "specialhealthfund";
  implementingOffice?: string;
  year: string;
  subtitle?: string;

  // Header Visibility
  showHeader: boolean;
  setShowHeader: (show: boolean) => void;

  // Optional Actions
  onRecalculate?: () => void;
  isRecalculating?: boolean;
  showRecalculateButton?: boolean; // Explicit control (only for Projects)

  // Auto-Calculation Control
  isAutoCalculate?: boolean;
  onToggleAutoCalculate?: () => void;

  // Activity Log
  showActivityLog?: boolean;
}

export function BreakdownHeader({
  backUrl,
  backLabel,
  entityName,
  entityType,
  implementingOffice,
  year,
  subtitle,
  showHeader,
  setShowHeader,
  onRecalculate,
  isRecalculating = false,
  showRecalculateButton = false,
  isAutoCalculate,
  onToggleAutoCalculate,
  showActivityLog = true,
}: BreakdownHeaderProps) {
  const defaultSubtitle =
    subtitle || `Historical breakdown and progress tracking for ${year}`;

  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 no-print">
      <div className="flex-1">
        <Link
          href={backUrl}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {backLabel}
        </Link>

        {showHeader && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h1
              className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1"
              style={{ fontFamily: "var(--font-cinzel), serif" }}
            >
              {entityName || "Loading..."}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              {defaultSubtitle}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2 sm:mt-0">
        {/* Auto-Calculate Toggle */}
        {onToggleAutoCalculate && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="flex items-center gap-3 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-sm mr-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                  onClick={(e) => {
                    // Prevent switch from triggering twice if clicking the container
                    if ((e.target as HTMLElement).getAttribute('role') !== 'switch') {
                      onToggleAutoCalculate();
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded-md transition-colors ${isAutoCalculate ? "bg-green-100 dark:bg-green-900/30" : "bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700"}`}>
                      <RefreshCw className={`w-3.5 h-3.5 ${isAutoCalculate ? "text-green-700 dark:text-green-400" : "text-zinc-500"}`} />
                    </div>
                    <div className="flex flex-col select-none">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider leading-none mb-0.5">Auto-Calc</span>
                      <span className={`text-xs font-semibold leading-none transition-colors ${isAutoCalculate ? "text-green-700 dark:text-green-400" : "text-zinc-600 dark:text-zinc-400"}`}>
                        {isAutoCalculate ? "Active" : "Manual"}
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={isAutoCalculate}
                    onCheckedChange={() => onToggleAutoCalculate()}
                    className="data-[state=checked]:bg-green-600 h-5 w-9"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[300px] p-4">
                <div className="space-y-2">
                  <p className="font-semibold text-sm">
                    {isAutoCalculate ? "Auto-Calculation Active" : "Manual Calculation Mode"}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isAutoCalculate
                      ? "Parent financials are synced with breakdown items. Click to switch to manual mode."
                      : "Parent financials are manually managed. Click to enable auto-sync with breakdown items."}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHeader(!showHeader)}
          className="gap-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          {showHeader ? (
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

        {/* Recalculate Button - Only for Projects */}
        {showRecalculateButton && entityName && onRecalculate && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRecalculate}
            disabled={isRecalculating}
            className="gap-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRecalculating ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Recalculate Status</span>
          </Button>
        )}

        {/* Activity Log Sheet */}
        {showActivityLog && entityName && (
          <ActivityLogSheet
            type={
              entityType === "specialeducationfund"
                ? "specialEducationFundBreakdown"
                : entityType === "specialhealthfund"
                  ? "specialHealthFundBreakdown"
                  : "breakdown"
            }
            projectName={entityName}
            implementingOffice={implementingOffice}
          />
        )}
      </div>
    </div>
  );
}
