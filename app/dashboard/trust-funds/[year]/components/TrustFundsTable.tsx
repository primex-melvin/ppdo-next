// app/dashboard/trust-funds/components/TrustFundsTable.tsx - COMPLETE WITH ACTIVITY LOG

"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { useAccentColor } from "@/contexts/AccentColorContext";
import { TrustFundTableToolbar } from "./TrustFundTableToolbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowUpDown, 
  Trash2, 
  Search, 
  Printer, 
  Share2,
  Pin,
  MoreVertical,
  Eye,
  Edit,
  Archive
} from "lucide-react";
import { Modal } from "@/app/dashboard/project/[year]/components/Modal";
import { ConfirmationModal } from "@/app/dashboard/project/[year]/components/ConfirmationModal";
import { TrustFundForm } from "./TrustFundForm";
import { TrustFund, convertTrustFundFromDB } from "@/types/trustFund.types";
import { ActivityLogSheet } from "@/components/ActivityLogSheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  data: TrustFund[];
  onAdd?: (data: any) => void;
  onEdit?: (id: string, data: any) => void;
  onDelete?: (id: string) => void;
  onOpenTrash?: () => void;
  year?: number; // ✅ ADDED: Accept year prop
};

type SortField = "projectTitle" | "officeInCharge" | "dateReceived" | "received" | "utilized" | "balance" | null;
type SortDirection = "asc" | "desc" | null;

