// app/(extra)/canvas/_components/editor/upload-panel/FoldersTab.tsx

'use client';

import React, { useState } from 'react';
import { FolderPlus } from 'lucide-react';
import { UseUploadsReturn } from '../hooks/useUploads.types';
import FolderBrowser from './FolderBrowser';

interface FoldersTabProps {
  uploadHook: UseUploadsReturn;
}

export default function FoldersTab({ uploadHook }: FoldersTabProps) {
  const {
    folders,
    images,
    currentFolderId,
    setCurrentFolderId,
    createFolder,
    deleteImage,
    moveImageToFolder,
  } = uploadHook;

  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName);
      setNewFolderName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Create Folder Section */}
      <div className="flex-shrink-0 border-b border-zinc-200 dark:border-zinc-700 p-3">
        {isCreating ? (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewFolderName('');
                }
              }}
              autoFocus
              className="flex-1 px-2 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
            <button
              onClick={handleCreateFolder}
              className="px-2 py-1 text-sm font-medium bg-[#4FBA76] text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Create
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[#4FBA76] hover:bg-green-700 rounded-md transition-colors"
          >
            <FolderPlus size={16} />
            New Folder
          </button>
        )}
      </div>

      {/* Folder Browser */}
      <div className="flex-1 overflow-hidden">
        <FolderBrowser
          folders={folders}
          images={images}
          currentFolderId={currentFolderId}
          onFolderSelect={setCurrentFolderId}
          onDeleteImage={deleteImage}
          onMoveImage={moveImageToFolder}
        />
      </div>
    </div>
  );
}
