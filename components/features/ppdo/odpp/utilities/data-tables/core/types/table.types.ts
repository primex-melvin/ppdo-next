
export type ColumnType = "text" | "number" | "date" | "status" | "currency" | "percentage" | "custom";
export type ColumnAlign = "left" | "right" | "center";

export interface ColumnConfig<T = any> {
  key: keyof T | string;
  label: string;
  /**
   * Pixel width for the column.
   * This is the actual persisted width, not calculated from flex.
   * @example 180, 140, 320
   */
  width: number;
  /**
   * Minimum width in pixels - column cannot be resized smaller than this
   * @default 60
   */
  minWidth?: number;
  /**
   * Maximum width in pixels - column cannot be resized larger than this
   * @default 600
   */
  maxWidth?: number;
  /**
   * Flex weight for proportional resize calculations.
   * When container grows/shrinks, columns resize proportionally to their flex values.
   * @example 3 = wide column, 1 = narrow column
   */
  flex: number;
  type: ColumnType;
  align: ColumnAlign;
}

export interface RowHeights {
  [rowId: string]: number;
}

export interface TableSettings {
  tableIdentifier: string;
  columns: Array<{
    fieldKey: string;
    /**
     * Actual pixel width - persisted in database
     */
    width: number;
    isVisible: boolean;
    pinned?: "left" | "right" | null;
    flex?: number;
  }>;
  customRowHeights?: string;
}

/**
 * Default width constants by column type
 * Use these when defining column configurations
 */
export const DEFAULT_WIDTHS: Record<ColumnType, { width: number; min: number; max: number }> = {
  text: { width: 200, min: 120, max: 500 },
  number: { width: 100, min: 70, max: 200 },
  date: { width: 120, min: 100, max: 200 },
  status: { width: 130, min: 90, max: 200 },
  currency: { width: 140, min: 100, max: 250 },
  percentage: { width: 110, min: 80, max: 200 },
  custom: { width: 150, min: 80, max: 400 },
};

/**
 * Helper to create column config with sensible defaults
 */
export function createColumnConfig<T>(
  key: keyof T | string,
  label: string,
  type: ColumnType,
  options?: Partial<Omit<ColumnConfig<T>, 'key' | 'label' | 'type'>>
): ColumnConfig<T> {
  const defaults = DEFAULT_WIDTHS[type];
  return {
    key,
    label,
    type,
    width: options?.width ?? defaults.width,
    minWidth: options?.minWidth ?? defaults.min,
    maxWidth: options?.maxWidth ?? defaults.max,
    flex: options?.flex ?? 1,
    align: options?.align ?? "left",
  };
}