export function TrustFundsTable({ data, onAdd, onEdit, onDelete, onOpenTrash, year }: Props) {
  const { accentColorValue } = useAccentColor();
  
  // Mutations
  const togglePin = useMutation(api.trustFunds.togglePin);
  const bulkMoveToTrash = useMutation(api.trustFunds.bulkMoveToTrash);
  
  // Current user for permissions
  const currentUser = useQuery(api.users.current);
  
  // State
  const [selected, setSelected] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TrustFund | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  
  // Activity Log State
  const [logSheetOpen, setLogSheetOpen] = useState(false);
  const [selectedLogItem, setSelectedLogItem] = useState<TrustFund | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.projectTitle.toLowerCase().includes(query) ||
          item.officeInCharge.toLowerCase().includes(query) ||
          (item.remarks && item.remarks.toLowerCase().includes(query))
      );
    }

    // Sort
    if (sortField && sortDirection) {
      result.sort((a, b) => {
        let aVal: any = a[sortField];
        let bVal: any = b[sortField];

        // Handle null/undefined
        if (aVal === null || aVal === undefined) aVal = "";
        if (bVal === null || bVal === undefined) bVal = "";

        // String comparison
        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortDirection === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        // Number comparison
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      });
    }

    return result;
  }, [data, searchQuery, sortField, sortDirection]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredAndSortedData.reduce(
      (acc, item) => {
        acc.received += item.received;
        acc.obligatedPR += item.obligatedPR || 0;
        acc.utilized += item.utilized;
        acc.balance += item.balance;
        return acc;
      },
      { received: 0, obligatedPR: 0, utilized: 0, balance: 0 }
    );
  }, [filteredAndSortedData]);

  const allSelected = selected.length === filteredAndSortedData.length && filteredAndSortedData.length > 0;

  const toggleAll = () =>
    setSelected(allSelected ? [] : filteredAndSortedData.map((item) => item.id));

  const toggleOne = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(
        sortDirection === "asc" ? "desc" : sortDirection === "desc" ? null : "asc"
      );
      if (sortDirection === "desc") setSortField(null);
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handlePin = async (item: TrustFund) => {
    try {
      await togglePin({ id: item.id as Id<"trustFunds"> });
      toast.success(item.isPinned ? "Unpinned" : "Pinned to top");
    } catch (error) {
      toast.error("Failed to toggle pin");
    }
  };

  const handleBulkTrash = async () => {
    if (selected.length === 0) return;
    
    try {
      await bulkMoveToTrash({ ids: selected as Id<"trustFunds">[] });
      toast.success(`Moved ${selected.length} item(s) to trash`);
      setSelected([]);
    } catch (error) {
      toast.error("Failed to move items to trash");
    }
  };

  const handleEdit = (item: TrustFund) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleDelete = (item: TrustFund) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleViewLog = (item: TrustFund) => {
    setSelectedLogItem(item);
    setLogSheetOpen(true);
  };

  const handleExportCSV = () => {
    try {
      // Simple CSV export
      const headers = ["Project Title", "Office In-Charge", "Date Received", "Received", "Obligated PR", "Utilized", "Balance", "Remarks"];
      const rows = filteredAndSortedData.map(item => [
        item.projectTitle,
        item.officeInCharge,
        formatDate(item.dateReceived),
        item.received,
        item.obligatedPR || 0,
        item.utilized,
        item.balance,
        item.remarks || ""
      ]);
      
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trust-funds-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success("CSV exported successfully");
    } catch (error) {
      toast.error("Failed to export CSV");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // ✅ FIXED: Handle optional dateReceived
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "—"; // Return dash if no date
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <Card className="rounded-lg border">
        {/* ================= HEADER ================= */}
        <CardHeader className="border-b px-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold tracking-widest text-muted-foreground">
              TRUST FUNDS
            </h2>

            <div className="flex items-center gap-2">
              {selected.length > 0 && isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkTrash}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Move to Trash ({selected.length})
                </Button>
              )}

              {onOpenTrash && (
                <Button variant="outline" size="sm" onClick={onOpenTrash} className="text-blue-600">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Recycle Bin
                </Button>
              )}

              {/* <Button variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button> */}

              <Button variant="outline" size="icon" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
              </Button>

              {onAdd && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setShowAddModal(true)}
                >
                  Add New Item
                </Button>
              )}
            </div>
          </div>

          {/* Search Input */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search trust funds..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-sm"
              />
            </div>
          </div>
        </CardHeader>

        {/* ================= TABLE ================= */}
        <CardContent className="p-0">
          <div className="relative max-h-[600px] overflow-auto">
            <Table className="w-full table-fixed text-sm">
              <colgroup>
                {isAdmin && <col className="w-[44px]" />}
                <col className="w-[300px]" />
                <col className="w-[200px]" />
                <col className="w-[150px]" />
                <col className="w-[150px]" />
                <col className="w-[150px]" />
                <col className="w-[150px]" />
                <col className="w-[150px]" />
                <col className="w-[200px]" />
                <col className="w-[80px]" />
              </colgroup>

              <TableHeader className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-950">
                <TableRow className="h-10 border-b">
                  {isAdmin && (
                    <TableHead className="px-2 text-center">
                      <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                    </TableHead>
                  )}

                  {[
                    { label: "PROJECT TITLE", field: "projectTitle" as SortField },
                    { label: "OFFICE IN-CHARGE", field: "officeInCharge" as SortField },
                    { label: "DATE RECEIVED", field: "dateReceived" as SortField },
                  ].map(({ label, field }) => (
                    <TableHead
                      key={label}
                      className="px-3 uppercase text-[11px] tracking-wide text-muted-foreground font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      onClick={() => handleSort(field)}
                    >
                      <div className="flex items-center gap-1">
                        {label}
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      </div>
                    </TableHead>
                  ))}

                  {[
                    { label: "RECEIVED", field: "received" as SortField },
                    { label: "OBLIGATED PR", field: null },
                    { label: "UTILIZED", field: "utilized" as SortField },
                    { label: "BALANCE", field: "balance" as SortField },
                  ].map(({ label, field }) => (
                    <TableHead
                      key={label}
                      className={`px-3 uppercase text-[11px] tracking-wide text-muted-foreground font-medium text-right ${
                        field ? "cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800" : ""
                      }`}
                      onClick={() => field && handleSort(field)}
                    >
                      <div className="flex w-full items-center justify-end gap-1">
                        {label}
                        {field && <ArrowUpDown className="h-3 w-3 opacity-40 shrink-0" />}
                      </div>
                    </TableHead>
                  ))}

                  <TableHead className="px-3 uppercase text-[11px] tracking-wide text-muted-foreground font-medium">
                    REMARKS
                  </TableHead>

                  <TableHead className="px-3 uppercase text-[11px] tracking-wide text-muted-foreground font-medium text-center">
                    ACTIONS
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredAndSortedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 10 : 9} className="text-center py-8 text-zinc-500">
                      No trust funds found
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {filteredAndSortedData.map((item) => (
                      <TableRow key={item.id} className="h-10 hover:bg-muted/40">
                        {isAdmin && (
                          <TableCell className="px-2 text-center">
                            <Checkbox
                              checked={selected.includes(item.id)}
                              onCheckedChange={() => toggleOne(item.id)}
                            />
                          </TableCell>
                        )}

                        <TableCell className="px-3 font-medium truncate">
                          <div className="flex items-center gap-2">
                            {item.isPinned && (
                              <Pin className="h-3 w-3 text-amber-500 fill-amber-500" />
                            )}
                            {item.projectTitle}
                          </div>
                        </TableCell>

                        <TableCell className="px-3 truncate">
                          {item.officeInCharge}
                        </TableCell>

                        <TableCell className="px-3">
                          {formatDate(item.dateReceived)}
                        </TableCell>

                        <TableCell className="px-3 text-right tabular-nums">
                          {formatCurrency(item.received)}
                        </TableCell>

                        <TableCell className="px-3 text-right tabular-nums">
                          {item.obligatedPR ? formatCurrency(item.obligatedPR) : "—"}
                        </TableCell>

                        <TableCell className="px-3 text-right tabular-nums">
                          {formatCurrency(item.utilized)}
                        </TableCell>

                        <TableCell className="px-3 text-right font-semibold tabular-nums">
                          {formatCurrency(item.balance)}
                        </TableCell>

                        <TableCell className="px-3 text-muted-foreground truncate">
                          {item.remarks || "—"}
                        </TableCell>

                        <TableCell className="px-3 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewLog(item)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Activity Log
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handlePin(item)}>
                                <Pin className="h-4 w-4 mr-2" />
                                {item.isPinned ? "Unpin" : "Pin"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {onEdit && (
                                <DropdownMenuItem onClick={() => handleEdit(item)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {onDelete && (
                                <DropdownMenuItem
                                  onClick={() => handleDelete(item)}
                                  className="text-red-600"
                                >
                                  <Archive className="h-4 w-4 mr-2" />
                                  Move to Trash
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* ================= TOTAL ROW ================= */}
                    <TableRow className="border-t bg-muted/30 font-semibold h-11">
                      {isAdmin && <TableCell />}
                      
                      <TableCell colSpan={3} className="px-3">
                        TOTAL
                      </TableCell>

                      <TableCell className="px-3 text-right tabular-nums">
                        {formatCurrency(totals.received)}
                      </TableCell>

                      <TableCell className="px-3 text-right tabular-nums">
                        {formatCurrency(totals.obligatedPR)}
                      </TableCell>

                      <TableCell className="px-3 text-right tabular-nums">
                        {formatCurrency(totals.utilized)}
                      </TableCell>

                      <TableCell className="px-3 text-right tabular-nums">
                        {formatCurrency(totals.balance)}
                      </TableCell>

                      <TableCell colSpan={2} />
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Trust Fund"
          size="xl"
        >
          <TrustFundForm
            year={year} // ✅ ADDED: Pass year to form
            onSave={(data) => {
              if (onAdd) onAdd(data);
              setShowAddModal(false);
            }}
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>
      )}

      {showEditModal && selectedItem && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedItem(null);
          }}
          title="Edit Trust Fund"
          size="xl"
        >
          <TrustFundForm
            trustFund={selectedItem}
            year={year} // ✅ ADDED: Pass year to form
            onSave={(data) => {
              if (onEdit) onEdit(selectedItem.id, data);
              setShowEditModal(false);
              setSelectedItem(null);
            }}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedItem(null);
            }}
          />
        </Modal>
      )}

      {showDeleteModal && selectedItem && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedItem(null);
          }}
          onConfirm={() => {
            if (onDelete) onDelete(selectedItem.id);
            setShowDeleteModal(false);
            setSelectedItem(null);
          }}
          title="Move to Trash"
          message={`Are you sure you want to move "${selectedItem.projectTitle}" to trash?`}
          confirmText="Move to Trash"
          variant="danger"
        />
      )}

      {/* Activity Log Sheet */}
      {selectedLogItem && (
        <ActivityLogSheet
          type="trustFund"
          entityId={selectedLogItem.id}
          title={`Trust Fund History: ${selectedLogItem.projectTitle}`}
          isOpen={logSheetOpen}
          onOpenChange={(open) => {
            setLogSheetOpen(open);
            if (!open) setSelectedLogItem(null);
          }}
        />
      )}
    </>
  );
}