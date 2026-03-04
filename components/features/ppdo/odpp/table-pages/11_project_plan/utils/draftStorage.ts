// app/dashboard/project/[year]/utils/draftStorage.ts

import { PrintDraft, DraftInfo } from '@/lib/print-canvas/types';
import {
  saveTablePrintDraft,
  loadTablePrintDraft,
  deleteTablePrintDraft,
  hasTablePrintDraft,
  listTablePrintDrafts,
  getTablePrintStorageInfo,
  cleanupOldDrafts as cleanupTablePrintDrafts,
  formatTimestamp as formatTablePrintTimestamp,
} from '@/components/features/ppdo/odpp/utilities/table/print-preview/draftStorage';

const DRAFT_KEY_PREFIX = 'budget_print_draft_';
const MAX_DRAFTS = 10;

/**
 * Sanitize string for use in storage keys
 */
function sanitize(str: string): string {
  return str
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 50);
}

/**
 * Generate storage key for a draft
 */
export function getDraftKey(year: number, particular?: string): string {
  const base = `${DRAFT_KEY_PREFIX}${year}`;
  return particular ? `${base}_${sanitize(particular)}` : base;
}

/**
 * Save a draft to localStorage
 */
export function saveDraft(draft: PrintDraft): boolean {
  return saveTablePrintDraft(
    getDraftKey(draft.budgetYear, draft.budgetParticular),
    draft,
    {
      year: draft.budgetYear,
      label: draft.budgetParticular || `Budget ${draft.budgetYear}`,
      documentTitleFallback: draft.budgetParticular
        ? `Budget ${draft.budgetYear} - ${draft.budgetParticular}`
        : `Budget ${draft.budgetYear}`,
    }
  );
}

/**
 * Load a draft from localStorage
 */
export function loadDraft(year: number, particular?: string): PrintDraft | null {
  return loadTablePrintDraft(getDraftKey(year, particular));
}

/**
 * Delete a draft from localStorage
 */
export function deleteDraft(year: number, particular?: string): boolean {
  return deleteTablePrintDraft(getDraftKey(year, particular));
}

/**
 * Check if a draft exists
 */
export function hasDraft(year: number, particular?: string): boolean {
  return hasTablePrintDraft(getDraftKey(year, particular));
}

/**
 * List all drafts
 */
export function listAllDrafts(): DraftInfo[] {
  return listTablePrintDrafts().filter((draft) => draft.key.startsWith(DRAFT_KEY_PREFIX));
}

/**
 * Clean up old drafts, keeping only the most recent ones
 */
export function cleanupOldDrafts(keepCount: number = MAX_DRAFTS): void {
  cleanupTablePrintDrafts(keepCount);
}

/**
 * Get storage usage info
 */
export function getStorageInfo(): {
  used: number;
  total: number;
  percentage: number;
  draftCount: number;
} {
  const info = getTablePrintStorageInfo();
  return {
    ...info,
    draftCount: listAllDrafts().length,
  };
}

export function formatTimestamp(timestamp: number): string {
  return formatTablePrintTimestamp(timestamp);
}
