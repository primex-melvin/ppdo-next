// app/(extra)/canvas/_components/editor/upload-panel/FolderBrowser.tsx

'use client';

import React, { useState } from 'react';
import { ChevronRight, Trash2 } from 'lucide-react';
import { UploadedImage, UploadFolder } from '../types/upload';

interface FolderBrowserProps {
  folders: UploadFolder[];
  images: UploadedImage[];
  currentFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onDeleteImage: (imageId: string) => void;
  onMoveImage?: (imageId: string, newFolderId: string | null) => void;
}

export default function FolderBrowser({
  folders,
  images,
  currentFolderId,
  onFolderSelect,
  onDeleteImage,
  onMoveImage,
}: FolderBrowserProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['root'])
  );
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getImagesByFolder = (folderId: string | null) => {
    return images.filter((img) => img.folderId === folderId);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day}, ${hours}:${minutes}`;
  };

  const handleImageDragStart = (e: React.DragEvent, image: UploadedImage) => {
    setDraggedImageId(image.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'move-image',
      imageId: image.id,
      fromFolderId: image.folderId,
    }));
  };

  const handleFolderDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleFolderDrop = (e: React.DragEvent, toFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const dragData = JSON.parse(data);
        if (dragData.type === 'move-image' && onMoveImage) {
          onMoveImage(dragData.imageId, toFolderId);
        }
      }
    } catch (error) {
      console.error('Failed to parse drag data:', error);
    }
  };

  const handleImageDragEnd = () => {
    setDraggedImageId(null);
  };

  const renderFolderTree = (parentFolderId: string | null, depth: number = 0) => {
    const childFolders = folders.filter((f) => f.parentId === parentFolderId);
    const folderImages = getImagesByFolder(parentFolderId);
    const isExpanded = expandedFolders.has(parentFolderId || 'root');
    const isSelected = currentFolderId === parentFolderId;

    return (
      <div key={parentFolderId || 'root'}>
        {/* Folder Item */}
        {parentFolderId !== null && (
          <div
            onDragOver={handleFolderDragOver}
            onDrop={(e) => handleFolderDrop(e, parentFolderId)}
            className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer rounded transition-colors ${
              isSelected
                ? 'bg-blue-100 text-blue-900'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            onClick={() => onFolderSelect(parentFolderId)}
            style={{ marginLeft: `${depth * 16}px` }}
          >
            {childFolders.length > 0 || folderImages.length > 0 ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(parentFolderId);
                }}
                className="p-0 hover:bg-gray-200 rounded"
              >
                <ChevronRight
                  size={16}
                  className={`transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              </button>
            ) : (
              <div className="w-4" />
            )}
            <span className="text-sm font-medium">
              {folders.find((f) => f.id === parentFolderId)?.name}
            </span>
            <span className="text-xs text-gray-500 ml-auto">
              ({folderImages.length})
            </span>
          </div>
        )}

        {/* Root Folder */}
        {parentFolderId === null && (
          <div
            onDragOver={handleFolderDragOver}
            onDrop={(e) => handleFolderDrop(e, null)}
            className={`px-2 py-1.5 cursor-pointer rounded transition-colors ${
              isSelected
                ? 'bg-blue-100 text-blue-900'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            onClick={() => onFolderSelect(null)}
          >
            <span className="text-sm font-medium">My Uploads</span>
            <span className="text-xs text-gray-500 ml-2">
              ({folderImages.length})
            </span>
          </div>
        )}

        {/* Images Grid */}
        {isExpanded && folderImages.length > 0 && (
          <div
            className="ml-4 mt-1 grid grid-cols-2 gap-2 p-2 bg-gray-50 rounded"
            style={{ marginLeft: `${depth * 16 + 16}px` }}
          >
            {folderImages.map((image) => (
              <div
                key={image.id}
                draggable
                onDragStart={(e) => handleImageDragStart(e, image)}
                onDragEnd={handleImageDragEnd}
                className={`group relative rounded overflow-hidden border cursor-grab active:cursor-grabbing transition-all ${
                  draggedImageId === image.id
                    ? 'opacity-50 border-blue-400'
                    : 'border-gray-200 hover:border-blue-400'
                }`}
              >
                {/* Thumbnail */}
                <img
                  src={image.thumbnail}
                  alt={image.name}
                  className="w-full h-16 object-cover"
                />

                {/* Delete Button */}
                <button
                  onClick={() => onDeleteImage(image.id)}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 bg-red-500 hover:bg-red-600 text-white rounded transition-all"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>

                {/* Image Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-1 py-1 text-white text-[10px]">
                  <div className="truncate font-medium">{image.name}</div>
                  <div className="text-gray-300 text-[9px]">
                    {formatDate(image.uploadedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Child Folders */}
        {isExpanded &&
          childFolders.map((folder) =>
            renderFolderTree(folder.id, depth + 1)
          )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-auto p-2">
      <div className="space-y-1">{renderFolderTree(null)}</div>
    </div>
  );
}
