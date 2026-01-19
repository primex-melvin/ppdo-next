// components/ui/changelog-banner.tsx

"use client";

import { useState, useEffect } from "react";
import { X, ExternalLink, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChangelogBannerProps {
  /**
   * The latest changelog version/title
   */
  version?: string;
  /**
   * The latest changelog description
   */
  latestChange: string;
  /**
   * URL to the full changelog page
   */
  changelogUrl?: string;
  /**
   * Whether the banner can be dismissed by the user
   * @default true
   */
  dismissible?: boolean;
  /**
   * Custom className for styling
   */
  className?: string;
  /**
   * Callback when banner is dismissed
   */
  onDismiss?: () => void;
  /**
   * Storage key for remembering dismissal state
   * If provided, dismissal will persist across sessions
   */
  storageKey?: string;
}

export function ChangelogBanner({
  version = "Latest Update",
  latestChange,
  changelogUrl = "/changelog",
  dismissible = true,
  className,
  onDismiss,
  storageKey = "changelog-banner-dismissed",
}: ChangelogBannerProps) {
  const PRIMARY_COLOR = "#15803D"; // Green-700

  // Check if banner was previously dismissed
  const [isDismissed, setIsDismissed] = useState(false);

  // Check localStorage after mount
  useEffect(() => {
    if (!dismissible || !storageKey) return;

    try {
      const dismissed = localStorage.getItem(storageKey) === "true";
      if (dismissed) {
        setIsDismissed(true);
      }
    } catch (error) {
      console.error("Failed to read banner dismissal state:", error);
    }
  }, [dismissible, storageKey]);

  const handleDismiss = () => {
    if (!dismissible) return;

    setIsDismissed(true);

    // Save dismissal state if storage key is provided
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, "true");
      } catch (error) {
        console.error("Failed to save banner dismissal state:", error);
      }
    }

    onDismiss?.();
  };

  // Don't render if dismissed
  if (isDismissed) return null;

  return (
    <div
      className={cn(
        "relative w-full border-b transition-all duration-300",
        "bg-green-700 border-green-800",
        "dark:bg-green-700 dark:border-green-800",
        className
      )}
      style={{
        backgroundColor: PRIMARY_COLOR,
        borderBottomColor: PRIMARY_COLOR,
      }}
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-2.5 md:py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left side: Icon, Badge, Version, and Latest Change */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            {/* Icon & Badge */}
            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
              <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
              <span className="inline-flex items-center px-1.5 md:px-2 py-0.5 rounded-md text-[10px] md:text-xs font-bold uppercase tracking-wide bg-green-800 text-white border border-green-900">
                NEW
              </span>
            </div>

            {/* Version */}
            <span className="text-xs md:text-sm font-semibold text-white whitespace-nowrap hidden sm:inline">
              {version}
            </span>

            {/* Separator */}
            <span className="text-white hidden sm:inline">—</span>

            {/* Latest Change */}
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm text-white">
                {latestChange}
              </p>
            </div>

            {/* Changelog Link */}
            {changelogUrl && (
              <a
                href={changelogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1 text-xs md:text-sm font-medium text-white hover:text-green-100 transition-colors underline underline-offset-2"
              >
                <span className="hidden sm:inline">View Changelog</span>
                <span className="sm:hidden">Details</span>
                <ExternalLink className="h-3 w-3 md:h-3.5 md:w-3.5" />
              </a>
            )}
          </div>

          {/* Right side: Dismiss Button */}
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="shrink-0 p-1 rounded-md text-white hover:bg-green-800 transition-colors"
              aria-label="Dismiss banner"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to manage changelog banner dismissal state
 */
export function useChangelogBanner(storageKey: string = "changelog-banner-dismissed") {
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(storageKey) === "true";
    } catch {
      return false;
    }
  });

  const dismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(storageKey, "true");
    } catch (error) {
      console.error("Failed to save banner dismissal state:", error);
    }
  };

  const reset = () => {
    setIsDismissed(false);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Failed to reset banner dismissal state:", error);
    }
  };

  return { isDismissed, dismiss, reset };
}