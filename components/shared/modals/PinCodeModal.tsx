"use client"

import { useState, useEffect, useCallback } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import {
  AlertCircle,
  CheckCircle2,
  LifeBuoy,
  Loader2,
  Lock,
  Settings,
  Timer,
  Unlock,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

const MAX_ATTEMPTS = 3
const LOCKOUT_DURATION = 60

interface PinCodeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  title?: string
  description?: string
}

const getStorageKey = (key: string) => `pin_modal_${key}`

export function PinCodeModal({
  isOpen,
  onClose,
  onSuccess,
  title = "Security Verification",
  description = "Enter your 6-digit PIN to permanently delete items",
}: PinCodeModalProps) {
  const [pin, setPin] = useState("")
  const [attempts, setAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isRequestingReset, setIsRequestingReset] = useState(false)

  const pinStatus = useQuery(api.userPin.getPinStatus)
  const verifyPinMutation = useMutation(api.userPin.verifyPinMutation)
  const requestPinResetMutation = useMutation(api.userPin.requestPinReset)

  const requiresPinChange = Boolean(pinStatus?.mustChangeDeletePin)
  const hasPendingResetRequest = Boolean(pinStatus?.hasPendingResetRequest)

  useEffect(() => {
    const lockedUntil = localStorage.getItem(getStorageKey("locked_until"))
    const savedAttempts = localStorage.getItem(getStorageKey("attempts"))

    if (lockedUntil) {
      const unlockTime = parseInt(lockedUntil, 10)
      const now = Date.now()
      if (unlockTime > now) {
        setIsLocked(true)
        setLockoutTimeLeft(Math.ceil((unlockTime - now) / 1000))
      } else {
        localStorage.removeItem(getStorageKey("locked_until"))
        localStorage.removeItem(getStorageKey("attempts"))
      }
    }

    if (savedAttempts) {
      setAttempts(parseInt(savedAttempts, 10))
    }
  }, [])

  useEffect(() => {
    if (!isLocked || lockoutTimeLeft <= 0) return

    const timer = setInterval(() => {
      setLockoutTimeLeft((prev) => {
        if (prev <= 1) {
          setIsLocked(false)
          setAttempts(0)
          localStorage.removeItem(getStorageKey("locked_until"))
          localStorage.removeItem(getStorageKey("attempts"))
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isLocked, lockoutTimeLeft])

  useEffect(() => {
    if (!isOpen) return

    setPin("")
    setError(null)
    setSuccessMessage(null)
    setIsSuccess(false)

    const lockedUntil = localStorage.getItem(getStorageKey("locked_until"))
    if (lockedUntil) {
      const unlockTime = parseInt(lockedUntil, 10)
      const now = Date.now()
      if (unlockTime > now) {
        setIsLocked(true)
        setLockoutTimeLeft(Math.ceil((unlockTime - now) / 1000))
      }
    }
  }, [isOpen])

  const handleOpenAccountSettings = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-account-settings", {
        detail: { tab: "security" },
      }))
    }
    onClose()
  }

  const handleVerify = useCallback(async () => {
    if (isLocked || isVerifying || requiresPinChange) return
    if (pin.length !== 6) {
      setError("Please enter a 6-digit PIN")
      return
    }

    setIsVerifying(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const result = await verifyPinMutation({ pin })

      if (result.valid) {
        setIsSuccess(true)
        setAttempts(0)
        localStorage.removeItem(getStorageKey("attempts"))

        setTimeout(() => {
          onSuccess()
          setPin("")
          setIsSuccess(false)
        }, 500)
      } else {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        localStorage.setItem(getStorageKey("attempts"), newAttempts.toString())

        if (newAttempts >= MAX_ATTEMPTS) {
          const unlockTime = Date.now() + LOCKOUT_DURATION * 1000
          localStorage.setItem(getStorageKey("locked_until"), unlockTime.toString())
          setIsLocked(true)
          setLockoutTimeLeft(LOCKOUT_DURATION)
          setError(`Too many failed attempts. Please wait ${LOCKOUT_DURATION} seconds.`)
        } else {
          setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`)
          setPin("")
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify PIN. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }, [attempts, isLocked, isVerifying, onSuccess, pin, requiresPinChange, verifyPinMutation])

  const handlePinChange = (value: string) => {
    if (isLocked || requiresPinChange) return
    setPin(value)
    setError(null)
    setSuccessMessage(null)

    if (value.length === 6) {
      setTimeout(() => handleVerify(), 200)
    }
  }

  const handleRequestReset = async () => {
    setError(null)
    setSuccessMessage(null)
    setIsRequestingReset(true)

    try {
      const result = await requestPinResetMutation({
        userAgent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
      })
      setSuccessMessage(result.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request PIN reset.")
    } finally {
      setIsRequestingReset(false)
    }
  }

  const handleClose = () => {
    if (!isLocked) {
      setPin("")
      setError(null)
      setSuccessMessage(null)
    }
    onClose()
  }

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const pendingResetDate = pinStatus?.pendingResetRequestedAt
    ? new Date(pinStatus.pendingResetRequestedAt).toLocaleString()
    : null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-center">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-300",
                isSuccess
                  ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                  : isLocked
                    ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                    : requiresPinChange
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
              )}
            >
              {isSuccess ? (
                <Unlock className="h-5 w-5" />
              ) : isLocked ? (
                <Timer className="h-5 w-5" />
              ) : requiresPinChange ? (
                <Settings className="h-5 w-5" />
              ) : (
                <Lock className="h-5 w-5" />
              )}
            </div>
          </div>
          <DialogTitle className="text-center text-xl font-semibold">
            {isSuccess ? "Access Granted" : title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isLocked
              ? "Too many failed attempts. Please wait before trying again."
              : isSuccess
                ? "PIN verified successfully. Proceeding with deletion..."
                : requiresPinChange
                  ? "Your PIN was reset. Open Account Settings and create a new PIN before permanent delete is allowed."
                  : description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isLocked && (
            <div className="flex flex-col items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-4 border border-amber-200 dark:border-amber-900/50">
              <Timer className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {formatTimeLeft(lockoutTimeLeft)}
              </span>
              <span className="text-sm text-amber-600 dark:text-amber-400">
                Please wait before trying again
              </span>
            </div>
          )}

          {!isLocked && !isSuccess && !requiresPinChange && (
            <div className="flex flex-col items-center gap-4">
              <InputOTP
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                value={pin}
                onChange={handlePinChange}
                disabled={isLocked || isVerifying}
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

              <div className="flex items-center gap-1">
                {[...Array(MAX_ATTEMPTS)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 w-6 rounded-full transition-colors",
                      i < attempts ? "bg-red-500" : "bg-zinc-200 dark:bg-zinc-700"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-zinc-500">
                {attempts === 0
                  ? `${MAX_ATTEMPTS} attempts allowed`
                  : `${MAX_ATTEMPTS - attempts} attempts remaining`}
              </span>

              <div className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <LifeBuoy className="h-4 w-4 mt-0.5 text-zinc-600 dark:text-zinc-300" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Forgot your PIN?
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                      Request a super admin PIN reset. Delete actions remain blocked until you create a new PIN in Account Settings.
                    </p>
                  </div>
                </div>
                {hasPendingResetRequest && (
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    A reset request is already pending.
                    {pendingResetDate ? ` Requested on ${pendingResetDate}.` : ""}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRequestReset}
                    disabled={isRequestingReset || hasPendingResetRequest}
                    className="gap-2"
                  >
                    {isRequestingReset ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Requesting...
                      </>
                    ) : hasPendingResetRequest ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Request Pending
                      </>
                    ) : (
                      <>
                        <LifeBuoy className="h-4 w-4" />
                        Forgot PIN? Request Reset
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleOpenAccountSettings}
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Open Account Security
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!isLocked && !isSuccess && requiresPinChange && (
            <div className="rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    New PIN required
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Your reset was approved. Set a new PIN in Account Settings before trying permanent delete again.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleOpenAccountSettings}
                className="w-full gap-2"
              >
                <Settings className="h-4 w-4" />
                Open Account Settings
              </Button>
            </div>
          )}

          {isSuccess && (
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Unlock className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm text-green-600 dark:text-green-400">
                Verification successful
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/50">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <p className="text-center text-xs text-zinc-400 dark:text-zinc-600">
            {requiresPinChange
              ? "Permanent delete is blocked until you create a new PIN."
              : pinStatus?.hasCustomPin
                ? "Your account is protected with a custom PIN"
                : "Tip: Set a custom PIN in Account Settings for better security"}
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSuccess}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            {isLocked ? "Close" : "Cancel"}
          </Button>
          {!isLocked && !isSuccess && !requiresPinChange && (
            <Button
              onClick={handleVerify}
              disabled={pin.length !== 6 || isVerifying}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4" />
                  Verify & Delete
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PinCodeModal
