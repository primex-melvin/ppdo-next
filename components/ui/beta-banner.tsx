// components/ui/beta-banner.tsx

"use client";

import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface BetaBannerProps {
  /**
   * The feature name to display in the banner
   */
  featureName?: string;
  /**
   * Custom message to display. If not provided, uses default message with featureName
   */
  message?: string;
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
   * Variant style of the banner
   * @default "default"
   */
  variant?: "default" | "info" | "accent" | "danger";
  /**
   * Custom colors for the banner (overrides variant)
   */
  customColors?: {
    container?: string;
    icon?: string;
    text?: string;
    badge?: string;
    button?: string;
  };
  /**
   * Callback when banner is dismissed
   */
  onDismiss?: () => void;
  /**
   * Storage key for remembering dismissal state
   * If provided, dismissal will persist across sessions
   */
  storageKey?: string;
  /**
   * User role to control dismissibility
   * Only super_admin can dismiss
   */
  userRole?: string;
}

export function BetaBanner({
  featureName,
  message,
  dismissible = true,
  className,
  variant = "default",
  onDismiss,
  storageKey,
  userRole,
  customColors,
}: BetaBannerProps) {
  // Check if user can dismiss (only super_admin)
  const canDismiss = dismissible && userRole === "super_admin";

  // Check if banner was previously dismissed
  const [isDismissed, setIsDismissed] = useState(() => {
    // Don't check storage on initial render to avoid hydration mismatch
    return false;
  });

  // Check localStorage after mount
  useEffect(() => {
    if (!canDismiss || !storageKey) return;
    
    try {
      const dismissed = localStorage.getItem(storageKey) === "true";
      if (dismissed) {
        setIsDismissed(true);
      }
    } catch (error) {
      console.error("Failed to read banner dismissal state:", error);
    }
  }, [canDismiss, storageKey]);

  const handleDismiss = () => {
    if (!canDismiss) return;
    
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

  // Generate default message
  const displayMessage = message || 
    `${featureName ? `The ${featureName} feature` : "This feature"} is currently in beta. We're actively improving it and appreciate your patience as we polish the experience.`;

  // Variant styles
  const variantStyles = {
    default: {
      container: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/50",
      icon: "text-blue-600 dark:text-blue-400",
      text: "text-blue-900 dark:text-blue-100",
      badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-300 dark:border-blue-700",
      button: "text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/50",
    },
    info: {
      container: "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-800/50",
      icon: "text-indigo-600 dark:text-indigo-400",
      text: "text-indigo-900 dark:text-indigo-100",
      badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700",
      button: "text-indigo-700 hover:bg-indigo-100 dark:text-indigo-300 dark:hover:bg-indigo-900/50",
    },
    accent: {
      container: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/50",
      icon: "text-amber-600 dark:text-amber-400",
      text: "text-amber-900 dark:text-amber-100",
      badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700",
      button: "text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/50",
    },
    danger: {
      container: "bg-red-400 border-red-400 dark:bg-red-400 dark:border-red-400",
      icon: "text-white dark:text-white",
      text: "text-white dark:text-white",
      badge: "bg-red-700 text-white dark:bg-red-700 dark:text-white border border-red-800 dark:border-red-800",
      button: "text-white hover:bg-red-700 dark:text-white dark:hover:bg-red-700",
    },
  };

  // Use custom colors if provided, otherwise use variant styles
  const styles = customColors || variantStyles[variant];

  return (
    <div
      className={cn(
        "relative w-full border-b transition-all duration-300",
        styles.container,
        className
      )}
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left side: Icon, Badge, Feature Name */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <div className="flex items-center gap-2 shrink-0">
              <Sparkles className={cn("h-4 w-4 md:h-5 md:w-5", styles.icon)} />
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] md:text-xs font-bold uppercase tracking-wide",
                  styles.badge
                )}
              >
                BETA
              </span>
            </div>

            {featureName && (
              <span className={cn("text-sm md:text-base font-semibold whitespace-nowrap hidden sm:block", styles.text)}>
                {featureName}
              </span>
            )}

            {/* Message */}
            <div className="flex-1 min-w-0">
              <p className={cn("text-xs md:text-sm", styles.text)}>
                {displayMessage}
              </p>
            </div>
          </div>

          {/* Right side: Dismiss Button (only for admins) */}
          {canDismiss && (
            <button
              onClick={handleDismiss}
              className={cn(
                "shrink-0 p-1 rounded-md transition-colors",
                styles.button
              )}
              aria-label="Dismiss banner"
              title="Dismiss (Super Admin only)"
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
 * Hook to manage beta banner dismissal state
 */
export function useBetaBanner(storageKey: string) {
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