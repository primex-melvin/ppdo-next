// lib/pdf-client.ts
// Client-side helper to call the server-side PDF exporter

export interface ClientPDFExportOptions {
  mode: 'url' | 'html';
  url?: string;
  html?: string;
  filename?: string;
  scale?: number;
  waitForSelector?: string;
  waitForTimeout?: number;
  printBackground?: boolean;
  margin?: {
    top?: string | number;
    right?: string | number;
    bottom?: string | number;
    left?: string | number;
  };
}

/**
 * Export PDF from a URL (renders server-side with Puppeteer)
 */
export async function exportPDFFromUrl(
  url: string,
  filename: string = 'document.pdf',
  options: Partial<ClientPDFExportOptions> = {}
): Promise<void> {
  try {
    const response = await fetch('/api/export-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'url',
        url,
        filename,
        scale: options.scale ?? 2,
        waitForSelector: options.waitForSelector,
        waitForTimeout: options.waitForTimeout ?? 500,
        printBackground: options.printBackground ?? true,
        margin: options.margin,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate PDF');
    }

    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/);
    const downloadFilename = filenameMatch ? filenameMatch[1] : filename;

    // Get generation time for debugging
    const generationTime = response.headers.get('X-Generation-Time');
    if (generationTime) {
      console.log(`PDF generated in ${generationTime}`);
    }

    // Download the PDF
    const blob = await response.blob();
    downloadBlob(blob, downloadFilename);
  } catch (error) {
    console.error('PDF Export Error:', error);
    throw error;
  }
}

/**
 * Export PDF from HTML content (renders server-side)
 */
export async function exportPDFFromHTML(
  html: string,
  filename: string = 'document.pdf',
  options: Partial<ClientPDFExportOptions> = {}
): Promise<void> {
  try {
    const response = await fetch('/api/export-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'html',
        html,
        filename,
        scale: options.scale ?? 2,
        waitForSelector: options.waitForSelector,
        waitForTimeout: options.waitForTimeout ?? 500,
        printBackground: options.printBackground ?? true,
        margin: options.margin,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate PDF');
    }

    const contentDisposition = response.headers.get('Content-Disposition');
    const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/);
    const downloadFilename = filenameMatch ? filenameMatch[1] : filename;

    const generationTime = response.headers.get('X-Generation-Time');
    if (generationTime) {
      console.log(`PDF generated in ${generationTime}`);
    }

    const blob = await response.blob();
    downloadBlob(blob, downloadFilename);
  } catch (error) {
    console.error('PDF Export Error:', error);
    throw error;
  }
}

/**
 * Export current page (via window.location.href) as PDF
 */
export async function exportCurrentPageAsPDF(
  filename: string = 'page.pdf',
  options: Partial<ClientPDFExportOptions> = {}
): Promise<void> {
  const currentUrl = window.location.href;
  await exportPDFFromUrl(currentUrl, filename, {
    waitForSelector: options.waitForSelector ?? '#__next', // Default Next.js root
    ...options,
  });
}

/**
 * Helper: trigger browser download of a blob
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export DOM element as PDF (capture HTML and send to server)
 */
export async function exportElementAsPDF(
  elementSelector: string,
  filename: string = 'element.pdf',
  options: Partial<ClientPDFExportOptions> = {}
): Promise<void> {
  const element = document.querySelector(elementSelector);
  if (!element) {
    throw new Error(`Element with selector "${elementSelector}" not found.`);
  }

  // Wrap element in a printable HTML structure
  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @page {
            size: A4;
            margin: 0.5in;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
      </body>
    </html>
  `;

  await exportPDFFromHTML(html, filename, options);
}
