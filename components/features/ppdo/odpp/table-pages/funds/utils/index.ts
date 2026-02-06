// components/ppdo/funds/utils/index.ts

/**
 * Shared utility functions for all fund components
 * These utilities provide common formatting, calculation, and export functionality
 */

import { BaseFund } from "../types";
import { AVAILABLE_COLUMNS, STATUS_CONFIG, STATUS_CLASSES } from "../constants";
import {
    formatCurrency,
    formatDate,
    formatPercentage,
} from "@/lib/shared/utils/formatting";

// Re-export shared formatters
export { formatCurrency, formatDate, formatPercentage };

// ============================================================================
// ADDITIONAL FORMATTING UTILITIES
// ============================================================================

export const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

    return formatDate(timestamp);
};

export const formatStatus = (status?: string): string => {
    if (!status) return "—";
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.not_available;
    return config.label;
};

export const getStatusClassName = (status?: string): string => {
    if (!status) return "bg-zinc-100/50 text-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300";
    return STATUS_CLASSES[status as keyof typeof STATUS_CLASSES] || STATUS_CLASSES.not_available;
};

export const truncateText = (text: string, maxLength: number = 50): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
};

// ============================================================================
// CALCULATION UTILITIES
// ============================================================================

export const calculateUtilizationRate = (utilized: number, received: number): number => {
    if (received === 0) return 0;
    return (utilized / received) * 100;
};

export const calculateTotals = <T extends BaseFund>(data: T[]) => {
    const totals = data.reduce(
        (acc, item) => {
            acc.received += item.received;
            acc.obligatedPR += item.obligatedPR || 0;
            acc.utilized += item.utilized;
            acc.balance += item.balance;
            return acc;
        },
        { received: 0, obligatedPR: 0, utilized: 0, balance: 0 }
    );

    // Calculate average utilization rate for totals
    const avgUtilizationRate = totals.received > 0
        ? (totals.utilized / totals.received) * 100
        : 0;

    return {
        ...totals,
        utilizationRate: avgUtilizationRate,
    };
};

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

/**
 * Export funds data to CSV
 */
export const exportToCSV = <T extends BaseFund>(
    data: T[],
    hiddenColumns: Set<string>,
    year?: number,
    fundType: string = 'funds'
): void => {
    try {
        const headers = AVAILABLE_COLUMNS
            .filter(col => !hiddenColumns.has(col.id))
            .map(col => col.label);

        const rows = data.map(item =>
            AVAILABLE_COLUMNS
                .filter(col => !hiddenColumns.has(col.id))
                .map(col => {
                    switch (col.id) {
                        case "projectTitle": return item.projectTitle;
                        case "officeInCharge": return item.officeInCharge;
                        case "status": return formatStatus(item.status);
                        case "dateReceived": return formatDate(item.dateReceived as any);
                        case "received": return item.received;
                        case "obligatedPR": return item.obligatedPR || 0;
                        case "utilized": return item.utilized;
                        case "utilizationRate":
                            return item.utilizationRate?.toFixed(2) ||
                                calculateUtilizationRate(item.utilized, item.received).toFixed(2);
                        case "balance": return item.balance;
                        case "remarks": return item.remarks || "";
                        default: return "";
                    }
                })
        );

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fundType}-${year || 'all'}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        throw new Error("Failed to export CSV");
    }
};

/**
 * Print table with specified orientation
 */
export const printTable = (orientation: 'portrait' | 'landscape'): void => {
    const style = document.createElement('style');
    style.textContent = `
    @page {
      size: ${orientation === 'portrait' ? 'A4 portrait' : 'A4 landscape'};
      margin: 0.5in;
    }
    @media print {
      .no-print { display: none !important; }
      .print-area { break-inside: avoid; }
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  `;
    document.head.appendChild(style);

    setTimeout(() => {
        window.print();
        document.head.removeChild(style);
    }, 100);
};

// ============================================================================
// SLUG UTILITIES
// ============================================================================

export const createFundSlug = (projectTitle: string, id: string): string => {
    const slug = projectTitle
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    return `${slug}-${id}`;
};

export const extractIdFromSlug = (slug: string): string => {
    const parts = slug.split("-");
    return parts[parts.length - 1];
};
