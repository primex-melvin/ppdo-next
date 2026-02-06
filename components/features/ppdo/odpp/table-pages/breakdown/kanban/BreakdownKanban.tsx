"use client";

import { useMemo, useCallback } from "react";
import { Breakdown } from "../types";
import { formatCurrency, formatDate } from "../../funds/utils"; // Reusing utils
import { KanbanBoard, KanbanCardData, KanbanCardProps } from "../../../utilities/shared/kanban";

interface BreakdownKanbanProps {
    data: Breakdown[];
    onView: (item: Breakdown) => void;
    onEdit?: (item: Breakdown) => void;
    onDelete?: (id: string) => void;
    visibleStatuses?: Set<string>;
    visibleFields?: Set<string>;
    onStatusChange?: (itemId: string, newStatus: string) => void;
}

const COLUMNS = [
    { title: "Ongoing", id: "ongoing", color: "bg-blue-500" },
    { title: "Delayed", id: "delayed", color: "bg-red-500" },
    { title: "Completed", id: "completed", color: "bg-green-500" },
];

export function BreakdownKanban({
    data,
    onView,
    onEdit,
    onDelete,
    visibleStatuses,
    visibleFields,
    onStatusChange,
}: BreakdownKanbanProps) {

    // Transform Breakdown items to KanbanCardData
    const groupedData = useMemo(() => {
        const cols: Record<string, KanbanCardData[]> = {
            ongoing: [],
            delayed: [],
            completed: [],
        };

        data.forEach((item) => {
            let status = item.status?.toLowerCase();

            if (!status || !cols[status]) {
                status = "ongoing";
            }
            if (status === "active") status = "ongoing";

            // Calculate utilization
            const util = item.utilizationRate ??
                (item.allocatedBudget && item.allocatedBudget > 0
                    ? ((item.budgetUtilized || 0) / item.allocatedBudget) * 100
                    : 0);

            // Construct dynamic metrics based on visibleFields
            const metrics = [];
            const fields = visibleFields || new Set(["allocatedBudget", "balance"]);

            if (fields.has("allocatedBudget")) {
                metrics.push({ label: "Allocated", value: formatCurrency(item.allocatedBudget || 0) });
            }
            if (fields.has("obligatedBudget")) {
                metrics.push({ label: "Obligated", value: formatCurrency(item.obligatedBudget || 0) });
            }
            if (fields.has("budgetUtilized")) {
                metrics.push({ label: "Utilized", value: formatCurrency(item.budgetUtilized || 0) });
            }
            if (fields.has("balance")) {
                metrics.push({ label: "Balance", value: formatCurrency(item.balance || 0) });
            }

            // Create generic card data
            const cardData: KanbanCardData = {
                id: item._id,
                title: item.projectTitle || item.projectName || item.implementingOffice || "Untitled Project",
                subtitle: item.implementingOffice,
                metrics: metrics,
                // Only show utilization if selected
                utilizationRate: fields.has("utilizationRate") ? util : undefined,
                footerLeft: fields.has("date") ? formatDate(item.dateStarted || item.reportDate) : "",
                footerRight: fields.has("remarks") ? item.remarks : undefined,
                isPinned: false,
            };

            if (cols[status]) {
                cols[status].push(cardData);
            } else {
                cols["ongoing"].push(cardData);
            }
        });

        return cols;
    }, [data, visibleFields]); // Add visibleFields to dependency

    // Create action handlers factory
    const renderCardActions = useCallback((cardData: KanbanCardData): KanbanCardProps["actions"] => {
        const originalItem = data.find(d => d._id === cardData.id);

        if (!originalItem) return {};

        return {
            onView: () => onView(originalItem),
            onEdit: onEdit ? () => onEdit(originalItem) : undefined,
            onDelete: onDelete ? () => onDelete(originalItem._id) : undefined,
        };
    }, [data, onView, onEdit, onDelete]);

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
