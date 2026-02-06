// components/ppdo/funds/components/FundsShareModal.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import BaseShareModal from "@/components/features/ppdo/BaseShareModal";
import { SelectedUserForAccess } from "@/types/access.types";

type FundType = 'trust' | 'specialEducation' | 'specialHealth' | 'twentyPercent';

interface FundsShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    fundType: FundType;
    title?: string;
}

type SelectedUser = SelectedUserForAccess;

/**
 * Get the access type string used in accessRequests for filtering
 */
function getAccessTypeFilter(fundType: FundType): string {
    switch (fundType) {
        case 'trust':
            return 'trustFund';
        case 'specialEducation':
            return 'specialEducationFund';
        case 'specialHealth':
            return 'specialHealthFund';
        case 'twentyPercent':
            return 'twentyPercentDF';
        default:
            return fundType;
    }
}

/**
 * Get the display title for the share modal
 */
function getShareTitle(fundType: FundType, customTitle?: string): string {
    if (customTitle) return `Share "${customTitle}"`;

    switch (fundType) {
        case 'trust':
            return 'Share "Trust Funds"';
        case 'specialEducation':
            return 'Share "Special Education Funds"';
        case 'specialHealth':
            return 'Share "Special Health Funds"';
        case 'twentyPercent':
            return 'Share "20% Development Fund"';
        default:
            return 'Share Funds';
    }
}

/**
 * Funds-level share modal wrapper
 * Uses BaseShareModal with fund-specific queries and mutations based on fundType
 */
export function FundsShareModal({
    isOpen,
    onClose,
    fundType,
    title,
}: FundsShareModalProps) {
    // Queries - get all access requests
    const allAccessRequests = useQuery(api.accessRequests.list);

    // Get users with access based on fund type
    const trustFundUsers = useQuery(
        api.trustFundSharedAccess.listUsersWithAccess,
        fundType === 'trust' ? {} : "skip"
    );
    const specialEducationUsers = useQuery(
        api.specialEducationFundSharedAccess.listUsersWithAccess,
        fundType === 'specialEducation' ? {} : "skip"
    );
    const specialHealthUsers = useQuery(
        api.specialHealthFundSharedAccess.listUsersWithAccess,
        fundType === 'specialHealth' ? {} : "skip"
    );
    // 20% DF uses budgetParticularAccess, skip for now

    // Select the appropriate users list
    const usersWithAccess = fundType === 'trust'
        ? trustFundUsers
        : fundType === 'specialEducation'
            ? specialEducationUsers
            : fundType === 'specialHealth'
                ? specialHealthUsers
                : [];

    // Filter requests for this specific fund type
    const accessTypeFilter = getAccessTypeFilter(fundType);
    const accessRequests = allAccessRequests?.filter(
        (req) => req.accessType === accessTypeFilter
    );

    // Mutations based on fund type
    const updateRequestStatus = useMutation(api.accessRequests.updateStatus);

    const grantTrustFundAccess = useMutation(api.trustFundSharedAccess.grantAccess);
    const revokeTrustFundAccess = useMutation(api.trustFundSharedAccess.revokeAccess);

    const grantSpecialEducationAccess = useMutation(api.specialEducationFundSharedAccess.grantAccess);
    const revokeSpecialEducationAccess = useMutation(api.specialEducationFundSharedAccess.revokeAccess);

    const grantSpecialHealthAccess = useMutation(api.specialHealthFundSharedAccess.grantAccess);
    const revokeSpecialHealthAccess = useMutation(api.specialHealthFundSharedAccess.revokeAccess);

    // State
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [savingAccess, setSavingAccess] = useState(false);

    // ============================================================================
    // MUTATION HANDLERS
    // ============================================================================

    const handleGrantAccess = async (user: SelectedUser) => {
        const payload = {
            userId: user.userId,
            accessLevel: user.accessLevel,
            notes: `Access granted via share dialog`,
        };

        switch (fundType) {
            case 'trust':
                await grantTrustFundAccess(payload);
                break;
            case 'specialEducation':
                await grantSpecialEducationAccess(payload);
                break;
            case 'specialHealth':
                await grantSpecialHealthAccess(payload);
                break;
            case 'twentyPercent':
                // 20% DF uses different access system - would need specific handling
                console.warn('20% DF access granting not yet implemented in this modal');
                break;
        }
    };

    const handleRevokeAccess = async (userId: Id<"users">) => {
        switch (fundType) {
            case 'trust':
                await revokeTrustFundAccess({ userId });
                break;
            case 'specialEducation':
                await revokeSpecialEducationAccess({ userId });
                break;
            case 'specialHealth':
                await revokeSpecialHealthAccess({ userId });
                break;
            case 'twentyPercent':
                // 20% DF uses different access system
                console.warn('20% DF access revoking not yet implemented in this modal');
                break;
        }
    };

    const handleApproveRequest = async (requestId: Id<"accessRequests">) => {
        await updateRequestStatus({
            requestId,
            status: "approved",
            adminNotes: undefined,
        });
    };

    const handleRejectRequest = async (requestId: Id<"accessRequests">) => {
        await updateRequestStatus({
            requestId,
            status: "rejected",
            adminNotes: undefined,
        });
    };

    // ============================================================================
    // RENDER
    // ============================================================================

    return (
        <BaseShareModal
            isOpen={isOpen}
            onClose={onClose}
            title={getShareTitle(fundType, title)}
            accessRequests={accessRequests}
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