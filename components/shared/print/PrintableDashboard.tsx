"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Printer, Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { DashboardContent } from "@/components/features/analytics/DashboardContent";

import { DashboardFilters } from "@/hooks/useDashboardFilters";

export function PrintableDashboard({ filters }: { filters: DashboardFilters }) {
    const [showPreview, setShowPreview] = useState(false);
    const [options, setOptions] = useState({
        includeCharts: true,
        includeTables: true,
        orientation: "landscape" as "portrait" | "landscape",
        pageSize: "a4" as "a4" | "letter" | "legal",
    });

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        const doc = new jsPDF({
            orientation: options.orientation,
            unit: "mm",
            format: options.pageSize,
        });

        // Add cover page
        addCoverPage(doc, filters);

        // Capture and add content
        const content = document.getElementById("printable-content");
        if (content) {
            const canvas = await html2canvas(content);
            const imgData = canvas.toDataURL("image/png");

            doc.addPage();
            doc.addImage(imgData, "PNG", 10, 10, 190, 0);
        }

        doc.save(`ppdo-dashboard-${Date.now()}.pdf`);
    };

    return (
        <>
            <div className="hidden fixed bottom-6 right-6 flex gap-2 z-50">
                <Button onClick={() => setShowPreview(true)}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Dashboard
                </Button>
            </div>

            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-6xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Print Preview</DialogTitle>
                    </DialogHeader>

                    {/* Options */}
                    <div className="flex gap-4 border-b pb-4">
                        <Button onClick={handlePrint} variant="outline">
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                        </Button>
                        <Button onClick={handleDownloadPDF}>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                        </Button>
                    </div>

                    {/* Preview Content */}
                    <div
                        id="printable-content"
                        className="overflow-auto bg-white p-8 print:p-0"
                    >
                        <PrintableContent filters={filters} options={options} />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

function addCoverPage(doc: jsPDF, filters: DashboardFilters) {
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("PPDO Tarlac", 105, 40, { align: "center" });

    doc.setFontSize(18);
    doc.text("Dashboard Report", 105, 50, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(
        `Generated: ${new Date().toLocaleDateString()}`,
        105,
        104,
        { align: "center" }
    );

    // Applied filters
    if (filters.fiscalYearId) {
        doc.text(`Year: ${filters.fiscalYearId}`, 20, 80);
    }
}

// Internal component to handle print layout
function PrintableContent({ filters, options }: { filters: DashboardFilters; options: any }) {
    return (
        <div className="space-y-8">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold">Dashboard Report</h1>
                <p className="text-muted-foreground">
                    Generated on {new Date().toLocaleDateString()}
                </p>
            </div>

            {/* We reuse the dashboard content but strip interactive elements via CSS or props if possible */}
            {/* For now, we wrap it. In a real scenario, we might pass a 'readonly' prop */}
            <div className="pointer-events-none">
                <DashboardContent filters={filters} year={filters.fiscalYearId ? undefined : new Date().getFullYear().toString()} />
            </div>

            <div className="mt-8 text-xs text-center text-muted-foreground border-t pt-4">
                PPDO Tarlac - Official Document
            </div>
        </div>
    );
}