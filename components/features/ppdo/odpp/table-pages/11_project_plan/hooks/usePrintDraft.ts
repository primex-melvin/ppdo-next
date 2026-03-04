// app/dashboard/project/[year]/hooks/usePrintDraft.ts

import { useTablePrintDraft } from '@/components/features/ppdo/odpp/utilities/table/print-preview/useTablePrintDraft';
import { getDraftKey } from '../utils/draftStorage';

/**
 * Hook for managing print preview drafts
 */
export function usePrintDraft(
  year: number,
  particular?: string
) {
  return useTablePrintDraft({
    storageKey: getDraftKey(year, particular),
    metadata: {
      year,
      label: particular || `Budget ${year}`,
      documentTitleFallback: particular
        ? `Budget ${year} - ${particular}`
        : `Budget ${year}`,
    },
  });
}
