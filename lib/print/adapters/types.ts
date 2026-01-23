// lib/print/adapters/types.ts
/**
 * Generic printable item interface
 * Any data type can implement this to be printable
 */
export interface PrintableItem {
  id: string;
  [key: string]: any;
}

/**
 * Generic metadata for print data
 */
export interface PrintMetadata {
  title?: string;
  subtitle?: string;
  timestamp?: number;
  [key: string]: any;
}

/**
 * Generic printable data format
 * Represents any data structure that can be converted to print format
 */
export interface PrintableData {
  items: PrintableItem[];
  totals?: Record<string, number>;
  metadata?: PrintMetadata;
}

/**
 * Column definition interface (compatible with existing ColumnDefinition)
 */
export interface PrintColumnDefinition {
  key: string;
  label: string;
  align: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
}

/**
 * Row marker for category or section headers
 * Indicates where to insert a visual section/category header in the canvas
 */
export interface PrintRowMarker {
  index: number;
  type: 'category' | 'group';
  label: string;
  categoryId?: string;
}

/**
 * Data adapter interface for converting domain-specific data to printable format
 * Implementations should handle their specific domain (Budget, Breakdown, etc.)
 */
export interface PrintDataAdapter<T = any> {
  /**
   * Convert domain-specific data to generic printable format
   * @returns PrintableData with items, totals, and metadata
   */
  toPrintableData(): PrintableData;

  /**
   * Get column definitions for the data
   * @returns Array of column definitions
   */
  getColumnDefinitions(): PrintColumnDefinition[];

  /**
   * Optional: Get row markers for category/group headers
   * @returns Array of row markers or undefined
   */
  getRowMarkers?(): PrintRowMarker[] | undefined;

  /**
   * Optional: Get data identifier for draft naming
   * @returns A unique identifier for this dataset
   */
  getDataIdentifier?(): string;
}
