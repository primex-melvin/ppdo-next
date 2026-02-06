// components/modals/PinReminderModal.tsx
// Global reminder modal for users who haven't set a custom PIN

"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Shield, AlertTriangle, CheckCircle2, Loader2, Settings, X } from "lucide-react";

interface PinReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSettings?: () => void;
}

const REMINDER_DISMISS_KEY = "pin_reminder_dismissed_at";
const REMINDER_COOLDOWN_HOURS = 24; // Show reminder once per day if dismissed

export function PinReminderModal({
  isOpen,
  onClose,
  onNavigateToSettings,
}: PinReminderModalProps) {
  const pinStatus = useQuery(api.userPin.getPinStatus);
  const setPinMutation = useMutation(api.userPin.setPin);

  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showQuickSetup, setShowQuickSetup] = useState(false);

  // Check if reminder was recently dismissed
  useEffect(() => {
    if (!isOpen) return;

    const dismissedAt = localStorage.getItem(REMINDER_DISMISS_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const cooldownMs = REMINDER_COOLDOWN_HOURS * 60 * 60 * 1000;
      
      if (Date.now() - dismissedTime < cooldownMs) {
        // Still in cooldown period, close the modal
        onClose();
      }
    }
  }, [isOpen, onClose]);

  // Close modal if user already has custom PIN
  useEffect(() => {
    if (pinStatus?.hasCustomPin) {
      onClose();
    }
  }, [pinStatus?.hasCustomPin, onClose]);

  const handleDismiss = () => {
    localStorage.setItem(REMINDER_DISMISS_KEY, Date.now().toString());
    onClose();
  };

  const handleQuickSetup = async () => {
    setError(null);
    setSuccess(null);

    if (newPin.length !== 6) {
      setError("PIN must be exactly 6 digits");
      return;
    }

    if (newPin !== confirmPin) {
      setError("PINs do not match");
      return;
    }

    setIsLoading(true);

    try {
      await setPinMutation({
        newPin,
      });

      setSuccess("PIN set successfully! Your account is now more secure.");
      
      // Clear form
      setNewPin("");
      setConfirmPin("");

      // Close after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set PIN");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToSettings = () => {
    if (onNavigateToSettings) {
      onNavigateToSettings();
    }
    onClose();
  };

  const canSubmit = newPin.length === 6 && confirmPin.length === 6 && newPin === confirmPin;

  return (
    <Dialog open={isOpen} onOpenChange={handleDismiss}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <Shield className="h-6 w-6" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl font-semibold">
            {showQuickSetup ? "Set Your Delete Protection PIN" : "Secure Your Account"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {showQuickSetup 
              ? "Create a custom PIN to protect against accidental permanent deletions"
              : "You're currently using the default PIN (123456). For better security, please set a custom PIN."}
          </DialogDescription>
        </DialogHeader>

        {!showQuickSetup ? (
          // Initial Reminder View
          <div className="space-y-6 py-4">
            {/* Warning Alert */}
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-4 border border-amber-200 dark:border-amber-900/50">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium mb-1">Why change your PIN?</p>
                <ul className="space-y-1 list-disc list-inside text-amber-700 dark:text-amber-300">
                  <li>Prevents accidental data loss</li>
                  <li>Protects against unauthorized deletions</li>
                  <li>Required for permanent delete actions</li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => setShowQuickSetup(true)}
                className="w-full gap-2 bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Shield className="h-4 w-4" />
                Set Custom PIN Now
              </Button>

              <Button
                variant="outline"
                onClick={handleNavigateToSettings}
                className="w-full gap-2"
              >
                <Settings className="h-4 w-4" />
                Go to Account Settings
              </Button>
            </div>

            {/* Dismiss Option */}
            <button
              onClick={handleDismiss}
              className="w-full text-center text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300 transition-colors"
            >
              Remind me later (24 hours)
            </button>
          </div>
        ) : (
          // Quick Setup View
          <div className="space-y-6 py-4">
            {/* Error/Success Messages */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/50">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {success}
              </div>
            )}

            {/* New PIN Input */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 text-center block">
                Enter New PIN
              </label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={newPin}
                  onChange={setNewPin}
                  disabled={isLoading || !!success}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            {/* Confirm PIN Input */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 text-center block">
                Confirm PIN
              </label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={confirmPin}
                  onChange={setConfirmPin}
                  disabled={isLoading || !!success}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            {/* Match Indicator */}
            {newPin && confirmPin && (
              <div className="text-center">
                {newPin === confirmPin ? (
                  <span className="text-sm text-green-600 dark:text-green-400 flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    PINs match
                  </span>
                ) : (
                  <span className="text-sm text-red-600 dark:text-red-400 flex items-center justify-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    PINs do not match
                  </span>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowQuickSetup(false)}
                disabled={isLoading}
                className="flex-1 gap-2"
              >
                <X className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleQuickSetup}
                disabled={!canSubmit || isLoading || !!success}
                className="flex-1 gap-2 bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Set PIN
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PinReminderModal;
