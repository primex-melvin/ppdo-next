"use client";

import { useMemo, useCallback } from "react";
import { BudgetItem } from "../types";
import { formatCurrency } from "@/lib/shared/utils/formatting";
import { KanbanBoard, KanbanCardData, KanbanCardProps } from "../../../utilities/shared/kanban";

interface BudgetItemKanbanProps {
    data: BudgetItem[];
    isAdmin: boolean;
    onViewLog: (item: BudgetItem) => void;
    onEdit?: (item: BudgetItem) => void;
    onDelete?: (item: BudgetItem) => void;
    onPin: (item: BudgetItem) => void;
    visibleStatuses?: Set<string>;
    visibleFields?: Set<string>;
    year: number;
    onStatusChange?: (itemId: string, newStatus: string) => void;
}

// Columns for Budget Items Kanban - maps to actual status values
const COLUMNS = [
    { title: "Delayed", id: "delayed", color: "bg-red-500" },
    { title: "Ongoing", id: "ongoing", color: "bg-blue-500" },
    { title: "Completed", id: "completed", color: "bg-green-500" },
];

// Valid statuses in the database
type ValidStatus = "completed" | "ongoing" | "delayed";

export function BudgetItemKanban({
    data,
    isAdmin,
    onViewLog,
    onEdit,
    onDelete,
    onPin,
    visibleStatuses,
    visibleFields,
    year,
    onStatusChange,
}: BudgetItemKanbanProps) {

    // Transform BudgetItem items to KanbanCardData
    const groupedData = useMemo(() => {
        const cols: Record<string, KanbanCardData[]> = {
            delayed: [],
            ongoing: [],
            completed: [],
        };

        data.forEach((item) => {
            // Default to "ongoing" if no status
            const status: ValidStatus = item.status || "ongoing";

            // Ensure status is valid for our columns
            const targetCol = cols[status] ? status : "ongoing";

            // Calculate utilization safely
            const utilizationRate = item.utilizationRate ??
                (item.totalBudgetAllocated > 0 ? (item.totalBudgetUtilized / item.totalBudgetAllocated) * 100 : 0);

            // Construct dynamic metrics based on visibleFields
            const metrics = [];
            const fields = visibleFields || new Set(["totalBudgetAllocated", "totalBudgetUtilized", "balance"]);

            if (fields.has("totalBudgetAllocated")) {
                metrics.push({ label: "Allocated", value: formatCurrency(item.totalBudgetAllocated) });
            }
            if (fields.has("obligatedBudget")) {
                metrics.push({ label: "Obligated", value: formatCurrency(item.obligatedBudget || 0) });
            }
            if (fields.has("totalBudgetUtilized")) {
                metrics.push({ label: "Utilized", value: formatCurrency(item.totalBudgetUtilized) });
            }
            if (fields.has("balance")) {
                const balance = item.totalBudgetAllocated - item.totalBudgetUtilized;
                metrics.push({ label: "Balance", value: formatCurrency(balance) });
            }

            // Create slug from particular name
            const slug = item.particular
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");
            const navigationUrl = `/dashboard/project/${year}/${slug}?view=kanban`;

            // Create generic card data
            const cardData: KanbanCardData = {
                id: item.id || "",
                title: item.particular,
                subtitle: `FY ${item.year || year}`,
                metrics: metrics,
                utilizationRate: fields.has("utilizationRate") ? utilizationRate : undefined,
                footerLeft: `${item.projectCompleted} completed`,
                footerRight: `${item.projectsOngoing || 0} ongoing, ${item.projectDelayed} delayed`,
                isPinned: item.isPinned,
                navigationUrl: navigationUrl,
            };

            cols[targetCol].push(cardData);
        });

        return cols;
    }, [data, visibleFields, year]);

    // Create action handlers factory
    const renderCardActions = useCallback((cardData: KanbanCardData): KanbanCardProps["actions"] => {
        const originalItem = data.find(d => d.id === cardData.id);

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
