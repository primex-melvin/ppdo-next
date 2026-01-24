// app/(extra)/canvas/_components/editor/hooks/usePrintClipboard.ts
/**
 * Clipboard handling hook for PrintPreviewModal
 * Allows pasting images while in print preview mode
 * Integrates with the existing canvas image system
 */

import { useEffect } from 'react';
import { CanvasElement, Page, HeaderFooter, ImageElement } from '../types';
import {
  extractImagesFromClipboardEvent,
  readClipboardImages,
  calculateImageDimensions,
  calculateCenterPosition,
  checkClipboardPermission,
} from '@/lib/clipboard-utils';
import { toast } from 'sonner';

type ActiveSection = 'header' | 'page' | 'footer';

export const HEADER_HEIGHT = 100;
export const FOOTER_HEIGHT = 80;

interface UsePrintClipboardProps {
  isOpen: boolean;
  currentPage: Page;
  selectedElementId: string | null;
  isEditingElementId: string | null;
  onAddImage: (
    element: ImageElement,
    section: ActiveSection
  ) => void;
  activeSection: ActiveSection;
  pageSize: { width: number; height: number };
}

/**
 * Hook for handling clipboard paste events in print preview modal
 * Automatically inserts pasted images as canvas elements
 */
export const usePrintClipboard = ({
  isOpen,
  currentPage,
  selectedElementId,
  isEditingElementId,
  onAddImage,
  activeSection,
  pageSize,
}: UsePrintClipboardProps) => {
  useEffect(() => {
    if (!isOpen || isEditingElementId) {
      return;
    }

    const handlePaste = async (e: ClipboardEvent) => {
      // Don't intercept if user is editing text
      if (isEditingElementId) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items || items.length === 0) {
        return;
      }

      // Check if any image items exist
      const hasImages = Array.from(items).some(item =>
        item.type.startsWith('image/')
      );

      if (!hasImages) {
        return;
      }

      e.preventDefault();

      try {
        // Extract images from clipboard event
        const images = await extractImagesFromClipboardEvent(e);

        if (images.length === 0) {
          toast.info('No images found in clipboard');
          return;
        }

        // Get page dimensions based on active section
        let pageWidth = pageSize.width;
        let pageHeight = pageSize.height;

        if (activeSection === 'header') {
          pageHeight = HEADER_HEIGHT;
        } else if (activeSection === 'footer') {
          pageHeight = FOOTER_HEIGHT;
        }

        // Insert each pasted image as a new canvas element
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          const originalWidth = image.width || 300;
          const originalHeight = image.height || 300;

          // Calculate dimensions to fit within page
          const { width, height } = calculateImageDimensions(
            originalWidth,
            originalHeight,
            pageWidth,
            pageHeight
          );

          // Calculate position (offset subsequent images to avoid overlap)
          const basePosition = calculateCenterPosition(pageWidth, pageHeight, width, height);
          const offsetX = (i * 20) % Math.max(0, pageWidth - width);
          const offsetY = (i * 20) % Math.max(0, pageHeight - height);

          const imageElement: ImageElement = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'image',
            src: image.src,
            x: basePosition.x + offsetX,
            y: basePosition.y + offsetY,
            width,
            height,
            name: `Pasted Image ${i + 1}`,
          };

          // Add image to active section
          onAddImage(imageElement, activeSection);
        }

        toast.success(`Added ${images.length} image${images.length > 1 ? 's' : ''}`);
      } catch (error) {
        console.error('Failed to paste image:', error);
        toast.error('Failed to paste image. Please try again.');
      }
    };

    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [isOpen, isEditingElementId, currentPage, onAddImage, activeSection, pageSize]);
};
