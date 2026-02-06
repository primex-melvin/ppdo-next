
export type ColumnType = "text" | "number" | "date" | "status" | "currency" | "percentage" | "custom";
export type ColumnAlign = "left" | "right" | "center";

export interface ColumnConfig<T = any> {
  key: keyof T | string;
  label: string;
  width: number;
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
