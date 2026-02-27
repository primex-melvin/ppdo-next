// lib/export-wysiwyg-pdf.ts

import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { Page, CanvasElement, HeaderFooter } from '@/app/(extra)/canvas/_components/editor/types';
import { getPageLayoutMetrics } from '@/app/(extra)/canvas/_components/editor/layout';

const PAGE_SIZES: Record<string, { width: number; height: number }> = {
  A4: { width: 595, height: 842 },
  Short: { width: 612, height: 792 },
  Long: { width: 612, height: 936 },
};

// ============================================================================
// TABLE STRUCTURE DETECTION & BORDER RENDERING
// ============================================================================

interface TableStructure {
  columns: { x: number; width: number }[];
  rows: { y: number; height: number }[];
  mergedRows: { y: number; height: number }[];
  tableLeft: number;
  tableTop: number;
  tableWidth: number;
  tableHeight: number;
}

const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

const inferCommonInnerGap = (positions: number[], sizeByPosition: Map<number, number>): number => {
  const gaps: number[] = [];
  for (let i = 0; i < positions.length - 1; i++) {
    const pos = positions[i];
    const next = positions[i + 1];
    const size = sizeByPosition.get(pos) ?? 0;
    const gap = next - pos - size;
    if (gap >= 0) gaps.push(gap);
  }
  if (gaps.length === 0) return 0;
  // Use the minimum positive gap to avoid first-column extra padding skewing the result.
  const positive = gaps.filter(g => g > 0);
  return positive.length > 0 ? Math.min(...positive) : median(gaps);
};

/**
 * Detect table structure from canvas elements
 * Groups elements by groupId and analyzes their layout
 * Only considers visible elements to support column hiding
 */
function detectTableStructure(elements: CanvasElement[]): TableStructure | null {
  const isCategoryElement = (el: CanvasElement): boolean =>
    el.type === 'text' && el.id.startsWith('category-header-');

  // Find visible table elements (filter out hidden columns)
  const tableElements = elements.filter(
    (el) => el.groupId && el.groupName?.toLowerCase().includes('table') && el.visible !== false
  );
  const regularCellElements = tableElements.filter((el) => !isCategoryElement(el));

  if (tableElements.length === 0 || regularCellElements.length === 0) return null;

  // Get unique X positions (columns) and Y positions (rows)
  const uniqueX = Array.from(new Set(regularCellElements.map((el) => el.x))).sort((a, b) => a - b);
  const uniqueY = Array.from(new Set(tableElements.map((el) => el.y))).sort((a, b) => a - b);

  if (uniqueX.length === 0 || uniqueY.length === 0) return null;

  const widthByX = new Map<number, number>();
  const heightByY = new Map<number, number>();

  uniqueX.forEach((x) => {
    const cellsInColumn = regularCellElements.filter((el) => el.x === x);
    if (cellsInColumn.length > 0) widthByX.set(x, cellsInColumn[0].width);
  });
  uniqueY.forEach((y) => {
    const cellsInRow = tableElements.filter((el) => el.y === y);
    if (cellsInRow.length > 0) heightByY.set(y, cellsInRow[0].height);
  });

  // Infer inner padding gap from the generated text-grid layout (converter stores text boxes, not cell rectangles).
  const commonColumnGap = inferCommonInnerGap(uniqueX, widthByX);
  const commonRowGap = inferCommonInnerGap(uniqueY, heightByY);
  const halfColumnGap = commonColumnGap / 2;
  const halfRowGap = commonRowGap / 2;

  // Build column structure as OUTER cell bounds (not text bounds)
  const columns = uniqueX.map((x, index) => {
    const width = widthByX.get(x) ?? 0;
    let left = x - halfColumnGap;

    // First column may include additional left text padding; infer and compensate.
    if (index === 0 && uniqueX.length > 1) {
      const firstGap = uniqueX[1] - x - width;
      const extraLeftPadding = Math.max(0, firstGap - commonColumnGap);
      left -= extraLeftPadding;
    }

    const right = index < uniqueX.length - 1
      ? uniqueX[index + 1] - halfColumnGap
      : x + width + halfColumnGap;

    return { x: left, width: Math.max(0, right - left) };
  });

  // Build row structure from row-start to next-row-start spacing.
  // This avoids false/double horizontal borders for multiline rows where the text
  // box height can be shorter than the actual row height.
  const rows = uniqueY.map((y, index) => {
    const height = heightByY.get(y) ?? 0;
    const top = y;
    const bottom = index < uniqueY.length - 1
      ? uniqueY[index + 1]
      : y + height + halfRowGap;

    return { y: top, height: Math.max(0, bottom - top) };
  });

  const mergedRows = rows.filter((row) =>
    tableElements.some((el) => el.y === row.y && isCategoryElement(el))
  );

  // Calculate table bounds from reconstructed outer cell bounds
  const tableLeft = Math.min(...columns.map((c) => c.x));
  const tableTop = Math.min(...rows.map((r) => r.y));
  const tableRight = Math.max(...columns.map((c) => c.x + c.width));
  const tableBottom = Math.max(...rows.map((r) => r.y + r.height));
  const tableWidth = Math.max(0, tableRight - tableLeft);
  const tableHeight = Math.max(0, tableBottom - tableTop);

  return {
    columns,
    rows,
    mergedRows,
    tableLeft,
    tableTop,
    tableWidth,
    tableHeight,
  };
}

function getMergedIntervals(rows: Array<{ y: number; height: number }>): Array<{ start: number; end: number }> {
  if (rows.length === 0) return [];

  const intervals = rows
    .map((row) => ({ start: row.y, end: row.y + row.height }))
    .sort((a, b) => a.start - b.start);

  const merged: Array<{ start: number; end: number }> = [];
  for (const interval of intervals) {
    const last = merged[merged.length - 1];
    if (!last || interval.start > last.end) {
      merged.push({ ...interval });
    } else {
      last.end = Math.max(last.end, interval.end);
    }
  }

  return merged;
}

