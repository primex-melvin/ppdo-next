"use client";

import { Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TimeoutErrorStateProps {
  onRetry: () => void;
  onShowPartial?: () => void;
  partialResultsCount?: number;
  isRetrying?: boolean;
  className?: string;
}

export function TimeoutErrorState({
  onRetry,
  onShowPartial,
  partialResultsCount = 0,
  isRetrying = false,
  className,
}: TimeoutErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/30 p-6 mb-4">
        <Clock className="size-12 text-yellow-600 dark:text-yellow-400" />
      </div>

      <h3 className="text-lg font-semibold mb-2">
        Search is taking longer than expected
      </h3>

      <p className="text-sm text-muted-foreground max-w-md mb-6">
        The search query is complex and taking longer than usual to process.
        This might be due to high server load.
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        <Button
          variant="outline"
          onClick={onRetry}
          disabled={isRetrying}
          className="gap-2"
        >
          <RefreshCw className={cn("size-4", isRetrying && "animate-spin")} />
          {isRetrying ? "Retrying..." : "Try Again"}
        </Button>

        {partialResultsCount > 0 && onShowPartial && (
          <Button
            variant="secondary"
            onClick={onShowPartial}
            className="gap-2"
          >
            <AlertTriangle className="size-4" />
            Show {partialResultsCount} Partial Results
          </Button>
        )}
      </div>

      {partialResultsCount > 0 && (
        <p className="text-xs text-muted-foreground mt-4">
          Partial results may not include all matches
        </p>
      )}
    </div>
  );
}
