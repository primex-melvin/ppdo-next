// lib/pdf-exporter.ts
// Server-side PDF exporter using Puppeteer for HD/crystal-clear output

import puppeteer, { Browser, Page } from 'puppeteer';

export interface PDFExportOptions {
  url: string;
  filename?: string;
  scale?: number; // Device scale factor (1-2+); higher = more detail/larger file
  pageWidth?: string; // CSS width (e.g., '8.5in', '210mm')
  pageHeight?: string; // CSS height (e.g., '11in', '297mm')
  waitForSelector?: string; // CSS selector to wait for before rendering
  waitForTimeout?: number; // milliseconds to wait
  printBackground?: boolean; // Include background colors/images
  displayHeaderFooter?: boolean; // Show header/footer if page defines them
  margin?: {
    top?: string | number;
    right?: string | number;
    bottom?: string | number;
    left?: string | number;
  };
  preferCSSPageSize?: boolean; // Use @page CSS size
}

export interface PDFExportResult {
  success: boolean;
  buffer?: Buffer;
  error?: string;
  duration?: number;
}

// Global browser instance (reused across calls for efficiency)
let globalBrowser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (globalBrowser && globalBrowser.isConnected()) {
    return globalBrowser;
  }

  // Launch Puppeteer with optimizations for PDF rendering
  globalBrowser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // Reduce memory usage
      '--disable-gpu', // Disable GPU for server environments
      '--disable-software-rasterizer',
    ],
  });

  return globalBrowser;
}

export async function closeBrowser(): Promise<void> {
  if (globalBrowser) {
    await globalBrowser.close();
    globalBrowser = null;
  }
}

export async function generatePDFFromUrl(
  options: PDFExportOptions
): Promise<PDFExportResult> {
  const startTime = Date.now();
  let page: Page | null = null;

  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    // Set viewport with device scale factor for high-quality rendering
    const scale = options.scale || 2; // Default to 2x DPI (~192 DPI)
    await page.setViewport({
      width: 1280,
      height: 1024,
      deviceScaleFactor: scale,
    });

    // Navigate to URL with full network idle
    await page.goto(options.url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait for specific element if provided (e.g., print preview container)
    if (options.waitForSelector) {
      await page.waitForSelector(options.waitForSelector, { timeout: 10000 });
    }

    // Additional wait time for animations/lazy loading
    if (options.waitForTimeout) {
      await new Promise((resolve) => setTimeout(resolve, options.waitForTimeout));
    }

    // Hide scrollbars and UI elements not needed in print
    await page.evaluate(() => {
      document.body.style.overflow = 'visible';
      // Hide any fixed positioning elements
      const fixedElements = document.querySelectorAll('[style*="fixed"]');
      fixedElements.forEach((el) => {
        (el as HTMLElement).style.display = 'none';
      });
    });

    // Generate PDF with optimized settings for clarity
    const pdfBuffer = await page.pdf({
      // Use physical page size if provided, else A4
      format: 'A4',
      width: options.pageWidth || '8.27in',
      height: options.pageHeight || '11.69in',
      
      // Margins (in inches or mm)
      margin: {
        top: options.margin?.top ?? '0.5in',
        right: options.margin?.right ?? '0.5in',
        bottom: options.margin?.bottom ?? '0.5in',
        left: options.margin?.left ?? '0.5in',
      },
      
      // Quality settings
      printBackground: options.printBackground !== false,
      preferCSSPageSize: options.preferCSSPageSize !== false,
      displayHeaderFooter: options.displayHeaderFooter === true,
      
      // Landscape/portrait determined by CSS @page rule or page dimensions
      landscape: false,
      
      // Scale (1 = 96 DPI, higher values increase quality at cost of file size)
      scale: 1.5, // ~144 DPI; can increase to 2 for 192 DPI if needed
    });

    const duration = Date.now() - startTime;

    return {
      success: true,
      buffer: pdfBuffer,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('PDF Export Error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration,
    };
  } finally {
    // Close page but keep browser alive for reuse
    if (page) {
      await page.close();
    }
  }
}

export async function generatePDFFromHTML(
  html: string,
  options: Omit<PDFExportOptions, 'url'>
): Promise<PDFExportResult> {
  const startTime = Date.now();
  let page: Page | null = null;

  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    const scale = options.scale || 2;
    await page.setViewport({
      width: 1280,
      height: 1024,
      deviceScaleFactor: scale,
    });

    // Set HTML content directly
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait for specific element if provided
    if (options.waitForSelector) {
      await page.waitForSelector(options.waitForSelector, { timeout: 10000 });
    }

    if (options.waitForTimeout) {
      await new Promise((resolve) => setTimeout(resolve, options.waitForTimeout));
    }

    const pdfBuffer = await page.pdf({
      format: 'A4',
      width: options.pageWidth || '8.27in',
      height: options.pageHeight || '11.69in',
      margin: {
        top: options.margin?.top ?? '0.5in',
        right: options.margin?.right ?? '0.5in',
        bottom: options.margin?.bottom ?? '0.5in',
        left: options.margin?.left ?? '0.5in',
      },
      printBackground: options.printBackground !== false,
      preferCSSPageSize: options.preferCSSPageSize !== false,
      displayHeaderFooter: options.displayHeaderFooter === true,
      landscape: false,
      scale: 1.5,
    });

    const duration = Date.now() - startTime;

    return {
      success: true,
      buffer: pdfBuffer,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('PDF Export Error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration,
    };
  } finally {
    if (page) {
      await page.close();
    }
  }
}

// Graceful shutdown hook (call on app termination)
export async function cleanupPDFExporter(): Promise<void> {
  await closeBrowser();
}
