"use client";

import {
    ResizableModal,
    ResizableModalContent,
    ResizableModalHeader,
    ResizableModalTitle,
    ResizableModalDescription,
    ResizableModalBody,
    ResizableModalFooter,
} from "@/components/ui/resizable-modal";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/shared/utils/form-helpers";
import { Calculator } from "lucide-react";

interface AutoCalcConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    isAutoCalculate: boolean;
    data: {
        obligated: number;
        utilized: number;
        balance: number;
    };
}

export function AutoCalcConfirmationModal({
    isOpen,
    onClose,
    isAutoCalculate,
    data,
}: AutoCalcConfirmationModalProps) {
    return (
        <ResizableModal open={isOpen} onOpenChange={onClose}>
            <ResizableModalContent
                maxWidth="1000px"
                width="95vw"
                className="max-h-[80vh] overflow-hidden"
            >
                <ResizableModalHeader className="py-3 px-6 pb-2">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full shrink-0 ${isAutoCalculate ? "bg-green-100 dark:bg-green-900/30" : "bg-zinc-100 dark:bg-zinc-800"}`}>
                            <Calculator className={`w-5 h-5 ${isAutoCalculate ? "text-green-700 dark:text-green-400" : "text-zinc-500"}`} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <ResizableModalTitle className="text-lg">
                                {isAutoCalculate ? "Auto-Calculation Enabled" : "Manual Calculation Enabled"}
                            </ResizableModalTitle>
                            <ResizableModalDescription className="text-xs">
                                {isAutoCalculate
                                    ? "Parent financials are now auto-calculated from breakdowns"
                                    : "Parent financials can now be manually adjusted"}
                            </ResizableModalDescription>
                        </div>
                    </div>
                </ResizableModalHeader>
                <ResizableModalBody className="px-6 py-2 overflow-hidden">
                    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-zinc-200 dark:border-zinc-800">
                                    <TableHead className="text-center h-9 text-xs uppercase tracking-wider font-semibold text-zinc-500">Obligated</TableHead>
                                    <TableHead className="text-center h-9 text-xs uppercase tracking-wider font-semibold text-zinc-500">Utilized</TableHead>
                                    <TableHead className="text-center h-9 text-xs uppercase tracking-wider font-semibold text-zinc-500">Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow className="hover:bg-transparent border-0">
                                    <TableCell className="text-center py-3 text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100">
                                        {formatCurrency(data.obligated)}
                                    </TableCell>
                                    <TableCell className="text-center py-3 text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100">
                                        {formatCurrency(data.utilized)}
                                    </TableCell>
                                    <TableCell className="text-center py-3 text-lg font-bold font-mono text-green-700 dark:text-green-400">
                                        {formatCurrency(data.balance)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </ResizableModalBody>
                <ResizableModalFooter className="py-3 px-6 pt-2 border-t-0">
                    <Button onClick={onClose} size="sm" className="w-full sm:w-auto px-6">
                        Acknowledge
                    </Button>
                </ResizableModalFooter>
            </ResizableModalContent>
        </ResizableModal>
    );
}
