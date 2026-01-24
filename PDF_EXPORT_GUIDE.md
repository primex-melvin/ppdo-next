# PDF Export Guide — Server-Side Puppeteer HD Generator

## Overview

The scaffolded **server-side Puppeteer PDF exporter** renders pages and documents in headless Chromium to produce crystal-clear, print-ready PDFs with:
- **Vector text** (fonts render as outlines, not rasterized)
- **High DPI raster** (2x device scale = ~192 DPI)
- **Consistent output** (independent of client printer settings)
- **Complex layouts** (full CSS/JavaScript support)

## Architecture

### Files Created

| File | Purpose |
|------|---------|
| **`lib/pdf-exporter.ts`** | Core Puppeteer logic; server-side rendering and PDF generation |
| **`app/api/export-pdf/route.ts`** | Next.js API endpoint; accepts URL or HTML and returns PDF |
| **`lib/pdf-client.ts`** | Client-side helpers for invoking the exporter from React components |

### How It Works

```
User clicks "Export PDF" 
        ↓
React component calls lib/pdf-client.ts (e.g., exportPDFFromUrl)
        ↓
POST /api/export-pdf with render mode + URL or HTML
        ↓
Next.js API handler spins up Puppeteer browser
        ↓
Puppeteer navigates to URL or renders HTML
        ↓
Waits for images, fonts, dynamic content to load
        ↓
Calls page.pdf() with device scale + print settings
        ↓
Returns PDF buffer as binary response
        ↓
Browser downloads PDF to user
```

## Installation

### 1. Install Puppeteer

```bash
npm install puppeteer
```

This installs Puppeteer and downloads a compatible Chromium browser (~300-400MB).

**For production/serverless**: Use `puppeteer-extra` with plugin for lighter builds (optional).

### 2. Verify the Files

Ensure these files exist:
- `lib/pdf-exporter.ts` ✓
- `app/api/export-pdf/route.ts` ✓
- `lib/pdf-client.ts` ✓

## Usage

### Basic Example: Export Current Page

```typescript
// In a React component
import { exportCurrentPageAsPDF } from '@/lib/pdf-client';

export default function PrintButton() {
  const handleExport = async () => {
    try {
      await exportCurrentPageAsPDF('my-document.pdf', {
        scale: 2, // 2x DPI (default)
        waitForSelector: '#print-container',
        waitForTimeout: 500,
      });
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return <button onClick={handleExport}>Export to PDF</button>;
}
```

### Advanced Example: Export with Custom Options

```typescript
import { exportPDFFromUrl } from '@/lib/pdf-client';

// Export a specific page with margins and scale
await exportPDFFromUrl(
  'http://localhost:3000/dashboard/report',
  'report.pdf',
  {
    scale: 2, // ~192 DPI
    waitForSelector: '.report-content', // Wait for this element
    waitForTimeout: 1000, // Extra 1s for animations
    printBackground: true, // Include background colors
    margin: {
      top: '0.5in',
      right: '0.75in',
      bottom: '0.5in',
      left: '0.75in',
    },
  }
);
```

### Export HTML Content

