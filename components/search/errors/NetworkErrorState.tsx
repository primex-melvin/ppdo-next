"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NetworkErrorStateProps {
  onRetry: () => void;
  isRetrying?: boolean;
  className?: string;
}

export function NetworkErrorState({
  onRetry,
  isRetrying = false,
  className,
}: NetworkErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="rounded-full bg-destructive/10 p-6 mb-4">
        <WifiOff className="size-12 text-destructive" />
      </div>

      <h3 className="text-lg font-semibold mb-2">Connection Error</h3>

      <p className="text-sm text-muted-foreground max-w-md mb-6">
        Unable to connect to the search server. Please check your internet
        connection and try again.
      </p>

      <Button
        variant="outline"
        onClick={onRetry}
        disabled={isRetrying}
        className="gap-2"
      >
        <RefreshCw
          className={cn("size-4", isRetrying && "animate-spin")}
        />
        {isRetrying ? "Retrying..." : "Retry Connection"}
      </Button>
    </div>
  );
}
