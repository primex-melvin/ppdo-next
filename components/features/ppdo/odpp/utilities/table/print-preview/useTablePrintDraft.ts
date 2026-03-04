import { useCallback, useEffect, useState } from "react";
import { PrintDraft } from "@/lib/print-canvas/types";
import {
  deleteTablePrintDraft,
  formatTimestamp,
  hasTablePrintDraft,
  loadTablePrintDraft,
  saveTablePrintDraft,
  TablePrintDraftMetadata,
} from "./draftStorage";

interface UseTablePrintDraftOptions {
  storageKey: string | null;
  metadata: TablePrintDraftMetadata;
}

interface UseTablePrintDraftReturn {
  draftState: PrintDraft | null;
  isDirty: boolean;
  hasDraft: boolean;
  lastSavedTime: number | null;
  saveDraft: (draft: PrintDraft) => boolean;
  loadDraft: () => PrintDraft | null;
  deleteDraft: () => boolean;
  setIsDirty: (dirty: boolean) => void;
  formattedLastSaved: string;
}

export function useTablePrintDraft({
  storageKey,
  metadata,
}: UseTablePrintDraftOptions): UseTablePrintDraftReturn {
  const [draftState, setDraftState] = useState<PrintDraft | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!storageKey) {
      setDraftState(null);
      setIsDirty(false);
      setHasDraft(false);
      setLastSavedTime(null);
      return;
    }

    const exists = hasTablePrintDraft(storageKey);
    setHasDraft(exists);

    if (!exists) {
      setDraftState(null);
      setLastSavedTime(null);
      return;
    }

    const loaded = loadTablePrintDraft(storageKey);
    if (loaded) {
      setDraftState(loaded);
      setLastSavedTime(loaded.timestamp);
    }
  }, [storageKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const saveDraft = useCallback((draft: PrintDraft): boolean => {
    if (!storageKey) return false;

    const normalizedDraft: PrintDraft = {
      ...draft,
      budgetYear: draft.budgetYear || metadata.year,
      budgetParticular: draft.budgetParticular || metadata.label,
      documentTitle: draft.documentTitle || metadata.documentTitleFallback,
    };

    const success = saveTablePrintDraft(storageKey, normalizedDraft, metadata);
    if (success) {
      setDraftState(normalizedDraft);
      setLastSavedTime(normalizedDraft.timestamp);
      setIsDirty(false);
      setHasDraft(true);
    }

    return success;
  }, [metadata, storageKey]);

  const loadDraft = useCallback((): PrintDraft | null => {
    if (!storageKey) return null;

    const loaded = loadTablePrintDraft(storageKey);
    if (loaded) {
      setDraftState(loaded);
      setLastSavedTime(loaded.timestamp);
      setIsDirty(false);
      setHasDraft(true);
    }

    return loaded;
  }, [storageKey]);

  const deleteDraft = useCallback((): boolean => {
    if (!storageKey) return false;

    const success = deleteTablePrintDraft(storageKey);
    if (success) {
      setDraftState(null);
      setLastSavedTime(null);
      setIsDirty(false);
      setHasDraft(false);
    }

    return success;
  }, [storageKey]);

  return {
    draftState,
    isDirty,
    hasDraft,
    lastSavedTime,
    saveDraft,
    loadDraft,
    deleteDraft,
    setIsDirty,
    formattedLastSaved: lastSavedTime ? formatTimestamp(lastSavedTime) : "",
  };
}
