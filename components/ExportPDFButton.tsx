// components/ExportPDFButton.tsx
// Example component showing how to use the Puppeteer HD PDF exporter

'use client';

import { useState } from 'react';
import { exportCurrentPageAsPDF, exportElementAsPDF } from '@/lib/pdf-client';

export function ExportPDFButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExportCurrentPage = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await exportCurrentPageAsPDF('document.pdf', {
        scale: 2, // 2x DPI (~192 DPI)
        waitForSelector: '#print-container', // Adjust to your print area selector
        waitForTimeout: 1000,
        printBackground: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportElement = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Export a specific DOM element (e.g., a chart or section)
      await exportElementAsPDF('#export-section', 'section.pdf', {
        scale: 2,
        margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleExportCurrentPage}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? '⏳ Generating PDF...' : '📥 Export Page as HD PDF'}
      </button>

      <button
        onClick={handleExportElement}
        disabled={isLoading}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        {isLoading ? '⏳ Generating PDF...' : '📊 Export Section as PDF'}
      </button>

      {error && <div className="text-red-600 text-sm">{error}</div>}
    </div>
  );
}
