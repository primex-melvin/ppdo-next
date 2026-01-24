// lib/canvas-utils.ts (CLIENT-SIDE ONLY - Fixed SSR error)

import { Page, HeaderFooter, CanvasElement } from '@/app/(extra)/canvas/_components/editor/types';
import { CanvasTemplate } from '@/app/(extra)/canvas/_components/editor/types/template';

/**
 * Dynamically import dom-to-image-more only on client side
 */
async function getDomToImage() {
  if (typeof window === 'undefined') {
    throw new Error('dom-to-image-more can only be used in the browser');
  }
  const domtoimage = await import('dom-to-image-more');
  return domtoimage.default;
}

/**
 * Capture canvas as thumbnail using dom-to-image-more (more reliable)
 * Falls back to manual canvas rendering if DOM capture fails
 */
export async function captureCanvasAsThumbnail(
  containerId: string,
  width: number = 300,
  height: number = 400
): Promise<string> {
  // Ensure we're in browser environment
  if (typeof window === 'undefined') {
    console.warn('captureCanvasAsThumbnail called on server side');
    return generatePlaceholderThumbnail(width, height);
  }

  console.group('📸 THUMBNAIL CAPTURE');
  console.log('Container ID:', containerId);
  console.log('Target size:', width, 'x', height);
  
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('❌ Container not found');
    console.groupEnd();
    return generatePlaceholderThumbnail(width, height);
  }

  try {
    console.log('✅ Container found, attempting dom-to-image capture...');
    
    // Dynamically import dom-to-image-more
    const domtoimage = await getDomToImage();
    
    // Use dom-to-image-more for better CSS support
    const dataUrl = await domtoimage.toPng(container, {
      quality: 0.8,
      width: container.offsetWidth,
      height: container.offsetHeight,
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left',
      },
      filter: (node: Node) => {
        // Filter out elements that might cause issues
        // Check if node is an HTMLElement before accessing classList
        if (node instanceof HTMLElement && node.classList?.contains('no-capture')) {
          return false;
        }
        return true;
      },
    });

    console.log('✅ Image captured, resizing to thumbnail...');

    // Resize to thumbnail dimensions
    const thumbnail = await resizeImage(dataUrl, width, height);
    
    console.log('✅ Thumbnail created successfully');
    console.groupEnd();
    
    return thumbnail;
  } catch (error) {
    console.warn('⚠️ dom-to-image failed, trying fallback method...', error);
    
    try {
      // Fallback: Manual canvas rendering
      const thumbnail = await manualCanvasCapture(container, width, height);
      console.log('✅ Fallback thumbnail created');
      console.groupEnd();
      return thumbnail;
    } catch (fallbackError) {
      console.error('❌ All capture methods failed:', fallbackError);
      console.groupEnd();
      return generatePlaceholderThumbnail(width, height);
    }
  }
}

/**
 * Resize image to thumbnail size while maintaining aspect ratio
 */
async function resizeImage(
  dataUrl: string,
  targetWidth: number,
  targetHeight: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Set canvas size
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Calculate scaling to fit within target size
      const scale = Math.min(
        targetWidth / img.width,
        targetHeight / img.height
      );
      
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      
      // Center the image
      const x = (targetWidth - scaledWidth) / 2;
      const y = (targetHeight - scaledHeight) / 2;

      // Fill background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      
      // Draw image
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      
      // Convert to data URL
      resolve(canvas.toDataURL('image/png', 0.85));
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

/**
 * Manual canvas capture as fallback
 * Renders template elements directly to canvas
 */
async function manualCanvasCapture(
  container: HTMLElement,
  width: number,
  height: number
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Get container dimensions
  const rect = container.getBoundingClientRect();
  const scale = Math.min(width / rect.width, height / rect.height);
  
  canvas.width = width;
  canvas.height = height;

  // Fill white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Draw a border
  ctx.strokeStyle = '#e4e4e7';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // Get all canvas elements from the container
  const canvasElements = container.querySelectorAll('[data-element-type]');
  
  for (const element of Array.from(canvasElements)) {
    const el = element as HTMLElement;
    const type = el.getAttribute('data-element-type');
    
    if (type === 'text') {
      await drawTextElement(ctx, el, scale);
    } else if (type === 'image') {
      await drawImageElement(ctx, el, scale);
    }
  }

  return canvas.toDataURL('image/png', 0.85);
}

/**
 * Draw text element on canvas
 */
async function drawTextElement(
  ctx: CanvasRenderingContext2D,
  element: HTMLElement,
  scale: number
): Promise<void> {
  const rect = element.getBoundingClientRect();
  const computed = window.getComputedStyle(element);
  
  const x = rect.left * scale;
  const y = rect.top * scale;
  const text = element.textContent || '';
  
  ctx.save();
  
  // Set text properties
  ctx.font = `${computed.fontWeight} ${parseInt(computed.fontSize) * scale}px ${computed.fontFamily}`;
  ctx.fillStyle = computed.color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  // Draw text
  ctx.fillText(text, x, y);
  
  ctx.restore();
}

/**
 * Draw image element on canvas
 */
async function drawImageElement(
  ctx: CanvasRenderingContext2D,
  element: HTMLElement,
  scale: number
): Promise<void> {
  const img = element.querySelector('img');
  if (!img || !img.complete) return;
  
  const rect = element.getBoundingClientRect();
  
  ctx.save();
  
  ctx.drawImage(
    img,
    rect.left * scale,
    rect.top * scale,
    rect.width * scale,
    rect.height * scale
  );
  
  ctx.restore();
}

/**
 * Generate a high-quality placeholder thumbnail
 */
function generatePlaceholderThumbnail(width: number, height: number): string {
  // Check if we're in browser
  if (typeof window === 'undefined') {
    // Return a tiny base64 PNG for SSR
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }

  console.log('🎨 Generating placeholder thumbnail');
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }

  // Draw modern gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#6366f1');
  gradient.addColorStop(1, '#8b5cf6');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add subtle pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i < width; i += 20) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, height);
    ctx.stroke();
  }
  for (let i = 0; i < height; i += 20) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(width, i);
    ctx.stroke();
  }

  // Draw border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 3;
  ctx.strokeRect(3, 3, width - 6, height - 6);

  // Draw icon
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 72px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('📄', width / 2, height / 2 - 30);

  // Draw label
  ctx.font = '600 18px Arial';
  ctx.fillText('Template', width / 2, height / 2 + 50);

  // Draw subtitle
  ctx.font = '400 12px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText('Preview not available', width / 2, height / 2 + 75);

  return canvas.toDataURL('image/png', 0.9);
}

