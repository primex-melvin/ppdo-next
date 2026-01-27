// lib/shared/hooks/useFormDraft.ts

"use client";

import { useCallback } from "react";

/**
 * Hook for managing form drafts in localStorage
 * @param storageKey - The localStorage key to use for storing the draft
 * @returns Object containing draft management functions
 */
export function useFormDraft(storageKey: string) {
  /**
   * Load saved draft from localStorage
   * @returns Saved draft object or null
   */
  const loadDraft = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Error loading form draft:", error);
    }
    return null;
  }, [storageKey]);

  /**
   * Save draft to localStorage
   * @param values - Form values to save
   */
  const saveDraft = useCallback((values: any) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(values));
    } catch (error) {
      console.error("Error saving form draft:", error);
    }
  }, [storageKey]);

  /**
   * Clear draft from localStorage
   */
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Error clearing form draft:", error);
    }
  }, [storageKey]);

  return {
    loadDraft,
    saveDraft,
    clearDraft,
  };
}
