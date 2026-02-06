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
import { Lock, Unlock, AlertCircle, Timer, X } from "lucide-react"
import { cn } from "@/lib/utils"

const MAX_ATTEMPTS = 3
const LOCKOUT_DURATION = 60 // seconds

interface PinCodeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  title?: string
  description?: string
}

// Storage keys for persisting lockout state
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
  const [isSuccess, setIsSuccess] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  // Get PIN status from server
  const pinStatus = useQuery(api.userPin.getPinStatus)
  
  // Mutation for verifying PIN
  const verifyPinMutation = useMutation(api.userPin.verifyPinMutation)

  // Load lockout state from localStorage on mount
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
        // Lockout expired, clear it
        localStorage.removeItem(getStorageKey("locked_until"))
        localStorage.removeItem(getStorageKey("attempts"))
      }
    }

    if (savedAttempts) {
      setAttempts(parseInt(savedAttempts, 10))
    }
  }, [])

  // Countdown timer for lockout
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

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPin("")
      setError(null)
      setIsSuccess(false)
      
      // Check if still locked
      const lockedUntil = localStorage.getItem(getStorageKey("locked_until"))
      if (lockedUntil) {
        const unlockTime = parseInt(lockedUntil, 10)
        const now = Date.now()
        if (unlockTime > now) {
          setIsLocked(true)
          setLockoutTimeLeft(Math.ceil((unlockTime - now) / 1000))
        }
      }
    }
  }, [isOpen])

  const handleVerify = useCallback(async () => {
    if (isLocked || isVerifying) return
    if (pin.length !== 6) {
      setError("Please enter a 6-digit PIN")
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      // Verify PIN using Convex mutation
      const result = await verifyPinMutation({ pin })

      if (result.valid) {
        // Success
        setIsSuccess(true)
        setError(null)
        setAttempts(0)
        localStorage.removeItem(getStorageKey("attempts"))
        
        // Small delay to show success state before closing
        setTimeout(() => {
          onSuccess()
          setPin("")
          setIsSuccess(false)
        }, 500)
      } else {
        // Wrong PIN
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        localStorage.setItem(getStorageKey("attempts"), newAttempts.toString())
        
        if (newAttempts >= MAX_ATTEMPTS) {
          // Lock out the user
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
      setError("Failed to verify PIN. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }, [pin, attempts, isLocked, isVerifying, verifyPinMutation, onSuccess])

  const handlePinChange = (value: string) => {
    if (isLocked) return
    setPin(value)
    setError(null)
    
    // Auto-verify when 6 digits are entered
    if (value.length === 6) {
      // Small delay to show the last digit before verifying
      setTimeout(() => handleVerify(), 200)
    }
  }

  const handleClose = () => {
    if (!isLocked) {
      setPin("")
      setError(null)
    }
    onClose()
  }

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

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
                  : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
              )}
            >
              {isSuccess ? (
                <Unlock className="h-5 w-5" />
              ) : isLocked ? (
                <Timer className="h-5 w-5" />
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
              ? `Too many failed attempts. Please wait before trying again.`
              : isSuccess
              ? "PIN verified successfully. Proceeding with deletion..."
              : description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Lockout Timer Display */}
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

          {/* PIN Input */}
          {!isLocked && !isSuccess && (
            <div className="flex flex-col items-center gap-4">
              <InputOTP
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                value={pin}
                onChange={handlePinChange}
                disabled={isLocked}
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

              {/* Attempts Indicator */}
              <div className="flex items-center gap-1">
                {[...Array(MAX_ATTEMPTS)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 w-6 rounded-full transition-colors",
                      i < attempts
                        ? "bg-red-500"
                        : "bg-zinc-200 dark:bg-zinc-700"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-zinc-500">
                {attempts === 0
                  ? `${MAX_ATTEMPTS} attempts allowed`
                  : `${MAX_ATTEMPTS - attempts} attempts remaining`}
              </span>
            </div>
          )}

          {/* Success State */}
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

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Security Note */}
          <p className="text-center text-xs text-zinc-400 dark:text-zinc-600">
            {pinStatus?.hasCustomPin 
              ? "Your account is protected with a custom PIN" 
              : "Tip: Set a custom PIN in Account Settings for better security"}
          </p>
        </div>

        {/* Footer */}
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
          {!isLocked && !isSuccess && (
            <Button
              onClick={handleVerify}
              disabled={pin.length !== 6}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              <Unlock className="h-4 w-4" />
              Verify & Delete
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PinCodeModal