/**
 * Apply template styling to all pages
 */
export function applyTemplateToPages(
  pages: Page[],
  template: CanvasTemplate
): Page[] {
  return pages.map((page) => {
    const templateElements = template.page.elements.map(el => ({
      ...el,
      id: `template-${template.id}-${el.id}-${page.id}`,
      locked: true,
    }));

    return {
      ...page,
      size: template.page.size,
      orientation: template.page.orientation,
      backgroundColor: template.page.backgroundColor || page.backgroundColor,
      elements: [...templateElements, ...page.elements],
    };
  });
}

/**
 * Remove template elements from page
 */
export function removeTemplateFromPage(page: Page, templateId: string): Page {
  return {
    ...page,
    elements: page.elements.filter(el => 
      !el.id.startsWith(`template-${templateId}`)
    ),
  };
}

/**
 * Remove all template elements from pages
 */
export function removeTemplateFromPages(pages: Page[]): Page[] {
  return pages.map(page => ({
    ...page,
    elements: page.elements.filter(el => !el.id.includes('template-')),
  }));
}

/**
 * Check if page has template elements
 */
export function pageHasTemplate(page: Page): boolean {
  return page.elements.some(el => el.id.includes('template-'));
}

/**
 * Get template ID from page elements
 */
export function getPageTemplateId(page: Page): string | null {
  const templateElement = page.elements.find(el => el.id.includes('template-'));
  if (!templateElement) return null;
  
  const match = templateElement.id.match(/template-([^-]+)/);
  return match ? match[1] : null;
}

/**
 * Validate template structure with comprehensive checks
 */
export function validateTemplate(template: CanvasTemplate): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!template.name || template.name.trim().length === 0) {
    errors.push('Template name is required');
  }

  if (template.name && template.name.length > 50) {
    errors.push('Template name must be 50 characters or less');
  }

  if (!template.page?.size) {
    errors.push('Page size is required');
  }

  if (!template.page?.orientation) {
    errors.push('Page orientation is required');
  }

  // Warnings for missing optional content
  if (!template.thumbnail || template.thumbnail.length === 0) {
    warnings.push('Template has no thumbnail - placeholder will be used');
  }

  const hasContent =
    (template.header?.elements?.length || 0) > 0 ||
    (template.footer?.elements?.length || 0) > 0 ||
    (template.page?.elements?.length || 0) > 0;

  if (!hasContent) {
    warnings.push('Template has no elements');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Safely load and normalize template data
 */
export function safeLoadTemplate(template: CanvasTemplate): CanvasTemplate {
  try {
    // Deep clone and normalize
    const normalized: CanvasTemplate = {
      id: template.id || `template-${Date.now()}`,
      name: template.name || 'Untitled Template',
      description: template.description,
      thumbnail: template.thumbnail || generatePlaceholderThumbnail(300, 400),
      createdAt: template.createdAt || Date.now(),
      updatedAt: template.updatedAt || Date.now(),
      header: {
        elements: Array.isArray(template.header?.elements) ? template.header.elements : [],
        backgroundColor: template.header?.backgroundColor || '#ffffff',
      },
      footer: {
        elements: Array.isArray(template.footer?.elements) ? template.footer.elements : [],
        backgroundColor: template.footer?.backgroundColor || '#ffffff',
      },
      page: {
        size: template.page?.size || 'A4',
        orientation: template.page?.orientation || 'portrait',
        backgroundColor: template.page?.backgroundColor || '#ffffff',
        elements: Array.isArray(template.page?.elements) ? template.page.elements : [],
      },
      category: template.category || 'custom',
      isDefault: template.isDefault || false,
      tags: Array.isArray(template.tags) ? template.tags : [],
    };

    return normalized;
  } catch (error) {
    console.error('Failed to normalize template:', error);
    throw new Error('Template data is corrupted and cannot be loaded');
  }
}