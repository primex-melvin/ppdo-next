// app/(extra)/canvas/_components/PDFExportModal.tsx

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { Page, HeaderFooter } from './editor/types';
import { exportAsWYSIWYGPDF } from '@/lib/export-wysiwyg-pdf';

interface PDFExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: Page[];
  header: HeaderFooter;
  footer: HeaderFooter;
  documentTitle?: string;
}

type QualityLevel = 'medium' | 'ultra';

interface QualityOption {
  level: QualityLevel;
  label: string;
  scale: number;
  dpi: number;
  description: string;
  estimatedSizeMultiplier: number;
}

const QUALITY_OPTIONS: QualityOption[] = [
  {
    level: 'medium',
    label: 'Medium Quality',
    scale: 2,
    dpi: 144,
    description: 'Good for screen viewing and general use. Balanced file size.',
    estimatedSizeMultiplier: 1,
  },
  {
    level: 'ultra',
    label: 'Ultra Quality',
    scale: 4,
    dpi: 288,
    description: 'Best for printing and archival. Larger file size.',
    estimatedSizeMultiplier: 2.5,
  },
];

export default function PDFExportModal({
  isOpen,
  onClose,
  pages,
  header,
  footer,
  documentTitle,
}: PDFExportModalProps) {
  const [selectedQuality, setSelectedQuality] = useState<QualityLevel>('medium');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const estimatedBaseSize = pages.length * 0.5; // 0.5 MB per page base estimate

  const handleExport = async () => {
    setIsExporting(true);
    setProgress(0);

    const selectedOption = QUALITY_OPTIONS.find(opt => opt.level === selectedQuality);
    if (!selectedOption) return;

    try {
      await exportAsWYSIWYGPDF(
        pages,
        header,
        footer,
        selectedOption.scale,
        documentTitle,
        (currentPage: number, totalPages: number) => {
          // Progress callback
          const progressPercent = Math.round((currentPage / totalPages) * 100);
          setProgress(progressPercent);
        }
      );

      // Close modal on success
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Export as PDF</DialogTitle>
          <DialogDescription>
            Choose the quality level for your PDF export. Higher quality produces larger files.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {QUALITY_OPTIONS.map((option) => {
              const isSelected = selectedQuality === option.level;
              const estimatedSize = (estimatedBaseSize * option.estimatedSizeMultiplier).toFixed(1);

              return (
                <button
                  key={option.level}
                  onClick={() => !isExporting && setSelectedQuality(option.level)}
                  disabled={isExporting}
                  className={`
                    relative p-4 rounded-lg border-2 text-left transition-all
                    ${isSelected
                      ? 'border-[#4FBA76] bg-[#4FBA76]/5 shadow-md'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                    }
                    ${isExporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-[#4FBA76] rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className="font-semibold text-stone-900">{option.label}</h3>

                    <div className="flex gap-3 text-xs text-stone-600">
                      <div>
                        <span className="font-medium">Scale:</span> {option.scale}x
                      </div>
                      <div>
                        <span className="font-medium">DPI:</span> {option.dpi}
                      </div>
                    </div>

                    <p className="text-sm text-stone-600 leading-relaxed">
                      {option.description}
                    </p>

                    <div className="text-xs text-stone-500">
                      Est. size: ~{estimatedSize} MB
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-stone-600">
                <span>Exporting...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#4FBA76] h-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-[#4FBA76] hover:bg-[#45a869] text-white gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                Export PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
