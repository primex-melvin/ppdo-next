// app/(private)/dashboard/implementing-agencies/components/table/AgencyTableRow.tsx

"use client";

import { Edit, Trash2, Eye } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Agency, AgencyColumnConfig } from "../../types/agency-table.types";
import { DEFAULT_ROW_HEIGHT } from "../../constants/agency-table.constants";

interface AgencyTableRowProps {
  agency: Agency;
  index: number;
  columns: AgencyColumnConfig[];
  rowHeight: number;
  canEditLayout: boolean;
  onRowClick: (agency: Agency, event: React.MouseEvent) => void;
  onEdit?: (agency: Agency) => void;
  onDelete?: (id: string) => void;
  onStartRowResize: (e: React.MouseEvent, rowId: string) => void;
  isSelected?: boolean;
  onSelectRow?: (id: string, checked: boolean) => void;
}

function formatCellValue(agency: Agency, column: AgencyColumnConfig): React.ReactNode {
  const key = String(column.key);

  switch (key) {
    case "type":
      return (
        <Badge
          variant={agency.type === "internal" ? "default" : "secondary"}
          className="text-[10px] px-1.5 py-0"
        >
          {agency.type === "internal" ? "Internal" : "External"}
        </Badge>
      );

    case "isActive":
      return (
        <Badge
          variant={agency.isActive ? "default" : "destructive"}
          className="text-[10px] px-1.5 py-0"
        >
          {agency.isActive ? "Active" : "Inactive"}
        </Badge>
      );

    case "totalBreakdowns":
      return (agency.totalBreakdowns ?? 0).toString();

    case "createdAt":
    case "updatedAt": {
      const value = agency[key];
      if (!value) return "-";
      return new Date(value).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    case "totalProjects":
      return (agency.totalProjects ?? 0).toString();

    default: {
      const value = agency[key];
      if (value === undefined || value === null || value === "") return "-";
      if (typeof value === "number") return value.toLocaleString();
      return String(value);
    }
  }
}

export function AgencyTableRow({
  agency,
  index,
  columns,
  rowHeight,
  canEditLayout,
  onRowClick,
  onEdit,
  onDelete,
  onStartRowResize,
  isSelected = false,
  onSelectRow,
}: AgencyTableRowProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <tr
          id={`row-${agency._id}`}
          className={`cursor-pointer transition-colors ${isSelected
              ? "bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30"
              : "bg-white dark:bg-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
            }`}
          style={{ height: rowHeight }}
          onClick={(e) => onRowClick(agency, e)}
        >
          {/* Checkbox */}
          <td
            className="text-center px-2"
            style={{ border: "1px solid rgb(228 228 231 / 1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {onSelectRow && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelectRow(agency._id, checked as boolean)}
                aria-label={`Select row ${index + 1}`}
              />
            )}
          </td>

          {/* Row Number */}
          <td
            className="text-center text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 relative"
            style={{ border: "1px solid rgb(228 228 231 / 1)" }}
          >
            {index + 1}
            {canEditLayout && (
              <div
                className="absolute bottom-0 left-0 right-0 cursor-row-resize"
                onMouseDown={(e) => onStartRowResize(e, agency._id)}
                style={{
                  height: "4px",
                  marginBottom: "-2px",
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgb(59 130 246 / 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              />
            )}
          </td>

          {/* Data Cells */}
          {columns.map((column) => {
            const cellContent = formatCellValue(agency, column);

            return (
              <td
                key={String(column.key)}
                className="px-2 sm:px-3 py-2 text-[11px] sm:text-xs text-zinc-900 dark:text-zinc-100"
                style={{
                  width: `${column.width}px`,
                  minWidth: column.minWidth ? `${column.minWidth}px` : "80px",
                  maxWidth: column.maxWidth ? `${column.maxWidth}px` : "450px",
                  border: "1px solid rgb(228 228 231 / 1)",
                  textAlign: column.align,
                }}
              >
                {typeof cellContent === "string" ? (
                  <span className="truncate block">{cellContent}</span>
                ) : (
                  cellContent
                )}
              </td>
            );
          })}

          {/* Actions */}
          <td
            className="text-center"
            style={{ border: "1px solid rgb(228 228 231 / 1)" }}
          >
            <div className="flex items-center justify-center gap-1">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(agency);
                  }}
                  className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors"
                  title="Edit"
                >
                  <Edit
                    style={{ width: "14px", height: "14px" }}
                    className="text-zinc-600 dark:text-zinc-400"
                  />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(agency._id);
                  }}
                  className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 style={{ width: "14px", height: "14px" }} />
                </button>
              )}
            </div>
          </td>
        </tr>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-[280px]">
        <ContextMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onRowClick(agency, e as any);
          }}
          className="flex items-center gap-2 cursor-pointer text-xs"
        >
          <Eye style={{ width: "14px", height: "14px" }} />
          <span>View Details</span>
        </ContextMenuItem>

        {onEdit && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit(agency);
              }}
              className="flex items-center gap-2 cursor-pointer text-xs"
            >
              <Edit style={{ width: "14px", height: "14px" }} />
              <span>Edit Agency</span>
            </ContextMenuItem>
          </>
        )}

        {onDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete(agency._id);
              }}
              className="flex items-center gap-2 cursor-pointer text-xs text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
            >
              <Trash2 style={{ width: "14px", height: "14px" }} />
              <span>Delete Agency</span>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
