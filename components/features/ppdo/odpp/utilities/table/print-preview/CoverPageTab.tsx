// components/ppdo/table/print-preview/CoverPageTab.tsx

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, ArrowLeft, FileText, X as XIcon } from 'lucide-react';
import {
  ResizableModalHeader,
  ResizableModalTitle,
  ResizableModalDescription,
  ResizableModalBody,
  ResizableModalFooter,
} from '@/components/ui/resizable-modal';

interface CoverPageTabProps {
  onSelect: (includeCoverPage: boolean) => void;
  onBack: () => void;
}

export function CoverPageTab({ onSelect, onBack }: CoverPageTabProps) {
  const [selected, setSelected] = useState(false);

  return (
    <>
      {/* Header */}
      <ResizableModalHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <ResizableModalTitle className="text-2xl">
              Cover Page
            </ResizableModalTitle>
            <ResizableModalDescription>
              Would you like to add a cover page as the first page?
            </ResizableModalDescription>
          </div>
        </div>
      </ResizableModalHeader>

      {/* Cards */}
      <ResizableModalBody className="px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 gap-8">
            {/* No Card */}
            <button
              onClick={() => setSelected(false)}
              className={`relative group transition-all duration-200 ${
                !selected ? 'scale-105' : 'hover:scale-102'
              }`}
            >
              <div
                className={`relative border-2 rounded-xl overflow-hidden transition-all ${
                  !selected
                    ? 'border-[#15803D] ring-4 ring-[#15803D]/20 shadow-xl'
                    : 'border-stone-300 dark:border-stone-600 hover:border-stone-400 dark:hover:border-stone-500 hover:shadow-lg'
                }`}
              >
                {/* Visual */}
                <div className="aspect-[3/4] bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-800 dark:to-stone-900 p-8 flex items-center justify-center">
                  <div className="relative w-full h-full max-w-[140px] max-h-[200px] flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center">
                      <XIcon className="w-12 h-12 text-stone-400 dark:text-stone-500" />
                    </div>
                  </div>
                </div>

                {/* Label */}
                <div className={`px-6 py-4 transition-colors ${!selected ? 'bg-[#15803D] text-white' : 'bg-white dark:bg-stone-800'}`}>
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <h3 className="font-semibold text-lg">No Cover Page</h3>
                      <p className={`text-sm ${!selected ? 'text-white/90' : 'text-stone-500 dark:text-stone-400'}`}>
                        Start directly with data
                      </p>
                    </div>
                    {!selected && (
                      <div className="bg-white text-[#15803D] rounded-full p-1 shadow-lg">
                        <Check className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>

            {/* Yes Card */}
            <button
              onClick={() => setSelected(true)}
              className={`relative group transition-all duration-200 ${
                selected ? 'scale-105' : 'hover:scale-102'
              }`}
            >
              <div
                className={`relative border-2 rounded-xl overflow-hidden transition-all ${
                  selected
                    ? 'border-[#15803D] ring-4 ring-[#15803D]/20 shadow-xl'
                    : 'border-stone-300 dark:border-stone-600 hover:border-stone-400 dark:hover:border-stone-500 hover:shadow-lg'
                }`}
              >
                {/* Visual */}
                <div className="aspect-[3/4] bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-800 dark:to-stone-900 p-8 flex items-center justify-center">
                  <div className="relative w-full h-full max-w-[140px] max-h-[200px]">
                    <div className="absolute inset-0 bg-white dark:bg-stone-950 rounded-lg shadow-2xl border border-stone-200 dark:border-stone-700 flex flex-col items-center justify-center p-4">
                      <div className="w-12 h-12 rounded-full bg-[#15803D]/10 flex items-center justify-center mb-3">
                        <FileText className="w-6 h-6 text-[#15803D]" />
                      </div>
                      <div className="h-2 bg-stone-300 dark:bg-stone-600 rounded w-3/4 mb-1.5" />
                      <div className="h-1.5 bg-stone-200 dark:bg-stone-700 rounded w-1/2 mb-1" />
                      <div className="h-1 bg-stone-200 dark:bg-stone-700 rounded w-2/3" />
                    </div>
                  </div>
                </div>

                {/* Label */}
                <div className={`px-6 py-4 transition-colors ${selected ? 'bg-[#15803D] text-white' : 'bg-white dark:bg-stone-800'}`}>
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <h3 className="font-semibold text-lg">Add Cover Page</h3>
                      <p className={`text-sm ${selected ? 'text-white/90' : 'text-stone-500 dark:text-stone-400'}`}>
                        Title page before data
                      </p>
                    </div>
                    {selected && (
                      <div className="bg-white text-[#15803D] rounded-full p-1 shadow-lg">
                        <Check className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">About Cover Pages</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  The cover page includes the document title, subtitle, and generation date. You can always add or remove it later in the editor.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ResizableModalBody>

      {/* Footer */}
      <ResizableModalFooter className="px-8 py-4 bg-stone-50 dark:bg-stone-800/50">
        <div className="flex items-center justify-between w-full">
          <span className="text-sm text-stone-500 dark:text-stone-400">
            Cover page: <span className="font-medium text-stone-700 dark:text-stone-300">{selected ? 'Yes' : 'No'}</span>
          </span>
          <Button
            onClick={() => onSelect(selected)}
            className="bg-[#15803D] hover:bg-[#15803D]/90 text-white px-6"
          >
            <Check className="w-4 h-4 mr-2" />
            Finish & Create Preview
          </Button>
        </div>
      </ResizableModalFooter>
    </>
  );
}
