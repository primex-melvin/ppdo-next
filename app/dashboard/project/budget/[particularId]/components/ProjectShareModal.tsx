// app/dashboard/project/budget/[particularId]/components/ProjectShareModal.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { X, UserPlus, Check, XCircle, Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ProjectShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  particularCode: string;
  particularFullName: string;
}

export function ProjectShareModal({
  isOpen,
  onClose,
  particularCode,
  particularFullName,
}: ProjectShareModalProps) {
  const [activeTab, setActiveTab] = useState<"shared" | "pending">("shared");

  // Queries
  const sharedUsers = useQuery(
    api.budgetParticularAccess.getSharedUsers,
    isOpen ? { particularCode } : "skip"
  );
  
  const pendingRequests = useQuery(
    api.accessRequests.getParticularPendingRequests,
    isOpen ? { particularCode } : "skip"
  );

  // Mutations
  const revokeAccess = useMutation(api.budgetParticularAccess.revokeAccess);
  const approveRequest = useMutation(api.accessRequests.approveRequest);
  const rejectRequest = useMutation(api.accessRequests.rejectRequest);

  const handleRevokeAccess = async (userId: Id<"users">) => {
    try {
      await revokeAccess({ particularCode, userId });
      toast.success("Access revoked successfully");
    } catch (error) {
      toast.error("Failed to revoke access");
      console.error(error);
    }
  };

  const handleApproveRequest = async (requestId: Id<"accessRequests">) => {
    try {
      await approveRequest({ requestId });
      toast.success("Access request approved");
    } catch (error) {
      toast.error("Failed to approve request");
      console.error(error);
    }
  };

  const handleRejectRequest = async (requestId: Id<"accessRequests">) => {
    try {
      await rejectRequest({ requestId });
      toast.success("Access request rejected");
    } catch (error) {
      toast.error("Failed to reject request");
      console.error(error);
    }
  };

  if (!isOpen) return null;

  const pendingCount = pendingRequests?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Share & Manage Access
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {particularFullName}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-6">
          <button
            onClick={() => setActiveTab("shared")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "shared"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Shared Users ({sharedUsers?.length || 0})
            </div>
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors relative ${
              activeTab === "pending"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Requests ({pendingCount})
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "shared" ? (
            <div className="space-y-3">
              {!sharedUsers || sharedUsers.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No users have been granted access yet
                  </p>
                </div>
              ) : (
                sharedUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {user.name?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {user.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="w-3 h-3 text-zinc-400" />
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {user.role}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeAccess(user._id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Revoke
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {!pendingRequests || pendingRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No pending access requests
                  </p>
                </div>
              ) : (
                pendingRequests.map((request) => (
                  <div
                    key={request._id}
                    className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                          {request.user?.name?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {request.user?.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="w-3 h-3 text-zinc-400" />
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {request.user?.email}
                          </p>
                        </div>
                        {request.reason && (
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 italic">
                            "{request.reason}"
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRejectRequest(request._id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproveRequest(request._id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}