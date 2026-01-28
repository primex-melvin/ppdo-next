"use client";

import { useMemo, useCallback } from "react";
import { BaseFund } from "../types";
import { formatCurrency, formatDate, createFundSlug } from "../utils";
import { KanbanBoard, KanbanCardData, KanbanCardProps } from "../../shared/kanban";

interface FundsKanbanProps<T extends BaseFund> {
    data: T[];
    isAdmin: boolean;
    onViewLog: (item: T) => void;
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
    onPin: (item: T) => void;
    visibleStatuses?: Set<string>;
    visibleFields?: Set<string>;
    fundType: 'trust' | 'specialEducation' | 'specialHealth';
    year: number;
    onStatusChange?: (itemId: string, newStatus: string) => void;
}

const COLUMNS = [
    { title: "Not Available", id: "not_available", color: "bg-zinc-400" },
    { title: "On Process", id: "on_process", color: "bg-amber-500" },
    { title: "Ongoing", id: "ongoing", color: "bg-blue-500" },
    { title: "Completed", id: "completed", color: "bg-green-500" },
];

export function FundsKanban<T extends BaseFund>({
    data,
    isAdmin,
    onViewLog,
    onEdit,
    onDelete,
    onPin,
    visibleStatuses,
    visibleFields,
    fundType,
    year,
    onStatusChange,
}: FundsKanbanProps<T>) {

    // Transform BaseFund items to KanbanCardData
    const groupedData = useMemo(() => {
        const cols: Record<string, KanbanCardData[]> = {
            not_available: [],
            on_process: [],
            ongoing: [],
            completed: [],
        };

        const basePath = fundType === 'trust'
            ? 'trust-funds'
            : fundType === 'specialEducation'
                ? 'special-education-funds'
                : 'special-health-funds';

        data.forEach((item) => {
            let status = item.status;
            // Map statuses to columns
            if (!status || status === "not_yet_started") status = "not_available";
            if (status === "active") status = "ongoing";

            const targetCol = cols[status] ? status : "not_available";

            // Calculate utilization safely
            const utilizationRate = item.utilizationRate ??
                (item.received > 0 ? (item.utilized / item.received) * 100 : 0);

            // Construct dynamic metrics based on visibleFields
            const metrics = [];
            const fields = visibleFields || new Set(["received", "balance"]);

            if (fields.has("received")) {
                metrics.push({ label: "Received", value: formatCurrency(item.received) });
            }
            if (fields.has("allocatedBudget")) {
                // @ts-ignore - Handle specific fund types that might have this field
                const val = (item as any).allocatedBudget || 0;
                metrics.push({ label: "Allocated", value: formatCurrency(val) });
            }
            if (fields.has("obligatedPR")) {
                metrics.push({ label: "Obligated/PR", value: formatCurrency(item.obligatedPR || 0) });
            }
            if (fields.has("utilized")) {
                metrics.push({ label: "Utilized", value: formatCurrency(item.utilized) });
            }
            if (fields.has("balance")) {
                metrics.push({ label: "Balance", value: formatCurrency(item.balance) });
            }

            const slug = createFundSlug(item.projectTitle, (item.id || item._id) as string);
            const navigationUrl = `/dashboard/${basePath}/${year}/${slug}?view=kanban`;

            // Create generic card data
            const cardData: KanbanCardData = {
                id: item.id || item._id || "", // Ensure ID
                title: item.projectTitle,
                subtitle: item.officeInCharge,
                metrics: metrics,
                utilizationRate: fields.has("utilizationRate") ? utilizationRate : undefined,
                footerLeft: fields.has("date") ? formatDate(item.dateReceived) : "",
                footerRight: fields.has("remarks") ? item.remarks : undefined,
                isPinned: item.isPinned,
                navigationUrl: navigationUrl,
            };

            cols[targetCol].push(cardData);
        });

        return cols;
    }, [data, visibleFields, fundType, year]);

    // Create action handlers factory
    const renderCardActions = useCallback((cardData: KanbanCardData): KanbanCardProps["actions"] => {
        const originalItem = data.find(d => (d.id || d._id) === cardData.id);

        if (!originalItem) return {};

        return {
            onView: () => onViewLog(originalItem),
            onEdit: onEdit ? () => onEdit(originalItem) : undefined,
            onDelete: onDelete ? () => onDelete(originalItem) : undefined,
            onPin: () => onPin(originalItem),
        };
    }, [data, onViewLog, onEdit, onDelete, onPin]);

    const handleStatusChange = (itemId: string, newStatus: string) => {
        if (onStatusChange) {
            onStatusChange(itemId, newStatus);
        }
    };

    return (
        <KanbanBoard
            columns={COLUMNS}
            data={groupedData}
            onStatusChange={handleStatusChange}
            renderCardActions={renderCardActions}
            visibleStatuses={visibleStatuses}
        />
    );
}
