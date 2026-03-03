"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

type RequestStatus = "pending" | "approved" | "rejected";

interface PinResetRequest {
  _id: Id<"pinResetRequests">;
  email: string;
  message?: string;
  status: RequestStatus;
  requestedAt: number;
  reviewedAt?: number;
  adminNotes?: string;
  requesterName?: string;
  requesterRole?: string;
  requesterStatus?: string;
  reviewedByName?: string;
}

export default function PinResetManagementPage() {
  const { isAdmin, isSuperAdmin } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");
  const [selectedRequest, setSelectedRequest] = useState<PinResetRequest | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requests = useQuery(
    api.userPin.listPinResetRequests,
    statusFilter !== "all" ? { status: statusFilter } : {}
  ) as PinResetRequest[] | undefined;
  const approvePinReset = useMutation(api.userPin.approvePinReset);
  const rejectPinReset = useMutation(api.userPin.rejectPinReset);

  if (!isAdmin && !isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Access Denied
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            You don&apos;t have permission to access PIN reset management.
          </p>
        </div>
      </div>
    );
  }

  if (!requests) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  const filteredRequests = requests.filter((request) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      request.email?.toLowerCase()?.includes(searchLower) ||
      request.requesterName?.toLowerCase()?.includes(searchLower) ||
      request.adminNotes?.toLowerCase()?.includes(searchLower)
    );
  });

  const handleAction = (request: PinResetRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(action);
    setAdminNotes("");
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!selectedRequest || !actionType) return;

    setIsSubmitting(true);
    try {
      if (actionType === "approve") {
        await approvePinReset({
          requestId: selectedRequest._id,
          adminNotes: adminNotes.trim() || undefined,
        });
        toast.success("PIN reset approved. The user must now create a new PIN.");
      } else {
        await rejectPinReset({
          requestId: selectedRequest._id,
          adminNotes: adminNotes.trim() || undefined,
        });
        toast.success("PIN reset request rejected.");
      }

      setShowDialog(false);
      setSelectedRequest(null);
      setActionType(null);
      setAdminNotes("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to process PIN reset request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const StatusBadge = ({ status }: { status: RequestStatus }) => {
    const config = {
      pending: {
        bg: "bg-yellow-100 dark:bg-yellow-950",
        text: "text-yellow-700 dark:text-yellow-400",
        icon: Clock,
      },
      approved: {
        bg: "bg-green-100 dark:bg-green-950",
        text: "text-green-700 dark:text-green-400",
        icon: CheckCircle2,
      },
      rejected: {
        bg: "bg-red-100 dark:bg-red-950",
        text: "text-red-700 dark:text-red-400",
        icon: XCircle,
      },
    }[status];

    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <>
      <div className="mb-6">
        <h1
          className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          PIN Reset Management
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Review forgot-PIN recovery requests for permanent delete protection
        </p>
      </div>

      {!isSuperAdmin && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-sm">
            View-only access. Only super admins can approve or reject PIN reset requests.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Pending</p>
              <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                {requests.filter((request) => request.status === "pending").length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-950 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Approved</p>
              <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                {requests.filter((request) => request.status === "approved").length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Rejected</p>
              <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                {requests.filter((request) => request.status === "rejected").length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search by email, requester, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RequestStatus | "all")}
              className="w-full h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100"
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Request Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Requested
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <tr
                    key={request._id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {request.requesterName || "Unknown"}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {request.email || "No email on file"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          Role: {request.requesterRole || "unknown"}
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          User status: {request.requesterStatus || "unknown"}
                        </p>
                        {request.message ? (
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            Note: {request.message}
                          </p>
                        ) : (
                          <p className="text-xs text-zinc-500 dark:text-zinc-500">
                            No requester note provided
                          </p>
                        )}
                        {request.reviewedByName && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-500">
                            Reviewed by {request.reviewedByName}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-zinc-700 dark:text-zinc-300">
                          {formatDate(request.requestedAt)}
                        </p>
                        {request.reviewedAt && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Reviewed: {formatDate(request.reviewedAt)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {request.status === "pending" && isSuperAdmin ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAction(request, "approve")}
                            className="gap-2"
                          >
                            <ShieldAlert className="h-4 w-4" />
                            Approve Reset
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(request, "reject")}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {request.status === "pending"
                            ? "Awaiting super admin action"
                            : request.adminNotes || "No further action"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      No PIN reset requests found.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve PIN Reset" : "Reject PIN Reset"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Approving this request resets the user PIN into recovery mode. The user must create a new PIN before permanent delete actions are allowed."
                : "Rejecting this request keeps the current PIN unchanged."}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4 space-y-2">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {selectedRequest.requesterName || "Unknown"}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {selectedRequest.email || "No email on file"}
                </p>
                {selectedRequest.message && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    Requester note: {selectedRequest.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Admin Notes
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Optional notes for the audit trail and future review"
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  variant={actionType === "approve" ? "default" : "destructive"}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : actionType === "approve" ? (
                    "Approve Reset"
                  ) : (
                    "Reject Request"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
