// components/ppdo/breakdown/components/BreakdownShareModal.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import BaseShareModal from "@/components/features/ppdo/BaseShareModal";
import {
  SelectedUserForAccess,
  UserWithAccessInfo,
  AccessRequest,
} from "@/types/access.types";

interface BreakdownShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  entityType: "project" | "trustfund" | "specialeducationfund" | "specialhealthfund" | "twentyPercentDF";
  entityName: string;
}

type SelectedUser = SelectedUserForAccess;

/**
 * Breakdown-level share modal wrapper
 * Uses BaseShareModal with breakdown-specific queries and mutations
 */
export function BreakdownShareModal({
  isOpen,
  onClose,
  entityId,
  entityType,
  entityName,
}: BreakdownShareModalProps) {
  // Queries
  const usersWithAccess = useQuery(
    api.breakdownSharedAccess.listUsersWithAccess,
    isOpen ? { entityId, entityType } : "skip"
  );

  // For access requests, we filter by the page/entity type
  const allAccessRequests = useQuery(
    api.accessRequests.list,
    isOpen ? {} : "skip"
  );

  // Mutations
  const grantAccess = useMutation(api.breakdownSharedAccess.grantAccess);
  const revokeAccess = useMutation(api.breakdownSharedAccess.revokeAccess);
  const approveRequest = useMutation(api.accessRequests.approveRequest);
  const rejectRequest = useMutation(api.accessRequests.rejectRequest);

  // State
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [savingAccess, setSavingAccess] = useState(false);

  // ============================================================================
  // MUTATION HANDLERS
  // ============================================================================

  const handleGrantAccess = async (user: SelectedUser) => {
    await grantAccess({
      userId: user.userId,
      entityId,
      entityType,
      accessLevel: user.accessLevel,
      notes: `Access granted via share dialog`,
    });
  };

  const handleRevokeAccess = async (userId: Id<"users">) => {
    await revokeAccess({
      userId,
      entityId,
      entityType,
    });
  };

  const handleApproveRequest = async (requestId: Id<"accessRequests">) => {
    await approveRequest({ requestId });
  };

  const handleRejectRequest = async (requestId: Id<"accessRequests">) => {
    await rejectRequest({ requestId });
  };

  // Filter access requests for breakdown-related requests
  const filteredAccessRequests: AccessRequest[] = (allAccessRequests || [])
    .filter((req) => 
      req.status === "pending" && 
      (req.accessType === "breakdown" || 
       req.pageRequested?.includes("breakdown") ||
       req.pageRequested?.includes("projectbreakdown"))
    )
    .map((req) => ({
      _id: req._id,
      userName: req.userName || "Unknown",
      userEmail: req.userEmail || "",
      departmentName: req.departmentName || "Not Assigned",
      createdAt: req.createdAt,
      accessType: req.accessType,
      reason: req.reason,
      status: req.status,
    }));

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <BaseShareModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Share "${entityName}"`}
      accessRequests={filteredAccessRequests}
      usersWithAccess={usersWithAccess || []}
      onGrantAccess={handleGrantAccess}
      onRevokeAccess={handleRevokeAccess}
      onApproveRequest={handleApproveRequest}
      onRejectRequest={handleRejectRequest}
      savingAccess={savingAccess}
      setSavingAccess={setSavingAccess}
      processingId={processingId}
      setProcessingId={setProcessingId}
    />
  );
}