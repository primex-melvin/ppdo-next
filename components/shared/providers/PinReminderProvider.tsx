// components/providers/PinReminderProvider.tsx
// Global provider to show PIN reminder for users without custom PIN

"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PinReminderModal } from "@/components/shared/modals/PinReminderModal";

interface PinReminderProviderProps {
  children: React.ReactNode;
}

const REMINDER_DISMISS_KEY = "pin_reminder_dismissed_at";
const REMINDER_COOLDOWN_HOURS = 24;

export function PinReminderProvider({ children }: PinReminderProviderProps) {
  const pinStatus = useQuery(api.userPin.getPinStatus);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Only check after we've loaded the pin status
    if (pinStatus === undefined) return;

    // If user has custom PIN, don't show reminder
    if (pinStatus?.hasCustomPin) {
      setHasChecked(true);
      return;
    }

    // Check if reminder was recently dismissed
    const dismissedAt = localStorage.getItem(REMINDER_DISMISS_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const cooldownMs = REMINDER_COOLDOWN_HOURS * 60 * 60 * 1000;
      
      if (Date.now() - dismissedTime < cooldownMs) {
        // Still in cooldown, don't show
        setHasChecked(true);
        return;
      }
    }

    // Show the reminder modal after a short delay (let the app load first)
    const timer = setTimeout(() => {
      setIsModalOpen(true);
      setHasChecked(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [pinStatus]);

  // Handle navigation to settings
  const handleNavigateToSettings = () => {
    // Dispatch a custom event that the layout can listen for
    window.dispatchEvent(new CustomEvent("open-account-settings", {
      detail: { tab: "security" }
    }));
  };

  // Don't render until we've checked the PIN status
  if (!hasChecked && pinStatus === undefined) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <PinReminderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onNavigateToSettings={handleNavigateToSettings}
      />
    </>
  );
}

export default PinReminderProvider;