function getVerticalLineSegments(
  top: number,
  bottom: number,
  skipIntervals: Array<{ start: number; end: number }>
): Array<{ start: number; end: number }> {
  if (bottom <= top) return [];
  if (skipIntervals.length === 0) return [{ start: top, end: bottom }];

  const segments: Array<{ start: number; end: number }> = [];
  let cursor = top;

  for (const interval of skipIntervals) {
    const skipStart = Math.max(top, interval.start);
    const skipEnd = Math.min(bottom, interval.end);
    if (skipEnd <= skipStart) continue;

    if (skipStart > cursor) {
      segments.push({ start: cursor, end: skipStart });
    }
    cursor = Math.max(cursor, skipEnd);
  }

  if (cursor < bottom) {
    segments.push({ start: cursor, end: bottom });
  }

  return segments.filter((segment) => segment.end > segment.start);
}

/**
 * Create SVG element with table borders
 * Renders Google Docs-style table borders (1px solid black, edge-to-edge)
 *
 * This function is designed to be WYSIWYG - the borders you see in the preview
 * will be exactly what appears in the PDF.
 *
 * @param structure - The detected table structure
 * @param containerWidth - Width of the container
 * @param containerHeight - Height of the container
 * @param borderColor - Color of the border (default: black) - for future colored layouts
 * @param borderWidth - Width of the border in pixels (default: 1)
 */
/**
 * Create an image element with table borders rendered as an inline SVG data URL.
 *
 * IMPORTANT: This returns an <img> element instead of an <svg> element to completely
 * isolate the SVG from the document's CSS cascade. html2canvas cannot parse modern
 * CSS color functions like lab(), oklch(), etc. that may be inherited from parent
 * elements. By converting the SVG to a data URL, we ensure html2canvas treats it
 * as a regular image and doesn't attempt to parse any CSS properties.
 */
function createTableBordersImage(
  structure: TableStructure,
  containerWidth: number,
  containerHeight: number,
  borderColor: string = '#000000',
  borderWidth: number = 1
): HTMLImageElement {
  // Build SVG as a string - completely isolated from document CSS
  const lines: string[] = [];

  // Outer table border (rectangle)
  lines.push(
    `<rect x="${structure.tableLeft}" y="${structure.tableTop}" ` +
    `width="${structure.tableWidth}" height="${structure.tableHeight}" ` +
    `fill="none" stroke="${borderColor}" stroke-width="${borderWidth}" ` +
    `vector-effect="non-scaling-stroke"/>`
  );

  const mergedIntervals = getMergedIntervals(structure.mergedRows);
  const tableBottom = structure.tableTop + structure.tableHeight;

  // Vertical column borders (skip the last column - outer border handles it)
  structure.columns.slice(0, -1).forEach((col) => {
    const x = col.x + col.width;
    getVerticalLineSegments(structure.tableTop, tableBottom, mergedIntervals).forEach((segment) => {
      lines.push(
        `<line x1="${x}" y1="${segment.start}" ` +
        `x2="${x}" y2="${segment.end}" ` +
        `stroke="${borderColor}" stroke-width="${borderWidth}" ` +
        `vector-effect="non-scaling-stroke"/>`
      );
    });
  });

  // Horizontal row borders (skip the last row - outer border handles it)
  structure.rows.slice(0, -1).forEach((row) => {
    const y = row.y + row.height;
    lines.push(
      `<line x1="${structure.tableLeft}" y1="${y}" ` +
      `x2="${structure.tableLeft + structure.tableWidth}" y2="${y}" ` +
      `stroke="${borderColor}" stroke-width="${borderWidth}" ` +
      `vector-effect="non-scaling-stroke"/>`
    );
  });

  // Build complete SVG string with explicit xmlns for data URL compatibility
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${containerWidth}" height="${containerHeight}">${lines.join('')}</svg>`;

  // Convert to data URL - this completely isolates SVG from document CSS
  const dataUrl = `data:image/svg+xml;base64,${btoa(svgString)}`;

  // Create image element
  const img = document.createElement('img');
  img.src = dataUrl;
  img.style.position = 'absolute';
  img.style.left = '0';
  img.style.top = '0';
  img.style.width = `${containerWidth}px`;
  img.style.height = `${containerHeight}px`;
  img.style.pointerEvents = 'none';
  img.style.zIndex = '1'; // keep above section background, below text

  return img;
}

/**
 * Color properties that html2canvas needs to process
 * These are all CSS properties that can contain color values
 */
const COLOR_STYLE_PROPERTIES = [
  'color',
  'backgroundColor',
  'borderColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'outlineColor',
  'textDecorationColor',
  'caretColor',
  'columnRuleColor',
] as const;

/**
 * Properties that may contain colors within complex values (like shadows)
 */
const COMPLEX_COLOR_PROPERTIES = [
  'boxShadow',
  'textShadow',
] as const;

/**
 * Regex patterns to detect modern CSS color functions that html2canvas doesn't support
 */
