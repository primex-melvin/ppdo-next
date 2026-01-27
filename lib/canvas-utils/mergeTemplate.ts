// lib/canvas-utils/mergeTemplate.ts

import { Page, HeaderFooter } from '@/app/(extra)/canvas/_components/editor/types';
import { CanvasTemplate } from '@/app/(extra)/canvas/_components/editor/types/template';

/**
 * Merges a template's styling with existing canvas pages
 * This preserves all existing content while applying template styling
 * Similar to applying a theme in Google Docs or PowerPoint
 */
export function mergeTemplateWithCanvas(
  existingPages: Page[],
  existingHeader: HeaderFooter,
  existingFooter: HeaderFooter,
  template: CanvasTemplate
): {
  pages: Page[];
  header: HeaderFooter;
  footer: HeaderFooter;
} {
  console.group('🎨 MERGING TEMPLATE WITH EXISTING CANVAS');
  console.log('Template:', template.name);
  console.log('Existing pages:', existingPages.length);
  console.log('Template page background:', template.page.backgroundColor);

  // Merge pages - apply template background and keep all elements
  const mergedPages: Page[] = existingPages.map((page) => {
    console.log(`📄 Merging page ${page.id}`);
    console.log(`  - Original background: ${page.backgroundColor}`);
    console.log(`  - Template background: ${template.page.backgroundColor}`);
    console.log(`  - Keeping ${page.elements.length} existing elements`);

    return {
      ...page,
      backgroundColor: template.page.backgroundColor || page.backgroundColor,
      // Keep all existing page elements - don't overwrite user content
      elements: page.elements,
    };
  });

  // Merge header - combine template elements with existing elements
  const mergedHeader: HeaderFooter = {
    elements: [
      // Add template header elements first (if header exists)
      ...(template.header?.elements || []).map((el) => ({
        ...el,
        // Generate new IDs to avoid conflicts
        id: `template-header-${el.id}-${Date.now()}`,
      })),
      // Keep existing header elements
      ...existingHeader.elements,
    ],
    backgroundColor: template.header?.backgroundColor || existingHeader.backgroundColor || '#ffffff',
  };

  console.log(`📋 Header merged: ${template.header?.elements?.length || 0} template + ${existingHeader.elements.length} existing = ${mergedHeader.elements.length} total`);

  // Merge footer - combine template elements with existing elements
  const mergedFooter: HeaderFooter = {
    elements: [
      // Add template footer elements first (if footer exists)
      ...(template.footer?.elements || []).map((el) => ({
        ...el,
        // Generate new IDs to avoid conflicts
        id: `template-footer-${el.id}-${Date.now()}`,
      })),
      // Keep existing footer elements
      ...existingFooter.elements,
    ],
    backgroundColor: template.footer?.backgroundColor || existingFooter.backgroundColor || '#ffffff',
  };

  console.log(`📋 Footer merged: ${template.footer?.elements?.length || 0} template + ${existingFooter.elements.length} existing = ${mergedFooter.elements.length} total`);

  console.log('✅ Template merge complete');
  console.groupEnd();

  return {
    pages: mergedPages,
    header: mergedHeader,
    footer: mergedFooter,
  };
}
