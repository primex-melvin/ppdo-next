// app/(private)/dashboard/implementing-agencies/components/table/AgencyTableRow.tsx

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Edit, Trash2, Eye, Building2, FileText, CheckCircle2 } from "lucide-react";
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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

// Mouse-following Agency Summary Tooltip Component
function AgencySummaryTooltip({ agency, children }: { agency: Agency; children: React.ReactNode }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const tooltipTimeout = useRef<NodeJS.Timeout | null>(null);

  // Tooltip estimated dimensions
  const tooltipWidth = 320; // max-w-xs = 20rem = 320px
  const tooltipHeight = 250; // approximate height
  const offset = 15;

  // Initialize viewport size and listen for resize
  useEffect(() => {
    const updateViewportSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial size
    updateViewportSize();

    // Add resize listener
    window.addEventListener('resize', updateViewportSize);
    return () => window.removeEventListener('resize', updateViewportSize);
  }, []);

  const utilizationRate = agency.totalBudget > 0
    ? ((agency.utilizedBudget / agency.totalBudget) * 100).toFixed(1)
    : "0.0";

  const handleMouseEnter = useCallback(() => {
    tooltipTimeout.current = setTimeout(() => {
      setShowTooltip(true);
      // Small delay for fade-in animation
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }, 500);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const x = e.clientX;
    const y = e.clientY;
    const viewportWidth = viewportSize.width || window.innerWidth;
    const viewportHeight = viewportSize.height || window.innerHeight;

    // Determine position based on viewport edges
    const nearRightEdge = x + tooltipWidth + offset > viewportWidth;
    const nearBottomEdge = y + tooltipHeight + offset > viewportHeight;

    if (nearRightEdge && nearBottomEdge) {
      setTooltipPosition('top-left');
    } else if (nearRightEdge) {
      setTooltipPosition('bottom-left');
    } else if (nearBottomEdge) {
      setTooltipPosition('top-right');
    } else {
      setTooltipPosition('bottom-right');
    }

    setMousePos({ x, y });
  }, [viewportSize.width, viewportSize.height]);

  const handleMouseLeave = useCallback(() => {
    if (tooltipTimeout.current) {
      clearTimeout(tooltipTimeout.current);
      tooltipTimeout.current = null;
    }
    setIsVisible(false);
    // Wait for fade-out animation before removing from DOM
    setTimeout(() => {
      setShowTooltip(false);
    }, 200);
  }, []);

  // Calculate tooltip position based on current tooltipPosition state
  const getTooltipStyle = () => {
    switch (tooltipPosition) {
      case 'bottom-right':
        return { left: mousePos.x + offset, top: mousePos.y + offset };
      case 'bottom-left':
        return { left: mousePos.x - tooltipWidth - offset, top: mousePos.y + offset };
      case 'top-right':
        return { left: mousePos.x + offset, top: mousePos.y - tooltipHeight - offset };
      case 'top-left':
        return { left: mousePos.x - tooltipWidth - offset, top: mousePos.y - tooltipHeight - offset };
      default:
        return { left: mousePos.x + offset, top: mousePos.y + offset };
    }
  };

  return (
    <>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="contents"
      >
        {children}
      </div>

      {/* Custom Tooltip Portal */}
      {showTooltip && typeof document !== "undefined" && createPortal(
        <div
          className={`fixed z-50 pointer-events-none transition-all duration-200 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
          }`}
          style={getTooltipStyle()}
        >
          <div className="max-w-xs p-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-lg">
            <div className="space-y-3">
              {/* Agency Header */}
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-zinc-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                    {agency.fullName}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {agency.code}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-zinc-500 mb-1">
                    <FileText className="h-3 w-3" />
                  </div>
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{agency.totalProjects || 0}</p>
                  <p className="text-[10px] text-zinc-500">Projects</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-emerald-500 mb-1">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{agency.completedProjects || 0}</p>
                  <p className="text-[10px] text-zinc-500">Completed</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{agency.activeProjects || 0}</p>
                  <p className="text-[10px] text-zinc-500">Active</p>
                </div>
              </div>

              {/* Budget Info */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Total Budget:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatCurrency(agency.totalBudget || 0)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Utilized:</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(agency.utilizedBudget || 0)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Utilization Rate:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{utilizationRate}%</span>
                </div>
              </div>

              {/* Click Hint */}
              <p className="text-[10px] text-zinc-400 text-center pt-1">
                Click to view details
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
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
        <AgencySummaryTooltip agency={agency}>
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
        </AgencySummaryTooltip>
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
