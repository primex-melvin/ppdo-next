// components/account/SecurityTab.tsx

"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Lock, Key, AlertTriangle, CheckCircle2, Loader2, Shield } from "lucide-react";

interface SecurityTabProps {
  user: {
    _id: string;
    email?: string;
    hasCustomDeletePin?: boolean;
  };
}

export function SecurityTab({ user }: SecurityTabProps) {
  const pinStatus = useQuery(api.userPin.getPinStatus);
  const setPinMutation = useMutation(api.userPin.setPin);
  
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<"current" | "new">(pinStatus?.hasPinSet ? "current" : "new");

  const hasCustomPin = pinStatus?.hasCustomPin ?? false;
  const isDefaultPin = !hasCustomPin && pinStatus?.hasPinSet;

  const handleSetPin = async () => {
    setError(null);
    setSuccess(null);

    // Validation
    if (step === "current" && currentPin.length !== 6) {
      setError("Please enter your current 6-digit PIN");
      return;
    }

    if (newPin.length !== 6) {
      setError("New PIN must be exactly 6 digits");
      return;
    }

    if (newPin !== confirmPin) {
      setError("New PIN and confirmation do not match");
      return;
    }

    if (newPin === currentPin && step === "current") {
      setError("New PIN must be different from current PIN");
      return;
    }

    setIsLoading(true);

    try {
      const result = await setPinMutation({
        currentPin: step === "current" ? currentPin : undefined,
        newPin,
      });

      setSuccess(result.message);
      
      // Reset form
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setStep("new");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update PIN");
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = step === "new" 
    ? newPin.length === 6 && confirmPin.length === 6
    : currentPin.length === 6 && newPin.length === 6 && confirmPin.length === 6;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
          <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Delete Protection PIN
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Secure your account with a PIN for permanent delete actions
          </p>
        </div>
      </div>

      {/* Status Alert */}
      {isDefaultPin && (
        <div className="flex items-start gap-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-4 border border-amber-200 dark:border-amber-900/50">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Using Default PIN
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              You are currently using the default PIN (123456). For better security, 
              please set a custom PIN below.
            </p>
          </div>
        </div>
      )}

      {hasCustomPin && (
        <div className="flex items-center gap-3 rounded-lg bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-900/50">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Custom PIN Set
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Your account is protected with a custom PIN.
            </p>
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/50">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {/* PIN Form */}
      <div className="space-y-6">
        {/* Step 1: Current PIN (if already set) */}
        {step === "current" && (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <Key className="h-4 w-4" />
              Current PIN
            </label>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                value={currentPin}
                onChange={setCurrentPin}
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
            <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
              Enter your current 6-digit PIN
            </p>
          </div>
        )}

        {/* Step 2: New PIN */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <Lock className="h-4 w-4" />
            {step === "current" ? "New PIN" : "Set Your PIN"}
          </label>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              value={newPin}
              onChange={setNewPin}
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
          <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
            {step === "current" 
              ? "Enter your new 6-digit PIN" 
              : "Create a 6-digit PIN for delete protection"}
          </p>
        </div>

        {/* Step 3: Confirm New PIN */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Confirm PIN
          </label>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              value={confirmPin}
              onChange={setConfirmPin}
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
          <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
            Re-enter your PIN to confirm
          </p>
        </div>

        {/* PIN Match Indicator */}
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
      </div>

      {/* Info Box */}
      <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200 dark:border-zinc-800">
        <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          When is the PIN required?
        </h4>
        <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1 list-disc list-inside">
          <li>Permanently deleting items from trash</li>
          <li>Bulk delete operations</li>
          <li>Clearing trash bin contents</li>
        </ul>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <button
          onClick={handleSetPin}
          disabled={!canSubmit || isLoading}
          className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              {hasCustomPin ? "Update PIN" : "Set PIN"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default SecurityTab;
