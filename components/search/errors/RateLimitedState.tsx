"use client";

import { useEffect, useState, useCallback } from "react";
import { Hourglass, Lock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface RateLimitedStateProps {
  retryAfter: number; // seconds
  onRetry: () => void;
  className?: string;
}

export function RateLimitedState({
  retryAfter,
  onRetry,
  className,
}: RateLimitedStateProps) {
  const [countdown, setCountdown] = useState(retryAfter);

  const handleRetry = useCallback(() => {
    onRetry();
  }, [onRetry]);

  useEffect(() => {
    // Reset countdown when retryAfter changes
    setCountdown(retryAfter);
  }, [retryAfter]);

  useEffect(() => {
    if (countdown <= 0) {
      handleRetry();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, handleRetry]);

  const progress = Math.max(0, ((retryAfter - countdown) / retryAfter) * 100);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="rounded-full bg-muted p-6 mb-4">
        <Lock className="size-12 text-muted-foreground" />
      </div>

      <h3 className="text-lg font-semibold mb-2">Too Many Requests</h3>

      <p className="text-sm text-muted-foreground max-w-md mb-6">
        You&apos;ve made too many search requests. Please wait before trying
        again.
      </p>

      <div className="w-full max-w-xs space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Hourglass className="size-4 text-muted-foreground animate-pulse" />
          <span className="text-sm font-medium tabular-nums">
            Retry in {countdown}s
          </span>
        </div>

        <Progress value={progress} className="h-2" />
      </div>

      {countdown <= 0 && (
        <p className="text-sm text-muted-foreground mt-4">
          You can search again now
        </p>
      )}
    </div>
  );
}
