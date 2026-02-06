// app/components/spreadsheet/hooks/useKeyboardNavigation.ts

import { useEffect } from "react";
import { CellPosition } from "../types";
import { getCellKey } from "../utils/formatting";

interface UseKeyboardNavigationProps {
  selectedCell: CellPosition;
  editingCell: string | null;
  totalColumns: number;
  dataRows: number;
  totalRowNumber: number;
  columns: string[];
  onCellClick: (row: number, col: number) => void;
  onCellChange: (row: number, col: number, value: string) => void;
  onEditingCellChange: (cell: string | null) => void;
}

/**
 * Hook to handle keyboard navigation in spreadsheet
 */
export function useKeyboardNavigation({
  selectedCell,
  editingCell,
  totalColumns,
  dataRows,
  totalRowNumber,
  columns,
  onCellClick,
  onCellChange,
  onEditingCellChange,
}: UseKeyboardNavigationProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingCell) return;

      const maxCol = totalColumns - 1;
      const maxRow = dataRows; // Don't navigate into total row

      let newRow = selectedCell.row;
      let newCol = selectedCell.col;

      // Start editing on printable character
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (newRow !== totalRowNumber) {
          const cellKey = getCellKey(selectedCell.row, selectedCell.col, columns);
          onEditingCellChange(cellKey);
        }
        return;
      }

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          if (newRow > 1) newRow--;
          break;
        case "ArrowDown":
          e.preventDefault();
          if (newRow < maxRow) newRow++;
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (newCol > 0) newCol--;
          break;
        case "ArrowRight":
          e.preventDefault();
          if (newCol < maxCol) newCol++;
          break;
        case "Enter":
          e.preventDefault();
          if (newRow < maxRow) newRow++;
          break;
        case "Tab":
          e.preventDefault();
          if (e.shiftKey) {
            if (newCol > 0) newCol--;
          } else {
            if (newCol < maxCol) newCol++;
          }
          break;
        case "Delete":
        case "Backspace":
          e.preventDefault();
          if (newRow !== totalRowNumber) {
            onCellChange(selectedCell.row, selectedCell.col, "");
          }
          break;
        case "F2":
          e.preventDefault();
          if (newRow !== totalRowNumber) {
            const cellKey = getCellKey(selectedCell.row, selectedCell.col, columns);
            onEditingCellChange(cellKey);
          }
          break;
        case "Escape":
          e.preventDefault();
          onEditingCellChange(null);
          break;
        default:
          return;
      }

      if (newRow !== selectedCell.row || newCol !== selectedCell.col) {
        onCellClick(newRow, newCol);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedCell,
    editingCell,
    onCellClick,
    onCellChange,
    columns,
    totalColumns,
    dataRows,
    totalRowNumber,
    onEditingCellChange,
  ]);
}