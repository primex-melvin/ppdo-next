/**
 * InspectionTable Component
 *
 * Full-featured table for inspections following the BreakdownHistoryTable pattern.
 * Features: search, column visibility, sorting, pagination, export, print.
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Printer,
  FileSpreadsheet,
  Plus,
  Trash2,
} from "lucide-react";
import { useAccentColor } from "@/contexts/AccentColorContext";
import { toast } from "sonner";

// Shared table components
import {
  GenericTableToolbar,
  TableSearchInput,
  TableActionButton,
} from "@/components/shared/table";
import { ColumnVisibilityMenu } from "@/components/shared/table/ColumnVisibilityMenu";
import { ResponsiveMoreMenu } from "@/components/shared/table/ResponsiveMoreMenu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

// Inspection-specific components
import { InspectionGalleryModal } from "../components/inspection/InspectionGalleryModal";
import { InspectionContextMenu } from "../components/inspection/InspectionContextMenu";
import { Inspection } from "../types";

interface InspectionTableProps {
  inspections: Inspection[];
  isLoading?: boolean;
  onAdd?: () => void;
  onEdit?: (inspection: Inspection) => void;
  onDelete?: (inspection: Inspection) => void;
  onView: (inspection: Inspection) => void;
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "in_progress":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
};

const formatDateTime = (timestamp: number): string => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
};

// Sortable header component
const SortableHeader = ({
  column,
  label,
}: {
  column: any;
  label: string;
}) => (
  <button
    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    className="flex items-center gap-1 font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
  >
    {label}
    {column.getIsSorted() === "asc" && <ChevronUp className="h-4 w-4" />}
    {column.getIsSorted() === "desc" && <ChevronDown className="h-4 w-4" />}
    {!column.getIsSorted() && <ChevronsUpDown className="h-4 w-4 opacity-50" />}
  </button>
);

export function InspectionTable({
  inspections,
  isLoading = false,
  onAdd,
  onEdit,
  onDelete,
  onView,
}: InspectionTableProps) {
  const { accentColorValue } = useAccentColor();

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  // Hide programNumber, category, and viewCount by default
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(
    new Set(["programNumber", "category", "viewCount"])
  );

  // Gallery modal state
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedInspectionForGallery, setSelectedInspectionForGallery] =
    useState<Inspection | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    inspection: Inspection;
  } | null>(null);

  // Column definitions
  const columns = useMemo<ColumnDef<Inspection>[]>(
    () => [
      {
        accessorKey: "programNumber",
        header: ({ column }) => <SortableHeader column={column} label="Program No." />,
        cell: ({ row }) => (
          <div className="text-sm text-zinc-900 dark:text-zinc-100">
            {row.getValue("programNumber") || "—"}
          </div>
        ),
        size: 120,
      },
      {
        accessorKey: "title",
        header: ({ column }) => <SortableHeader column={column} label="Title" />,
        cell: ({ row }) => (
          <div
            className="max-w-xs truncate text-sm text-zinc-900 dark:text-zinc-100"
            title={row.getValue("title")}
          >
            {row.getValue("title")}
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: ({ column }) => <SortableHeader column={column} label="Category" />,
        cell: ({ row }) => (
          <div className="text-sm text-zinc-700 dark:text-zinc-300">
            {row.getValue("category") || "—"}
          </div>
        ),
        size: 140,
      },
      {
        accessorKey: "inspectionDateTime",
        header: ({ column }) => <SortableHeader column={column} label="Date" />,
        cell: ({ row }) => (
          <div className="text-sm text-zinc-700 dark:text-zinc-300">
            {formatDateTime(row.getValue("inspectionDateTime") ?? Date.now())}
          </div>
        ),
        size: 110,
      },
      {
        accessorKey: "status",
        header: ({ column }) => <SortableHeader column={column} label="Status" />,
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          return (
            <Badge className={`${getStatusColor(status)} whitespace-nowrap capitalize`}>
              {status.replace("_", " ")}
            </Badge>
          );
        },
        size: 120,
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: "viewCount",
        header: ({ column }) => <SortableHeader column={column} label="Views" />,
        cell: ({ row }) => (
          <div className="text-sm text-zinc-700 dark:text-zinc-300 text-center">
            {row.getValue("viewCount")}
          </div>
        ),
        size: 80,
      },
      {
        accessorKey: "imageCount",
        header: "Images",
        cell: ({ row }) => {
          const inspection = row.original;
          const imageCount = inspection.imageCount || 0;
          const thumbnails = inspection.thumbnails || [];

          if (imageCount === 0) {
            return (
              <div className="text-sm text-zinc-500 dark:text-zinc-500 text-center">—</div>
            );
          }

          const visibleThumbnails = thumbnails.slice(0, 3);
          const hasOverflow = imageCount > 3;

          return (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                {visibleThumbnails.map((thumbnail: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedInspectionForGallery(inspection);
                      setGalleryOpen(true);
                    }}
                    className="cursor-pointer group relative h-8 w-8 overflow-hidden rounded border border-zinc-200 dark:border-zinc-600 hover:border-[#4FBA76] dark:hover:border-[#4FBA76] transition-all hover:shadow-md"
                    title={`View ${imageCount} image${imageCount !== 1 ? "s" : ""}`}
                  >
                    <img
                      src={thumbnail}
                      alt={`Inspection thumbnail ${idx + 1}`}
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                  </button>
                ))}

                {hasOverflow && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedInspectionForGallery(inspection);
                      setGalleryOpen(true);
                    }}
                    className="h-8 w-8 flex items-center justify-center rounded bg-zinc-100 dark:bg-zinc-700 hover:bg-[#4FBA76] dark:hover:bg-[#4FBA76] text-zinc-700 dark:text-zinc-300 hover:text-white transition-all text-xs font-semibold border border-zinc-200 dark:border-zinc-600 hover:border-[#4FBA76]"
                    title={`View all ${imageCount} images`}
                  >
                    +{imageCount - 3}
                  </button>
                )}
              </div>

              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                {imageCount}
              </span>
            </div>
          );
        },
        size: 160,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onView(row.original);
              }}
              className="text-xs h-8"
            >
              View
            </Button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  inspection: row.original,
                });
              }}
              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="More actions"
            >
              <svg
                className="h-4 w-4 text-zinc-600 dark:text-zinc-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>
          </div>
        ),
        size: 140,
      },
    ],
    [onView]
  );

  // Filter out hidden columns
  const visibleColumns = useMemo(() => {
    return columns.filter((col) => {
      const key = (col as any).accessorKey || col.id;
      return !hiddenColumns.has(key);
    });
  }, [columns, hiddenColumns]);

  const table = useReactTable({
    data: inspections,
    columns: visibleColumns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  // Column visibility handlers
  const handleToggleColumn = (columnId: string, isChecked: boolean) => {
    const newHidden = new Set(hiddenColumns);
    if (isChecked) {
      newHidden.delete(columnId);
    } else {
      newHidden.add(columnId);
    }
    setHiddenColumns(newHidden);
  };

  const handleShowAllColumns = () => setHiddenColumns(new Set());
  const handleHideAllColumns = () => {
    const allIds = columns
      .map((c) => (c as any).accessorKey || c.id)
      .filter(Boolean);
    setHiddenColumns(new Set(allIds));
  };

  // Export CSV handler
  const handleExportCSV = useCallback(() => {
    try {
      const rows = table.getRowModel().rows.map((row) => row.original);
      const headers = [
        "Program Number",
        "Title",
        "Category",
        "Date",
        "Status",
        "Views",
        "Images",
      ];
      const csvContent = [
        headers.join(","),
        ...rows.map((insp) =>
          [
            insp.programNumber || "",
            `"${insp.title}"`,
            insp.category || "",
            formatDateTime(insp.inspectionDateTime ?? Date.now()),
            insp.status,
            insp.viewCount,
            insp.imageCount,
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `inspections_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();

      toast.success(`Exported ${rows.length} inspections to CSV`);
    } catch (error) {
      toast.error("Failed to export CSV");
    }
  }, [table]);

  // Print handler
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-zinc-300 border-t-transparent dark:border-zinc-700 dark:border-t-transparent" />
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Loading inspections...
        </p>
      </div>
    );
  }

  const columnList = columns
    .filter((c) => c.id !== "actions")
    .map((c) => ({
      key: (c as any).accessorKey || c.id,
      label: typeof c.header === "function" ? (c as any).accessorKey || c.id : c.header,
    }));

  return (
    <>
      <div className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden h-[calc(100vh-320px)] min-h-[400px]">
        {/* Toolbar */}
        <GenericTableToolbar
          actions={
            <div className="flex items-center gap-1 sm:gap-2">
              <ColumnVisibilityMenu
                columns={columnList}
                hiddenColumns={hiddenColumns}
                onToggleColumn={handleToggleColumn}
                onShowAll={handleShowAllColumns}
                onHideAll={handleHideAllColumns}
                variant="table"
              />

              {/* Desktop secondary actions */}
              <div className="hidden lg:flex items-center gap-2">
                <TableActionButton
                  icon={Printer}
                  label="Print"
                  onClick={handlePrint}
                  title="Print"
                />
                <TableActionButton
                  icon={FileSpreadsheet}
                  label="Export CSV"
                  onClick={handleExportCSV}
                  title="Export to CSV"
                />
              </div>

              {/* Mobile/Tablet more menu */}
              <div className="lg:hidden">
                <ResponsiveMoreMenu>
                  <DropdownMenuItem onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportCSV}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export CSV
                  </DropdownMenuItem>
                </ResponsiveMoreMenu>
              </div>

              {onAdd && (
                <TableActionButton
                  icon={Plus}
                  label="Add"
                  onClick={onAdd}
                  variant="primary"
                  accentColor={accentColorValue}
                  hideLabelOnMobile={true}
                />
              )}
            </div>
          }
        >
          <TableSearchInput
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(value) => table.getColumn("title")?.setFilterValue(value)}
            placeholder="Search inspections..."
          />
        </GenericTableToolbar>

        {/* Table */}
        <div className="flex-1 overflow-auto border-t border-zinc-200 dark:border-zinc-800">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50 sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-transparent"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-zinc-700 dark:text-zinc-300 font-semibold px-4 py-3 whitespace-nowrap"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length}
                    className="h-64 text-center"
                  >
                    <div className="flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400">
                      <svg
                        className="mx-auto h-12 w-12 text-zinc-400 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                        No inspections found
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {table.getColumn("title")?.getFilterValue()
                          ? "Try adjusting your search"
                          : "Create your first inspection to get started"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                    onClick={() => onView(row.original)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        inspection: row.original,
                      });
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="px-4 py-3"
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount() || 1} (
            {table.getFilteredRowModel().rows.length} total)
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="border-zinc-200 dark:border-zinc-800"
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="border-zinc-200 dark:border-zinc-800"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {selectedInspectionForGallery && (
        <InspectionGalleryModal
          isOpen={galleryOpen}
          onClose={() => {
            setGalleryOpen(false);
            setSelectedInspectionForGallery(null);
          }}
          inspection={selectedInspectionForGallery}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <InspectionContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          inspection={contextMenu.inspection}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewDetails={onView}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}

export default InspectionTable;
