// app/(extra)/canvas/_components/editor/hooks/useUploads.ts

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { UploadedImage, UploadFolder, UploadProgress } from '../types/upload';
import {
  uploadImageToIndexedDB,
  getImagesByFolderFromIndexedDB,
  deleteImageFromIndexedDB,
  moveImageToFolderInIndexedDB,
  getAllImagesFromIndexedDB,
} from '../utils/indexeddb-upload';
import { compressImage } from '../utils/image-compress';

interface UseUploadsOptions {
  enableFeature?: boolean;
}

export const useUploads = (options: UseUploadsOptions = {}) => {
  const { enableFeature = true } = options;
  
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [folders, setFolders] = useState<UploadFolder[]>([
    { id: 'root', name: 'My Uploads', createdAt: Date.now(), parentId: null, imageCount: 0 },
  ]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const progressTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Load images on mount
  useEffect(() => {
    if (!enableFeature) {
      setIsLoading(false);
      return;
    }

    const loadImages = async () => {
      try {
        const allImages = await getAllImagesFromIndexedDB();
        setImages(allImages);
        
        // Calculate folder counts
        const folderCounts = new Map<string | null, number>();
        allImages.forEach((img) => {
          const count = folderCounts.get(img.folderId) || 0;
          folderCounts.set(img.folderId, count + 1);
        });

        setFolders((prevFolders) =>
          prevFolders.map((folder) => ({
            ...folder,
            imageCount: folderCounts.get(folder.id === 'root' ? null : folder.id) || 0,
          }))
        );
      } catch (error) {
        console.error('Failed to load images from IndexedDB:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadImages();
  }, [enableFeature]);

  const addImage = useCallback(
    async (file: File) => {
      if (!enableFeature) return null;

      const fileId = `${Date.now()}-${Math.random()}`;
      const progress: UploadProgress = {
        fileId,
        fileName: file.name,
        progress: 0,
        status: 'uploading',
      };

      setUploadProgress((prev) => [...prev, progress]);

      try {
        // Compress image
        const { dataUrl, thumbnail } = await compressImage(file);
        
        setUploadProgress((prev) =>
          prev.map((p) => (p.fileId === fileId ? { ...p, progress: 75, status: 'processing' } : p))
        );

        const image: UploadedImage = {
          id: fileId,
          name: file.name,
          dataUrl,
          thumbnail,
          size: file.size,
          uploadedAt: Date.now(),
          folderId: currentFolderId,
          mimeType: file.type,
        };

        await uploadImageToIndexedDB(image);

        setImages((prev) => [...prev, image]);
        
        // Update folder count
        setFolders((prevFolders) =>
          prevFolders.map((folder) => {
            if (
              (currentFolderId === null && folder.id === 'root') ||
              (currentFolderId !== null && folder.id === currentFolderId)
            ) {
              return { ...folder, imageCount: folder.imageCount + 1 };
            }
            return folder;
          })
        );

        setUploadProgress((prev) =>
          prev.map((p) =>
            p.fileId === fileId ? { ...p, progress: 100, status: 'success' } : p
          )
        );

        // Auto-remove success status after 2s
        const timeout = setTimeout(() => {
          setUploadProgress((prev) => prev.filter((p) => p.fileId !== fileId));
        }, 2000);

        progressTimeouts.current.set(fileId, timeout);

        return image;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        setUploadProgress((prev) =>
          prev.map((p) =>
            p.fileId === fileId
              ? { ...p, status: 'error', error: errorMsg }
              : p
          )
        );
        console.error('Failed to upload image:', error);
        return null;
      }
    },
    [enableFeature, currentFolderId]
  );

  const deleteImage = useCallback(
    async (imageId: string) => {
      if (!enableFeature) return;

      try {
        await deleteImageFromIndexedDB(imageId);
        setImages((prev) => prev.filter((img) => img.id !== imageId));

        // Update folder count
        const image = images.find((img) => img.id === imageId);
        if (image) {
          setFolders((prevFolders) =>
            prevFolders.map((folder) => {
              if (
                (image.folderId === null && folder.id === 'root') ||
                (image.folderId !== null && folder.id === image.folderId)
              ) {
                return { ...folder, imageCount: Math.max(0, folder.imageCount - 1) };
              }
              return folder;
            })
          );
        }
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
    },
    [enableFeature, images]
  );

  const createFolder = useCallback(
    (name: string) => {
      if (!enableFeature) return null;

      const newFolder: UploadFolder = {
        id: `folder-${Date.now()}-${Math.random()}`,
        name,
        createdAt: Date.now(),
        parentId: null,
        imageCount: 0,
      };

      setFolders((prev) => [...prev, newFolder]);
      return newFolder;
    },
    [enableFeature]
  );

  const deleteFolder = useCallback(
    async (folderId: string) => {
      if (!enableFeature || folderId === 'root') return;

      try {
        // Move all images in folder to root
        const folderImages = images.filter((img) => img.folderId === folderId);
        for (const image of folderImages) {
          await moveImageToFolderInIndexedDB(image.id, null);
        }

        setImages((prev) =>
          prev.map((img) =>
            img.folderId === folderId ? { ...img, folderId: null } : img
          )
        );

        setFolders((prev) => prev.filter((f) => f.id !== folderId));
      } catch (error) {
        console.error('Failed to delete folder:', error);
      }
    },
    [enableFeature, images]
  );

  const renameFolder = useCallback(
    (folderId: string, newName: string) => {
      if (!enableFeature) return;

      setFolders((prev) =>
        prev.map((f) => (f.id === folderId ? { ...f, name: newName } : f))
      );
    },
    [enableFeature]
  );

  const moveImageToFolder = useCallback(
    async (imageId: string, newFolderId: string | null) => {
      if (!enableFeature) return;

      try {
        const updated = await moveImageToFolderInIndexedDB(imageId, newFolderId);
        if (updated) {
          setImages((prev) =>
            prev.map((img) => (img.id === imageId ? updated : img))
          );
        }
      } catch (error) {
        console.error('Failed to move image:', error);
      }
    },
    [enableFeature]
  );

  const getImagesByFolder = useCallback(
    (folderId: string | null) => {
      return images.filter((img) => img.folderId === folderId);
    },
    [images]
  );

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      progressTimeouts.current.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  return {
    images,
    folders,
    uploadProgress,
    currentFolderId,
    setCurrentFolderId,
    isLoading,
    addImage,
    deleteImage,
    createFolder,
    deleteFolder,
    renameFolder,
    moveImageToFolder,
    getImagesByFolder,
  };
};
