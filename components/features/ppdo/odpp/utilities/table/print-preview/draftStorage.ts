import { DraftInfo, DraftMetadata, PrintDraft } from "@/lib/print-canvas/types";

const METADATA_KEY = "table_print_draft_metadata";
const MAX_DRAFTS = 10;

export interface TablePrintDraftMetadata {
  year: number;
  label: string;
  documentTitleFallback: string;
}

export function saveTablePrintDraft(
  storageKey: string,
  draft: PrintDraft,
  metadata: TablePrintDraftMetadata
): boolean {
  try {
    const serialized = JSON.stringify(draft);

    try {
      localStorage.setItem(storageKey, serialized);
    } catch (error) {
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        cleanupOldDrafts(5);
        localStorage.setItem(storageKey, serialized);
      } else {
        throw error;
      }
    }

    updateMetadata(storageKey, draft, metadata);
    return true;
  } catch (error) {
    console.error("Failed to save draft:", error);
    return false;
  }
}

export function loadTablePrintDraft(storageKey: string): PrintDraft | null {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return null;

    const parsed = JSON.parse(saved);
    if (!validateDraft(parsed)) {
      console.error("Invalid draft format");
      return null;
    }

    return parsed;
  } catch (error) {
    console.error("Failed to load draft:", error);
    return null;
  }
}

export function deleteTablePrintDraft(storageKey: string): boolean {
  try {
    localStorage.removeItem(storageKey);
    removeFromMetadata(storageKey);
    return true;
  } catch (error) {
    console.error("Failed to delete draft:", error);
    return false;
  }
}

export function hasTablePrintDraft(storageKey: string): boolean {
  return localStorage.getItem(storageKey) !== null;
}

export function listTablePrintDrafts(): DraftInfo[] {
  return getMetadata().drafts;
}

export function getTablePrintStorageInfo(): {
  used: number;
  total: number;
  percentage: number;
  draftCount: number;
} {
  try {
    let used = 0;
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      const value = localStorage.getItem(key);
      used += key.length + (value?.length || 0);
    }

    const total = 5 * 1024 * 1024;
    const percentage = (used / total) * 100;

    return {
      used,
      total,
      percentage,
      draftCount: listTablePrintDrafts().length,
    };
  } catch (error) {
    console.error("Failed to get storage info:", error);
    return {
      used: 0,
      total: 0,
      percentage: 0,
      draftCount: 0,
    };
  }
}

export function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;

  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function cleanupOldDrafts(keepCount: number = MAX_DRAFTS): void {
  try {
    const metadata = getMetadata();
    metadata.drafts.sort((a, b) => b.timestamp - a.timestamp);

    const toDelete = metadata.drafts.slice(keepCount);
    toDelete.forEach((draft) => {
      try {
        localStorage.removeItem(draft.key);
      } catch (error) {
        console.error(`Failed to delete draft ${draft.key}:`, error);
      }
    });

    const remaining = metadata.drafts.slice(0, keepCount);
    localStorage.setItem(METADATA_KEY, JSON.stringify({ drafts: remaining }));
  } catch (error) {
    console.error("Failed to cleanup old drafts:", error);
  }
}

function validateDraft(draft: unknown): draft is PrintDraft {
  if (!draft || typeof draft !== "object") return false;

  const candidate = draft as PrintDraft;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.timestamp === "number" &&
    typeof candidate.budgetYear === "number" &&
    !!candidate.filterState &&
    !!candidate.canvasState &&
    Array.isArray(candidate.canvasState.pages) &&
    !!candidate.tableSnapshot
  );
}

function updateMetadata(
  storageKey: string,
  draft: PrintDraft,
  metadata: TablePrintDraftMetadata
): void {
  try {
    const current = getMetadata();
    const filtered = current.drafts.filter((entry) => entry.key !== storageKey);

    const newEntry: DraftInfo = {
      key: storageKey,
      year: metadata.year,
      particular: draft.budgetParticular,
      label: metadata.label,
      timestamp: draft.timestamp,
      lastModified: draft.lastModified,
      documentTitle: draft.documentTitle || metadata.documentTitleFallback,
      pageCount: draft.canvasState.pages.length,
    };

    filtered.push(newEntry);
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    localStorage.setItem(METADATA_KEY, JSON.stringify({ drafts: filtered }));
  } catch (error) {
    console.error("Failed to update metadata:", error);
  }
}

function removeFromMetadata(storageKey: string): void {
  try {
    const metadata = getMetadata();
    const filtered = metadata.drafts.filter((entry) => entry.key !== storageKey);
    localStorage.setItem(METADATA_KEY, JSON.stringify({ drafts: filtered }));
  } catch (error) {
    console.error("Failed to remove from metadata:", error);
  }
}

function getMetadata(): DraftMetadata {
  try {
    const saved = localStorage.getItem(METADATA_KEY);
    if (!saved) return { drafts: [] };

    const parsed = JSON.parse(saved) as DraftMetadata;
    if (!parsed.drafts || !Array.isArray(parsed.drafts)) {
      return { drafts: [] };
    }

    return parsed;
  } catch (error) {
    console.error("Failed to get metadata:", error);
    return { drafts: [] };
  }
}
