import { useState, useCallback, useEffect } from "react";
import { PrintDraft } from "@/lib/print-canvas/types";
import { toast } from "sonner";

const DRAFT_STORAGE_PREFIX = "ppdo-fund-print-draft-";

export function useFundsPrintDraft(year: number, fundType: string) {
    const [draftState, setDraftState] = useState<PrintDraft | null>(null);
    const [hasDraft, setHasDraft] = useState(false);

    const storageKey = `${DRAFT_STORAGE_PREFIX}${fundType}-${year}`;

    // Load draft on mount
    useEffect(() => {
        const checkDraft = () => {
            try {
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    setDraftState(parsed);
                    setHasDraft(true);
                } else {
                    setDraftState(null);
                    setHasDraft(false);
                }
            } catch (error) {
                console.error("Failed to load draft:", error);
            }
        };

        checkDraft();
        // Listen for storage events in case other tabs update it
        window.addEventListener("storage", checkDraft);
        return () => window.removeEventListener("storage", checkDraft);
    }, [storageKey]);

    const saveDraft = useCallback((draft: PrintDraft) => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(draft));
            setDraftState(draft);
            setHasDraft(true);
            return Promise.resolve();
        } catch (error) {
            console.error("Failed to save draft:", error);
            toast.error("Failed to save draft locally");
            return Promise.reject(error);
        }
    }, [storageKey]);

    const deleteDraft = useCallback(() => {
        try {
            localStorage.removeItem(storageKey);
            setDraftState(null);
            setHasDraft(false);
            toast.success("Draft discarded");
        } catch (error) {
            console.error("Failed to delete draft:", error);
        }
    }, [storageKey]);

    return {
        draftState,
        hasDraft,
        saveDraft,
        deleteDraft
    };
}
