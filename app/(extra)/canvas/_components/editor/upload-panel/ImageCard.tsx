// app/(extra)/canvas/_components/editor/upload-panel/ImageCard.tsx

'use client';

import React, { useState } from 'react';
import { UploadedImage } from '../types/upload';
import { Trash2, GripHorizontal } from 'lucide-react';

interface ImageCardProps {
  image: UploadedImage;
  onSelect: () => void;
  onDelete?: () => void;
  isDragging?: boolean;
}

export default function ImageCard({ 
  image, 
  onSelect, 
  onDelete,
  isDragging = false 
}: ImageCardProps) {
  const [showDelete, setShowDelete] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'image',
      image: image,
      source: 'upload-panel'
    }));
    // Create custom drag image
    const img = new Image();
    img.src = image.thumbnail;
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  // Format upload date
  const uploadDate = new Date(image.uploadedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: '2-digit'
  });

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      className={`relative group cursor-grab active:cursor-grabbing rounded-md overflow-hidden border-2 transition-all ${
        isDragging 
          ? 'border-[#4FBA76] bg-green-50 opacity-50' 
          : 'border-zinc-200 dark:border-zinc-700 hover:border-[#4FBA76]'
      }`}
    >
      {/* Drag Handle Icon */}
      <div className="absolute top-1 left-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="p-1 bg-white/80 rounded shadow-sm">
          <GripHorizontal size={12} className="text-zinc-600" />
        </div>
      </div>

      {/* Image */}
      <img
        src={image.thumbnail}
        alt={image.name}
        onClick={onSelect}
        className="w-full h-24 object-cover hover:opacity-75 transition-opacity cursor-pointer"
      />

      {/* Hover Overlay */}
      {showDelete && onDelete && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
            title="Delete image"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {/* Image Info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-2 text-white text-xs">
        <div className="truncate font-medium">{image.name}</div>
        <div className="text-gray-200 text-xs">{uploadDate}</div>
      </div>
    </div>
  );
}
