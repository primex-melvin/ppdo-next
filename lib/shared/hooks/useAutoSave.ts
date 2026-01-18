// lib/shared/hooks/useAutoSave.ts
// NEW FILE - CREATE THIS

import { useEffect, useRef } from 'react';

/**
 * Hook for auto-saving form data to localStorage
 * Debounces saves to avoid excessive writes
 * 
 * @param key - LocalStorage key to save to
 * @param data - Data to save (will be JSON stringified)
 * @param delay - Debounce delay in milliseconds (default: 500)
 * @param enabled - Whether auto-save is enabled (default: true)
 * 
 * @example
 * ```tsx
 * const formValues = form.watch();
 * 
 * // Auto-save form values (only if not editing existing item)
 * useAutoSave('budget_form_draft', formValues, 500, !item);
 * ```
 */
export function useAutoSave<T>(
  key: string,
  data: T,
  delay: number = 500,
  enabled: boolean = true
): void {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    // Clear any pending saves
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't save if disabled
    if (!enabled) {
      return;
    }

    // Debounce the save
    timeoutRef.current = setTimeout(() => {
      try {
        const serialized = JSON.stringify(data);
        localStorage.setItem(key, serialized);
      } catch (error) {
        console.error(`Failed to auto-save to ${key}:`, error);
      }
    }, delay);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [key, data, delay, enabled]);
}

/**
 * Hook to load saved draft from localStorage
 * 
 * @param key - LocalStorage key to load from
 * @returns Parsed data or null if not found
 * 
 * @example
 * ```tsx
 * const savedDraft = useLoadDraft<FormValues>('budget_form_draft');
 * 
 * const form = useForm({
 *   defaultValues: savedDraft || defaultValues
 * });
 * ```
 */
export function useLoadDraft<T>(key: string): T | null {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved) as T;
    }
  } catch (error) {
    console.error(`Failed to load draft from ${key}:`, error);
  }
  return null;
}

/**
 * Hook to clear saved draft from localStorage
 * 
 * @param key - LocalStorage key to clear
 * @returns Function to clear the draft
 * 
 * @example
 * ```tsx
 * const clearDraft = useClearDraft('budget_form_draft');
 * 
 * const onSubmit = (data) => {
 *   // ... save data
 *   clearDraft(); // Clear the draft after successful save
 * };
 * ```
 */
export function useClearDraft(key: string): () => void {
  return () => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to clear draft from ${key}:`, error);
    }
  };
}

/**
 * Hook to check if a draft exists
 * 
 * @param key - LocalStorage key to check
 * @returns Boolean indicating if draft exists
 * 
 * @example
 * ```tsx
 * const hasDraft = useHasDraft('budget_form_draft');
 * 
 * {hasDraft && (
 *   <Badge>Draft saved</Badge>
 * )}
 * ```
 */
export function useHasDraft(key: string): boolean {
  try {
    const saved = localStorage.getItem(key);
    return saved !== null && saved !== undefined;
  } catch (error) {
    return false;
  }
}