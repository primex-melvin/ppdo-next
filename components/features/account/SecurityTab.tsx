// components/account/SecurityTab.tsx

"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Key,
  LifeBuoy,
  Loader2,
  Lock,
  Shield,
} from "lucide-react";

interface SecurityTabProps {
  user: {
    _id: string;
    email?: string;
    hasCustomDeletePin?: boolean;
  };
}

export function SecurityTab({}: SecurityTabProps) {
  const pinStatus = useQuery(api.userPin.getPinStatus);
  const setPinMutation = useMutation(api.userPin.setPin);
  const requestPinResetMutation = useMutation(api.userPin.requestPinReset);

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<"current" | "new">("new");

  const hasCustomPin = pinStatus?.hasCustomPin ?? false;
  const isDefaultPin = !hasCustomPin && Boolean(pinStatus?.hasPinSet);
  const mustChangeDeletePin = pinStatus?.mustChangeDeletePin ?? false;
  const hasPendingResetRequest = pinStatus?.hasPendingResetRequest ?? false;

  useEffect(() => {
    if (pinStatus === undefined) return;

    if (pinStatus.mustChangeDeletePin || !pinStatus.hasCustomPin) {
      setStep("new");
      return;
    }

    setStep("current");
  }, [pinStatus]);

  const handleSetPin = async () => {
    setError(null);
    setSuccess(null);

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
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update PIN");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestReset = async () => {
    setError(null);
    setSuccess(null);
    setIsRequestingReset(true);

    try {
      const result = await requestPinResetMutation({
        userAgent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
      });
      setSuccess(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request PIN reset");
    } finally {
      setIsRequestingReset(false);
    }
  };

  const canSubmit = step === "new"
    ? newPin.length === 6 && confirmPin.length === 6
    : currentPin.length === 6 && newPin.length === 6 && confirmPin.length === 6;

  const pendingResetDate = pinStatus?.pendingResetRequestedAt
    ? new Date(pinStatus.pendingResetRequestedAt).toLocaleString()
    : null;

  return (
    <div className="p-6 space-y-6">
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

      {mustChangeDeletePin ? (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-900/50">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              PIN reset completed
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              A super admin reset your delete-protection PIN. You must create a new 6-digit PIN now before permanent delete actions will work again.
            </p>
          </div>
        </div>
      ) : hasPendingResetRequest ? (
        <div className="flex items-start gap-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-4 border border-amber-200 dark:border-amber-900/50">
          <Clock3 className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              PIN reset request pending
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Your forgot-PIN request is waiting for super admin approval.
              {pendingResetDate ? ` Requested on ${pendingResetDate}.` : ""}
            </p>
          </div>
        </div>
      ) : isDefaultPin ? (
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
      ) : hasCustomPin ? (
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
      ) : null}

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <LifeBuoy className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Forgot your PIN?
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Request a super admin reset. Permanent delete will remain blocked until the request is approved and you create a new PIN.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleRequestReset}
            disabled={isRequestingReset || hasPendingResetRequest || mustChangeDeletePin}
            className="gap-2"
          >
            {isRequestingReset ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Requesting...
              </>
            ) : hasPendingResetRequest ? (
              <>
                <Clock3 className="h-4 w-4" />
                Request Pending
              </>
            ) : mustChangeDeletePin ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Reset Complete
              </>
            ) : (
              <>
                <LifeBuoy className="h-4 w-4" />
                Request PIN Reset
              </>
            )}
          </Button>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Recovery is admin-approved only. OTP and email reset are not enabled in this system.
          </span>
        </div>
      </div>

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

      <div className="space-y-6">
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

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <Lock className="h-4 w-4" />
            {step === "current" ? "New PIN" : mustChangeDeletePin ? "Create New PIN" : "Set Your PIN"}
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
              : mustChangeDeletePin
                ? "Create a new 6-digit PIN to restore permanent delete access"
                : "Create a 6-digit PIN for delete protection"}
          </p>
        </div>

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
              {mustChangeDeletePin ? "Save New PIN" : hasCustomPin ? "Update PIN" : "Set PIN"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default SecurityTab;
