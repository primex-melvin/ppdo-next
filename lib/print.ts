// lib/print.ts

import { Page, CanvasElement } from '@/app/dashboard/canvas/_components/editor/types';

const PAGE_SIZES: Record<string, { width: number; height: number; widthInch: number; heightInch: number }> = {
  A4: { width: 595, height: 842, widthInch: 8.27, heightInch: 11.69 },
  Short: { width: 612, height: 792, widthInch: 8.5, heightInch: 11 },
  Long: { width: 612, height: 936, widthInch: 8.5, heightInch: 13 },
};

export function printAllPages(pages: Page[]) {
  // Create print styles if not exists
  let printStyleElement = document.getElementById('canvas-print-styles');
  if (!printStyleElement) {
    printStyleElement = document.createElement('style');
    printStyleElement.id = 'canvas-print-styles';
    printStyleElement.textContent = `
      @media print {
        /* Hide all UI elements */
        body > *:not(#__print-container) {
          display: none !important;
        }
        
        /* Reset body and html for print */
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: auto !important;
          overflow: visible !important;
        }
        
        /* Show and position print container */
        #__print-container {
          display: block !important;
          position: static !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          visibility: visible !important;
        }
        
        /* Ensure all children are visible */
        #__print-container * {
          visibility: visible !important;
        }
        
        /* Page styling */
        .print-page {
          page-break-after: always !important;
          page-break-inside: avoid !important;
          break-after: page !important;
          break-inside: avoid !important;
          margin: 0 auto !important;
          padding: 0 !important;
          display: block !important;
          position: relative !important;
          overflow: visible !important;
        }
        
        .print-page:last-child {
          page-break-after: auto !important;
          break-after: auto !important;
        }
        
        /* Ensure images print correctly */
        .print-page img {
          display: block !important;
          max-width: 100% !important;
          height: auto !important;
          page-break-inside: avoid !important;
        }
        
        /* Ensure text elements print correctly */
        .print-page div[data-element-type="text"] {
          display: block !important;
        }
        
        /* Remove page margins */
        @page {
          margin: 0;
          size: auto;
        }
      }
    `;
    document.head.appendChild(printStyleElement);
  }

  // Remove existing print container if any
  const existingContainer = document.getElementById('__print-container');
  if (existingContainer) {
    document.body.removeChild(existingContainer);
  }

  // Create a print container
  const printContainer = document.createElement('div');
  printContainer.id = '__print-container';
  printContainer.style.cssText = `
    position: fixed;
    left: -99999px;
    top: 0;
    width: 100%;
    z-index: -1;
    pointer-events: none;
  `;

  // Render all pages
  pages.forEach((page, pageIndex) => {
    const pageSize = PAGE_SIZES[page.size] || PAGE_SIZES.A4;

    // Create page wrapper
    const pageDiv = document.createElement('div');
    pageDiv.className = 'print-page';
    pageDiv.style.cssText = `
      width: ${pageSize.width}px;
      height: ${pageSize.height}px;
      position: relative;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      overflow: hidden;
    `;

    // Render all elements (text and images) - skip hidden elements
    page.elements.forEach((element: CanvasElement) => {
      // Skip hidden elements when printing
      if (element.visible === false) return;
      
      if (element.type === 'text') {
        const textDiv = document.createElement('div');
        textDiv.setAttribute('data-element-type', 'text');
        textDiv.setAttribute('data-element-id', element.id);
        
        textDiv.style.cssText = `
          position: absolute;
          left: ${element.x}px;
          top: ${element.y}px;
          width: ${element.width}px;
          min-height: ${element.height}px;
          font-size: ${element.fontSize}px;
          font-weight: ${element.bold ? '700' : '400'};
          font-style: ${element.italic ? 'italic' : 'normal'};
          text-decoration: ${element.underline ? 'underline' : 'none'};
          color: ${element.color};
          overflow: hidden;
          word-wrap: break-word;
          white-space: pre-wrap;
          text-shadow: ${element.shadow ? '2px 2px 4px rgba(0,0,0,0.3)' : 'none'};
          -webkit-text-stroke: ${element.outline ? '0.5px rgba(0,0,0,0.5)' : 'none'};
          padding: 0;
          margin: 0;
          box-sizing: border-box;
          line-height: normal;
        `;

        // Handle Google Fonts
        const googleFonts = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat'];
        if (googleFonts.includes(element.fontFamily)) {
          textDiv.style.fontFamily = `'${element.fontFamily}', sans-serif`;
        } else if (element.fontFamily === 'font-serif') {
          textDiv.style.fontFamily = 'Georgia, serif';
        } else if (element.fontFamily === 'font-mono') {
          textDiv.style.fontFamily = 'monospace';
        } else {
          textDiv.style.fontFamily = 'sans-serif';
        }

        textDiv.textContent = element.text;
        pageDiv.appendChild(textDiv);
      } else if (element.type === 'image') {
        const imgDiv = document.createElement('img');
        imgDiv.src = element.src;
        imgDiv.alt = element.name || 'Image';
        imgDiv.setAttribute('data-element-type', 'image');
        imgDiv.setAttribute('data-element-id', element.id);
        
        imgDiv.style.cssText = `
          position: absolute;
          left: ${element.x}px;
          top: ${element.y}px;
          width: ${element.width}px;
          height: ${element.height}px;
          object-fit: contain;
          display: block;
          margin: 0;
          padding: 0;
        `;
        
        pageDiv.appendChild(imgDiv);
      }
    });

    printContainer.appendChild(pageDiv);
  });

  document.body.appendChild(printContainer);

  // Wait for images and fonts to load, then print
  const images = printContainer.querySelectorAll('img');
  const imagePromises = Array.from(images).map((img) => {
    return new Promise((resolve) => {
      if (img.complete) {
        resolve(true);
      } else {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        // Timeout after 5 seconds
        setTimeout(() => resolve(false), 5000);
      }
    });
  });

  Promise.all(imagePromises).then(() => {
    
    // Small delay to ensure rendering is complete
    setTimeout(() => {
      window.print();
      
      // Clean up after print dialog closes
      const cleanup = () => {
        const container = document.getElementById('__print-container');
        if (container && document.body.contains(container)) {
          document.body.removeChild(container);
        }
      };
      
      // Listen for after print event
      const afterPrintHandler = () => {
        cleanup();
        window.removeEventListener('afterprint', afterPrintHandler);
      };
      window.addEventListener('afterprint', afterPrintHandler);
      
      // Fallback cleanup after a delay
      setTimeout(cleanup, 2000);
    }, 500);
  });
}