```typescript
import { exportPDFFromHTML } from '@/lib/pdf-client';

const htmlContent = `
  <html>
    <head>
      <style>
        @page { size: A4; margin: 0.5in; }
        body { font-family: Arial, sans-serif; }
        h1 { color: #333; }
      </style>
    </head>
    <body>
      <h1>My Report</h1>
      <p>Generated content here...</p>
    </body>
  </html>
`;

await exportPDFFromHTML(htmlContent, 'report.pdf', {
  scale: 2,
  printBackground: true,
});
```

### Export DOM Element

```typescript
import { exportElementAsPDF } from '@/lib/pdf-client';

// Export just the chart container
await exportElementAsPDF(
  '#chart-container',
  'chart.pdf',
  {
    scale: 2,
    margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
  }
);
```

## API Reference

### `POST /api/export-pdf`

**Request Body (JSON)**:

```json
{
  "mode": "url",
  "url": "http://localhost:3000/print-preview",
  "filename": "document.pdf",
  "scale": 2,
  "waitForSelector": "#print-container",
  "waitForTimeout": 500,
  "printBackground": true,
  "pageWidth": "8.27in",
  "pageHeight": "11.69in",
  "margin": {
    "top": "0.5in",
    "right": "0.5in",
    "bottom": "0.5in",
    "left": "0.5in"
  },
  "preferCSSPageSize": true
}
```

**Response** (on success):
- **Content-Type**: `application/pdf`
- **Body**: PDF binary file
- **Headers**:
  - `Content-Disposition`: `attachment; filename="document.pdf"`
  - `X-Generation-Time`: Time taken to generate PDF (milliseconds)

**Response** (on error):
```json
{
  "error": "URL is required when mode is 'url'."
}
```

## Configuration & Tuning

### Device Scale Factor (DPI)

| Scale | Approx. DPI | Use Case |
|-------|-------------|----------|
| 1 | 96 | Screen preview |
| 1.5 | 144 | Documents, dashboards |
| 2 | 192 | High-quality print (default) |
| 3+ | 288+ | Photo/art, very high quality |

```typescript
// Higher scale = sharper output, larger file size
await exportCurrentPageAsPDF('doc.pdf', { scale: 3 });
```

### Page Sizes

Common page dimensions:
- **A4**: `8.27in × 11.69in` (default)
- **Letter**: `8.5in × 11in`
- **Legal**: `8.5in × 14in`
- **A3**: `11.69in × 16.54in`

```typescript
await exportPDFFromUrl(url, 'doc.pdf', {
  pageWidth: '8.5in',
  pageHeight: '11in', // US Letter
});
```

### Wait Conditions

```typescript
// Wait for a specific element to render
await exportCurrentPageAsPDF('doc.pdf', {
  waitForSelector: '.data-loaded', // CSS selector
  waitForTimeout: 2000, // Extra 2 seconds
});
```

Use `waitForSelector` for dynamic content (charts, tables loaded via JS).

## Performance & Best Practices

### Memory & Startup

- **First call**: ~1-2s (browser startup, Chrome launch)
- **Subsequent calls**: ~0.3-0.5s (browser reused, warm)
- **Memory**: ~150-200MB for browser instance

**Tip**: The exporter reuses a global browser instance. Don't close it between exports.

### Avoiding Common Issues

#### ❌ Images not loading?
```typescript
// Add waitForTimeout to let images download
await exportCurrentPageAsPDF('doc.pdf', {
  waitForTimeout: 2000, // Adjust as needed
});
```

#### ❌ Text looks blurry?
```typescript
// Increase device scale
await exportCurrentPageAsPDF('doc.pdf', {
  scale: 3, // Try 3 for crystal-clear text
});
```

#### ❌ Background colors not printing?
```typescript
// Ensure printBackground is true
await exportCurrentPageAsPDF('doc.pdf', {
  printBackground: true, // Default, but explicit is good
});
```

#### ❌ Fonts not embedding?
Ensure fonts are loaded via:
- CSS `@import url('...')`  or `@font-face`
- Network fully idle (Puppeteer waits for this by default)

## Integration with Existing Print Logic

The new Puppeteer exporter **complements** (not replaces) `lib/print.ts`. Use:

- **`lib/print.ts`**: Client-side `window.print()` for quick in-browser printing
- **`lib/pdf-exporter.ts`**: Server-side for consistent, HD, downloadable PDFs

Example: Offer both options to users:

```typescript
export default function ExportMenu() {
  return (
    <div>
      <button onClick={() => window.print()}>
        📄 Print to Printer (Client)
      </button>
      <button onClick={() => exportCurrentPageAsPDF('doc.pdf', { scale: 2 })}>
        📥 Download HD PDF (Server)
      </button>
    </div>
  );
}
```

## Troubleshooting

### "Timeout waiting for target page to load"
- **Cause**: Page takes >30s to load
- **Fix**: Increase `waitUntil` timeout in `pdf-exporter.ts` or optimize page load

### "Page did not produce any output"
- **Cause**: Content is hidden (e.g., `display: none`)
- **Fix**: Ensure print styles don't hide content; check `@media print` rules

### Puppeteer crashes on production/Docker
- **Cause**: Missing dependencies
- **Fix**: Install system deps in Dockerfile:
  ```bash
  apt-get install -y chromium-browser libxss1 libappindicator1 libindicator7
  # or use puppeteer-extra for lighter builds
  ```

### Large file sizes
- **Cause**: High scale factor + embedded images
- **Fix**: Use `scale: 1.5` for most use cases; optimize images before export

## Next Steps

1. **Install Puppeteer**: `npm install puppeteer`
2. **Test the API**: `curl http://localhost:3000/api/export-pdf`  (should return JSON info)
3. **Add export button** to your print preview component:
   ```typescript
   import { exportCurrentPageAsPDF } from '@/lib/pdf-client';
   
   <button onClick={() => exportCurrentPageAsPDF('report.pdf', { scale: 2 })}>
     Export HD PDF
   </button>
   ```
4. **Monitor**: Check browser console and server logs for errors
5. **Iterate**: Adjust scale, margins, and wait conditions based on output

## Optional Enhancements

- **Caching**: Cache rendered PDFs by URL hash (Redis, in-memory)
- **Rate limiting**: Add API throttling to prevent abuse
- **Watermarking**: Inject text/images during render for branding
- **Multi-page**: Render multiple URLs into a single PDF (combine page.pdf() calls)
- **HTML-to-SVG**: Convert vector shapes before Puppeteer for true vector PDFs

---

**Status**: ✅ Server-side Puppeteer scaffold complete. Ready to integrate with print preview UI.
