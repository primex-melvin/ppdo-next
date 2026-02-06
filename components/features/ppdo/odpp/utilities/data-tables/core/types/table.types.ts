
export type ColumnType = "text" | "number" | "date" | "status" | "currency" | "percentage" | "custom";
export type ColumnAlign = "left" | "right" | "center";

export interface ColumnConfig<T = any> {
  key: keyof T | string;
  label: string;
  /**
   * Flex weight for dynamic width calculation.
   * Higher values = wider columns.
   * Total width is distributed proportionally based on flex values.
   * @example 3 = wide column (particulars), 1 = narrow column (year)
   */
  flex: number;
  /**
   * Minimum width in pixels to ensure readability
   */
  minWidth?: number;
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
    width: number;
    isVisible: boolean;
  }>;
  customRowHeights?: string;
}
