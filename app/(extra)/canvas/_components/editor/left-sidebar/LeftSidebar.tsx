// app/(extra)/canvas/_components/editor/left-sidebar/LeftSidebar.tsx

'use client';

import React, { useState } from 'react';
import { Type, Layers, Upload } from 'lucide-react';
import UploadPanel from '../upload-panel/UploadPanel';

interface LeftSidebarProps {
  enableUploadFeature?: boolean;
  onImageSelect?: (image: any) => void;
  textContent?: React.ReactNode;
  layersContent?: React.ReactNode;
}

export default function LeftSidebar({
  enableUploadFeature = true,
  onImageSelect,
  textContent,
  layersContent,
}: LeftSidebarProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'layers' | 'uploads'>(
    'text'
  );

  return (
   <div className="flex flex-col w-64 h-full bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 overflow-hidden">

      {/* Tab Buttons */}
      <div className="flex flex-col gap-2 p-2 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
        <button
          onClick={() => setActiveTab('text')}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md font-medium text-sm transition-all ${
            activeTab === 'text'
              ? 'bg-[#4FBA76] text-white shadow-sm'
              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
          }`}
          title="Text elements"
        >
          <Type size={18} />
          <span>Text</span>
        </button>

        <button
          onClick={() => setActiveTab('layers')}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md font-medium text-sm transition-all ${
            activeTab === 'layers'
              ? 'bg-[#4FBA76] text-white shadow-sm'
              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
          }`}
          title="Layer management"
        >
          <Layers size={18} />
          <span>Layers</span>
        </button>

        {enableUploadFeature && (
          <button
            onClick={() => setActiveTab('uploads')}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md font-medium text-sm transition-all ${
              activeTab === 'uploads'
                ? 'bg-[#4FBA76] text-white shadow-sm'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
            }`}
            title="Upload images"
          >
            <Upload size={18} />
            <span>Uploads</span>
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'text' && (
          <div className="h-full overflow-auto p-3">
            {textContent || (
              <div className="text-zinc-500 text-sm">Text panel content</div>
            )}
          </div>
        )}

        {activeTab === 'layers' && (
          <div className="h-full overflow-auto p-3">
            {layersContent || (
              <div className="text-zinc-500 text-sm">Layers panel content</div>
            )}
          </div>
        )}

        {activeTab === 'uploads' && enableUploadFeature && (
          <div className="h-full overflow-hidden">
            <UploadPanel
              enableFeature={enableUploadFeature}
              onImageSelect={onImageSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
}
