// app/(extra)/canvas/_components/editor/upload-panel/ImagesTab.tsx

'use client';

import React, { useRef, useState } from 'react';
import { UploadedImage } from '../types/upload';
import { UseUploadsReturn } from '../hooks/useUploads.types';
import ImageCard from './ImageCard';

interface ImagesTabProps {
  uploadHook: UseUploadsReturn;
  onImageSelect?: (image: UploadedImage) => void;
}

export default function ImagesTab({ uploadHook, onImageSelect }: ImagesTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const {
    images,
    uploadProgress,
    currentFolderId,
    isLoading,
    addImage,
    getImagesByFolder,
  } = uploadHook;

  const folderImages = getImagesByFolder(currentFolderId);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(
      (file) =>
        file.type.startsWith('image/') &&
        ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(
          file.type
        )
    );

    for (const file of files) {
      await addImage(file);
    }
  };

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.currentTarget.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      await addImage(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="text-zinc-500 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Upload Area */}
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-4 border-2 border-dashed transition-colors ${
          isDragging
            ? 'border-[#4FBA76] bg-green-50 dark:bg-green-950'
            : 'border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800'
        }`}
      >
        <div className="text-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-block px-4 py-2 rounded-md font-medium text-white bg-[#4FBA76] hover:bg-green-700 transition-colors text-sm"
          >
            Choose Files
          </button>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
            or drag & drop images here
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Progress Items */}
      {uploadProgress.length > 0 && (
        <div className="border-b border-zinc-200 dark:border-zinc-700 p-3 space-y-2">
          {uploadProgress.map((progress) => (
            <div key={progress.fileId} className="text-xs">
              <div className="flex justify-between mb-1">
                <span className="text-zinc-700 dark:text-zinc-300 truncate">
                  {progress.fileName}
                </span>
                <span className="text-zinc-500 text-xs">{progress.progress}%</span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#4FBA76] h-full transition-all"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              {progress.status === 'error' && (
                <p className="text-red-500 text-xs mt-1">{progress.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Images Grid */}
      {folderImages.length > 0 ? (
        <div className="flex-1 overflow-auto p-3">
          <div className="grid grid-cols-3 gap-2">
            {folderImages.map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                onSelect={() => onImageSelect?.(image)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-zinc-500 text-sm">No images yet</p>
            <p className="text-zinc-400 text-xs mt-1">
              Upload images to get started
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
