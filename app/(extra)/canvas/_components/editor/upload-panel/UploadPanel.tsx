// app/(extra)/canvas/_components/editor/upload-panel/UploadPanel.tsx

'use client';

import React, { useState } from 'react';
import { useUploads } from '../hooks/useUploads';
import FoldersTab from './FoldersTab';
import ImagesTab from './ImagesTab';
interface UploadPanelProps {
  enableFeature?: boolean;
  onImageSelect?: (image: any) => void;
}

export default function UploadPanel({
  enableFeature = true,
  onImageSelect,
}: UploadPanelProps) {
  const [activeTab, setActiveTab] = useState<'images' | 'folders'>('images');
  
  const uploadHook = useUploads({ enableFeature });

  if (!enableFeature) return null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700">
      {/* Tab Switcher */}
      <div className="flex gap-0 border-b border-zinc-200 dark:border-zinc-700">
        <button
          onClick={() => setActiveTab('images')}
          className={`flex-1 px-4 py-3 font-medium text-sm transition-all ${
            activeTab === 'images'
              ? 'text-white bg-[#4FBA76] border-b-2 border-[#4FBA76]'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          Images
        </button>
        <button
          onClick={() => setActiveTab('folders')}
          className={`flex-1 px-4 py-3 font-medium text-sm transition-all ${
            activeTab === 'folders'
              ? 'text-white bg-[#4FBA76] border-b-2 border-[#4FBA76]'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          Folders
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'images' && (
          <ImagesTab    
            uploadHook={uploadHook} 
            onImageSelect={onImageSelect}
          />
        )}
        {activeTab === 'folders' && (
          <FoldersTab 
            uploadHook={uploadHook}
          />
        )}
      </div>
    </div>
  );
}
