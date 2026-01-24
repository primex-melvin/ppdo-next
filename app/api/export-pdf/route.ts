// app/api/export-pdf/route.ts
// API endpoint for server-side PDF export via Puppeteer

import { NextRequest, NextResponse } from 'next/server';
import { generatePDFFromUrl, generatePDFFromHTML, cleanupPDFExporter } from '../../../lib/pdf-exporter';

/**
 * POST /api/export-pdf
 * 
 * Accepts:
 * {
 *   "mode": "url" | "html",  // "url" to render from URL, "html" to render HTML string
 *   "url": "http://...",      // Required if mode=url
 *   "html": "<html>...",      // Required if mode=html
 *   "filename": "document.pdf",
 *   "scale": 2,               // Device scale factor (1-3); higher = more detail
 *   "waitForSelector": "#print-container",
 *   "waitForTimeout": 1000,
 *   "printBackground": true,
 *   "margin": { "top": "0.5in", "right": "0.5in", "bottom": "0.5in", "left": "0.5in" }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      mode = 'url',
      url,
      html,
      filename = 'document.pdf',
      scale = 2,
      waitForSelector,
      waitForTimeout = 500,
      printBackground = true,
      margin,
      pageWidth = '8.27in',
      pageHeight = '11.69in',
      preferCSSPageSize = true,
    } = body;

    // Validate mode and inputs
    if (!mode || !['url', 'html'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Use "url" or "html".' },
        { status: 400 }
      );
    }

    if (mode === 'url' && !url) {
      return NextResponse.json(
        { error: 'URL is required when mode is "url".' },
        { status: 400 }
      );
    }

    if (mode === 'html' && !html) {
      return NextResponse.json(
        { error: 'HTML is required when mode is "html".' },
        { status: 400 }
      );
    }

    let result;

    if (mode === 'url') {
      result = await generatePDFFromUrl({
        url,
        filename,
        scale,
        pageWidth,
        pageHeight,
        waitForSelector,
        waitForTimeout,
        printBackground,
        preferCSSPageSize,
        margin,
      });
    } else {
      result = await generatePDFFromHTML(html, {
        filename,
        scale,
        pageWidth,
        pageHeight,
        waitForSelector,
        waitForTimeout,
        printBackground,
        preferCSSPageSize,
        margin,
      });
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'PDF generation failed.' },
        { status: 500 }
      );
    }

    // Return PDF as binary with proper headers
    return new NextResponse(result.buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Generation-Time': `${result.duration}ms`,
      },
    });
  } catch (error) {
    console.error('API Error:', error);

    // Cleanup on error
    await cleanupPDFExporter();

    return NextResponse.json(
      { error: 'Internal server error during PDF generation.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/export-pdf
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'PDF Exporter API is running. Use POST with mode, url or html.',
    example: {
      method: 'POST',
      url: 'mode=url&url=http://localhost:3000/print-preview',
      html: 'mode=html&html=<html>...</html>',
    },
  });
}
