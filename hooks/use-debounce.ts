// hooks/use-debounce.ts
import { useEffect, useState, useCallback, useRef } from "react";

/**
 * Standard debounce hook
 * Delays updating the value until after the specified delay
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounce hook with manual flush and cancel
 * Allows immediate execution (flush) or cancellation of pending updates
 */
export function useDebounceWithFlush<T>(
  value: T,
  delay: number = 300
): {
  debouncedValue: T;
  flush: () => void;
  cancel: () => void;
  isPending: boolean;
} {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isPending, setIsPending] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentValueRef = useRef<T>(value);

  // Update current value reference
  useEffect(() => {
    currentValueRef.current = value;
  }, [value]);

  // Set up debounce timer
  useEffect(() => {
    setIsPending(true);

    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
      setIsPending(false);
      timerRef.current = null;
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [value, delay]);

  /**
   * Immediately flush the pending value
   * Useful when user explicitly triggers search (e.g., Enter key)
   */
  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setDebouncedValue(currentValueRef.current);
    setIsPending(false);
  }, []);

  /**
   * Cancel the pending update
   * Useful when clearing search or navigating away
   */
  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPending(false);
  }, []);

  return {
    debouncedValue,
    flush,
    cancel,
    isPending,
  };
}