const MODERN_COLOR_REGEX = /\b(lab|lch|oklch|oklab|hwb|color|color-mix)\s*\(/i;

/**
 * Check if a color value uses modern CSS color functions unsupported by html2canvas
 */
const isModernColorFunction = (color: string): boolean => {
  if (!color) return false;
  return MODERN_COLOR_REGEX.test(color);
};

/**
 * Check if a color value is already in a safe format for html2canvas
 */
const isSafeColorFormat = (color: string): boolean => {
  if (!color) return true;
  const trimmed = color.trim().toLowerCase();

  // Safe formats: hex, rgb/rgba, hsl/hsla, transparent, named colors
  if (
    trimmed.startsWith('#') ||
    trimmed.startsWith('rgb') ||
    trimmed.startsWith('hsl') ||
    trimmed === 'transparent' ||
    trimmed === 'inherit' ||
    trimmed === 'initial' ||
    trimmed === 'unset' ||
    trimmed === 'currentcolor' ||
    /^[a-z]+$/.test(trimmed) // Named colors like 'white', 'black', etc.
  ) {
    return true;
  }

  return false;
};

/**
 * Reusable canvas for color conversion - created lazily and cached
 * Using Canvas 2D context is the most reliable way to convert any CSS color to RGBA
 * because Canvas always operates in sRGB color space
 */
let colorConversionCanvas: HTMLCanvasElement | null = null;
let colorConversionCtx: CanvasRenderingContext2D | null = null;

/**
 * Get or create the shared color conversion canvas
 */
const getColorConversionContext = (): CanvasRenderingContext2D | null => {
  if (!colorConversionCanvas) {
    colorConversionCanvas = document.createElement('canvas');
    colorConversionCanvas.width = 1;
    colorConversionCanvas.height = 1;
    colorConversionCtx = colorConversionCanvas.getContext('2d', { willReadFrequently: true });
  }
  return colorConversionCtx;
};

/**
 * Convert any CSS color to RGBA using Canvas 2D context
 * This is the most reliable method as Canvas always operates in sRGB color space
 * and will convert any modern color format (lab, oklch, etc.) to RGBA values
 *
 * @param color - The CSS color value to convert
 * @returns Object with r, g, b, a values (0-255 for rgb, 0-1 for alpha) or null if failed
 */
const colorToRGBA = (color: string): { r: number; g: number; b: number; a: number } | null => {
  const ctx = getColorConversionContext();
  if (!ctx) return null;

  try {
    // Clear the canvas first with a known color to detect invalid colors
    ctx.clearRect(0, 0, 1, 1);

    // Set fill style - the browser will parse any valid CSS color
    ctx.fillStyle = '#00000000'; // Reset to transparent
    ctx.fillStyle = color; // Set the color we want to convert

    // Fill a single pixel
    ctx.fillRect(0, 0, 1, 1);

    // Read back the pixel data - this is ALWAYS in RGBA format (sRGB)
    const imageData = ctx.getImageData(0, 0, 1, 1);
    const [r, g, b, a] = imageData.data;

    return { r, g, b, a: a / 255 };
  } catch {
    return null;
  }
};

/**
 * Extract luminance estimate from color for perceptually accurate fallbacks
 * Uses simplified relative luminance calculation
 */
const estimateLuminance = (color: string): number => {
  const rgba = colorToRGBA(color);
  if (!rgba) return 0.5; // Assume mid-gray if we can't parse

  // Simplified relative luminance (accurate enough for fallback selection)
  const { r, g, b } = rgba;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

/**
 * Get a perceptually appropriate fallback color based on the original color's luminance
 * Instead of always falling back to black, this preserves approximate brightness
 */
const getPerceptualFallback = (originalColor: string, isBackground: boolean): string => {
  // Try to get luminance from the original color
  const luminance = estimateLuminance(originalColor);

  if (isBackground) {
    // For backgrounds, map luminance to grayscale
    if (luminance > 0.9) return '#ffffff';
    if (luminance > 0.7) return '#e0e0e0';
    if (luminance > 0.5) return '#a0a0a0';
    if (luminance > 0.3) return '#606060';
    if (luminance > 0.1) return '#303030';
    return '#000000';
  } else {
    // For text/foreground, map luminance to grayscale
    if (luminance > 0.8) return '#ffffff';
    if (luminance > 0.6) return '#c0c0c0';
    if (luminance > 0.4) return '#808080';
    if (luminance > 0.2) return '#404040';
    return '#000000';
  }
};

/**
 * Convert any CSS color (including LAB, LCH, OKLCH, OKLAB, HWB, color-mix) to RGB/RGBA format
 * that html2canvas can understand. Uses Canvas 2D context for reliable conversion.
 *
 * This method is more reliable than getComputedStyle because Canvas 2D context
 * ALWAYS converts colors to sRGB before drawing, guaranteeing valid RGB output.
 *
 * @param color - The color value to convert
 * @param fallback - Fallback color if conversion fails (default: transparent)
 * @param isBackground - Whether this is a background color (affects fallback selection)
 * @returns A color in rgb/rgba format
 */
const convertColorToRGB = (
  color: string | undefined,
  fallback: string = 'transparent',
  isBackground: boolean = false
): string => {
  if (!color) return fallback;

  const trimmed = color.trim();

  // Handle special CSS values that aren't actual colors
  const lowerTrimmed = trimmed.toLowerCase();
  if (lowerTrimmed === 'transparent') return 'transparent';
  if (lowerTrimmed === 'inherit' || lowerTrimmed === 'initial' || lowerTrimmed === 'unset') {
    return fallback;
  }
  if (lowerTrimmed === 'currentcolor') {
    return isBackground ? 'transparent' : 'rgb(0, 0, 0)';
  }

  // If already in a safe format and NOT a modern color function, return as-is
  // This avoids unnecessary conversion for simple colors
  if (isSafeColorFormat(trimmed) && !isModernColorFunction(trimmed)) {
    return trimmed;
  }

  // Use Canvas 2D context for reliable conversion
  const rgba = colorToRGBA(trimmed);

  if (rgba) {
    const { r, g, b, a } = rgba;

    // Handle fully transparent
    if (a === 0) {
      return 'transparent';
    }

    // Handle fully opaque
    if (a >= 0.999) {
      return `rgb(${r}, ${g}, ${b})`;
    }

    // Handle semi-transparent (preserve alpha)
    const rgbaResult = `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;

    // Paranoid safety check: ensure result doesn't somehow contain modern color functions
    if (isModernColorFunction(rgbaResult)) {
      console.error(`[PDF Export] CRITICAL: Canvas conversion produced modern color function: "${rgbaResult}"`);
      return isBackground ? 'transparent' : '#000000';
    }

    return rgbaResult;
  }

  // Canvas conversion failed - try computed style as backup
  try {
    const tempElement = document.createElement('div');
    tempElement.style.cssText = `
      position: absolute;
      visibility: hidden;
      pointer-events: none;
      color: ${trimmed};
    `;
    document.body.appendChild(tempElement);

    const computedColor = window.getComputedStyle(tempElement).color;
    document.body.removeChild(tempElement);

    // Try to convert the computed color with Canvas
    if (computedColor && computedColor !== trimmed) {
      const computedRGBA = colorToRGBA(computedColor);
      if (computedRGBA) {
        const { r, g, b, a } = computedRGBA;
        if (a === 0) return 'transparent';
        if (a >= 0.999) return `rgb(${r}, ${g}, ${b})`;
        return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
      }
    }

    // Check if computed color is in safe format
    if (computedColor && isSafeColorFormat(computedColor)) {
      return computedColor;
    }
  } catch {
    // Silently continue to fallback
  }

  // All conversion methods failed - use perceptually accurate fallback
  const perceptualFallback = getPerceptualFallback(trimmed, isBackground);
  console.warn(
    `[PDF Export] Color "${trimmed}" could not be converted, using perceptual fallback "${perceptualFallback}"`
  );

  // Final safety check: ensure we never return a modern color function
  if (isModernColorFunction(perceptualFallback)) {
    console.error(`[PDF Export] CRITICAL: Fallback color "${perceptualFallback}" contains modern color function! Using safe default.`);
    return isBackground ? 'transparent' : '#000000';
  }

  return perceptualFallback;
};

/**
 * Enhanced regex to match modern color functions including nested parentheses
 * Handles: lab(), lch(), oklch(), oklab(), hwb(), color(), color-mix()
 * Also handles alpha channel syntax like "oklch(0.5 0.1 200 / 0.5)"
 */
const MODERN_COLOR_FUNCTION_REGEX = /\b(lab|lch|oklch|oklab|hwb|color|color-mix)\s*\([^()]*(?:\([^()]*\)[^()]*)*\)/gi;

/**
 * Convert colors within complex CSS values like box-shadow and text-shadow
 * These can contain multiple colors in a single value
 *
 * @param value - The CSS property value (e.g., "2px 2px 4px oklch(0.5 0.1 200 / 0.5)")
 * @returns The value with all modern color functions converted to rgba()
 */
const normalizeComplexColorValue = (value: string | undefined): string => {
  if (!value || value === 'none') return value || 'none';

  // If no modern color functions detected, return as-is
  if (!isModernColorFunction(value)) {
    return value;
  }

  try {
    let result = value;
    let hasUnconvertedColors = false;

    // Find all modern color function matches
    const matches = value.match(MODERN_COLOR_FUNCTION_REGEX);

    if (matches) {
      // Create a Set to avoid processing duplicates
      const uniqueMatches = [...new Set(matches)];

      for (const match of uniqueMatches) {
        // Convert using Canvas-based method
        const convertedColor = convertColorToRGB(match, 'rgba(0, 0, 0, 0.3)', false);

        // Check if conversion succeeded (not a fallback)
        if (convertedColor.includes('rgba') || convertedColor.includes('rgb')) {
          // Replace all occurrences of this color in the value
          result = result.split(match).join(convertedColor);
        } else {
          hasUnconvertedColors = true;
        }
      }
    }

    // Verify no modern color functions remain
    if (isModernColorFunction(result)) {
      // Some colors couldn't be converted, try a more aggressive approach
      // by converting the entire value as a color (works for simple cases)
      const simpleConversion = convertColorToRGB(value, 'none', false);
      if (simpleConversion !== 'none' && !isModernColorFunction(simpleConversion)) {
        return simpleConversion;
      }

      if (hasUnconvertedColors) {
        console.warn(
          `[PDF Export] Complex value "${value}" still contains modern colors after conversion, using fallback`
        );
      }
      // Return safe fallback for shadows
      return 'none';
    }

    return result;
  } catch (error) {
    console.warn(`[PDF Export] Failed to normalize complex color value "${value}"`, error);
    return 'none';
  }
};

/**
 * Background-related color properties
 */
const BACKGROUND_COLOR_PROPERTIES = new Set([
  'backgroundColor',
  'background-color',
]);

/**
 * Convert camelCase to kebab-case
 */
const toKebabCase = (str: string): string => {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
};

/**
 * Normalize all color-related styles on a single element
 * Converts modern CSS color functions to rgb/rgba format
 * Uses Canvas-based conversion for reliability
 */
const normalizeElementColors = (element: HTMLElement): void => {
  const computedStyle = window.getComputedStyle(element);

  // Process simple color properties
  for (const prop of COLOR_STYLE_PROPERTIES) {
    const cssProp = toKebabCase(prop);
    const value = computedStyle.getPropertyValue(cssProp);

    // Skip empty values or values that are already safe
    if (!value || value === 'transparent' || value === 'initial' || value === 'inherit') {
      continue;
    }

    // Check if conversion is needed (modern color function or needs normalization)
    if (isModernColorFunction(value)) {
      const isBackground = BACKGROUND_COLOR_PROPERTIES.has(prop) || BACKGROUND_COLOR_PROPERTIES.has(cssProp);
      const fallback = isBackground ? 'transparent' : 'rgb(0, 0, 0)';
      const converted = convertColorToRGB(value, fallback, isBackground);

      // Only set if conversion changed the value
      if (converted !== value) {
        element.style.setProperty(cssProp, converted, 'important');
      }
    }
  }

  // Process complex color properties (shadows)
  for (const prop of COMPLEX_COLOR_PROPERTIES) {
    const cssProp = toKebabCase(prop);
    const value = computedStyle.getPropertyValue(cssProp);

    // Skip empty or 'none' values
    if (!value || value === 'none') {
      continue;
    }

    // Check if conversion is needed
    if (isModernColorFunction(value)) {
      const normalized = normalizeComplexColorValue(value);

      // Only set if normalization changed the value
      if (normalized !== value) {
        element.style.setProperty(cssProp, normalized, 'important');
      }
    }
  }
};

/**
 * Recursively normalize all color styles in a DOM tree
 * This ensures html2canvas can properly parse all colors
 */
const normalizeContainerColors = (container: HTMLElement): void => {
  // Normalize the container itself
  normalizeElementColors(container);

  // Normalize all child elements
  const allElements = container.querySelectorAll('*');
  allElements.forEach((el) => {
    if (el instanceof HTMLElement) {
      normalizeElementColors(el);
    }
  });
};

/**
 * Process dynamic text placeholders like {{pageNumber}} and {{totalPages}}
 */
const processDynamicText = (text: string, pageNumber: number, totalPages: number): string => {
  return text
    .replace(/\{\{pageNumber\}\}/g, pageNumber.toString())
    .replace(/\{\{totalPages\}\}/g, totalPages.toString());
};

const resolveCanvasFontFamily = (fontFamily: string | undefined): string => {
  if (!fontFamily) return 'sans-serif';

  const googleFonts = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat'];
  if (googleFonts.includes(fontFamily)) {
    return `'${fontFamily}', sans-serif`;
  }
  if (fontFamily === 'font-serif') return 'Georgia, serif';
  if (fontFamily === 'font-mono') return 'monospace';
  if (fontFamily.includes('light') || fontFamily.includes('bold')) return 'sans-serif';

  return 'sans-serif';
};

/**
 * Generate filename with format: {sanitized_title}_{YYYY-MM-DD}_{HH-MM-SS}.pdf
 */
const generateFilename = (title?: string): string => {
  const now = new Date();

  // Format date as YYYY-MM-DD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  // Format time as HH-MM-SS
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timeStr = `${hours}-${minutes}-${seconds}`;

  // Sanitize title: replace spaces with underscores, remove special chars
  const sanitizedTitle = title
    ? title
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_-]/g, '')
        .slice(0, 50) // Limit length
    : 'document';

  return `${sanitizedTitle}_${dateStr}_${timeStr}.pdf`;
};

/**
 * Create a temporary DOM container with all elements for a section
 * WYSIWYG: Includes table borders as SVG overlay for accurate PDF rendering
 */
const createSectionDOM = (
  elements: CanvasElement[],
  width: number,
  height: number,
  backgroundColor: string,
  pageNumber?: number,
  totalPages?: number
): HTMLDivElement => {
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  // Use explicit fallback for background colors, with isBackground=true
  const bgColor = convertColorToRGB(backgroundColor || '#ffffff', '#ffffff', true);
  container.style.setProperty('background-color', bgColor, 'important');
  container.style.backgroundColor = bgColor;
  container.style.overflow = 'hidden';

  elements.forEach((element) => {
    if (element.visible === false) return;

    if (element.type === 'text') {
      const isTableText = Boolean(element.groupId && element.groupName?.toLowerCase().includes('table'));
      const isCategoryText = element.id.startsWith('category-header-');
      const categoryRowTextLeftPadding = 6;
      const tableCellHorizontalPadding = 6;
      // Export text metrics are slightly taller than preview/html DOM metrics.
      // Keep the source geometry (converter owns middle alignment) and only add
      // extra room below/inside the box to protect descenders in PDF rasterization.
      const verticalSafetyPx = isTableText && !isCategoryText ? 6 : 0;
      const topOffsetPx = 0;
      const displayText = pageNumber && totalPages
        ? processDynamicText(element.text, pageNumber, totalPages)
        : element.text;

      const textEl = document.createElement('div');
      textEl.style.position = 'absolute';
      textEl.style.left = `${element.x}px`;
      textEl.style.top = `${Math.max(0, element.y - topOffsetPx)}px`;
      textEl.style.margin = '0';
      textEl.style.padding = '0';
      textEl.style.boxSizing = 'border-box';
      textEl.style.overflow = 'hidden'; // hard guard: never paint outside the cell box
      textEl.style.display = 'block';
      textEl.style.zIndex = '2'; // ensure glyphs render above table border overlay

      // Set width and height to match the element dimensions (preview uses minHeight semantics)
      if (element.width) {
        textEl.style.width = `${element.width}px`;
      }
      if (element.height) {
        const exportHeight = element.height + verticalSafetyPx;
        textEl.style.minHeight = `${exportHeight}px`;
        textEl.style.height = `${exportHeight}px`;
      }
      const textContentEl = isTableText ? document.createElement('div') : textEl;
      if (isTableText) {
        textContentEl.style.width = '100%';
        textContentEl.style.minWidth = '0';
        textContentEl.style.boxSizing = 'border-box';
      }

      // Font family with safe fallbacks for html2canvas
      textContentEl.style.fontFamily = resolveCanvasFontFamily(element.fontFamily);
      textContentEl.style.fontSize = `${element.fontSize}px`;
      textContentEl.style.fontWeight = element.bold ? 'bold' : 'normal';
      textContentEl.style.fontStyle = element.italic ? 'italic' : 'normal';
      textContentEl.style.textDecoration = element.underline ? 'underline' : 'none';
      // Use black as fallback for text colors, with isBackground=false
      const textColor = convertColorToRGB(element.color, '#000000', false);
      textContentEl.style.setProperty('color', textColor, 'important');
      textContentEl.style.color = textColor;
      // Text alignment
      textContentEl.style.textAlign = element.textAlign || 'left';
      if (isTableText && !isCategoryText) {
        const resolvedTextAlign = element.textAlign || 'left';
        if (resolvedTextAlign === 'left') {
          textContentEl.style.paddingLeft = `${tableCellHorizontalPadding}px`;
          textContentEl.style.boxSizing = 'border-box';
        } else if (resolvedTextAlign === 'right') {
          textContentEl.style.paddingRight = `${tableCellHorizontalPadding}px`;
          textContentEl.style.boxSizing = 'border-box';
        }
      }
      // CRITICAL: Preserve whitespace and spacing - prevents space collapse in html2canvas
      textContentEl.style.whiteSpace = 'pre-wrap';
      textContentEl.style.wordBreak = 'break-word';
      textContentEl.style.overflowWrap = 'break-word';
      textContentEl.style.wordSpacing = 'normal';
      textContentEl.style.letterSpacing = 'normal';
      textContentEl.style.textRendering = 'auto';
      // Ensure line height is set for proper text rendering
      textContentEl.style.lineHeight = String(element.lineHeight ?? 'normal');
      if (isCategoryText) {
        textEl.style.display = 'flex';
        textEl.style.alignItems = 'center';
        textContentEl.style.paddingLeft = `${categoryRowTextLeftPadding}px`;
        textContentEl.style.boxSizing = 'border-box';
      }

      if (element.backgroundColor) {
        const bgColor = convertColorToRGB(element.backgroundColor, 'transparent', true);
        if (isCategoryText) {
          // Category rows must fill the entire merged row area.
          textEl.style.setProperty('background-color', bgColor, 'important');
          textEl.style.backgroundColor = bgColor;
          textContentEl.style.setProperty('background-color', 'transparent', 'important');
        } else {
          // Set inline and force it to prevent any browser color space conversions
          textContentEl.style.setProperty('background-color', bgColor, 'important');
          textContentEl.style.backgroundColor = bgColor;
        }
      } else {
        // Explicitly set transparent to prevent inheritance
        textContentEl.style.setProperty('background-color', 'transparent', 'important');
      }

      if (element.shadow) {
        // Use explicit RGB values for shadow
        textContentEl.style.textShadow = '2px 2px 4px rgba(0,0,0,0.3)';
      }

      if (element.outline) {
        textContentEl.style.webkitTextStroke = '0.5px rgba(0,0,0,0.5)';
      }

      textContentEl.textContent = displayText;
      if (isTableText) {
        textEl.appendChild(textContentEl);
      }
      container.appendChild(textEl);
    } else if (element.type === 'image') {
      const imgEl = document.createElement('img');
      imgEl.style.position = 'absolute';
      imgEl.style.left = `${element.x}px`;
      imgEl.style.top = `${element.y}px`;
      imgEl.style.width = `${element.width}px`;
      imgEl.style.height = `${element.height}px`;
      imgEl.style.objectFit = 'contain';
      imgEl.crossOrigin = 'anonymous';
      imgEl.src = element.src;
      container.appendChild(imgEl);
    }
  });

  // ✅ WYSIWYG: Add table borders as image (SVG data URL)
  // Uses an <img> with SVG data URL to avoid html2canvas CSS parsing issues
  // This matches the TableBorderOverlay component in the canvas preview
  const tableStructure = detectTableStructure(elements);
  if (tableStructure) {
    // Default border styling - can be made configurable in the future
    // for colored layouts and custom styling
    const borderColor = '#000000';
    const borderWidth = 1;

    const bordersImg = createTableBordersImage(
      tableStructure,
      width,
      height,
      borderColor,
      borderWidth
    );
    container.appendChild(bordersImg);
  }

  return container;
};

/**
 * Wait for all images in a container to load
 */
const waitForImages = (container: HTMLElement): Promise<void> => {
  const images = container.querySelectorAll('img');
  const promises = Array.from(images).map(
    (img) =>
      new Promise<void>((resolve) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Continue even if image fails
        }
      })
  );
  return Promise.all(promises).then(() => {});
};

/**
 * Deep normalize all colors in a document/element, including stylesheets
 * This is a more thorough normalization that processes inline styles
 * and ensures all color values are converted before html2canvas parsing
 */
const deepNormalizeColors = (element: HTMLElement, document: Document): void => {
  // Get all elements including the root
  const elements = [element, ...Array.from(element.querySelectorAll('*'))];

  for (const el of elements) {
    if (!(el instanceof HTMLElement)) continue;

    // Get computed style
    const computedStyle = document.defaultView?.getComputedStyle(el);
    if (!computedStyle) continue;

    // Process all color properties
    for (const prop of COLOR_STYLE_PROPERTIES) {
      const cssProp = toKebabCase(prop);
      const value = computedStyle.getPropertyValue(cssProp);

      if (value && isModernColorFunction(value)) {
        const isBackground = BACKGROUND_COLOR_PROPERTIES.has(prop);
        const fallback = isBackground ? 'transparent' : 'rgb(0, 0, 0)';
        const converted = convertColorToRGB(value, fallback, isBackground);
        el.style.setProperty(cssProp, converted, 'important');
      }
    }

    // Process shadow properties
    for (const prop of COMPLEX_COLOR_PROPERTIES) {
      const cssProp = toKebabCase(prop);
      const value = computedStyle.getPropertyValue(cssProp);

      if (value && value !== 'none' && isModernColorFunction(value)) {
        const normalized = normalizeComplexColorValue(value);
        el.style.setProperty(cssProp, normalized, 'important');
      }
    }

    // Also check for CSS variables that might contain colors
    // by examining all inline style properties
    const inlineStyle = el.getAttribute('style');
    if (inlineStyle && isModernColorFunction(inlineStyle)) {
      // Re-process any modern colors in inline styles
      const styleProps = inlineStyle.split(';');
      const newStyleProps: string[] = [];

      for (const styleProp of styleProps) {
        const [propName, propValue] = styleProp.split(':').map(s => s?.trim());
        if (propName && propValue && isModernColorFunction(propValue)) {
          const isBackground = propName.toLowerCase().includes('background');
          const converted = convertColorToRGB(propValue, isBackground ? 'transparent' : 'rgb(0,0,0)', isBackground);
          newStyleProps.push(`${propName}: ${converted} !important`);
        } else if (propName && propValue) {
          newStyleProps.push(`${propName}: ${propValue}`);
        }
      }

      if (newStyleProps.length > 0) {
        el.setAttribute('style', newStyleProps.join('; '));
      }
    }
  }
};

/**
 * Capture a DOM element as canvas using html2canvas
 * Pre-processes all colors to ensure compatibility with html2canvas
 *
 * The critical color normalization happens in the onclone callback,
 * which runs AFTER html2canvas clones the DOM but BEFORE it parses styles.
 * This is the optimal point for color conversion.
 */
const captureElement = async (
  element: HTMLElement,
  scale: number
): Promise<HTMLCanvasElement> => {
  // Wait for images to load
  await waitForImages(element);

  // Wait for web fonts to finish loading so text metrics match the preview/canvas editor.
  try {
    const docWithFonts = document as Document & { fonts?: FontFaceSet };
    if ('fonts' in document && docWithFonts.fonts) {
      await Promise.race([
        docWithFonts.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
    }
  } catch (fontError) {
    console.warn('[PDF Export] Font readiness wait failed, continuing:', fontError);
  }

  // Pre-normalize the original element (for any manually created elements)
  try {
    normalizeContainerColors(element);
  } catch (colorError) {
    console.warn('[PDF Export] Pre-normalization encountered an error, continuing:', colorError);
  }

  // Capture with html2canvas
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: false,
    backgroundColor: null,
    logging: false,
    imageTimeout: 15000,
    // CRITICAL: onclone runs AFTER cloning but BEFORE html2canvas parses the DOM
    // This is the optimal point for color normalization
    onclone: (clonedDoc: Document, clonedElement: HTMLElement) => {
      try {
        // STEP 1: Remove ALL stylesheets from the cloned document
        // This eliminates any CSS that might define lab(), oklch(), etc. colors
        // We rely solely on inline styles which we control completely
        const stylesheets = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
        stylesheets.forEach((sheet) => sheet.remove());

        // STEP 2: Add a minimal reset stylesheet with only safe colors and text spacing
        const resetStyle = clonedDoc.createElement('style');
        resetStyle.textContent = `
          *, *::before, *::after {
            color-scheme: light !important;
            forced-color-adjust: none !important;
          }
          :root, html, body {
            color: #000000 !important;
            background-color: #ffffff !important;
          }
          /* CRITICAL: Preserve text spacing - prevents html2canvas from collapsing spaces */
          div, span, p, h1, h2, h3, h4, h5, h6 {
            word-spacing: normal !important;
            letter-spacing: normal !important;
            white-space: pre-wrap !important;
          }
        `;
        clonedDoc.head?.appendChild(resetStyle);

        // STEP 3: Set explicit safe colors on html and body
        if (clonedDoc.documentElement) {
          clonedDoc.documentElement.style.setProperty('color', '#000000', 'important');
          clonedDoc.documentElement.style.setProperty('background-color', '#ffffff', 'important');
          clonedDoc.documentElement.style.setProperty('color-scheme', 'light', 'important');
        }
        if (clonedDoc.body) {
          clonedDoc.body.style.setProperty('color', '#000000', 'important');
          clonedDoc.body.style.setProperty('background-color', '#ffffff', 'important');
          clonedDoc.body.style.setProperty('color-scheme', 'light', 'important');
        }

        // STEP 4: Process ALL elements and force safe color values
        const allElements = clonedDoc.querySelectorAll('*');
        allElements.forEach((el) => {
          if (el instanceof HTMLElement) {
            // Force all color properties to safe values
            // Use getComputedStyle from the cloned document's window
            const computedStyle = clonedDoc.defaultView?.getComputedStyle(el);
            if (computedStyle) {
              for (const prop of COLOR_STYLE_PROPERTIES) {
                const cssProp = toKebabCase(prop);
                const value = computedStyle.getPropertyValue(cssProp);

                if (value && value !== 'initial' && value !== 'inherit' && value !== 'unset') {
                  const isBackground = BACKGROUND_COLOR_PROPERTIES.has(prop) || BACKGROUND_COLOR_PROPERTIES.has(cssProp);
                  const converted = convertColorToRGB(value, isBackground ? 'transparent' : 'rgb(0,0,0)', isBackground);

                  if (!isModernColorFunction(converted)) {
                    el.style.setProperty(cssProp, converted, 'important');
                  } else {
                    el.style.setProperty(cssProp, isBackground ? 'transparent' : 'rgb(0,0,0)', 'important');
                  }
                }
              }

              // Also handle box-shadow and text-shadow
              for (const prop of COMPLEX_COLOR_PROPERTIES) {
                const cssProp = toKebabCase(prop);
                const value = computedStyle.getPropertyValue(cssProp);
                if (value && value !== 'none' && isModernColorFunction(value)) {
                  el.style.setProperty(cssProp, 'none', 'important');
                }
              }

              // CRITICAL: Preserve text spacing to prevent html2canvas from collapsing spaces
              // This fixes the issue where "Budget Tracking 2026" becomes "BudgetTracking2026"
              el.style.setProperty('word-spacing', 'normal', 'important');
              el.style.setProperty('letter-spacing', 'normal', 'important');
            }
          }

          // Handle SVG elements
          if (el instanceof SVGElement) {
            el.style.setProperty('color', '#000000', 'important');
            el.style.setProperty('color-scheme', 'light', 'important');

            if (el.tagName.toLowerCase() === 'svg') {
              el.style.setProperty('background-color', 'transparent', 'important');
              el.style.setProperty('fill', 'none', 'important');
              el.style.setProperty('stroke', '#000000', 'important');
            }

            const stroke = el.getAttribute('stroke');
            const fill = el.getAttribute('fill');

            if (stroke && isModernColorFunction(stroke)) {
              el.setAttribute('stroke', convertColorToRGB(stroke, '#000000', false));
            }
            if (fill && isModernColorFunction(fill)) {
              el.setAttribute('fill', convertColorToRGB(fill, 'none', true));
            }
          }
        });
      } catch (e) {
        console.warn('[PDF Export] Color normalization on clone failed:', e);
      }
    },
  });

  return canvas;
};

/**
 * Export pages as high-quality WYSIWYG PDF using html2canvas
 * @param pages - Array of pages to export
 * @param header - Header configuration
 * @param footer - Footer configuration
 * @param scale - Quality scale multiplier (2 = Medium/144 DPI, 4 = Ultra/288 DPI)
 * @param documentTitle - Optional document title for filename and metadata
 * @param onProgress - Optional callback for progress updates (currentPage, totalPages)
 */
export async function exportAsWYSIWYGPDF(
  pages: Page[],
  header: HeaderFooter,
  footer: HeaderFooter,
  scale: number = 2,
  documentTitle?: string,
  onProgress?: (currentPage: number, totalPages: number) => void
) {
  toast.info('Preparing PDF export...');

  try {
    const { jsPDF } = await import('jspdf');

    const firstPage = pages[0];
    const firstPageSize = PAGE_SIZES[firstPage?.size] || PAGE_SIZES.A4;
    const isFirstPageLandscape = firstPage?.orientation === 'landscape';

    // Initialize PDF
    const pdf = new jsPDF({
      orientation: isFirstPageLandscape ? 'landscape' : 'portrait',
      unit: 'px',
      format: isFirstPageLandscape
        ? [firstPageSize.height, firstPageSize.width]
        : [firstPageSize.width, firstPageSize.height],
      compress: true,
    });

    // Add metadata
    pdf.setProperties({
      title: documentTitle || 'Document',
      author: 'PPDO Canvas Editor',
      subject: documentTitle || 'PDF Export',
      keywords: 'pdf, export, canvas, wysiwyg',
      creator: 'PPDO Canvas Editor - WYSIWYG PDF Export',
    });

    // Create temporary container for rendering
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    document.body.appendChild(tempContainer);

    try {
      // Process each page
      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        const page = pages[pageIndex];
        const isLandscape = page.orientation === 'landscape';
        const baseSize = PAGE_SIZES[page.size] || PAGE_SIZES.A4;
        const pageSize = isLandscape
          ? { width: baseSize.height, height: baseSize.width }
          : baseSize;

        // Update progress
        if (onProgress) {
          onProgress(pageIndex + 1, pages.length);
        }

        // Create page container
        const pageContainer = document.createElement('div');
        pageContainer.style.position = 'relative';
        pageContainer.style.width = `${pageSize.width}px`;
        pageContainer.style.height = `${pageSize.height}px`;
        pageContainer.style.backgroundColor = '#ffffff'; // Always use safe explicit white

        // Create and append header (absolute positioning for precise layout)
        const layout = getPageLayoutMetrics(pageSize.width, pageSize.height, header, footer);

        if (layout.headerHeight > 0) {
          const headerDOM = createSectionDOM(
            header.elements,
            pageSize.width,
            layout.headerHeight,
            header.backgroundColor || '#ffffff',
            pageIndex + 1,
            pages.length
          );
          headerDOM.style.position = 'absolute';
          headerDOM.style.left = '0';
          headerDOM.style.top = '0';
          pageContainer.appendChild(headerDOM);
        }

        // Create and append page body (absolute positioning for precise layout)
        const bodyDOM = createSectionDOM(
          page.elements,
          pageSize.width,
          layout.bodyHeight,
          page.backgroundColor || '#ffffff'
        );
        bodyDOM.style.position = 'absolute';
        bodyDOM.style.left = '0';
        bodyDOM.style.top = `${layout.bodyTop}px`;
        pageContainer.appendChild(bodyDOM);

        if (layout.footerHeight > 0) {
          const footerDOM = createSectionDOM(
            footer.elements,
            pageSize.width,
            layout.footerHeight,
            footer.backgroundColor || '#ffffff',
            pageIndex + 1,
            pages.length
          );
          footerDOM.style.position = 'absolute';
          footerDOM.style.left = '0';
          footerDOM.style.top = `${layout.bodyTop + layout.bodyHeight}px`;
          pageContainer.appendChild(footerDOM);
        }

        // Add to temp container
        tempContainer.appendChild(pageContainer);

        // Capture the entire page
        const canvas = await captureElement(pageContainer, scale);

        // Add new page if not first
        if (pageIndex > 0) {
          pdf.addPage(
            [pageSize.width, pageSize.height],
            isLandscape ? 'landscape' : 'portrait'
          );
        }

        // Add captured image to PDF
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, pageSize.width, pageSize.height, undefined, 'FAST');

        // Clean up page container
        tempContainer.removeChild(pageContainer);
      }

      // Generate filename and save
      const filename = generateFilename(documentTitle);
      pdf.save(filename);

      toast.success('PDF exported successfully!');
    } finally {
      // Clean up temporary container
      document.body.removeChild(tempContainer);
    }
  } catch (error) {
    console.error('Error exporting PDF:', error);
    toast.error('Failed to export PDF. Please try again.');
    throw error;
  }
}
