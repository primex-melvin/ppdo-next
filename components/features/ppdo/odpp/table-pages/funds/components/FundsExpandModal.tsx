// components/ppdo/funds/components/FundsExpandModal.tsx

"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spreadsheet } from "@/components/features/spreadsheet";
import { createFundsSpreadsheetConfig, FundType } from "../utils/fundsSpreadsheetConfig";

interface FundsExpandModalProps {
    isOpen: boolean;
    onClose: () => void;
    fundType: FundType;
    year: number;
    title?: string;
}

export function FundsExpandModal({
    isOpen,
    onClose,
    fundType,
    year,
    title
}: FundsExpandModalProps) {
    if (!isOpen) return null;

    // Create dynamic config for this specific fund type
    const config = createFundsSpreadsheetConfig(fundType);
    const displayTitle = title || config.title;

    // Filter by year
    const filters = { year };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
            <div className="fixed inset-4 bg-white dark:bg-zinc-900 rounded-lg shadow-2xl overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        {displayTitle} - Spreadsheet View ({year})
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Spreadsheet Container */}
                <div className="flex-1 overflow-hidden">
                    <Spreadsheet
                        config={config}
                        filters={filters}
                    />
                </div>
            </div>
        </div>
    );
}