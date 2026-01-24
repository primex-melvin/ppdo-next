// app/(extra)/canvas/_components/editor/upload-panel/FolderTreeView.tsx

'use client';

import React from 'react';
import { UploadedImage, UploadFolder } from '../types/upload';
import { Trash2, Folder } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FolderTreeViewProps {
  folders: UploadFolder[];
  images: UploadedImage[];
  currentFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onDeleteImage: (imageId: string) => void;
}

export default function FolderTreeView({
  folders,
  images,
  currentFolderId,
  onFolderSelect,
  onDeleteImage,
}: FolderTreeViewProps) {
  const getImagesByFolder = (folderId: string | null) => {
    return images.filter((img) => img.folderId === folderId);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full overflow-auto p-3">
      <Accordion type="multiple" className="w-full">
        {folders.map((folder) => {
          const folderImages = getImagesByFolder(
            folder.id === 'root' ? null : folder.id
          );
          const isActive = currentFolderId === (folder.id === 'root' ? null : folder.id);

          return (
            <AccordionItem
              key={folder.id}
              value={folder.id}
              className={`border-l-4 transition-all ${
                isActive
                  ? 'border-[#4FBA76] bg-green-50 dark:bg-green-950/20'
                  : 'border-zinc-200 dark:border-zinc-700'
              }`}
            >
              <AccordionTrigger
                onClick={() =>
                  onFolderSelect(folder.id === 'root' ? null : folder.id)
                }
                className={`px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                  isActive ? 'bg-green-100 dark:bg-green-950/30' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <Folder size={16} className="text-[#4FBA76]" />
                  <span className="font-medium">{folder.name}</span>
                  <span className="text-xs text-zinc-500 ml-1">
                    ({folderImages.length})
                  </span>
                </div>
              </AccordionTrigger>

              {/* Images Grid inside Accordion */}
              <AccordionContent className="pt-2 pb-3 px-3">
                {folderImages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {folderImages.map((image) => (
                      <div
                        key={image.id}
                        className="group relative rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-700 hover:border-[#4FBA76] transition-colors"
                      >
                        {/* Thumbnail */}
                        <img
                          src={image.thumbnail}
                          alt={image.name}
                          className="w-full h-20 object-cover hover:opacity-75 transition-opacity cursor-pointer"
                        />

                        {/* Delete Button */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => onDeleteImage(image.id)}
                            className="p-1 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                            title="Delete image"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        {/* Image Info */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 py-1 text-white text-xs">
                          <div className="truncate font-medium text-[10px]">
                            {image.name}
                          </div>
                          <div className="text-gray-200 text-[9px]">
                            {formatDate(image.uploadedAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-zinc-500 text-xs">No images in this folder</p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
